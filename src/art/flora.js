// Space flowers + cosmic decor. All functions return inner SVG markup in the
// caller's coordinate space unless they end in `Svg`.
import { shade, f, rng } from './color.js';

const INK = '#4a3a6b';

export function sparkle(x, y, r, color = '#ffdf7e', { ink = INK, outline = true } = {}) {
  const k = r * 0.18;
  const d = `M${f(x)} ${f(y - r)} Q${f(x + k)} ${f(y - k)} ${f(x + r)} ${f(y)} Q${f(x + k)} ${f(y + k)} ${f(x)} ${f(y + r)} Q${f(x - k)} ${f(y + k)} ${f(x - r)} ${f(y)} Q${f(x - k)} ${f(y - k)} ${f(x)} ${f(y - r)}Z`;
  return `<path d="${d}" fill="${color}"${outline ? ` stroke="${ink}" stroke-width="${f(Math.max(0.6, r * 0.12))}" stroke-linejoin="round"` : ''}/>`;
}

export function starPoints(cx, cy, ro, ri, n = 5, rot = -90) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? ri : ro;
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    pts.push(`${f(cx + r * Math.cos(a))},${f(cy + r * Math.sin(a))}`);
  }
  return pts.join(' ');
}

export function star(x, y, r, color = '#ffdf7e', { ink = INK, outline = true } = {}) {
  return `<polygon points="${starPoints(x, y, r, r * 0.5)}" fill="${color}"${outline ? ` stroke="${ink}" stroke-width="${f(Math.max(0.6, r * 0.14))}" stroke-linejoin="round"` : ''}/>`;
}

export function planet(x, y, r, color, ringColor, { ink = INK, tilt = -18 } = {}) {
  const sw = f(Math.max(0.8, r * 0.09));
  const rx = r * 1.75;
  const ry = r * 0.42;
  const full = `M${f(x - rx)} ${f(y)} A${f(rx)} ${f(ry)} 0 1 0 ${f(x + rx)} ${f(y)} A${f(rx)} ${f(ry)} 0 1 0 ${f(x - rx)} ${f(y)}`;
  const front = `M${f(x - rx)} ${f(y)} A${f(rx)} ${f(ry)} 0 0 0 ${f(x + rx)} ${f(y)}`;
  const ring = (d) => `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${f(r * 0.3)}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${ringColor}" stroke-width="${f(r * 0.3 - sw * 2)}" stroke-linecap="round"/>`;
  return `<g transform="rotate(${tilt} ${f(x)} ${f(y)})">${ring(full)}</g>` +
    `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${color}" stroke="${ink}" stroke-width="${sw}"/>` +
    `<path d="M${f(x - r * 0.75)} ${f(y - r * 0.15)} Q${f(x)} ${f(y + r * 0.25)} ${f(x + r * 0.78)} ${f(y - r * 0.3)}" fill="none" stroke="${shade(color, -0.12)}" stroke-width="${f(r * 0.16)}" stroke-linecap="round" fill-opacity=".6" stroke-opacity=".6"/>` +
    `<circle cx="${f(x - r * 0.35)}" cy="${f(y - r * 0.45)}" r="${f(r * 0.16)}" fill="#fff" fill-opacity=".75" stroke-opacity=".75"/>` +
    `<g transform="rotate(${tilt} ${f(x)} ${f(y)})">${ring(front)}</g>`;
}

export function moon(x, y, r, color = '#ffe9a8', { ink = INK } = {}) {
  const d = `M${f(x + r * 0.2)} ${f(y - r)} A${f(r)} ${f(r)} 0 1 0 ${f(x + r * 0.2)} ${f(y + r)} A${f(r * 1.25)} ${f(r * 1.25)} 0 0 1 ${f(x + r * 0.2)} ${f(y - r)}Z`;
  return `<path d="${d}" fill="${color}" stroke="${ink}" stroke-width="${f(Math.max(0.7, r * 0.09))}" stroke-linejoin="round"/>`;
}

export function comet(x, y, len, color = '#ffdf7e', { ink = INK } = {}) {
  return `<path d="M${f(x)} ${f(y)} L${f(x - len)} ${f(y - len * 0.45)}" stroke="${shade(color, 0.3)}" stroke-width="${f(len * 0.12)}" stroke-linecap="round" fill-opacity=".8" stroke-opacity=".8"/>` +
    `<path d="M${f(x)} ${f(y)} L${f(x - len * 0.7)} ${f(y - len * 0.12)}" stroke="${shade(color, 0.5)}" stroke-width="${f(len * 0.07)}" stroke-linecap="round" fill-opacity=".8" stroke-opacity=".8"/>` +
    star(x, y, len * 0.18, color, { ink });
}

/** Ellipse petals rotated around a center. */
function petalRing(cx, cy, n, dist, rx, ry, color, ink, sw, offset = 0) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = offset + (360 / n) * i;
    s += `<ellipse cx="${f(cx)}" cy="${f(cy - dist)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(a)} ${f(cx)} ${f(cy)})" fill="${color}" stroke="${ink}" stroke-width="${sw}"/>`;
  }
  return s;
}

/**
 * A space flower head. kind: starBloom | cosmos | planetBloom | tulip | bell
 * `r` is the overall radius of the bloom.
 */
export function flower(kind, cx, cy, r, color, { ink = INK, center = '#ffdf7e' } = {}) {
  const sw = f(Math.max(0.6, r * 0.075));
  const inner = shade(color, 0.45);
  switch (kind) {
    case 'cosmos':
      return petalRing(cx, cy, 8, r * 0.55, r * 0.26, r * 0.5, color, ink, sw) +
        petalRing(cx, cy, 8, r * 0.5, r * 0.1, r * 0.28, inner, inner, 0.01) +
        `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.3)}" fill="${center}" stroke="${ink}" stroke-width="${sw}"/>` +
        sparkle(cx, cy, r * 0.18, '#fff', { outline: false });
    case 'planetBloom':
      return petalRing(cx, cy, 5, r * 0.55, r * 0.42, r * 0.46, color, ink, sw) +
        planet(cx, cy, r * 0.32, center, shade(color, -0.1), { ink, tilt: -20 });
    case 'tulip': {
      const w = r * 0.8;
      const top = cy - r * 0.75;
      const bot = cy + r * 0.6;
      return `<path d="M${f(cx - w)} ${f(top + r * 0.2)} Q${f(cx - w * 1.05)} ${f(bot)} ${f(cx)} ${f(bot)} Q${f(cx + w * 1.05)} ${f(bot)} ${f(cx + w)} ${f(top + r * 0.2)} L${f(cx + w * 0.45)} ${f(top + r * 0.55)} L${f(cx)} ${f(top)} L${f(cx - w * 0.45)} ${f(top + r * 0.55)}Z" fill="${color}" stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round"/>` +
        `<path d="M${f(cx)} ${f(top + r * 0.35)} Q${f(cx - w * 0.3)} ${f(cy + r * 0.2)} ${f(cx)} ${f(bot - r * 0.1)}" fill="none" stroke="${inner}" stroke-width="${f(r * 0.12)}" stroke-linecap="round"/>` +
        star(cx, top - r * 0.22, r * 0.26, center, { ink });
    }
    case 'bell': {
      let s = '';
      [-1, 0, 1].forEach((k) => {
        const bx = cx + k * r * 0.62;
        const by = cy + Math.abs(k) * r * 0.35;
        s += `<path d="M${f(bx)} ${f(by - r * 0.45)} C${f(bx - r * 0.45)} ${f(by - r * 0.45)} ${f(bx - r * 0.42)} ${f(by + r * 0.2)} ${f(bx - r * 0.5)} ${f(by + r * 0.38)} Q${f(bx - r * 0.25)} ${f(by + r * 0.22)} ${f(bx)} ${f(by + r * 0.42)} Q${f(bx + r * 0.25)} ${f(by + r * 0.22)} ${f(bx + r * 0.5)} ${f(by + r * 0.38)} C${f(bx + r * 0.42)} ${f(by + r * 0.2)} ${f(bx + r * 0.45)} ${f(by - r * 0.45)} ${f(bx)} ${f(by - r * 0.45)}Z" fill="${color}" stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round"/>` +
          `<circle cx="${f(bx)}" cy="${f(by + r * 0.5)}" r="${f(r * 0.09)}" fill="${center}" stroke="${ink}" stroke-width="${f(sw * 0.7)}"/>`;
      });
      return `<path d="M${f(cx - r * 0.62)} ${f(cy - r * 0.15)} Q${f(cx)} ${f(cy - r * 0.95)} ${f(cx + r * 0.62)} ${f(cy - r * 0.15)}" fill="none" stroke="#4aa36f" stroke-width="${sw}" stroke-linecap="round"/>` + s;
    }
    default: // starBloom
      return petalRing(cx, cy, 6, r * 0.52, r * 0.33, r * 0.5, color, ink, sw) +
        `<polygon points="${starPoints(cx, cy, r * 0.42, r * 0.24)}" fill="${center}" stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round"/>` +
        `<circle cx="${f(cx - r * 0.08)}" cy="${f(cy - r * 0.1)}" r="${f(r * 0.07)}" fill="#fff"/>`;
  }
}

/** Flower with a curved stem and a leaf, rooted at (x, y), bloom at top. */
export function stemFlower(kind, x, y, h, r, color, { ink = INK, lean = 0.15, leafSide = 1, center } = {}) {
  const tx = x + h * lean;
  const ty = y - h;
  const sw = f(Math.max(0.7, r * 0.09));
  const green = '#6fcf97';
  const mx = x + h * lean * 0.2 - h * 0.08 * leafSide;
  const my = y - h * 0.5;
  const leafX = x + (tx - x) * 0.35;
  const leafY = y - h * 0.38;
  const lw = r * 0.95 * leafSide;
  return `<path d="M${f(x)} ${f(y)} Q${f(mx)} ${f(my)} ${f(tx)} ${f(ty)}" fill="none" stroke="${ink}" stroke-width="${f(sw * 2.4)}" stroke-linecap="round"/>` +
    `<path d="M${f(x)} ${f(y)} Q${f(mx)} ${f(my)} ${f(tx)} ${f(ty)}" fill="none" stroke="${green}" stroke-width="${f(sw * 1.1)}" stroke-linecap="round"/>` +
    `<path d="M${f(leafX)} ${f(leafY)} Q${f(leafX + lw)} ${f(leafY - r * 0.9)} ${f(leafX + lw * 1.5)} ${f(leafY - r * 0.2)} Q${f(leafX + lw * 0.7)} ${f(leafY + r * 0.25)} ${f(leafX)} ${f(leafY)}Z" fill="${green}" stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round"/>` +
    flower(kind, tx, ty, r, color, { ink, center });
}

/** A small corner bouquet: 3 stem flowers + sparkles, ~120x100 units, rooted at bottom. */
export function sprig(palette, { seed = 1, ink = INK, mirror = false } = {}) {
  const kinds = ['starBloom', 'cosmos', 'tulip', 'planetBloom', 'bell'];
  const rand = rng(seed);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const cols = [palette.pink, palette.lavender, palette.teal, palette.peach, palette.yellow, palette.sky];
  const k1 = kinds[seed % kinds.length];
  const k2 = kinds[(seed + 2) % kinds.length];
  const k3 = kinds[(seed + 4) % kinds.length];
  const body =
    stemFlower(k2, 40, 100, 52, 11, pick(cols), { ink, lean: -0.35, leafSide: -1 }) +
    stemFlower(k3, 68, 100, 46, 10, pick(cols), { ink, lean: 0.4, leafSide: 1 }) +
    stemFlower(k1, 54, 100, 74, 14, pick(cols), { ink, lean: 0.05, leafSide: 1 }) +
    sparkle(18, 40, 6, palette.yellow, { ink }) +
    sparkle(98, 30, 4.5, palette.pink, { ink }) +
    `<circle cx="88" cy="58" r="1.8" fill="${palette.lavender}"/><circle cx="24" cy="66" r="1.5" fill="${palette.teal}"/>`;
  return mirror ? `<g transform="translate(120 0) scale(-1 1)">${body}</g>` : body;
}

/** Deterministic scatter of tiny stars/sparkles/dots inside a box. */
export function starfield(w, h, n, palette, { seed = 7, ink = INK, outline = false, bright = false } = {}) {
  const rand = rng(seed);
  const cols = bright ? ['#fff', '#fff', palette.yellow, palette.pink, palette.sky] : [palette.lavender, palette.pink, palette.yellow, palette.teal];
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const c = cols[Math.floor(rand() * cols.length)];
    const t = rand();
    if (t < 0.55) s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.6 + rand() * 1.2)}" fill="${c}" fill-opacity="${f(0.55 + rand() * 0.45)}" stroke-opacity="${f(0.55 + rand() * 0.45)}"/>`;
    else if (t < 0.85) s += sparkle(x, y, 2 + rand() * 3.5, c, { ink, outline });
    else s += star(x, y, 1.8 + rand() * 2.4, c, { ink, outline });
  }
  return s;
}

export const svg = (w, h, inner, cls = '', extra = '') => `<svg class="${cls}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" ${extra}>${inner}</svg>`;
