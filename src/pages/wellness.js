import { SECTION_IDS as ID } from '../model.js';
import { esc, c, pill, header, box, fill, charImg, pickChar, flowerImg, moodFace, waterDrop, arrowL, arrowR, pageShell } from '../render/components.js';
import { flower, svg } from '../art/flora.js';

export const css = `
.quad { flex: 1 1 0; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr; gap: .65rem; }
.quad .box > svg { position: absolute; right: .55rem; top: .4rem; width: 1.7rem; height: 1.7rem; }
.affs { display: grid; grid-template-columns: 1fr 1fr; gap: .35rem 1rem; }
.affs div { font: 600 1.25rem/1.15 var(--script); color: var(--ink); display: flex; gap: .4rem; align-items: baseline; }
.affs div::before { content: ""; width: .5rem; height: .5rem; border-radius: 50%; background: rgb(var(--pink-rgb)); flex: none; transform: translateY(-.15rem); }
.ci { flex: 1 1 0; min-height: 0; display: grid; border: 1.4px solid color-mix(in srgb, rgb(var(--c-rgb)) 70%, #fff); border-radius: var(--radius); overflow: hidden; background: var(--writing); }
.ci > div { display: flex; align-items: center; justify-content: center; gap: .18rem; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); min-height: 0; padding: 0 .3rem; }
.ci .th { background: rgba(var(--c-rgb), .3); font: 700 .68rem/1.1 var(--display); text-transform: uppercase; letter-spacing: .06em; text-align: center; }
.ci .dn { font: 700 .82rem/1 var(--display); justify-content: flex-start; padding-left: .55rem; }
.ci .hrs { justify-content: flex-end; align-items: flex-end; padding-bottom: .4rem; font: 600 .62rem/1 var(--display); color: var(--inkSoft); }
.ci .hrs i { flex: 1; border-bottom: 1px solid color-mix(in srgb, rgb(var(--ink-rgb)) 30%, #fff); margin-right: .2rem; }
.grat { flex: 1 1 0; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr; gap: .65rem; }
.g3 { flex: 1 1 0; display: flex; flex-direction: column; min-height: 0; }
.g3 div { flex: 1; display: flex; align-items: flex-end; gap: .45rem; border-bottom: 1px solid var(--line); padding-bottom: .2rem; }
.g3 svg { width: 1.15rem; height: 1.15rem; flex: none; margin-bottom: .1rem; }
.dateln { display: flex; gap: .4rem; align-items: flex-end; font: 600 .95rem/1 var(--script); color: var(--inkSoft); margin-left: auto; }
.dateln i { width: 5rem; border-bottom: 1px solid var(--line); height: 1rem; }
`;

const navPills = (ctx, kind, color) => {
  const list = ctx.model.byKind[kind] ?? [];
  const idx = list.indexOf(ctx.page);
  const prev = list[idx - 1], next = list[idx + 1];
  return pill(prev ? `#${prev.id}` : null, arrowL, color) + pill(next ? `#${next.id}` : null, arrowR, color);
};

export function wellness(ctx) {
  const { cfg, model } = ctx;
  const L = cfg.labels;
  const colors = ['pink', 'teal', 'lavender', 'peach'];
  const hints = ['move, rest, nourish', 'calm, learn, unplug', 'connect, love, laugh', 'create, wonder, pray'];
  const quads = L.selfCareAreas.map((a, i) => box({
    label: a, hint: hints[i] ?? '', color: colors[i % 4],
    body: fill('checks', { round: true }),
  }));
  const checkins = (model.byKind.checkin ?? []).slice(0, 1).map((p) => pill(`#${p.id}`, L.checkinTitle, 'teal')).join('');
  const grat = (model.byKind.gratitude ?? []).slice(0, 1).map((p) => pill(`#${p.id}`, L.gratitudeTitle, 'yellow')).join('');
  const body = header({
    kicker: 'my self-care menu',
    title: esc(L.wellnessTitle),
    actions: checkins + grat,
    mascot: charImg(ctx.art.characters.find((x) => x.id === 'mint') ?? pickChar(ctx), { height: '6rem', cls: 'mascot' }),
  }) +
    `<div class="quad">${quads.join('')}</div>` +
    box({ label: 'Gentle reminders', color: 'pink', cls: 'soft', style: 'flex:none', body: `<div class="affs">${L.affirmations.map((a) => `<div>${esc(a)}</div>`).join('')}</div>` });
  return pageShell(ctx, body);
}

export function checkin(ctx) {
  const { cfg, model, page } = ctx;
  const L = cfg.labels;
  const days = [...Array(7).keys()].map((i) => L.dayShort[(i + (cfg.weekStart === 'monday' ? 1 : 0)) % 7]);
  const cols = ['Day', 'Sleep', 'Water', 'Movement', 'Me time', 'Mood'];
  let grid = cols.map((h) => `<div class="th">${h}</div>`).join('');
  for (const d of days) {
    grid += `<div class="dn">${esc(d)}</div>` +
      `<div class="hrs"><i></i>hrs</div>` +
      `<div>${Array.from({ length: 8 }, () => waterDrop('.95rem')).join('')}</div>` +
      `<div><b class="cb"></b></div>` +
      `<div><b class="cb"></b></div>` +
      `<div>${L.moods.slice(0, 5).map((_, i) => moodFace(cfg, i, '1.15rem')).join('')}</div>`;
  }
  const body = header({
    kicker: 'week of ____________',
    title: esc(L.checkinTitle),
    actions: navPills(ctx, 'checkin', 'teal') + pill(model.href(ID.wellness), L.wellness, 'teal', 'solid'),
    mascot: charImg(pickChar(ctx, page.n + 2), { height: '5.6rem', cls: 'mascot' }),
  }) +
    `<div class="ci" style="${c('teal')};grid-template-columns:3.4rem 5.5rem 1fr 4.6rem 4.6rem 1fr;grid-template-rows:2.2rem repeat(7,1fr)">${grid}</div>` +
    `<div class="row" style="flex:0 0 22%">` +
    box({ label: 'How am I really feeling?', color: 'lavender', cls: 'grow', body: fill('lines') }) +
    box({ label: 'What drained me / filled me up', color: 'pink', cls: 'grow', body: fill('lines') }) +
    `</div>` +
    box({ label: 'Next week I’ll be gentle with myself by…', color: 'mint', style: 'flex:0 0 12%', body: fill('lines') });
  return pageShell(ctx, body);
}

export function gratitude(ctx) {
  const { cfg, model, page } = ctx;
  const L = cfg.labels;
  const P = cfg.colors;
  const bloom = (i) => svg(20, 20, flower(['starBloom', 'cosmos', 'planetBloom'][i % 3], 10, 10, 9, [P.pink, P.yellow, P.lavender][i % 3], { ink: P.ink }));
  const block = (title, color, n = 3) => `<div class="box" style="${c(color)}"><div class="label">${title}<span class="dateln">date <i></i></span></div><div class="g3">${Array.from({ length: n }, (_, i) => `<div>${bloom(i)}</div>`).join('')}</div></div>`;
  const colors = ['pink', 'peach', 'yellow', 'mint', 'teal', 'sky', 'lavender'];
  const blocks = colors.map((col, i) => block(`Day ${i + 1}`, col));
  blocks.push(`<div class="box soft" style="${c('pink')}"><div class="label">Best moment this week</div>${fill('lines')}${flowerImg(ctx.art.flowers[(page.n * 3) % ctx.art.flowers.length], { height: '3.4rem', style: 'position:absolute;right:.5rem;bottom:.4rem' })}</div>`);
  const body = header({
    kicker: 'three good things a day',
    title: esc(L.gratitudeTitle),
    actions: navPills(ctx, 'gratitude', 'yellow') + pill(model.href(ID.wellness), L.wellness, 'teal', 'solid'),
    mascot: charImg(pickChar(ctx, page.n + 4), { height: '5.6rem', cls: 'mascot' }),
  }) + `<div class="grat">${blocks.join('')}</div>`;
  return pageShell(ctx, body);
}
