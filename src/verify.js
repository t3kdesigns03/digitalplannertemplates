#!/usr/bin/env node
// Checks generated PDFs: every internal link must point at a real page, every
// page must carry navigation links, and reports page size + image weight.
//   node src/verify.js output/            (all PDFs in a folder and its style subfolders)
//   node src/verify.js file.pdf [...]
import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, PDFName, PDFDict, PDFArray, PDFRawStream, PDFRef } from 'pdf-lib';

const PT_PER_MM = 72 / 25.4;

async function verify(file) {
  const pdf = await PDFDocument.load(fs.readFileSync(file), { updateMetadata: false });
  const pages = pdf.getPages();
  const pageRefs = new Map(pages.map((p, i) => [p.ref.toString(), i]));
  let links = 0, external = 0;
  const broken = [];
  const named = [];
  const perPage = new Array(pages.length).fill(0);
  const reached = new Set();

  pages.forEach((page, i) => {
    const annots = page.node.Annots();
    if (!annots) return;
    for (let k = 0; k < annots.size(); k++) {
      const a = annots.lookup(k, PDFDict);
      if (a.get(PDFName.of('Subtype')) !== PDFName.of('Link')) continue;
      const action = a.lookup(PDFName.of('A'));
      if (action instanceof PDFDict && action.get(PDFName.of('S')) === PDFName.of('URI')) { external++; continue; }
      const dest = a.get(PDFName.of('Dest'));
      links++;
      perPage[i]++;
      if (dest instanceof PDFArray) {
        const target = dest.get(0);
        const idx = target instanceof PDFRef ? pageRefs.get(target.toString()) : undefined;
        if (idx === undefined) broken.push(`page ${i + 1}: destination is not a page`);
        else reached.add(idx);
      } else {
        named.push(`page ${i + 1}`); // still a named destination (post-processing skipped)
      }
    }
  });

  // image XObjects: count + bytes (shared ones are counted once)
  const images = new Map();
  for (const [ref, obj] of pdf.context.enumerateIndirectObjects()) {
    if (obj instanceof PDFRawStream && obj.dict.get(PDFName.of('Subtype')) === PDFName.of('Image')) {
      images.set(ref.toString(), obj.contents.length);
    }
  }
  const imageBytes = [...images.values()].reduce((a, b) => a + b, 0);
  const { width, height } = pages[0].getSize();
  const unlinked = perPage.map((n, i) => (n === 0 ? i + 1 : null)).filter(Boolean);
  const orphans = pages.map((_, i) => i).filter((i) => i > 0 && !reached.has(i)).map((i) => i + 1);

  const size = fs.statSync(file).size;
  const ok = !broken.length && !unlinked.length && !named.length;
  console.log(`\n${ok ? 'PASS' : 'FAIL'}  ${path.basename(file)}`);
  console.log(`  pages        ${pages.length}  (${(width / PT_PER_MM).toFixed(1)} x ${(height / PT_PER_MM).toFixed(1)} mm)`);
  console.log(`  links        ${links} internal, ${external} external, avg ${(links / pages.length).toFixed(1)}/page`);
  console.log(`  file size    ${(size / 1048576).toFixed(1)} MB  (images: ${images.size} objects, ${(imageBytes / 1048576).toFixed(1)} MB)`);
  console.log(`  outline      ${pdf.catalog.get(PDFName.of('Outlines')) ? 'yes' : 'no'}`);
  if (broken.length) console.log(`  BROKEN       ${broken.length}: ${broken.slice(0, 5).join('; ')}`);
  if (named.length) console.log(`  NAMED DESTS  ${named.length} links still use named destinations`);
  if (unlinked.length) console.log(`  NO NAV       pages without any links: ${unlinked.slice(0, 20).join(', ')}`);
  if (orphans.length) console.log(`  unreachable  ${orphans.length} pages no link points to: ${orphans.slice(0, 12).join(', ')}${orphans.length > 12 ? ', ...' : ''}`);
  return ok;
}

const inputs = process.argv.slice(2);
if (!inputs.length) inputs.push('output');
// folders are searched recursively, since builds land in output/<style>/
const pdfsIn = (dir) => fs.readdirSync(dir, { recursive: true }).filter((f) => f.endsWith('.pdf')).sort().map((f) => path.join(dir, f));
const files = inputs.flatMap((p) => (fs.statSync(p).isDirectory() ? pdfsIn(p) : [p]));
if (!files.length) {
  console.error('No PDFs found.');
  process.exit(1);
}
let allOk = true;
for (const f of files) allOk = (await verify(f)) && allOk;
process.exit(allOk ? 0 : 1);
