const toRgb = (hex) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

/** Mix a color toward white (amt > 0) or toward a deep plum (amt < 0). */
export function shade(hex, amt) {
  const rgb = toRgb(hex);
  const target = amt >= 0 ? [255, 255, 255] : [58, 40, 90];
  const a = Math.abs(amt);
  return toHex(rgb.map((v, i) => v + (target[i] - v) * a));
}

/** Deterministic PRNG so every build produces identical artwork. */
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const f = (n) => Math.round(n * 100) / 100;
