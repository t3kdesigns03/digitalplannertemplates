// Background art for the "galactic-cute" style: a dense nebula sky with a
// ringed planet, rendered once to a JPEG with sharp (feTurbulence noise) so
// the PDF embeds a single image. Colours come from the config palette and the
// noise seeds are fixed, so every build produces the same sky.
import sharp from 'sharp';
import { rng } from './color.js';

const rgb01 = (hex) => [1, 3, 5].map((i) => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(3));

/** A colourised noise layer: alpha = k * noise + b, so higher k = crisper wisps. */
function cloudFilter(id, { seed, freq, color, k, b, type = 'fractalNoise', octaves = 6 }) {
  const [r, g, bl] = rgb01(color);
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="${type}" baseFrequency="${freq}" numOctaves="${octaves}" seed="${seed}"/>
    <feColorMatrix type="matrix" values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${bl}  ${k} 0 0 0 ${b}"/>
  </filter>`;
}

function stars(W, H, n, seed) {
  const rand = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = rand() * W, y = rand() * H;
    const big = rand() < 0.05;
    const r = big ? 1.4 + rand() * 1.6 : 0.4 + rand() * 1.1;
    const tint = ['#ffffff', '#ffffff', '#fff3d6', '#ffd6f0', '#d6f2ff'][Math.floor(rand() * 5)];
    if (big) s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 4).toFixed(1)}" fill="url(#glow)" opacity=".55"/>`;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${tint}" opacity="${(0.55 + rand() * 0.45).toFixed(2)}"/>`;
  }
  // a few cross-shaped flares
  for (let i = 0; i < 9; i++) {
    const x = rand() * W, y = rand() * H * 0.8, L = 10 + rand() * 18;
    s += `<g opacity=".9"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(L * 0.5).toFixed(1)}" fill="url(#glow)"/>` +
      `<path d="M${(x - L).toFixed(1)} ${y.toFixed(1)}H${(x + L).toFixed(1)}M${x.toFixed(1)} ${(y - L).toFixed(1)}V${(y + L).toFixed(1)}" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".85"/>` +
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.8" fill="#fff"/></g>`;
  }
  return s;
}

/** Soft, banded ringed planet with a lit limb, no outlines (painterly look). */
function planet(cx, cy, r, P) {
  const ring = (front) => `<ellipse cx="${cx}" cy="${cy}" rx="${r * 1.95}" ry="${r * 0.42}" fill="none" stroke="url(#ringGrad)" stroke-width="${r * 0.2}" opacity=".85"
      ${front ? `clip-path="url(#ringFront)"` : ''} transform="rotate(-16 ${cx} ${cy})"/>` +
    `<ellipse cx="${cx}" cy="${cy}" rx="${r * 1.7}" ry="${r * 0.36}" fill="none" stroke="url(#ringGrad)" stroke-width="${r * 0.06}" opacity=".7"
      ${front ? `clip-path="url(#ringFront)"` : ''} transform="rotate(-16 ${cx} ${cy})"/>`;
  return `<defs>
      <linearGradient id="bands" x1="0" y1="0" x2="0.25" y2="1">
        <stop offset="0" stop-color="${P.peach}"/><stop offset=".18" stop-color="#c58ac9"/><stop offset=".32" stop-color="${P.peach}"/>
        <stop offset=".46" stop-color="#9b78d6"/><stop offset=".6" stop-color="#e6a7c6"/><stop offset=".76" stop-color="#7d62c4"/><stop offset="1" stop-color="#5b46a8"/>
      </linearGradient>
      <radialGradient id="shade" cx=".32" cy=".3" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0b0626" stop-opacity=".8"/></radialGradient>
      <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b9a2ff" stop-opacity=".2"/><stop offset=".5" stop-color="#ffe2f1"/><stop offset="1" stop-color="#b9a2ff" stop-opacity=".25"/></linearGradient>
      <clipPath id="ringFront"><rect x="${cx - r * 2.2}" y="${cy}" width="${r * 4.4}" height="${r * 1.2}" transform="rotate(-16 ${cx} ${cy})"/></clipPath>
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${r * 1.35}" fill="url(#glow)" opacity=".35"/>
    ${ring(false)}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#bands)"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#shade)"/>
    ${ring(true)}`;
}

export async function galacticSky(cfg, { width = 1100, height = 1500 } = {}) {
  const P = cfg.colors;
  const W = width, H = height;
  const mask = (id, cx, cy, rx, ry) => `<mask id="${id}"><ellipse cx="${W * cx}" cy="${H * cy}" rx="${W * rx}" ry="${H * ry}" fill="url(#fade)"/></mask>`;
  const layer = (filter, m) => `<rect width="${W}" height="${H}" filter="url(#${filter})" mask="url(#${m})"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#090622"/><stop offset=".5" stop-color="#1a0f4a"/><stop offset="1" stop-color="#2b145e"/>
    </linearGradient>
    <radialGradient id="fade"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#888"/><stop offset="1" stop-color="#000"/></radialGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".35" stop-color="#ffd6f0" stop-opacity=".35"/><stop offset="1" stop-color="#ffd6f0" stop-opacity="0"/></radialGradient>
    ${cloudFilter('vioSoft', { seed: 5, freq: 0.0024, color: '#7b4fe0', k: 2.2, b: -0.7 })}
    ${cloudFilter('magSoft', { seed: 3, freq: 0.003, color: '#ff4fb4', k: 2.6, b: -1.0 })}
    ${cloudFilter('magWisp', { seed: 13, freq: 0.0065, color: '#ff8fd0', k: 3.2, b: -1.4, octaves: 8 })}
    ${cloudFilter('cySoft', { seed: 9, freq: 0.0034, color: '#3cc8ff', k: 2.6, b: -1.05 })}
    ${cloudFilter('cyWisp', { seed: 21, freq: 0.0075, color: '#8ff0ff', k: 3.2, b: -1.45, octaves: 8 })}
    ${cloudFilter('core', { seed: 17, freq: 0.006, color: '#fff0fa', k: 3.6, b: -2.0 })}
    ${cloudFilter('dust', { seed: 31, freq: 0.005, color: '#070417', k: 3.0, b: -1.25 })}
    ${mask('mV', 0.5, 0.58, 0.9, 0.34)}
    ${mask('mM', 0.12, 0.3, 0.6, 0.4)}
    ${mask('mC', 0.92, 0.2, 0.55, 0.32)}
    ${mask('mCore1', 0.16, 0.34, 0.26, 0.17)}
    ${mask('mCore2', 0.86, 0.16, 0.22, 0.13)}
    ${mask('mDust', 0.5, 0.42, 0.8, 0.45)}
    ${mask('mLow', 0.5, 0.86, 0.9, 0.2)}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${layer('vioSoft', 'mV')}
  ${layer('magSoft', 'mM')}
  ${layer('cySoft', 'mC')}
  ${layer('magWisp', 'mM')}
  ${layer('cyWisp', 'mC')}
  ${layer('magSoft', 'mLow')}
  ${layer('dust', 'mDust')}
  ${layer('core', 'mCore1')}
  ${layer('core', 'mCore2')}
  ${stars(W, H, 2600, 42)}
  ${planet(W * 0.8, H * 0.47, W * 0.13, P)}
  <circle cx="${W * 0.88}" cy="${H * 0.08}" r="${W * 0.035}" fill="#3a2a7a"/><circle cx="${W * 0.88}" cy="${H * 0.08}" r="${W * 0.035}" fill="url(#shade)"/>
  <circle cx="${W * 0.1}" cy="${H * 0.5}" r="${W * 0.018}" fill="#8b6fd6"/><circle cx="${W * 0.1}" cy="${H * 0.5}" r="${W * 0.018}" fill="url(#shade)"/>
</svg>`;
  const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 86, chromaSubsampling: '4:4:4' }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}
