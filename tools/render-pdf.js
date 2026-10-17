// Renders pages of a finished PDF to PNG using pdf.js inside Chromium, so the
// post-processed file itself can be inspected. Also lists each page's link
// targets, which is a quick way to spot-check navigation.
//   node tools/render-pdf.js output/file.pdf 1,3,20 [--scale 2] [--out build/pdf-render]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args.splice(args.indexOf(k), 2)[1] : d);
const scale = Number(opt('--scale', '1.5'));
const outDir = path.resolve(opt('--out', 'build/pdf-render'));
const [pdfFile, pageList = '1'] = args;
if (!pdfFile) {
  console.error('usage: node tools/render-pdf.js file.pdf 1,2,3 [--scale 1.5]');
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });
const pdfjs = path.resolve('node_modules/pdfjs-dist/build');
const files = {
  '/pdf.mjs': [path.join(pdfjs, 'pdf.mjs'), 'text/javascript'],
  '/pdf.worker.mjs': [path.join(pdfjs, 'pdf.worker.mjs'), 'text/javascript'],
  '/doc.pdf': [path.resolve(pdfFile), 'application/pdf'],
  '/': [null, 'text/html'],
};
const html = `<!doctype html><body style="margin:0;background:#fff"><canvas id="c"></canvas><script type="module">
import * as pdfjs from '/pdf.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
const doc = await pdfjs.getDocument({ url: '/doc.pdf' }).promise;
window.renderPage = async (n, scale) => {
  const page = await doc.getPage(n);
  const vp = page.getViewport({ scale });
  const c = document.getElementById('c');
  c.width = vp.width; c.height = vp.height;
  await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
  const annots = await page.getAnnotations();
  const links = [];
  for (const a of annots.filter((x) => x.subtype === 'Link' && x.dest)) {
    const ref = Array.isArray(a.dest) ? a.dest[0] : null;
    links.push(ref ? (await doc.getPageIndex(ref)) + 1 : String(a.dest));
  }
  return { w: vp.width, h: vp.height, links };
};
window.ready = doc.numPages;
</script>`;
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
page.on('console', (m) => m.type() === 'error' && console.error('[page]', m.text()));
page.on('pageerror', (e) => console.error('[page]', e.message));
await context.route('http://pdf.local/**', (route) => {
  const p = new URL(route.request().url()).pathname;
  const [file, type] = files[p] ?? [];
  if (!type) return route.fulfill({ status: 404 });
  route.fulfill({ contentType: type, body: file ? fs.readFileSync(file) : html });
});
await page.goto('http://pdf.local/');
await page.waitForFunction(() => window.ready);
for (const n of pageList.split(',').map(Number)) {
  const info = await page.evaluate(([n, s]) => window.renderPage(n, s), [n, scale]);
  await page.setViewportSize({ width: Math.ceil(info.w), height: Math.ceil(info.h) });
  const file = path.join(outDir, `${path.basename(pdfFile, '.pdf')}-p${n}.png`);
  await page.locator('#c').screenshot({ path: file });
  console.log(`${path.relative(process.cwd(), file)}  links -> pages ${[...new Set(info.links)].join(',')}`);
}
await browser.close();
