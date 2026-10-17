import { SECTION_IDS as ID } from '../model.js';
import { esc, c, rgbOf, link, pill, header, box, fill, charImg, pickChar, flowerImg, monthColor, moodFace, pageShell } from '../render/components.js';
import { characterMarkup } from '../art/characters.js';
import { sparkle, star, planet, moon, flower, stemFlower, comet } from '../art/flora.js';
import { f } from '../art/color.js';

export const css = `
.ftiles { flex: 1 1 0; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr; gap: .75rem; }
.ftile { position: relative; display: flex; flex-direction: column; justify-content: flex-end; padding: .9rem 1rem; border-radius: 1.2rem; overflow: hidden;
  background: linear-gradient(160deg, rgba(var(--c-rgb), .18), rgba(var(--c-rgb), .5)); border: 1.4px solid color-mix(in srgb, rgb(var(--c-rgb)) 80%, #fff); min-height: 0; }
.ftile b { font: 700 1.35rem/1.1 var(--display); position: relative; z-index: 1; }
.ftile span { font: 600 1.1rem/1.1 var(--script); color: var(--inkSoft); position: relative; z-index: 1; max-width: 55%; }
.ftile img { position: absolute; right: .4rem; bottom: .3rem; height: 88%; width: auto; }
.garden { flex: 1 1 0; min-height: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: .5rem; }
.garden .gf { position: relative; display: flex; flex-direction: column; align-items: center; min-height: 0; }
.garden .gf svg { flex: 1 1 0; min-height: 0; width: 100%; }
.garden .gf a, .garden .gf span.ml { position: absolute; top: 36%; left: 50%; transform: translate(-50%, -50%); font: 700 .78rem/1 var(--display);
  width: 3.2rem; height: 3.2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.legend { display: flex; flex-wrap: wrap; gap: .5rem 1.1rem; align-items: center; }
.legend div { display: flex; align-items: center; gap: .35rem; font: 700 .76rem/1 var(--display); }
.legend .sw { width: 1.1rem; height: 1.1rem; border-radius: 50%; border: 1.3px dashed color-mix(in srgb, rgb(var(--ink-rgb)) 40%, #fff); }
.reads { flex: 1 1 0; min-height: 0; }
.ck.rated { gap: .5rem; }
.ck.rated .sp { flex: 1; }
.ck.rated svg { width: .85rem; height: .85rem; }
.doodle { flex: 1 1 0; min-height: 0; position: relative; border-radius: 1.2rem; border: 1.6px dashed color-mix(in srgb, rgb(var(--c-rgb)) 80%, #fff); background: var(--writing); overflow: hidden; }
.doodle > svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.sheet { flex: 1 1 0; min-height: 0; display: grid; gap: .6rem; }
.sheet > div { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; min-height: 0; border-radius: 1rem; padding: .3rem; }
.sheet img { flex: 1 1 0; min-height: 0; max-width: 100%; width: auto; object-fit: contain; }
.sheet svg { flex: 1 1 0; min-height: 0; width: 100%; }
.sheet b { font: 700 .8rem/1 var(--display); margin-top: .2rem; }
`;

export function fun(ctx) {
  const { cfg, model, art } = ctx;
  const L = cfg.labels;
  const ch = (id, n) => art.characters.find((x) => x.id === id) ?? pickChar(ctx, n);
  const tiles = [
    [ID.garden, L.gardenTitle, 'a petal for every brave day', 'mint', ch('peach', 1)],
    [ID.mood, L.moodTitle, 'a year of feelings in pixels', 'yellow', ch('sunny', 2)],
    [ID.bucket, L.bucketTitle, 'someday is a day of the week', 'peach', ch('sky', 3)],
    [ID.reads, L.readsTitle, 'stories to fall into', 'teal', ch('mint', 4)],
    [ID.doodle, L.doodleTitle, 'no rules, just stars', 'lavender', ch('starlight', 5)],
    [ID.stickers, L.stickersTitle, 'lasso, copy, paste', 'pink', ch('blossom', 6)],
  ].filter(([id]) => model.has.has(id));
  const body = header({
    kicker: 'because joy is productive too',
    title: esc(L.funTitle),
  }) + `<div class="ftiles">${tiles.map(([id, t, s, col, chr]) => link(`#${id}`, `<b>${esc(t)}</b><span>${esc(s)}</span>${charImg(chr, { height: '88%' })}`, { cls: 'ftile', style: c(col) })).join('')}</div>`;
  return pageShell(ctx, body);
}

/** One radial "dahlia" with n colourable petals, in a 100x130 box. */
function gardenFlower(n, P, color) {
  const cx = 50, cy = 47, inner = 12, outer = 40;
  let petals = '';
  for (let i = 0; i < n; i++) {
    const a = (360 / n) * i - 90;
    const w = Math.min(5.2, (Math.PI * (inner + outer) / n) * 0.62);
    const rad = (a * Math.PI) / 180;
    petals += `<ellipse cx="${f(cx + Math.cos(rad) * (inner + outer) / 2)}" cy="${f(cy + Math.sin(rad) * (inner + outer) / 2)}" rx="${f((outer - inner) / 2)}" ry="${f(w)}" transform="rotate(${f(a)} ${f(cx + Math.cos(rad) * (inner + outer) / 2)} ${f(cy + Math.sin(rad) * (inner + outer) / 2)})" fill="#fff" stroke="${color}" stroke-width=".9"/>`;
    if ((i + 1) % 5 === 0 || i === 0) {
      petals += `<text x="${f(cx + Math.cos(rad) * (outer + 4.5))}" y="${f(cy + Math.sin(rad) * (outer + 4.5) + 1.6)}" font-size="4.4" text-anchor="middle" fill="${P.inkSoft}" font-family="Fredoka" font-weight="600">${i + 1}</text>`;
    }
  }
  const stem = `<path d="M50 88 C48 100 53 108 50 116" stroke="#6fcf97" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
    `<path d="M50 102 Q38 94 33 99 Q40 107 50 102Z" fill="#a6ecc6" stroke="#6fcf97" stroke-width="1"/>` +
    `<path d="M50 108 Q62 99 67 104 Q60 112 50 108Z" fill="#a6ecc6" stroke="#6fcf97" stroke-width="1"/>`;
  const pot = `<path d="M34 115 h32 l-3.5 12 h-25Z" fill="${color}" opacity=".55"/><ellipse cx="50" cy="115" rx="21" ry="3.2" fill="none" stroke="${color}" stroke-width="1.4"/>`;
  return `<svg viewBox="0 0 100 130" preserveAspectRatio="xMidYMid meet">${stem}${pot}${petals}<circle cx="${cx}" cy="${cy}" r="${inner - 1}" fill="${P.yellow}" opacity=".55"/>${sparkle(84, 14, 4, P.yellow, { ink: P.ink })}</svg>`;
}

export function garden(ctx) {
  const { cfg, model } = ctx;
  const P = cfg.colors;
  const flowers = model.months.map((mo, i) => {
    const col = P[monthColor(i)];
    const label = esc(mo.undated ? mo.short : cfg.labels.monthShort[mo.m]);
    return `<div class="gf">${gardenFlower(mo.daysInMonth, P, col)}${link(model.monthHref(mo.key), label, { cls: 'ml' })}</div>`;
  });
  const body = header({
    kicker: 'color a petal each day you show up for yourself',
    title: esc(cfg.labels.gardenTitle),
    actions: pill(model.href(ID.fun), cfg.labels.fun, 'yellow', 'solid'),
    mascot: charImg(ctx.art.characters.find((x) => x.id === 'peach') ?? pickChar(ctx), { height: '6rem', cls: 'mascot' }),
  }) +
    box({ label: 'I’m growing', color: 'mint', style: 'flex:none', body: '<div class="write-line" style="flex:none"></div>' }) +
    `<div class="garden" style="grid-template-rows:repeat(${Math.max(4, Math.ceil(flowers.length / 3))},1fr)">${flowers.join('')}</div>`;
  return pageShell(ctx, body);
}

export function mood(ctx) {
  const { cfg, model } = ctx;
  const L = cfg.labels;
  const months = model.months;
  let grid = `<span></span>` + months.map((mo, i) => link(model.monthHref(mo.key), esc(mo.undated ? mo.short : cfg.labels.monthShort[mo.m].slice(0, 3)), { cls: 'mh', style: c(monthColor(i)) })).join('');
  for (let d = 1; d <= 31; d++) {
    grid += `<span class="dl">${d}</span>`;
    for (const mo of months) grid += `<span class="px${d > mo.daysInMonth ? ' no' : ''}"></span>`;
  }
  const legend = L.moods.map((m, i) => `<div>${moodFace(cfg, i, '1.6rem')}${esc(m)}<span class="sw"></span></div>`).join('');
  const body = header({
    kicker: 'one little square a day',
    title: esc(L.moodTitle),
    actions: pill(model.href(ID.fun), L.fun, 'yellow', 'solid'),
    mascot: charImg(ctx.art.characters.find((x) => x.id === 'sunny') ?? pickChar(ctx), { height: '6rem', cls: 'mascot' }),
  }) +
    box({ label: 'Color key', hint: 'pick a color for each mood', color: 'yellow', style: 'flex:none', body: `<div class="legend">${legend}</div>` }) +
    `<div class="yearpix" style="${c('lavender')};grid-template-columns:1.6rem repeat(${Math.max(12, months.length)},1fr);grid-template-rows:1.6rem repeat(31,1fr)">${grid}</div>`;
  return pageShell(ctx, body);
}

export function bucket(ctx) {
  const { cfg, model } = ctx;
  const body = header({
    kicker: 'dreams to collect, one by one',
    title: esc(cfg.labels.bucketTitle),
    actions: pill(model.href(ID.fun), cfg.labels.fun, 'yellow', 'solid'),
    mascot: charImg(ctx.art.characters.find((x) => x.id === 'sky') ?? pickChar(ctx), { height: '6rem', cls: 'mascot' }),
  }) +
    `<div class="row grow">` +
    box({ label: 'Adventures', color: 'peach', cls: 'grow', body: fill('checks', { round: true }) }) +
    box({ label: 'Experiences', color: 'lavender', cls: 'grow', body: fill('checks', { round: true }) }) +
    `</div>` +
    `<div class="row" style="flex:0 0 26%">` +
    box({ label: 'Places to see', color: 'sky', cls: 'grow', body: fill('checks', { round: true }) }) +
    box({ label: 'Things to learn', color: 'mint', cls: 'grow', body: fill('checks', { round: true }) }) +
    `</div>`;
  return pageShell(ctx, body);
}

export function reads(ctx) {
  const { cfg, model } = ctx;
  const body = header({
    kicker: 'rate them with stars',
    title: esc(cfg.labels.readsTitle),
    actions: pill(model.href(ID.fun), cfg.labels.fun, 'yellow', 'solid'),
    mascot: charImg(ctx.art.characters.find((x) => x.id === 'mint') ?? pickChar(ctx), { height: '6rem', cls: 'mascot' }),
  }) +
    box({ label: 'Books', color: 'teal', cls: 'grow', body: fill('rated') }) +
    box({ label: 'Shows & films', color: 'pink', cls: 'grow', body: fill('rated') });
  return pageShell(ctx, body);
}

export function doodle(ctx) {
  const { cfg, model } = ctx;
  const P = cfg.colors;
  const corner = `<svg viewBox="0 0 400 520" preserveAspectRatio="none">` +
    `<g transform="translate(4 4)">${sparkle(14, 16, 8, P.yellow, { ink: P.ink })}${star(38, 10, 4, P.pink, { ink: P.ink })}</g>` +
    `<g transform="translate(360 486)">${sparkle(20, 10, 8, P.lavender, { ink: P.ink })}${star(-6, 22, 4, P.yellow, { ink: P.ink })}</g>` +
    `</svg>`;
  const body = header({
    kicker: 'free space for free thoughts',
    title: esc(cfg.labels.doodleTitle),
    actions: pill(model.href(ID.fun), cfg.labels.fun, 'yellow', 'solid'),
    mascot: charImg(ctx.art.characters.find((x) => x.id === 'starlight') ?? pickChar(ctx), { height: '6rem', cls: 'mascot' }),
  }) + `<div class="doodle" style="${c('lavender')}">${corner}</div>`;
  return pageShell(ctx, body);
}

export function stickers(ctx) {
  const { cfg, model, art, page } = ctx;
  const P = cfg.colors;
  const ink = P.ink;
  let cells, cols, rows;
  if (page.sheet === 1) {
    cells = art.characters.map((ch) => `<div style="--c-rgb:${rgbOf(ch.color)};background:rgba(var(--c-rgb),.14)"><img src="${ch.uri}" alt="${esc(ch.name)}"><b>${esc(ch.name)}</b></div>`);
    cells.push(...art.flowers.slice(0, 2).map((fl) => `<div>${flowerImg(fl, { height: '100%' })}</div>`));
    cols = 3; rows = 3;
  } else {
    const vec = (inner, vb = '0 0 100 100') => `<div><svg viewBox="${vb}">${inner}</svg></div>`;
    cells = [
      ...art.flowers.map((fl) => `<div>${flowerImg(fl, { height: '100%' })}</div>`),
      vec(planet(70, 50, 24, P.lavender, P.pink, { ink }), '0 0 140 100'),
      vec(moon(50, 50, 36, '#fff1b8', { ink })),
      vec(comet(100, 58, 80, P.yellow, { ink }), '0 0 120 80'),
      vec(sparkle(50, 50, 40, P.yellow, { ink })),
      vec(stemFlower('cosmos', 50, 132, 92, 28, P.pink, { ink, lean: 0.06 }), '0 0 100 140'),
      vec(stemFlower('tulip', 50, 132, 92, 26, P.lavender, { ink, lean: 0.06 }), '0 0 100 140'),
      vec(flower('planetBloom', 50, 50, 40, P.teal, { ink })),
      ...['radiant', 'happy', 'calm', 'love'].map((m, i) => vec(characterMarkup({ species: 'star', color: cfg.moodColors[i] }, { mood: m, ink, blush: P.blush, sticker: true }), '-6 -6 112 112')),
    ];
    cols = 5; rows = Math.ceil(cells.length / 5);
  }
  const list = model.byKind.stickers;
  const other = list.find((p) => p !== page);
  const body = header({
    kicker: 'lasso a sticker, copy it, paste it anywhere',
    title: esc(cfg.labels.stickersTitle) + `<small>${page.sheet}</small>`,
    actions: (other ? pill(`#${other.id}`, `Sheet ${other.sheet}`, 'pink') : '') + pill(model.href(ID.fun), cfg.labels.fun, 'yellow', 'solid'),
  }) + `<div class="sheet" style="grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr)">${cells.join('')}</div>`;
  return pageShell(ctx, body);
}

