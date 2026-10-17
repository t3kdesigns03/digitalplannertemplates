// Assembles dist/ as a gallery: a main page with one card per design (style),
// and a page per design with its PDFs and cover thumbnails. Runs automatically
// after `npm run build` (postbuild), so a host like Netlify can publish dist/.
//   node tools/site.js [--config file] [--out dist]
//
// Reads every <output.dir>/<style>/builds.json, so styles built in separate runs
// all show up. Full-size covers (for Etsy listing photos) are saved next to the
// PDFs in <output.dir>/<style>/covers/.
//
//   dist/index.html                  gallery of designs
//   dist/<style>/index.html          one design: its PDFs + thumbnails
//   dist/<style>/*.pdf, covers/*.jpg
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { resolveConfig } from '../src/config.js';
import { STYLES } from '../src/styles.js';

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const cfg = resolveConfig({ configPath: opt('--config', process.env.PLANNER_CONFIG || null) });
const outRoot = path.resolve(cfg.output.dir);
const dist = path.resolve(opt('--out', 'dist'));

// every style folder with a finished build, in the order styles are registered
const known = Object.keys(STYLES);
const rank = (s) => (known.includes(s) ? known.indexOf(s) : known.length);
const builds = (fs.existsSync(outRoot) ? fs.readdirSync(outRoot, { withFileTypes: true }) : [])
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(outRoot, d.name, 'builds.json')))
  .map((d) => ({ dir: path.join(outRoot, d.name), ...JSON.parse(fs.readFileSync(path.join(outRoot, d.name, 'builds.json'), 'utf8')) }))
  .sort((a, b) => rank(a.style) - rank(b.style) || a.style.localeCompare(b.style));
if (!builds.length) {
  console.error(`No builds found in ${path.relative(process.cwd(), outRoot)}/<style>/. Run the PDF build first.`);
  process.exit(1);
}

fs.rmSync(dist, { recursive: true, force: true });

// Covers straight from the built HTML: a 2x shot for listing photos, then a
// small copy for the web page. If the HTML is gone, reuse the last listing shot.
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
for (const b of builds) {
  const siteDir = path.join(dist, b.style);
  fs.mkdirSync(path.join(siteDir, 'covers'), { recursive: true });
  fs.mkdirSync(path.join(b.dir, 'covers'), { recursive: true });
  for (const pdf of b.pdfs) {
    fs.copyFileSync(path.join(b.dir, pdf.file), path.join(siteDir, pdf.file));
    const jpg = pdf.file.replace(/\.pdf$/, '.jpg');
    const full = path.join(b.dir, 'covers', jpg);
    if (pdf.html && fs.existsSync(pdf.html)) {
      await page.goto('file:///' + path.resolve(pdf.html).replace(/\\/g, '/'));
      await page.waitForSelector('html[data-filled="1"]', { state: 'attached' });
      await page.locator('section.page').first().screenshot({ path: full, type: 'jpeg', quality: 90, scale: 'device' });
    }
    pdf.cover = null;
    if (fs.existsSync(full)) {
      await sharp(full).resize({ width: 640 }).jpeg({ quality: 82 }).toFile(path.join(siteDir, 'covers', jpg));
      pdf.cover = `covers/${jpg}`;
    }
  }
}
await browser.close();

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const SIZE_NAMES = { letter: 'US Letter', a4: 'A4', a5: 'A5' };
const uniq = (xs) => [...new Set(xs)];
const C = cfg.colors;
const first = builds[0];

const shell = (title, body) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
  :root { --ink: ${C.ink}; --soft: ${C.inkSoft}; --paper: ${C.paper}; --pink: ${C.pink}; --lav: ${C.lavender}; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 16px/1.5 system-ui, sans-serif; color: var(--ink); background: linear-gradient(180deg, #f6f0ff, var(--paper)); min-height: 100vh; }
  main { max-width: 1100px; margin: 0 auto; padding: 40px 16px 64px; }
  h1 { font-size: clamp(2rem, 5vw, 3.2rem); margin: 0; letter-spacing: -.01em; }
  p.lead { color: var(--soft); margin: .3rem 0 2rem; font-size: 1.1rem; }
  .back { display: inline-block; margin-bottom: 12px; color: var(--soft); text-decoration: none; font-weight: 600; }
  .back:hover { color: var(--ink); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 20px; }
  .grid.designs { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 28px; }
  .card { display: flex; flex-direction: column; background: #fff; border-radius: 18px; overflow: hidden; text-decoration: none; color: inherit;
    border: 1.5px solid color-mix(in srgb, var(--lav) 60%, #fff); transition: transform .15s ease, box-shadow .15s ease; }
  .card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px -12px color-mix(in srgb, var(--lav) 80%, #000); }
  .card img { width: 100%; aspect-ratio: 8.5 / 11; object-fit: cover; object-position: top; background: #eee; }
  .meta { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 2px; }
  .meta b { font-size: 1.05rem; }
  .meta span { color: var(--soft); font-size: .9rem; }
  .meta em { font-style: normal; font-weight: 600; margin-top: 8px; color: #fff; background: var(--ink); border-radius: 999px; padding: 6px 14px; align-self: flex-start; font-size: .9rem; }
  footer { margin-top: 40px; color: var(--soft); font-size: .85rem; }
  .style { display: inline-block; margin-left: 6px; padding: 2px 10px; border-radius: 999px; background: color-mix(in srgb, var(--lav) 35%, #fff); color: var(--ink); font-size: .85rem; }
</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>`;

// one page per design
for (const b of builds) {
  const cards = b.pdfs.map((p) => `
  <a class="card" href="${esc(p.file)}" download>
    ${p.cover ? `<img src="${esc(p.cover)}" alt="" loading="lazy">` : ''}
    <div class="meta">
      <b>${esc(p.variant === 'undated' ? 'Undated' : b.yearLabel)} &middot; ${esc(SIZE_NAMES[p.size] ?? p.size)}</b>
      <span>${p.pages} pages &middot; ${p.links.toLocaleString('en-US')} links &middot; ${(p.bytes / 1048576).toFixed(1)} MB</span>
      <em>Download PDF</em>
    </div>
  </a>`).join('');
  fs.writeFileSync(path.join(dist, b.style, 'index.html'), shell(`${b.title} ${b.subtitle} · ${b.styleLabel}`, `
  ${builds.length > 1 ? '<a class="back" href="../index.html">&larr; All designs</a>' : ''}
  <h1>${esc(b.title)} ${esc(b.subtitle)}</h1>
  <p class="lead">${esc(b.tagline)}. Hyperlinked for GoodNotes, Notability &amp; Noteshelf. <span class="style">${esc(b.styleLabel)} style</span></p>
  <div class="grid">${cards}</div>
  <footer>Generated ${esc(new Date(b.generated).toUTCString())}</footer>`));
}

// the gallery: one card per design, linking to its page
const designs = builds.map((b) => {
  const hero = b.pdfs.find((p) => p.cover);
  const variants = uniq(b.pdfs.map((p) => (p.variant === 'undated' ? 'Undated' : 'Dated'))).join(' & ');
  const sizes = uniq(b.pdfs.map((p) => SIZE_NAMES[p.size] ?? p.size)).join(', ');
  return `
  <a class="card" href="${esc(b.style)}/index.html">
    ${hero ? `<img src="${esc(`${b.style}/${hero.cover}`)}" alt="${esc(b.styleLabel)} cover" loading="lazy">` : ''}
    <div class="meta">
      <b>${esc(b.styleLabel)}</b>
      <span>${b.pdfs.length} PDF${b.pdfs.length === 1 ? '' : 's'} &middot; ${esc(variants)} &middot; ${esc(sizes)}</span>
      <em>View design</em>
    </div>
  </a>`;
}).join('');
const latest = builds.map((b) => b.generated).sort().at(-1);
fs.writeFileSync(path.join(dist, 'index.html'), shell(`${first.title} ${first.subtitle}`, `
  <h1>${esc(first.title)} ${esc(first.subtitle)}</h1>
  <p class="lead">${esc(first.tagline)}. Pick a design to see its planners.</p>
  <div class="grid designs">${designs}</div>
  <footer>Last built ${esc(new Date(latest).toUTCString())}</footer>`));

const total = builds.reduce((n, b) => n + b.pdfs.length, 0);
console.log(`Site  ${path.relative(process.cwd(), dist)}/ (${builds.length} design${builds.length === 1 ? '' : 's'}: ${builds.map((b) => b.style).join(', ')}; ${total} PDFs)`);
