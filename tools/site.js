// Assembles dist/: the built PDFs plus a small download page with a cover
// thumbnail for each. Runs automatically after `npm run build` (postbuild), so
// a host like Netlify can publish dist/ directly.
//   node tools/site.js [--config file] [--out dist]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { resolveConfig } from '../src/config.js';

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const cfg = resolveConfig({ configPath: opt('--config', process.env.PLANNER_CONFIG || null) });
const outDir = path.resolve(cfg.output.dir);
const dist = path.resolve(opt('--out', 'dist'));
const manifestPath = path.join(outDir, 'builds.json');
if (!fs.existsSync(manifestPath)) {
  console.error(`No ${path.relative(process.cwd(), manifestPath)} found. Run the PDF build first.`);
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'covers'), { recursive: true });

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const SIZE_NAMES = { letter: 'US Letter', a4: 'A4', a5: 'A5' };

// cover thumbnails straight from the built HTML
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const pdf of manifest.pdfs) {
  fs.copyFileSync(path.join(outDir, pdf.file), path.join(dist, pdf.file));
  pdf.cover = null;
  if (pdf.html && fs.existsSync(pdf.html)) {
    await page.goto('file:///' + path.resolve(pdf.html).replace(/\\/g, '/'));
    await page.waitForSelector('html[data-filled="1"]', { state: 'attached' });
    const cover = page.locator('section.page').first();
    const shot = path.join('covers', pdf.file.replace(/\.pdf$/, '.jpg'));
    await cover.screenshot({ path: path.join(dist, shot), type: 'jpeg', quality: 82, scale: 'css' });
    pdf.cover = shot.replace(/\\/g, '/');
  }
}
await browser.close();

const C = cfg.colors;
const cards = manifest.pdfs.map((p) => `
  <a class="card" href="${esc(p.file)}" download>
    ${p.cover ? `<img src="${esc(p.cover)}" alt="" loading="lazy">` : ''}
    <div class="meta">
      <b>${esc(p.variant === 'undated' ? 'Undated' : manifest.yearLabel)} &middot; ${esc(SIZE_NAMES[p.size] ?? p.size)}</b>
      <span>${p.pages} pages &middot; ${p.links.toLocaleString('en-US')} links &middot; ${(p.bytes / 1048576).toFixed(1)} MB</span>
      <em>Download PDF</em>
    </div>
  </a>`).join('');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(manifest.title)} ${esc(manifest.subtitle)}</title>
<style>
  :root { --ink: ${C.ink}; --soft: ${C.inkSoft}; --paper: ${C.paper}; --pink: ${C.pink}; --lav: ${C.lavender}; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 16px/1.5 system-ui, sans-serif; color: var(--ink); background: linear-gradient(180deg, #f6f0ff, var(--paper)); min-height: 100vh; }
  main { max-width: 1100px; margin: 0 auto; padding: 40px 16px 64px; }
  h1 { font-size: clamp(2rem, 5vw, 3.2rem); margin: 0; letter-spacing: -.01em; }
  p.lead { color: var(--soft); margin: .3rem 0 2rem; font-size: 1.1rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 20px; }
  .card { display: flex; flex-direction: column; background: #fff; border-radius: 18px; overflow: hidden; text-decoration: none; color: inherit;
    border: 1.5px solid color-mix(in srgb, var(--lav) 60%, #fff); transition: transform .15s ease; }
  .card:hover { transform: translateY(-3px); }
  .card img { width: 100%; aspect-ratio: 8.5 / 11; object-fit: cover; object-position: top; background: #eee; }
  .meta { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 2px; }
  .meta span { color: var(--soft); font-size: .9rem; }
  .meta em { font-style: normal; font-weight: 600; margin-top: 8px; color: #fff; background: var(--ink); border-radius: 999px; padding: 6px 14px; align-self: flex-start; font-size: .9rem; }
  footer { margin-top: 40px; color: var(--soft); font-size: .85rem; }
</style>
</head>
<body>
<main>
  <h1>${esc(manifest.title)} ${esc(manifest.subtitle)}</h1>
  <p class="lead">${esc(manifest.tagline)}. Hyperlinked for GoodNotes, Notability &amp; Noteshelf.</p>
  <div class="grid">${cards}</div>
  <footer>Generated ${esc(new Date(manifest.generated).toUTCString())}</footer>
</main>
</body>
</html>`;
fs.writeFileSync(path.join(dist, 'index.html'), html);
console.log(`Site  ${path.relative(process.cwd(), dist)}/ (${manifest.pdfs.length} PDFs + index.html)`);
