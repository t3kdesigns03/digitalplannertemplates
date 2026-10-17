import { SECTION_IDS as ID } from '../model.js';
import { esc, c, link, pill, header, box, fill, charImg, pickChar, arrowL, arrowR, pageShell } from '../render/components.js';
import { sparkle, svg } from '../art/flora.js';

export const css = `
.idx { flex: 1 1 0; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; grid-auto-flow: column; align-content: start; gap: .5rem 1.2rem; }
.idx a { display: flex; align-items: flex-end; gap: .6rem; border-bottom: 1px solid var(--line); padding-bottom: .3rem; height: 2.7rem; }
.idx .chip { width: 2rem; height: 1.7rem; flex: none; background: rgba(var(--c-rgb), .45); }
.idx i { flex: 1; }
.idx em { font: 600 .66rem/1 var(--display); font-style: normal; color: var(--inkSoft); text-transform: uppercase; letter-spacing: .08em; }
.topic { display: flex; gap: 1rem; flex: none; }
.topic .field { flex: 1; }
.prompts { flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; gap: .4rem; }
.prompts a { flex: 1 1 0; display: flex; align-items: center; gap: .7rem; padding: 0 .8rem; border-radius: .8rem; min-height: 0;
  background: rgba(var(--c-rgb), .18); border: 1.2px solid color-mix(in srgb, rgb(var(--c-rgb)) 55%, #fff); font: 600 .95rem/1.25 var(--body); }
.prompts .chip { width: 2rem; height: 2rem; flex: none; border-radius: 50%; background: rgb(var(--c-rgb)); }
.banner { display: flex; align-items: center; gap: .8rem; padding: .9rem 1.1rem; border-radius: 1.1rem; flex: none;
  background: linear-gradient(120deg, rgba(var(--c-rgb), .45), rgba(var(--lavender-rgb), .35)); }
.banner b { font: 700 1.75rem/1.15 var(--script); flex: 1; }
.banner svg { width: 2.2rem; height: 2.2rem; flex: none; }
`;

const navPills = (ctx, kind, color) => {
  const list = ctx.model.byKind[kind] ?? [];
  const idx = list.indexOf(ctx.page);
  const prev = list[idx - 1], next = list[idx + 1];
  return pill(prev ? `#${prev.id}` : null, arrowL, color) + pill(next ? `#${next.id}` : null, arrowR, color);
};
const pad = (n) => String(n).padStart(2, '0');

export function notesIndex(ctx) {
  const { cfg, model } = ctx;
  const L = cfg.labels;
  const notes = (model.byKind.notePage ?? []).map((p) => link(`#${p.id}`, `<span class="chip" style="${c('sky')}">${pad(p.n)}</span><i></i><em>note</em>`));
  const dots = (model.byKind.dotPage ?? []).map((p) => link(`#${p.id}`, `<span class="chip" style="${c('lavender')}">${pad(p.n)}</span><i></i><em>dot grid</em>`));
  const body = header({
    kicker: 'write a title, tap to open',
    title: esc(L.notesTitle),
    actions: pill(model.href(ID.journal), L.journalTitle, 'pink'),
    mascot: charImg(ctx.art.characters.find((x) => x.id === 'cloud') ?? pickChar(ctx), { height: '6rem', cls: 'mascot' }),
  }) + box({ label: 'Index', color: 'sky', cls: 'grow', body: `<div class="idx" style="grid-template-rows:repeat(${Math.max(1, Math.ceil((notes.length + dots.length) / 2))},auto)">${[...notes, ...dots].join('')}</div>` });
  return pageShell(ctx, body);
}

function noteLike(ctx, kind, fillKind, title, color) {
  const { cfg, model, page } = ctx;
  const body = header({
    kicker: `${title} ${pad(page.n)}`,
    title: '<span class="field" style="font-size:.4em;gap:.6rem">topic <i style="min-width:22rem"></i></span>',
    actions: navPills(ctx, kind, color) + pill(model.href(ID.notes), cfg.labels.notesTitle, color, 'solid'),
  }) + box({ color, cls: 'grow', body: fill(fillKind) });
  return pageShell(ctx, body);
}

export const notePage = (ctx) => noteLike(ctx, 'notePage', 'lines', 'Note', 'sky');
export const dotPage = (ctx) => noteLike(ctx, 'dotPage', 'dots', 'Dot grid', 'lavender');

export function journalIndex(ctx) {
  const { cfg, model } = ctx;
  const L = cfg.labels;
  const colors = ['pink', 'peach', 'yellow', 'mint', 'teal', 'sky', 'lavender'];
  const items = (model.byKind.journalPage ?? []).map((p, i) => link(`#${p.id}`, `<span class="chip" style="${c(colors[i % 7])}">${p.n}</span><span>${esc(p.prompt)}</span>`, { style: c(colors[i % 7]) }));
  const body = header({
    kicker: 'pick a prompt, tap to write',
    title: esc(L.journalTitle),
    actions: pill(model.href(ID.notes), L.notesTitle, 'sky'),
    mascot: charImg(pickChar(ctx, 6), { height: '6rem', cls: 'mascot' }),
  }) + `<div class="prompts">${items.join('')}</div>`;
  return pageShell(ctx, body);
}

export function journalPage(ctx) {
  const { cfg, model, page } = ctx;
  const colors = ['pink', 'peach', 'yellow', 'mint', 'teal', 'sky', 'lavender'];
  const col = colors[(page.n - 1) % 7];
  const spark = svg(20, 20, sparkle(10, 10, 9, cfg.colors.yellow, { ink: cfg.colors.ink }));
  const body = header({
    kicker: `Prompt ${page.n}`,
    title: 'Journal',
    actions: navPills(ctx, 'journalPage', col) + pill(model.href(ID.journal), cfg.labels.journalTitle, 'pink', 'solid'),
    mascot: charImg(pickChar(ctx, page.n), { height: '5.6rem', cls: 'mascot' }),
  }) +
    `<div class="banner" style="${c(col)}">${spark}<b>${esc(page.prompt)}</b></div>` +
    `<div class="field" style="flex:none;max-width:50%">date <i></i></div>` +
    box({ color: col, cls: 'grow', body: fill('lines') });
  return pageShell(ctx, body);
}
