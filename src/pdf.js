// Renders the planner HTML to PDF with Chromium, then post-processes it with
// pdf-lib: named destinations become explicit page destinations (the most
// widely supported link form in GoodNotes / Notability / Preview), and a
// bookmark outline + document metadata are added.
import fs from 'node:fs';
import zlib from 'node:zlib';
import { chromium } from 'playwright';
import { PDFDocument, PDFName, PDFDict, PDFArray, PDFRef, PDFString, PDFHexString, PDFRawStream, decodePDFRawStream } from 'pdf-lib';

export async function launch() {
  return chromium.launch();
}

export async function renderPdf(browser, htmlPath, pdfPath) {
  // own context per render so parallel jobs get separate renderer processes
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(0);
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'load' });
  await page.waitForSelector('html[data-filled="1"]', { state: 'attached' });
  await page.pdf({ path: pdfPath, preferCSSPageSize: true, printBackground: true });
  await context.close();
}

const nameOf = (obj) => {
  if (!obj) return null;
  if (obj instanceof PDFName) return obj.decodeText();
  if (obj instanceof PDFString || obj instanceof PDFHexString) return obj.decodeText();
  return null;
};

/** Converts every link's named destination into [page /Fit]. */
function explicitDestinations(pdf, idToIndex) {
  const pages = pdf.getPages();
  const ctx = pdf.context;
  let converted = 0, unresolved = [];
  for (const page of pages) {
    const annots = page.node.Annots();
    if (!annots) continue;
    for (let i = 0; i < annots.size(); i++) {
      const annot = annots.lookup(i, PDFDict);
      if (annot.get(PDFName.of('Subtype')) !== PDFName.of('Link')) continue;
      let name = nameOf(annot.lookup(PDFName.of('Dest')));
      const action = annot.lookup(PDFName.of('A'));
      if (!name && action instanceof PDFDict && action.get(PDFName.of('S')) === PDFName.of('GoTo')) name = nameOf(action.lookup(PDFName.of('D')));
      if (!name) continue;
      const idx = idToIndex.get(name);
      if (idx == null) { unresolved.push(name); continue; }
      annot.delete(PDFName.of('A'));
      annot.set(PDFName.of('Dest'), ctx.obj([pages[idx].ref, PDFName.of('Fit')]));
      annot.set(PDFName.of('Border'), ctx.obj([0, 0, 0]));
      converted++;
    }
  }
  return { converted, unresolved };
}

// ---- content compaction ---------------------------------------------------
// Skia writes path coordinates with 6 decimals and approximates every rounded
// corner with ~8 short cubic segments. We (1) merge runs of segments that lie on
// one circular arc into a single cubic and (2) round path coordinates. Both are
// done relative to the current transformation scale, so the change on the page
// is never more than 0.03pt for merged curves or 0.01pt for rounding (well under
// 0.01mm). Transform matrices, text and all other operators are left untouched.
const TOL_PT = 0.03;

const bez = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
};
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = (v) => Math.hypot(v[0], v[1]);
const norm = (v) => { const l = len(v); return l ? [v[0] / l, v[1] / l] : null; };

function fitArc(p0, segs, tol) {
  const first = segs[0], last = segs[segs.length - 1];
  const t0 = norm(sub(first[0], p0)) ?? norm(sub(first[1], p0)) ?? norm(sub(first[2], p0));
  const t3 = norm(sub(last[2], last[1])) ?? norm(sub(last[2], last[0])) ?? norm(sub(last[2], p0));
  if (!t0 || !t3) return null;
  const p3 = last[2];
  const d = len(sub(p3, p0));
  if (d < 1e-6) return null;
  const theta = Math.acos(Math.max(-1, Math.min(1, t0[0] * t3[0] + t0[1] * t3[1])));
  if (theta > (100 * Math.PI) / 180) return null;
  const h = theta < 1e-4 ? d / 3 : (4 / 3) * Math.tan(theta / 4) * (d / (2 * Math.sin(theta / 2)));
  const p1 = [p0[0] + t0[0] * h, p0[1] + t0[1] * h];
  const p2 = [p3[0] - t3[0] * h, p3[1] - t3[1] * h];
  const poly = [];
  for (let k = 0; k <= 48; k++) poly.push(bez(p0, p1, p2, p3, k / 48));
  const distToPoly = (q) => {
    let best = Infinity;
    for (let k = 0; k < poly.length - 1; k++) {
      const a = poly[k], b = poly[k + 1];
      const ab = sub(b, a), aq = sub(q, a);
      const L = ab[0] * ab[0] + ab[1] * ab[1];
      const t = L ? Math.max(0, Math.min(1, (aq[0] * ab[0] + aq[1] * ab[1]) / L)) : 0;
      best = Math.min(best, Math.hypot(q[0] - (a[0] + ab[0] * t), q[1] - (a[1] + ab[1] * t)));
    }
    return best;
  };
  let start = p0;
  for (const sg of segs) {
    for (const t of [0.25, 0.5, 0.75, 1]) if (distToPoly(bez(start, sg[0], sg[1], sg[2], t)) > tol) return null;
    start = sg[2];
  }
  return [p1, p2, p3];
}

const NUM = String.raw`-?\d*\.?\d+`;
const N6 = Array(6).fill(`(${NUM})`).join(' ');
const CURVE = new RegExp(`^${N6} c$`);
const CM = new RegExp(`^${N6} cm$`);
const POINT = new RegExp(String.raw`^(${NUM}) (${NUM}) ([ml])$`);
const RECT = new RegExp(String.raw`^(${NUM}) (${NUM}) (${NUM}) (${NUM}) re$`);
const PATH_OP = /^[\d.\s-]+[vy]$/;

export function compactContent(text) {
  const lines = text.split('\n');
  const out = [];
  const stack = [];
  let scale = 1;
  let cur = null, subStart = null;
  let fmt;
  const setPrecision = () => {
    const dec = Math.min(6, Math.max(0, Math.ceil(2 + Math.log10(scale))));
    const k = 10 ** dec;
    fmt = (v) => { const s = (Math.round(v * k) / k).toString(); return s === '-0' ? '0' : s; };
  };
  setPrecision();
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line === 'q') { stack.push(scale); out.push(line); i++; continue; }
    if (line === 'Q') { scale = stack.pop() ?? 1; setPrecision(); out.push(line); i++; continue; }
    const cm = CM.exec(line);
    if (cm) {
      const [a, b, c, d] = cm.slice(1, 5).map(parseFloat);
      scale *= Math.sqrt(Math.abs(a * d - b * c)) || 1;
      setPrecision();
      out.push(line);
      i++;
      continue;
    }
    const m = CURVE.exec(line);
    if (m && cur) {
      const run = [];
      let j = i;
      for (; j < lines.length; j++) {
        const mm = CURVE.exec(lines[j]);
        if (!mm) break;
        const n = mm.slice(1).map(parseFloat);
        run.push([[n[0], n[1]], [n[2], n[3]], [n[4], n[5]]]);
      }
      const tol = TOL_PT / scale;
      let p0 = cur, a = 0;
      while (a < run.length) {
        let best = null, bestEnd = a;
        for (let b = a + 1; b < run.length; b++) {
          const fit = fitArc(p0, run.slice(a, b + 1), tol);
          if (!fit) break;
          best = fit;
          bestEnd = b;
        }
        const sg = best ?? run[a];
        out.push(`${fmt(sg[0][0])} ${fmt(sg[0][1])} ${fmt(sg[1][0])} ${fmt(sg[1][1])} ${fmt(sg[2][0])} ${fmt(sg[2][1])} c`);
        p0 = sg[2];
        a = bestEnd + 1;
      }
      cur = p0;
      i = j;
      continue;
    }
    const pm = POINT.exec(line);
    const rect = !pm && RECT.exec(line);
    if (pm) {
      cur = [parseFloat(pm[1]), parseFloat(pm[2])];
      if (pm[3] === 'm') subStart = cur;
      out.push(`${fmt(cur[0])} ${fmt(cur[1])} ${pm[3]}`);
    } else if (m) {
      cur = [parseFloat(m[5]), parseFloat(m[6])];
      out.push(m.slice(1).map((v) => fmt(parseFloat(v))).join(' ') + ' c');
    } else if (rect) {
      cur = [parseFloat(rect[1]), parseFloat(rect[2])];
      subStart = cur;
      out.push(rect.slice(1).map((v) => fmt(parseFloat(v))).join(' ') + ' re');
    } else {
      if (line === 'h') cur = subStart;
      else if (PATH_OP.test(line)) cur = null; // v / y: stop tracking until next moveto
      out.push(line);
    }
    i++;
  }
  return out.join('\n');
}

function compactContentStreams(pdf) {
  const targets = new Set();
  for (const page of pdf.getPages()) {
    const contents = page.node.get(PDFName.of('Contents'));
    if (contents instanceof PDFRef) targets.add(contents);
    else if (contents instanceof PDFArray) contents.asArray().forEach((r) => r instanceof PDFRef && targets.add(r));
  }
  let before = 0, after = 0;
  if (process.env.PLANNER_COMPACT === 'none') return { before, after };
  for (const ref of targets) {
    const obj = pdf.context.lookup(ref);
    if (!(obj instanceof PDFRawStream)) continue;
    const filter = obj.dict.get(PDFName.of('Filter'));
    if (filter && filter !== PDFName.of('FlateDecode')) continue;
    const text = Buffer.from(decodePDFRawStream(obj).decode()).toString('latin1');
    if (/\bBI\b/.test(text)) continue; // inline image data: leave untouched
    const data = zlib.deflateSync(Buffer.from(compactContent(text), 'latin1'), { level: 9 });
    before += obj.contents.length;
    after += data.length;
    obj.dict.set(PDFName.of('Filter'), PDFName.of('FlateDecode'));
    obj.dict.delete(PDFName.of('DecodeParms'));
    pdf.context.assign(ref, PDFRawStream.of(obj.dict, data));
  }
  return { before, after };
}

/** items: [{ title, index, children? }] */
function addOutline(pdf, items) {
  const ctx = pdf.context;
  const pages = pdf.getPages();
  const outlinesRef = ctx.nextRef();
  const build = (list, parentRef) => {
    const refs = list.map(() => ctx.nextRef());
    let total = 0;
    list.forEach((item, i) => {
      const dict = ctx.obj({});
      dict.set(PDFName.of('Title'), PDFHexString.fromText(item.title));
      dict.set(PDFName.of('Parent'), parentRef);
      dict.set(PDFName.of('Dest'), ctx.obj([pages[item.index].ref, PDFName.of('Fit')]));
      if (i > 0) dict.set(PDFName.of('Prev'), refs[i - 1]);
      if (i < list.length - 1) dict.set(PDFName.of('Next'), refs[i + 1]);
      if (item.children?.length) {
        const sub = build(item.children, refs[i]);
        dict.set(PDFName.of('First'), sub.refs[0]);
        dict.set(PDFName.of('Last'), sub.refs[sub.refs.length - 1]);
        dict.set(PDFName.of('Count'), ctx.obj(-sub.refs.length)); // collapsed
      }
      ctx.assign(refs[i], dict);
      total++;
    });
    return { refs, total };
  };
  const top = build(items, outlinesRef);
  ctx.assign(outlinesRef, ctx.obj({ Type: 'Outlines', First: top.refs[0], Last: top.refs[top.refs.length - 1], Count: top.total }));
  pdf.catalog.set(PDFName.of('Outlines'), outlinesRef);
}

export async function postProcess(pdfPath, { cfg, model, outline }) {
  const pdf = await PDFDocument.load(fs.readFileSync(pdfPath), { updateMetadata: false });
  const pageCount = pdf.getPageCount();
  if (pageCount !== model.pages.length) {
    throw new Error(`Page count mismatch: expected ${model.pages.length}, Chromium produced ${pageCount}. A template is overflowing onto an extra page.`);
  }
  const idToIndex = new Map(model.pages.map((p, i) => [p.id, i]));
  let stats = { converted: 0, unresolved: [] };
  if (cfg.pdf.explicitDestinations) {
    stats = explicitDestinations(pdf, idToIndex);
    pdf.catalog.delete(PDFName.of('Dests'));
  }
  if (cfg.pdf.outline && outline.length) addOutline(pdf, outline);
  const compacted = compactContentStreams(pdf);

  pdf.setTitle(`${cfg.title} ${cfg.subtitle} ${cfg.yearLabel}`);
  pdf.setAuthor(cfg.author || '');
  pdf.setSubject(`${model.variant === 'dated' ? cfg.yearLabel : 'Undated'} digital planner`);
  pdf.setKeywords(['digital planner', 'goodnotes', 'notability', 'hyperlinked']);
  pdf.setCreator('cosmic-bloom-planner');
  pdf.setProducer('Chromium + pdf-lib');
  pdf.catalog.set(PDFName.of('PageLayout'), PDFName.of('SinglePage'));

  fs.writeFileSync(pdfPath, await pdf.save({ useObjectStreams: true }));
  return { pageCount, compacted, ...stats };
}
