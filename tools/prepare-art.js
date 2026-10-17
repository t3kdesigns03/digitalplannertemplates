// Turns the character JPGs (which have a fake transparency checkerboard baked
// in) into real transparent PNGs, and splits the space-flowers sheet into
// individual stickers.
//
//   node tools/prepare-art.js            process everything in assets/charachters
//   node tools/prepare-art.js --debug    also write mask previews to assets/processed/_debug
//
// Output: assets/processed/{characters,flowers}/*.png + assets/processed/manifest.json
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = path.resolve('assets/charachters');
const OUT = path.resolve('assets/processed');
const DEBUG = process.argv.includes('--debug');
const SHEETS = new Set(['spaceflowers']); // files that are sticker sheets, not single characters

function analyze(data, W, H) {
  const lum = new Float32Array(W * H);
  const sat = new Float32Array(W * H);
  for (let i = 0, p = 0; i < W * H; i++, p += 3) {
    const r = data[p], g = data[p + 1], b = data[p + 2];
    lum[i] = (r + g + b) / 3;
    sat[i] = Math.max(r, g, b) - Math.min(r, g, b);
  }
  return { lum, sat };
}

/** Integral image for O(1) window sums. */
function integral(mask, W, H) {
  const I = new Int32Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) {
    let row = 0;
    for (let x = 0; x < W; x++) {
      row += mask[y * W + x];
      I[(y + 1) * (W + 1) + x + 1] = I[y * (W + 1) + x + 1] + row;
    }
  }
  return (x0, y0, x1, y1) => {
    x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(W, x1); y1 = Math.min(H, y1);
    return I[y1 * (W + 1) + x1] - I[y0 * (W + 1) + x1] - I[y1 * (W + 1) + x0] + I[y0 * (W + 1) + x0];
  };
}

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * Phase-free checkerboard removal. The fake-transparency grid in these files
 * drifts, so instead of predicting tile positions we look for its texture:
 * light, unsaturated pixels with sharp edges in BOTH directions nearby.
 */
function removeChecker(data, W, H) {
  const { lum, sat } = analyze(data, W, H);

  // tile colours from unsaturated border pixels
  const border = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if ((x < 16 || y < 16 || x >= W - 16 || y >= H - 16) && sat[i] <= 10) border.push(lum[i]);
  }
  border.sort((a, b) => a - b);
  const split = 236;
  const loArr = border.filter((v) => v < split), hiArr = border.filter((v) => v >= split);
  const lo = loArr[loArr.length >> 1] ?? 217, hi = hiArr[hiArr.length >> 1] ?? 255;
  const mid = (hi + lo) / 2;

  const C = new Uint8Array(W * H), EH = new Uint8Array(W * H), EV = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    C[i] = sat[i] <= 12 && lum[i] >= lo - 12 ? 1 : 0;
  }
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    if (!C[i]) continue;
    if (Math.abs(lum[i + 1] - lum[i - 1]) >= 12 && Math.abs(lum[i + W] - lum[i - W]) < 8) EH[i] = 1;
    if (Math.abs(lum[i + W] - lum[i - W]) >= 12 && Math.abs(lum[i + 1] - lum[i - 1]) < 8) EV[i] = 1;
  }
  const sC = integral(C, W, H), sH = integral(EH, W, H), sV = integral(EV, W, H);
  const R = 7; // 15x15 window always spans a grid line both ways
  const core = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!C[i]) continue;
    const x0 = x - R, y0 = y - R, x1 = x + R + 1, y1 = y + R + 1;
    const n = (Math.min(W, x1) - Math.max(0, x0)) * (Math.min(H, y1) - Math.max(0, y0));
    if (sC(x0, y0, x1, y1) >= 0.9 * n && sH(x0, y0, x1, y1) >= 0.05 * n && sV(x0, y0, x1, y1) >= 0.05 * n) core[i] = 1;
  }

  // keep core regions touching the border, plus big enclosed ones (gaps between limbs)
  const bg = new Uint8Array(W * H);
  const seen = new Uint8Array(W * H);
  for (let s = 0; s < W * H; s++) {
    if (!core[s] || seen[s]) continue;
    const stack = [s], comp = [];
    seen[s] = 1;
    let touches = false;
    while (stack.length) {
      const i = stack.pop();
      comp.push(i);
      const x = i % W, y = (i / W) | 0;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) touches = true;
      for (const [dx, dy] of N4) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (core[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
      }
    }
    if (touches || comp.length >= 700) for (const i of comp) bg[i] = 1;
  }

  // grow into neighbouring checker-coloured pixels to reach the true edge
  let frontier = [];
  for (let i = 0; i < W * H; i++) if (bg[i]) frontier.push(i);
  for (let d = 0; d < 9 && frontier.length; d++) {
    const next = [];
    for (const i of frontier) {
      const x = i % W, y = (i / W) | 0;
      for (const [dx, dy] of N4) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (!bg[j] && C[j]) { bg[j] = 1; next.push(j); }
      }
    }
    frontier = next;
  }

  // drop small specks left floating in the background
  const lab = new Uint8Array(W * H);
  for (let s = 0; s < W * H; s++) {
    if (bg[s] || lab[s]) continue;
    const stack = [s], comp = [];
    lab[s] = 1;
    while (stack.length) {
      const i = stack.pop();
      comp.push(i);
      const x = i % W, y = (i / W) | 0;
      for (const [dx, dy] of N4) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (!bg[j] && !lab[j]) { lab[j] = 1; stack.push(j); }
      }
    }
    if (comp.length < 80) for (const i of comp) bg[i] = 1;
  }

  // distance from background (capped) for edge + glow handling
  const dist = new Uint8Array(W * H).fill(255);
  frontier = [];
  for (let i = 0; i < W * H; i++) if (bg[i]) { dist[i] = 0; frontier.push(i); }
  for (let d = 1; d <= 24 && frontier.length; d++) {
    const next = [];
    for (const i of frontier) {
      const x = i % W, y = (i / W) | 0;
      for (const [dx, dy] of N4) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (dist[j] === 255) { dist[j] = d; next.push(j); }
      }
    }
    frontier = next;
  }

  // A 24px box blur spans whole tile pairs, so it averages the checkerboard
  // to a flat grey and leaves only the smooth glow colour behind.
  const chan = [0, 1, 2].map((c) => {
    const m = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) m[i] = data[i * 3 + c];
    return integral(m, W, H);
  });
  const B = 12;
  const tileMean = (hi + lo) / 2;

  const out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x, p = i * 3, q = i * 4;
      if (bg[i]) continue;
      let a = 1;
      if (dist[i] === 1) {
        let n = 0, f = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          n++;
          if (!bg[ny * W + nx]) f++;
        }
        a = Math.min(1, f / n + 0.2);
      }
      let r = data[p], g = data[p + 1], b = data[p + 2];
      const near = lum[i] >= mid - 6 ? hi : lo;
      const devTile = Math.max(Math.abs(r - near), Math.abs(g - near), Math.abs(b - near));
      if (dist[i] <= 30 && devTile < 45 && sat[i] >= 6 && lum[i] > lo - 25) {
        // glow over the checkerboard: take colour + coverage from the blur
        const x0 = x - B, y0 = y - B, x1 = x + B, y1 = y + B;
        const n = (Math.min(W, x1) - Math.max(0, x0)) * (Math.min(H, y1) - Math.max(0, y0));
        const blur = chan.map((s) => s(x0, y0, x1, y1) / n);
        const dev = Math.max(...blur.map((v) => Math.abs(v - tileMean)));
        const ga = Math.min(1, Math.max(0, (dev - 3) / 38));
        if (ga < 0.995) {
          [r, g, b] = blur.map((v) => Math.min(255, Math.max(0, tileMean + (v - tileMean) / Math.max(ga, 0.05))));
          a = Math.min(a, ga);
        }
      }
      out[q] = r; out[q + 1] = g; out[q + 2] = b; out[q + 3] = Math.round(a * 255);
    }
  }
  // Edge decontamination: pixels right at the silhouette are partly blended
  // with the light checkerboard, which shows as a pale fringe on dark covers.
  // Give them the colour of the solid pixels just inside the character.
  const src = Buffer.from(out);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (bg[i] || dist[i] > 2) continue;
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (dist[j] >= 4 && src[j * 4 + 3] >= 250) { r += src[j * 4]; g += src[j * 4 + 1]; b += src[j * 4 + 2]; n++; }
      }
      if (n) { out[i * 4] = r / n; out[i * 4 + 1] = g / n; out[i * 4 + 2] = b / n; }
    }
  }
  return { rgba: out, bg, checker: { lo, hi } };
}

function bbox(rgba, W, H, minAlpha = 24) {
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (rgba[(y * W + x) * 4 + 3] >= minAlpha) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

async function writeCrop(rgba, W, H, box, file, pad = 6) {
  const left = Math.max(0, box.x0 - pad), top = Math.max(0, box.y0 - pad);
  const width = Math.min(W, box.x1 + pad + 1) - left, height = Math.min(H, box.y1 + pad + 1) - top;
  await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left, top, width, height })
    .png({ compressionLevel: 9, palette: false })
    .toFile(file);
  return { width, height };
}

/** Splits a sheet into blobs: components of the alpha mask after dilation. */
function splitSheet(rgba, W, H, { dilate = 10, minArea = 900 } = {}) {
  const solid = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) solid[i] = rgba[i * 4 + 3] >= 40 ? 1 : 0;
  // box dilation via integral image so nearby sparkles join their flower
  const integ = new Int32Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) {
    let row = 0;
    for (let x = 0; x < W; x++) {
      row += solid[y * W + x];
      integ[(y + 1) * (W + 1) + x + 1] = integ[y * (W + 1) + x + 1] + row;
    }
  }
  const dil = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const xa = Math.max(0, x - dilate), xb = Math.min(W, x + dilate + 1), ya = Math.max(0, y - dilate), yb = Math.min(H, y + dilate + 1);
    const s = integ[yb * (W + 1) + xb] - integ[ya * (W + 1) + xb] - integ[yb * (W + 1) + xa] + integ[ya * (W + 1) + xa];
    dil[y * W + x] = s > 0 ? 1 : 0;
  }
  const lab = new Int32Array(W * H).fill(-1);
  const blobs = [];
  for (let s = 0; s < W * H; s++) {
    if (!dil[s] || lab[s] >= 0) continue;
    const stack = [s];
    lab[s] = blobs.length;
    let area = 0, x0 = W, y0 = H, x1 = 0, y1 = 0;
    while (stack.length) {
      const i = stack.pop();
      const x = i % W, y = (i / W) | 0;
      if (solid[i]) { area++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (dil[j] && lab[j] < 0) { lab[j] = blobs.length; stack.push(j); }
      }
    }
    blobs.push({ id: blobs.length, area, x0, y0, x1, y1 });
  }
  return { blobs: blobs.filter((b) => b.area >= minArea && b.x1 - b.x0 >= 90 && b.y1 - b.y0 >= 90), lab };
}

async function main() {
  const files = fs.readdirSync(SRC).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
  if (!files.length) throw new Error(`No images found in ${SRC}`);
  for (const d of ['characters', 'flowers', DEBUG && '_debug'].filter(Boolean)) fs.mkdirSync(path.join(OUT, d), { recursive: true });
  const manifest = { generated: new Date().toISOString(), characters: [], flowers: [] };

  for (const file of files) {
    const name = path.parse(file).name.toLowerCase();
    const src = path.join(SRC, file);
    const meta = await sharp(src).metadata();
    let rgba, W, H;
    const withAlpha = meta.hasAlpha ? await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true }) : null;
    const realAlpha = withAlpha && (() => {
      const d = withAlpha.data;
      let clear = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] < 250) clear++;
      return clear > (d.length / 4) * 0.02;
    })();
    if (realAlpha) {
      // already a proper transparent PNG: use it as-is
      ({ data: rgba, info: { width: W, height: H } } = withAlpha);
    } else {
      const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      ({ width: W, height: H } = info);
      ({ rgba } = removeChecker(data, W, H));
    }
    if (DEBUG) {
      await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
        .flatten({ background: '#3b2d5e' }).jpeg({ quality: 80 }).toFile(path.join(OUT, '_debug', `${name}-on-dark.jpg`));
    }

    if (SHEETS.has(name)) {
      const { blobs, lab } = splitSheet(rgba, W, H);
      blobs.sort((a, b) => (Math.abs(a.y0 - b.y0) < 60 ? a.x0 - b.x0 : a.y0 - b.y0));
      let n = 0;
      for (const b of blobs) {
        const part = Buffer.from(rgba);
        for (let i = 0; i < W * H; i++) if (lab[i] !== b.id) part[i * 4 + 3] = 0;
        const box = bbox(part, W, H);
        if (!box) continue;
        n++;
        const out = `${name}-${String(n).padStart(2, '0')}.png`;
        const size = await writeCrop(part, W, H, box, path.join(OUT, 'flowers', out), 4);
        manifest.flowers.push({ file: `flowers/${out}`, ...size });
      }
      console.log(`${file}: ${realAlpha ? 'transparent PNG' : 'checkerboard removed'} -> ${n} stickers`);
    } else {
      const box = bbox(rgba, W, H);
      const out = `${name}.png`;
      const size = await writeCrop(rgba, W, H, box, path.join(OUT, 'characters', out));
      manifest.characters.push({ id: name, file: `characters/${out}`, ...size });
      console.log(`${file}: ${realAlpha ? 'transparent PNG' : 'checkerboard removed'} -> ${size.width}x${size.height}`);
    }
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Manifest written to ${path.relative(process.cwd(), path.join(OUT, 'manifest.json'))}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
