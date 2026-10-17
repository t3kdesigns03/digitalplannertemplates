// Builds a sticker pack for GoodNotes / Notability sticker libraries:
//   output/stickers/characters/*.png   the crew, cut out of their backgrounds
//   output/stickers/flowers/*.png      pieces split from the space-flowers sheet
//   output/stickers/svg/*.svg          vector extras (mood stars, planets, flowers...)
//   output/stickers/png/*.png          the vector extras as transparent PNGs
//   output/stickers/contact-sheet.html preview of everything
// Usage: node src/stickers.js [--config file] [--no-png]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { resolveConfig } from './config.js';
import { characterMarkup, MOODS } from './art/characters.js';
import { flower, planet, moon, sparkle, star, comet, stemFlower, svg } from './art/flora.js';

const args = process.argv.slice(2);
const configPath = args.includes('--config') ? args[args.indexOf('--config') + 1] : null;
const png = !args.includes('--no-png');
const cfg = resolveConfig({ configPath });
const P = cfg.colors;
const ink = P.ink;

/** White die-cut border: draw the art once as a fat white silhouette, then on top. */
const backed = (inner) => `<g stroke="#fff" stroke-width="7" stroke-linejoin="round" fill="#fff">${inner.replace(/(stroke|fill)(-opacity)?="[^"]*"/g, '')}</g>${inner}`;

function vectorStickers() {
  const list = [];
  [...MOODS, 'love', 'wow'].forEach((mood, i) => {
    const inner = characterMarkup({ species: 'star', color: cfg.moodColors[i % cfg.moodColors.length] }, { mood, ink, blush: P.blush, sticker: true });
    list.push({ name: `mood-star-${mood}`, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 112 112" width="512" height="512">${inner}</svg>` });
  });
  const cols = [P.pink, P.lavender, P.teal, P.peach, P.sky, P.yellow];
  ['starBloom', 'cosmos', 'planetBloom', 'tulip', 'bell'].forEach((kind, i) => {
    list.push({ name: `flower-${kind}`, svg: svg(120, 140, backed(stemFlower(kind, 50, 132, 92, 30, cols[i], { ink, lean: 0.08 })), '', 'width="512" height="597"') });
    list.push({ name: `bloom-${kind}`, svg: svg(100, 100, backed(flower(kind, 50, 52, 38, cols[(i + 2) % 6], { ink })), '', 'width="512" height="512"') });
  });
  list.push({ name: 'planet', svg: svg(140, 100, backed(planet(70, 50, 26, P.lavender, P.pink, { ink })), '', 'width="512" height="366"') });
  list.push({ name: 'planet-mint', svg: svg(140, 100, backed(planet(70, 50, 26, P.mint, P.yellow, { ink, tilt: 15 })), '', 'width="512" height="366"') });
  list.push({ name: 'moon', svg: svg(100, 100, backed(moon(50, 50, 38, '#ffe9a8', { ink })), '', 'width="512" height="512"') });
  list.push({ name: 'sparkle', svg: svg(100, 100, backed(sparkle(50, 50, 40, P.yellow, { ink })), '', 'width="512" height="512"') });
  list.push({ name: 'star', svg: svg(100, 100, backed(star(50, 53, 40, P.pink, { ink })), '', 'width="512" height="512"') });
  list.push({ name: 'comet', svg: svg(120, 80, backed(comet(100, 58, 80, P.yellow, { ink })), '', 'width="512" height="341"') });
  return list;
}

async function main() {
  const processed = path.resolve('assets/processed');
  if (!fs.existsSync(path.join(processed, 'manifest.json'))) {
    spawnSync(process.execPath, [path.resolve('tools/prepare-art.js')], { stdio: 'inherit' });
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(processed, 'manifest.json'), 'utf8'));
  const outDir = path.resolve(cfg.output.dir, 'stickers');
  for (const d of ['characters', 'flowers', 'svg']) fs.mkdirSync(path.join(outDir, d), { recursive: true });

  // raster crew + flowers (named after the config, e.g. "sky.png" for ssy.jpg)
  const byImage = Object.fromEntries(manifest.characters.map((c) => [c.id, c]));
  const raster = [];
  for (const ch of cfg.characters) {
    const entry = byImage[ch.image ?? ch.id];
    if (!entry) continue;
    const dest = path.join(outDir, 'characters', `${ch.id}.png`);
    fs.copyFileSync(path.join(processed, entry.file), dest);
    raster.push({ name: ch.name, file: dest });
  }
  for (const fl of manifest.flowers) {
    const dest = path.join(outDir, 'flowers', path.basename(fl.file));
    fs.copyFileSync(path.join(processed, fl.file), dest);
    raster.push({ name: path.basename(fl.file, '.png'), file: dest });
  }

  const vectors = vectorStickers();
  for (const s of vectors) fs.writeFileSync(path.join(outDir, 'svg', `${s.name}.svg`), s.svg);

  const rel = (f) => path.relative(outDir, f).replace(/\\/g, '/');
  const sheet = `<!doctype html><meta charset="utf-8"><title>Sticker pack</title><style>body{margin:0;padding:24px;background:${P.paper};font:13px sans-serif;color:${ink};display:grid;grid-template-columns:repeat(8,1fr);gap:14px}figure{margin:0;text-align:center}figure img,figure svg{width:100%;height:150px;object-fit:contain;background:#f1ebfa;border-radius:12px}</style>` +
    raster.map((r) => `<figure><img src="${rel(r.file)}"><figcaption>${r.name}</figcaption></figure>`).join('') +
    vectors.map((s) => `<figure>${s.svg}<figcaption>${s.name}</figcaption></figure>`).join('');
  fs.writeFileSync(path.join(outDir, 'contact-sheet.html'), sheet);

  if (png) {
    fs.mkdirSync(path.join(outDir, 'png'), { recursive: true });
    const browser = await chromium.launch();
    const page = await browser.newPage();
    for (const s of vectors) {
      await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style>${s.svg}`);
      await page.locator('svg').screenshot({ path: path.join(outDir, 'png', `${s.name}.png`), omitBackground: true });
    }
    await browser.close();
  }
  console.log(`Wrote ${raster.length} character/flower PNGs and ${vectors.length} vector stickers to ${path.relative(process.cwd(), outDir)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
