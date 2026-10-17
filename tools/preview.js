// Screenshots selected pages from a built HTML file (same layout engine the
// PDF uses) so templates can be reviewed without a PDF viewer.
//   node tools/preview.js build/<file>.html [pageId ...] [--out dir] [--scale 1]
// With no page ids, captures one page of each kind.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args.splice(args.indexOf(k), 2)[1] : d);
const outDir = path.resolve(opt('--out', 'build/preview'));
const scale = Number(opt('--scale', '1'));
const [html, ...ids] = args;
if (!html) {
  console.error('usage: node tools/preview.js build/<file>.html [pageId ...]');
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: scale });
await page.goto('file:///' + path.resolve(html).replace(/\\/g, '/'));
await page.waitForSelector('html[data-filled="1"]', { state: 'attached' });
await page.emulateMedia({ media: 'print' });
let targets = ids;
if (!targets.length) {
  targets = await page.$$eval('section.page', (els) => {
    const seen = new Set();
    return els.filter((e) => {
      const kind = e.id.replace(/-?\d.*$/, '') || e.id;
      if (seen.has(kind)) return false;
      seen.add(kind);
      return true;
    }).map((e) => e.id);
  });
}
for (const id of targets) {
  const el = page.locator(`section.page[id="${id}"]`);
  const file = path.join(outDir, `${path.basename(html, '.html')}--${id}.png`);
  await el.screenshot({ path: file });
  console.log(path.relative(process.cwd(), file));
}
await browser.close();
