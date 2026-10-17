// The alien crew. Every character is drawn in a 100x100 box, flat-kawaii style
// with a soft plum outline. `back: true` draws a white silhouette used as the
// die-cut border for sticker versions.
import { shade, f } from './color.js';

export const MOODS = ['radiant', 'happy', 'calm', 'meh', 'sad', 'stressed'];

function makePen(ink, back) {
  const sw = 2.4;
  return {
    ink,
    back,
    /** attributes for a filled + outlined shape */
    fill(color, { stroke = true, opacity } = {}) {
      if (back) return `fill="#fff" stroke="#fff" stroke-width="${sw + 7}" stroke-linejoin="round"`;
      const op = opacity != null ? ` fill-opacity="${opacity}" stroke-opacity="${opacity}"` : '';
      return stroke
        ? `fill="${color}" stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round"${op}`
        : `fill="${color}"${op}`;
    },
    /** attributes for a stroke-only line */
    line(color = ink, width = sw) {
      if (back) return `fill="none" stroke="#fff" stroke-width="${width + 7}" stroke-linecap="round"`;
      return `fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;
    },
    /** decorative detail that is skipped in the white backing pass */
    detail(svg) {
      return back ? '' : svg;
    },
  };
}

function roundEye(p, cx, cy, r) {
  return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(r)}" ry="${f(r * 1.13)}" fill="${p.ink}"/>` +
    `<circle cx="${f(cx - r * 0.33)}" cy="${f(cy - r * 0.4)}" r="${f(r * 0.38)}" fill="#fff"/>` +
    `<circle cx="${f(cx + r * 0.36)}" cy="${f(cy + r * 0.38)}" r="${f(r * 0.16)}" fill="#fff"/>`;
}

function heartEye(cx, cy, r, color) {
  const s = r * 1.15;
  return `<path d="M${f(cx)} ${f(cy + s * 0.85)} C${f(cx - s * 1.5)} ${f(cy - s * 0.1)} ${f(cx - s * 0.7)} ${f(cy - s * 1.2)} ${f(cx)} ${f(cy - s * 0.35)} C${f(cx + s * 0.7)} ${f(cy - s * 1.2)} ${f(cx + s * 1.5)} ${f(cy - s * 0.1)} ${f(cx)} ${f(cy + s * 0.85)}Z" fill="${color}"/>`;
}

/** Draws eyes + mouth + blush for a mood. `eyes` is 1, 2 or 3. */
function face(p, cx, cy, { eyes = 2, gap = 11, r = 5.2, mood = 'happy', blush = '#ff7fb0', lashes = false }) {
  if (p.back) return '';
  const xs = eyes === 1 ? [cx] : eyes === 3 ? [cx - gap, cx, cx + gap] : [cx - gap, cx + gap];
  const ys = xs.map((_, i) => (eyes === 3 && i === 1 ? cy - r * 0.6 : cy));
  const er = eyes === 3 ? r * 0.82 : eyes === 1 ? r * 1.35 : r;
  const ink = p.ink;
  const L = (d, w = 2.2) => `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  let out = '';

  // eyes
  xs.forEach((x, i) => {
    const y = ys[i];
    if (mood === 'radiant') out += L(`M${f(x - er)} ${f(y + er * 0.3)} Q${f(x)} ${f(y - er * 1.3)} ${f(x + er)} ${f(y + er * 0.3)}`, 2.4);
    else if (mood === 'calm') out += L(`M${f(x - er)} ${f(y - er * 0.1)} Q${f(x)} ${f(y + er * 1.1)} ${f(x + er)} ${f(y - er * 0.1)}`, 2.2);
    else if (mood === 'stressed') {
      const dir = i < xs.length / 2 ? 1 : -1;
      out += L(`M${f(x - er * 0.8 * dir)} ${f(y - er * 0.8)} L${f(x + er * 0.7 * dir)} ${f(y)} L${f(x - er * 0.8 * dir)} ${f(y + er * 0.8)}`, 2.2);
    } else if (mood === 'love') out += heartEye(x, y, er, '#ff5c9a');
    else out += roundEye(p, x, y, er);
    if (lashes && mood !== 'stressed' && (i === 0 || i === xs.length - 1)) {
      const side = i === 0 ? -1 : 1;
      out += L(`M${f(x + side * er * 0.8)} ${f(y - er * 0.85)} l${f(side * er * 0.55)} ${f(-er * 0.45)}`, 1.6);
      out += L(`M${f(x + side * er * 0.25)} ${f(y - er * 1.15)} l${f(side * er * 0.25)} ${f(-er * 0.55)}`, 1.6);
    }
  });
  if (mood === 'meh') out += L(`M${f(xs[0] - er * 1.1)} ${f(cy - er * 1.6)} l${f(er * 1.6)} ${f(er * 0.25)}`, 1.6) + L(`M${f(xs[xs.length - 1] + er * 1.1)} ${f(cy - er * 1.6)} l${f(-er * 1.6)} ${f(er * 0.25)}`, 1.6);

  // blush
  const bx = (xs[xs.length - 1] - xs[0]) / 2 + er * 1.7;
  out += `<ellipse cx="${f(cx - bx)}" cy="${f(cy + er * 1.35)}" rx="${f(er * 0.85)}" ry="${f(er * 0.5)}" fill="${blush}" fill-opacity="0.55" stroke-opacity="0.55"/>`;
  out += `<ellipse cx="${f(cx + bx)}" cy="${f(cy + er * 1.35)}" rx="${f(er * 0.85)}" ry="${f(er * 0.5)}" fill="${blush}" fill-opacity="0.55" stroke-opacity="0.55"/>`;

  // mouth
  const my = cy + er * 1.75;
  const mw = er * 0.9;
  switch (mood) {
    case 'radiant':
      out += `<path d="M${f(cx - mw * 1.3)} ${f(my - 0.6)} Q${f(cx)} ${f(my + mw * 2.2)} ${f(cx + mw * 1.3)} ${f(my - 0.6)}Z" fill="${ink}" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
      out += `<path d="M${f(cx - mw * 0.6)} ${f(my + mw * 0.75)} Q${f(cx)} ${f(my + mw * 0.3)} ${f(cx + mw * 0.6)} ${f(my + mw * 0.75)} Q${f(cx)} ${f(my + mw * 1.3)} ${f(cx - mw * 0.6)} ${f(my + mw * 0.75)}Z" fill="#ff8fb8"/>`;
      break;
    case 'calm':
      out += L(`M${f(cx - mw * 0.6)} ${f(my)} Q${f(cx)} ${f(my + mw * 0.6)} ${f(cx + mw * 0.6)} ${f(my)}`, 2);
      break;
    case 'meh':
      out += L(`M${f(cx - mw * 0.7)} ${f(my + 0.5)} L${f(cx + mw * 0.7)} ${f(my + 0.5)}`, 2);
      break;
    case 'sad':
      out += L(`M${f(cx - mw * 0.8)} ${f(my + mw * 0.6)} Q${f(cx)} ${f(my - mw * 0.3)} ${f(cx + mw * 0.8)} ${f(my + mw * 0.6)}`, 2);
      out += `<path d="M${f(xs[xs.length - 1] + er * 0.5)} ${f(cy + er * 0.9)} q${f(-er * 0.55)} ${f(er * 0.9)} 0 ${f(er * 1.25)} q${f(er * 0.55)} ${f(-er * 0.35)} 0 ${f(-er * 1.25)}Z" fill="#8fd3ff" stroke="${ink}" stroke-width="1"/>`;
      break;
    case 'stressed':
      out += L(`M${f(cx - mw)} ${f(my + 0.8)} l${f(mw * 0.5)} -1.6 l${f(mw * 0.5)} 1.6 l${f(mw * 0.5)} -1.6 l${f(mw * 0.5)} 1.6`, 1.8);
      break;
    case 'wow':
      out += `<ellipse cx="${f(cx)}" cy="${f(my + 1)}" rx="${f(mw * 0.45)}" ry="${f(mw * 0.6)}" fill="${ink}"/>`;
      break;
    default:
      out += L(`M${f(cx - mw)} ${f(my)} Q${f(cx)} ${f(my + mw * 1.1)} ${f(cx + mw)} ${f(my)}`, 2.2);
  }
  return out;
}

function starPoints(cx, cy, ro, ri, n = 5, rot = -90) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? ri : ro;
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    pts.push(`${f(cx + r * Math.cos(a))},${f(cy + r * Math.sin(a))}`);
  }
  return pts.join(' ');
}

function tipStar(p, cx, cy, r, color) {
  if (p.back) return `<circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="#fff"/>`;
  return `<polygon points="${starPoints(cx, cy, r, r * 0.5)}" fill="${color}" stroke="${p.ink}" stroke-width="1.8" stroke-linejoin="round"/>`;
}

function miniFlower(p, cx, cy, r, petal, center = '#ffdf7e') {
  if (p.back) return `<circle cx="${cx}" cy="${cy}" r="${r * 2.1 + 3}" fill="#fff"/>`;
  let s = '';
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 - 90) * (Math.PI / 180);
    s += `<circle cx="${f(cx + Math.cos(a) * r)}" cy="${f(cy + Math.sin(a) * r)}" r="${f(r * 0.85)}" fill="${petal}" stroke="${p.ink}" stroke-width="1.6"/>`;
  }
  return s + `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.7)}" fill="${center}" stroke="${p.ink}" stroke-width="1.6"/>`;
}

const SPECIES = {
  // Zuzu: a gumdrop blob with star-tipped antennae
  blob(p, c, o) {
    const light = shade(c, 0.45);
    const dark = shade(c, -0.12);
    return [
      `<path d="M41 31 Q36 21 33 13" ${p.line()}/>`,
      `<path d="M59 31 Q64 21 67 13" ${p.line()}/>`,
      tipStar(p, 33, 12, 6, o.accent),
      tipStar(p, 67, 12, 6, o.accent),
      `<ellipse cx="37" cy="91" rx="8" ry="4.5" ${p.fill(dark)}/>`,
      `<ellipse cx="63" cy="91" rx="8" ry="4.5" ${p.fill(dark)}/>`,
      `<ellipse cx="18" cy="64" rx="5.5" ry="8" transform="rotate(-28 18 64)" ${p.fill(c)}/>`,
      `<ellipse cx="82" cy="64" rx="5.5" ry="8" transform="rotate(28 82 64)" ${p.fill(c)}/>`,
      `<path d="M22 89 C16 66 20 30 50 28 C80 30 84 66 78 89 Q50 97 22 89Z" ${p.fill(c)}/>`,
      p.detail(`<ellipse cx="50" cy="77" rx="17" ry="10" fill="${light}"/>`),
      p.detail(`<circle cx="31" cy="45" r="2.6" fill="${dark}" fill-opacity=".5" stroke-opacity=".5"/><circle cx="69" cy="42" r="2" fill="${dark}" fill-opacity=".5" stroke-opacity=".5"/><circle cx="72" cy="50" r="1.4" fill="${dark}" fill-opacity=".5" stroke-opacity=".5"/>`),
      face(p, 50, 55, { mood: o.mood, gap: 11, r: 5.4, blush: o.blush }),
    ].join('');
  },

  // Mimi: a tall bean with pointy ears and a flower growing from her head
  bloom(p, c, o) {
    const dark = shade(c, -0.15);
    return [
      `<path d="M50 30 C49 21 56 17 55 10" ${p.line()}/>`,
      p.detail(`<path d="M51 22 q6 -5 10 -1 q-5 4 -10 1Z" fill="#8fdcae" stroke="${p.ink}" stroke-width="1.4"/>`),
      miniFlower(p, 55, 9, 4.2, o.accent),
      `<path d="M27 46 L12 31 L33 37Z" ${p.fill(c)}/>`,
      `<path d="M73 46 L88 31 L67 37Z" ${p.fill(c)}/>`,
      `<ellipse cx="38" cy="91" rx="7" ry="4" ${p.fill(dark)}/>`,
      `<ellipse cx="62" cy="91" rx="7" ry="4" ${p.fill(dark)}/>`,
      `<ellipse cx="50" cy="61" rx="29" ry="30" ${p.fill(c)}/>`,
      p.detail(`<circle cx="42" cy="38" r="1.8" fill="${dark}"/><circle cx="50" cy="36" r="2.1" fill="${dark}"/><circle cx="58" cy="38" r="1.8" fill="${dark}"/>`),
      p.detail(`<path d="M40 79 Q50 84 60 79" fill="none" stroke="${dark}" stroke-width="1.6" stroke-linecap="round"/>`),
      face(p, 50, 56, { mood: o.mood, gap: 11, r: 5.6, blush: o.blush, lashes: true }),
    ].join('');
  },

  // Kip: a little pilot peeking out of a snack-sized saucer
  saucer(p, c, o) {
    const hull = shade(o.accent, 0.35);
    const hullDark = shade(o.accent, -0.05);
    let lights = '';
    for (let i = 0; i < 5; i++) {
      const x = 22 + i * 14;
      const y = 71 - Math.sin((i / 4) * Math.PI) * 2.2;
      lights += p.back ? '' : `<circle cx="${x}" cy="${f(y)}" r="2.6" fill="#ffdf7e" stroke="${p.ink}" stroke-width="1.4"/>`;
    }
    return [
      `<path d="M50 30 L50 17" ${p.line()}/>`,
      p.back ? `<circle cx="50" cy="15" r="7" fill="#fff"/>` : `<circle cx="50" cy="15" r="3.8" fill="#ff9ecb" stroke="${p.ink}" stroke-width="1.8"/>`,
      `<circle cx="50" cy="47" r="18" ${p.fill(c)}/>`,
      face(p, 50, 45, { mood: o.mood, gap: 8, r: 4.3, blush: o.blush }),
      p.back ? `<path d="M23 60 A27 27 0 0 1 77 60Z" fill="#fff" stroke="#fff" stroke-width="9"/>`
        : `<path d="M23 60 A27 27 0 0 1 77 60Z" fill="#bfe6ff" fill-opacity=".38" stroke="${p.ink}" stroke-width="2.4"/>` +
          `<path d="M32 46 A20 20 0 0 1 44 37" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill-opacity=".9" stroke-opacity=".9"/>`,
      `<ellipse cx="50" cy="67" rx="46" ry="12.5" ${p.fill(hull)}/>`,
      `<ellipse cx="50" cy="61" rx="28" ry="5.5" ${p.fill(hullDark)}/>`,
      lights,
      `<path d="M36 79 L31 88" ${p.line()}/><path d="M64 79 L69 88" ${p.line()}/>`,
    ].join('');
  },

  // Lulu: a round sprout with three eyes, holding a star-blossom
  sprout(p, c, o) {
    const leaf = shade('#6fcf97', 0.05);
    const dark = shade(c, -0.15);
    return [
      `<path d="M50 30 L50 19" ${p.line()}/>`,
      `<path d="M50 21 C41 10 30 13 29 19 C36 25 44 25 50 21Z" ${p.fill(leaf)}/>`,
      `<path d="M50 21 C59 10 70 13 71 19 C64 25 56 25 50 21Z" ${p.fill(leaf)}/>`,
      `<path d="M84 64 C86 54 87 46 88 37" ${p.line('#4aa36f', 2.2)}/>`,
      miniFlower(p, 88, 33, 4.4, o.accent),
      `<ellipse cx="37" cy="90" rx="7.5" ry="4.2" ${p.fill(dark)}/>`,
      `<ellipse cx="63" cy="90" rx="7.5" ry="4.2" ${p.fill(dark)}/>`,
      `<ellipse cx="17" cy="66" rx="5.5" ry="7.5" transform="rotate(-25 17 66)" ${p.fill(c)}/>`,
      `<circle cx="50" cy="59" r="31" ${p.fill(c)}/>`,
      `<ellipse cx="83" cy="65" rx="6" ry="6.5" ${p.fill(c)}/>`,
      p.detail(`<path d="M33 76 Q50 86 67 76" fill="none" stroke="${dark}" stroke-width="1.5" stroke-linecap="round" fill-opacity=".7" stroke-opacity=".7"/>`),
      face(p, 50, 57, { mood: o.mood, eyes: 3, gap: 12, r: 5.4, blush: o.blush }),
    ].join('');
  },

  // Pip: a squishy fallen star
  star(p, c, o) {
    const pts = starPoints(50, 55, 42, 23);
    const body = p.back
      ? `<polygon points="${pts}" fill="#fff" stroke="#fff" stroke-width="22" stroke-linejoin="round"/>`
      : `<polygon points="${pts}" fill="${p.ink}" stroke="${p.ink}" stroke-width="14" stroke-linejoin="round"/>` +
        `<polygon points="${pts}" fill="${c}" stroke="${c}" stroke-width="9.2" stroke-linejoin="round"/>`;
    return [
      body,
      p.detail(`<polygon points="${starPoints(50, 59, 14, 8)}" fill="${shade(c, 0.5)}" stroke="${shade(c, 0.5)}" stroke-width="3" stroke-linejoin="round" fill-opacity=".6" stroke-opacity=".6"/>`),
      p.detail(`<path d="M30 30 q2 -6 8 -8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill-opacity=".85" stroke-opacity=".85"/>`),
      face(p, 50, 54, { mood: o.mood, gap: 9.5, r: 4.8, blush: o.blush }),
    ].join('');
  },

  // Nova: a peach jelly alien wearing a planet ring as a halo
  ringlet(p, c, o) {
    const ring = o.accent;
    const ringLine = (d) => (p.back
      ? `<path d="${d}" fill="none" stroke="#fff" stroke-width="15"/>`
      : `<path d="${d}" fill="none" stroke="${p.ink}" stroke-width="7.6"/><path d="${d}" fill="none" stroke="${ring}" stroke-width="3.6"/>`);
    const full = 'M8 36 A42 9.5 0 1 0 92 36 A42 9.5 0 1 0 8 36';
    const front = 'M8 36 A42 9.5 0 0 0 92 36';
    const dark = shade(c, -0.12);
    const toes = [30, 43, 57, 70].map((x, i) => `<ellipse cx="${x}" cy="${i === 0 || i === 3 ? 82 : 85}" rx="7.5" ry="7" ${p.fill(dark)}/>`).join('');
    return [
      `<g transform="rotate(-14 50 36)">${ringLine(full)}</g>`,
      toes,
      `<path d="M20 64 C18 36 32 22 50 22 C68 22 82 36 80 64 C79 78 66 84 50 84 C34 84 21 78 20 64Z" ${p.fill(c)}/>`,
      p.detail(`<path d="M44 23 q-4 -8 3 -10 q2 5 -3 10Z" fill="${shade(c, -0.2)}" stroke="${p.ink}" stroke-width="1.5" stroke-linejoin="round"/>`),
      `<g transform="rotate(-14 50 36)">${ringLine(front)}</g>`,
      face(p, 50, 56, { mood: o.mood, gap: 11, r: 5.4, blush: o.blush, lashes: true }),
    ].join('');
  },
};

const ACCENTS = { blob: '#ffdf7e', bloom: '#ff9ecb', saucer: '#c3b1ff', sprout: '#ff9ecb', star: '#ffdf7e', ringlet: '#c3b1ff' };

/** Inner SVG markup (no <svg> wrapper) for composing into larger scenes. */
export function characterMarkup(ch, { mood = 'happy', sticker = false, ink = '#4a3a6b', blush = '#ff7fb0' } = {}) {
  const draw = SPECIES[ch.species] ?? SPECIES.blob;
  const o = { mood, accent: ch.accent ?? ACCENTS[ch.species] ?? '#ffdf7e', blush };
  const front = draw(makePen(ink, false), ch.color, o);
  return sticker ? `<g>${draw(makePen(ink, true), ch.color, o)}</g>${front}` : front;
}

export function characterSvg(ch, { size = '100%', className = '', ...opts } = {}) {
  const pad = opts.sticker ? 6 : 1;
  return `<svg class="${className}" viewBox="${-pad} ${-pad} ${100 + pad * 2} ${100 + pad * 2}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">${characterMarkup(ch, opts)}</svg>`;
}
