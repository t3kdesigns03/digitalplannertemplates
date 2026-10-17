#!/usr/bin/env node
// Usage:
//   node src/cli.js                         build every size x variant in planner.config.json
//   node src/cli.js --config configs/sample.json
//   node src/cli.js --size a5 --variant undated
//   node src/cli.js --html-only             write HTML previews to build/ without rendering PDFs
//   node src/cli.js --jobs 2                render up to 2 PDFs at once
// Env equivalents (handy on CI / Netlify): PLANNER_CONFIG, PLANNER_SIZES,
// PLANNER_VARIANTS, PLANNER_JOBS. Command-line flags win over env vars.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { resolveConfig } from './config.js';
import { buildModel, SECTION_IDS } from './model.js';
import { loadArt } from './art/images.js';
import { buildHtml } from './render/document.js';
import { launch, renderPdf, postProcess } from './pdf.js';

function parseArgs(argv) {
  const env = process.env;
  const list = (v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined);
  const out = {
    overrides: {},
    configPath: env.PLANNER_CONFIG || undefined,
    sizes: list(env.PLANNER_SIZES),
    variants: list(env.PLANNER_VARIANTS),
    jobs: env.PLANNER_JOBS ? Number(env.PLANNER_JOBS) : undefined,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--config') out.configPath = next();
    else if (a === '--size') out.sizes = next().split(',');
    else if (a === '--variant') out.variants = next().split(',');
    else if (a === '--year') out.overrides.year = Number(next());
    else if (a === '--html-only') out.htmlOnly = true;
    else if (a === '--jobs') out.jobs = Number(next());
    else if (a === '--help' || a === '-h') out.help = true;
    else throw new Error(`Unknown argument: ${a}`);
  }
  return out;
}

function ensureArt() {
  const src = path.resolve('assets/charachters');
  const manifest = path.resolve('assets/processed/manifest.json');
  const newest = fs.existsSync(src) ? Math.max(0, ...fs.readdirSync(src).map((f) => fs.statSync(path.join(src, f)).mtimeMs)) : 0;
  if (fs.existsSync(manifest) && fs.statSync(manifest).mtimeMs >= newest) return;
  console.log('Preparing artwork (cutting characters out of their backgrounds)...');
  const r = spawnSync(process.execPath, [path.resolve('tools/prepare-art.js')], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('prepare-art failed');
}

/** Bookmarks shown in the PDF sidebar / GoodNotes outline. */
function outlineFor(cfg, model) {
  const idx = new Map(model.pages.map((p, i) => [p.id, i]));
  const L = cfg.labels;
  const item = (title, id, children) => (idx.has(id) ? { title, index: idx.get(id), ...(children?.length ? { children } : {}) } : null);
  const months = model.months.map((mo) => item(mo.undated ? mo.name : `${L.monthNames[mo.m]} ${mo.y}`, mo.id)).filter(Boolean);
  const many = (prefix, title) => model.pages.filter((p) => p.id.startsWith(prefix)).map((p, i) => item(`${title} ${i + 1}`, p.id));
  return [
    item('Cover', SECTION_IDS.cover),
    item(L.welcomeTitle.replace(/[!,].*$/, '') || 'Welcome', SECTION_IDS.welcome),
    item(L.dashboardTitle, SECTION_IDS.home),
    item(L.yearTitle, SECTION_IDS.year),
    item(L.yearPlanTitle, SECTION_IDS.yearPlan),
    item(L.goalsTitle, SECTION_IDS.goals, [item(L.visionTitle, SECTION_IDS.vision), ...many('goal-', L.goalPlannerTitle)].filter(Boolean)),
    item(L.habitsTitle, SECTION_IDS.habits),
    months.length ? { title: 'Months', index: months[0].index, children: months } : null,
    item(L.wellnessTitle, SECTION_IDS.wellness, [...many('checkin-', L.checkinTitle), ...many('gratitude-', L.gratitudeTitle)].filter(Boolean)),
    item(L.notesTitle, SECTION_IDS.notes),
    item(L.journalTitle, SECTION_IDS.journal),
    item(L.funTitle, SECTION_IDS.fun, [
      item(L.gardenTitle, SECTION_IDS.garden), item(L.moodTitle, SECTION_IDS.mood), item(L.bucketTitle, SECTION_IDS.bucket),
      item(L.readsTitle, SECTION_IDS.reads), item(L.doodleTitle, SECTION_IDS.doodle),
    ].filter(Boolean)),
    item(L.stickersTitle, SECTION_IDS.stickers),
  ].filter(Boolean);
}

function fileName(cfg, variant, size) {
  return cfg.output.filename
    .replace('{slug}', cfg.slug).replace('{yearLabel}', variant === 'undated' ? 'undated' : cfg.yearLabel)
    .replace('{variant}', variant === 'undated' ? '' : variant).replace('{size}', size)
    .replace(/-+/g, '-').replace('-.pdf', '.pdf');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 7).join('\n').replace(/^\/\/ ?/gm, ''));
    return;
  }
  const cfg = resolveConfig({ configPath: args.configPath, overrides: args.overrides });
  const sizes = args.sizes ?? cfg.sizes;
  const variants = args.variants ?? cfg.variants;
  ensureArt();
  const art = await loadArt(cfg);

  const outDir = path.resolve(cfg.output.dir);
  const buildDir = path.resolve('build');
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(buildDir, { recursive: true });

  const models = Object.fromEntries(variants.map((v) => [v, buildModel(cfg, v)]));
  const jobs = variants.flatMap((variant) => sizes.map((size) => ({ variant, size })));
  const htmlFor = (variant, size) => path.join(buildDir, fileName(cfg, variant, size).replace(/\.pdf$/, '.html'));

  if (args.htmlOnly) {
    for (const { variant, size } of jobs) {
      const htmlPath = htmlFor(variant, size);
      fs.writeFileSync(htmlPath, buildHtml({ cfg, model: models[variant], art, sizeKey: size }));
      console.log(`HTML  ${path.relative(process.cwd(), htmlPath)} (${models[variant].pages.length} pages)`);
    }
    return;
  }

  // Each Chromium render is single-threaded, so two at once roughly halves the
  // wall-clock time on multi-core machines (each needs ~1-2 GB of memory).
  const parallel = Math.max(1, Math.min(jobs.length, args.jobs || (os.cpus().length >= 4 ? 2 : 1)));
  const results = [];
  const browser = await launch();
  try {
    const queue = [...jobs];
    const worker = async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        const { variant, size } = job;
        const model = models[variant];
        const t0 = Date.now();
        const name = fileName(cfg, variant, size);
        const htmlPath = htmlFor(variant, size);
        fs.writeFileSync(htmlPath, buildHtml({ cfg, model, art, sizeKey: size }));
        const pdfPath = path.join(outDir, name);
        await renderPdf(browser, htmlPath, pdfPath);
        const info = await postProcess(pdfPath, { cfg, model, outline: outlineFor(cfg, model) });
        const bytes = fs.statSync(pdfPath).size;
        results.push({ file: name, variant, size, pages: info.pageCount, links: info.converted, bytes, html: cfg.output.keepHtml ? path.relative(process.cwd(), htmlPath) : null });
        if (!cfg.output.keepHtml) fs.rmSync(htmlPath);
        console.log(`PDF   ${path.relative(process.cwd(), pdfPath)}  ${info.pageCount} pages, ${info.converted} links, ${(bytes / 1048576).toFixed(1)} MB, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
        if (info.unresolved.length) console.warn(`      WARNING: ${info.unresolved.length} unresolved link targets, e.g. ${info.unresolved.slice(0, 5).join(', ')}`);
      }
    };
    await Promise.all(Array.from({ length: parallel }, worker));
  } finally {
    await browser.close();
  }

  // What was built, in config order. tools/site.js reads this to assemble dist/.
  const order = (r) => jobs.findIndex((j) => j.variant === r.variant && j.size === r.size);
  results.sort((a, b) => order(a) - order(b));
  fs.writeFileSync(path.join(outDir, 'builds.json'), JSON.stringify({
    title: cfg.title, subtitle: cfg.subtitle, tagline: cfg.tagline, yearLabel: cfg.yearLabel,
    generated: new Date().toISOString(), pdfs: results,
  }, null, 2));
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
