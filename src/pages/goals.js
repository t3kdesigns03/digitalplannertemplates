import { SECTION_IDS as ID } from '../model.js';
import { esc, c, pill, header, box, fill, charImg, pickChar, arrowL, arrowR, pageShell } from '../render/components.js';
import { sparkle, star, svg } from '../art/flora.js';

export const css = `
.areas { flex: 1 1 0; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr; gap: .65rem; }
.word { font: 700 2rem/1 var(--script); color: var(--inkSoft); border-bottom: 1.4px solid var(--line); flex: 1; min-height: 2.6rem; }
.vb { flex: 1 1 0; min-height: 0; display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(6, 1fr); gap: .6rem; }
.frame { position: relative; border-radius: 1rem; border: 1.6px dashed color-mix(in srgb, rgb(var(--c-rgb)) 90%, #fff); background: rgba(var(--c-rgb), .1);
  display: flex; align-items: flex-end; justify-content: flex-start; padding: .45rem .6rem; min-height: 0; }
.frame span { font: 600 1.05rem/1 var(--script); color: var(--inkSoft); }
.frame svg { position: absolute; right: .5rem; top: .45rem; width: 1.2rem; height: 1.2rem; }
.affirm { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: .3rem;
  border-radius: 1rem; background: linear-gradient(135deg, rgba(var(--pink-rgb), .45), rgba(var(--lavender-rgb), .5)); padding: .8rem; }
.affirm b { font: 700 1.6rem/1.15 var(--script); color: var(--ink); }
.affirm small { font: 700 .66rem/1 var(--display); letter-spacing: .14em; text-transform: uppercase; color: var(--ink); }
.rocket { display: grid; grid-template-columns: repeat(4, 1fr); gap: .8rem; position: relative; padding-top: .3rem; flex: 1 1 0; min-height: 0; }
.rocket::before { content: ""; position: absolute; left: 12%; right: 12%; top: 1.45rem; border-top: 2px dashed color-mix(in srgb, rgb(var(--c-rgb)) 90%, #fff); }
.rocket > div { position: relative; display: flex; flex-direction: column; align-items: center; gap: .3rem; min-height: 0; }
.rocket .st { width: 2.4rem; height: 2.4rem; border-radius: 50%; background: var(--writing); border: 2px solid rgb(var(--c-rgb));
  display: flex; align-items: center; justify-content: center; font: 700 .9rem/1 var(--display); }
.rocket .st svg { width: 1.4rem; height: 1.4rem; }
.rocket .write-line { width: 100%; min-height: 1.4rem; flex: none; }
.rocket small { font: 700 .62rem/1 var(--display); text-transform: uppercase; letter-spacing: .08em; color: var(--inkSoft); }
`;

export function goals(ctx) {
  const { cfg, model } = ctx;
  const L = cfg.labels;
  const colors = ['pink', 'peach', 'yellow', 'mint', 'sky', 'lavender'];
  const planners = (model.byKind.goalPlanner ?? []).map((p) => pill(`#${p.id}`, `Goal ${p.n}`, 'peach')).join('');
  const body = header({
    kicker: model.variant === 'dated' ? `my ${esc(cfg.yearLabel)}` : 'my year',
    title: esc(L.goalsTitle),
    actions: pill(model.href(ID.vision), L.visionTitle, 'pink') + planners,
    mascot: charImg(ctx.art.characters.find((x) => x.id === 'starlight') ?? pickChar(ctx), { height: '6rem', cls: 'mascot' }),
  }) +
    `<div class="row" style="flex:none">` +
    box({ label: 'Word of the year', color: 'yellow', cls: 'grow', body: `<div class="word"></div>` }) +
    box({ label: 'This year I want to feel', color: 'pink', cls: 'grow', body: `<div class="word"></div>` }) +
    `</div>` +
    `<div class="areas">${L.lifeAreas.map((a, i) => box({ label: a, color: colors[i % colors.length], body: fill('checks') })).join('')}</div>`;
  return pageShell(ctx, body);
}

export function vision(ctx) {
  const { cfg, model } = ctx;
  const L = cfg.labels;
  const plus = svg(20, 20, sparkle(10, 10, 9, cfg.colors.yellow, { ink: cfg.colors.ink }));
  // [col, row, colSpan, rowSpan, label, color]
  const frames = [
    [1, 1, 2, 2, 'dream life', 'pink'], [3, 1, 1, 1, 'travel', 'sky'], [4, 1, 1, 2, 'love', 'peach'],
    [3, 2, 1, 1, 'home', 'mint'], [1, 3, 1, 2, 'health', 'teal'], [4, 3, 1, 2, 'career', 'lavender'],
    [1, 5, 2, 2, 'adventures', 'yellow'], [3, 5, 1, 1, 'style', 'pink'], [4, 5, 1, 2, 'joy', 'mint'], [3, 6, 1, 1, 'money', 'peach'],
  ];
  const cells = frames.map(([x, y, w, h, label, col]) => `<div class="frame" style="${c(col)};grid-column:${x} / span ${w};grid-row:${y} / span ${h}">${plus}<span>${label}</span></div>`);
  cells.push(`<div class="affirm" style="grid-column:2 / span 2;grid-row:3 / span 2"><small>my affirmation</small><b>${esc(L.affirmations[0] ?? '')}</b>${charImg(pickChar(ctx, 2), { height: '5.5rem' })}</div>`);
  const body = header({
    kicker: 'paste pictures, stickers & words',
    title: esc(L.visionTitle),
    actions: pill(model.href(ID.goals), L.goalsTitle, 'peach'),
  }) + `<div class="vb">${cells.join('')}</div>`;
  return pageShell(ctx, body);
}

export function goalPlanner(ctx) {
  const { cfg, model, page } = ctx;
  const L = cfg.labels;
  const list = model.byKind.goalPlanner;
  const idx = list.indexOf(page);
  const prev = list[idx - 1], next = list[idx + 1];
  const st = (i) => svg(20, 20, i === 3 ? star(10, 10.5, 9, cfg.colors.yellow, { ink: cfg.colors.ink }) : sparkle(10, 10, 8.5, ['#ff9ecb', '#c3b1ff', '#5fd3cb'][i], { ink: cfg.colors.ink }));
  const rocket = `<div class="rocket" style="${c('peach')}">${['start', 'quarter way', 'halfway', 'landed!'].map((s, i) => `<div><span class="st">${st(i)}</span><small>${s}</small><div class="write-line"></div></div>`).join('')}</div>`;
  const body = header({
    kicker: `Goal ${page.n}`,
    title: esc(L.goalPlannerTitle),
    actions: pill(prev ? `#${prev.id}` : null, arrowL, 'peach') + pill(next ? `#${next.id}` : null, arrowR, 'peach') + pill(model.href(ID.goals), L.goalsTitle, 'peach', 'solid'),
    mascot: charImg(pickChar(ctx, page.n + 1), { height: '5.6rem', cls: 'mascot' }),
  }) +
    box({ label: 'My goal', color: 'peach', style: 'flex:0 0 auto;height:6.4rem', body: fill('lines') }) +
    `<div class="row" style="flex:0 0 17%">` +
    box({ label: 'Why it matters to me', color: 'pink', cls: 'grow', body: fill('lines') }) +
    `<div class="col" style="flex:0 0 38%">` +
    box({ label: 'Deadline', color: 'sky', cls: 'grow', body: `<div class="write-line"></div>` }) +
    box({ label: 'My reward', color: 'yellow', cls: 'grow', body: `<div class="write-line"></div>` }) +
    `</div></div>` +
    box({ label: 'Action steps', color: 'lavender', cls: 'grow', body: fill('checks') }) +
    box({ label: 'Milestones', color: 'peach', style: 'flex:none;height:7.4rem', body: rocket }) +
    `<div class="row" style="flex:0 0 13%">` +
    box({ label: 'Possible obstacles', color: 'teal', cls: 'grow', body: fill('lines') }) +
    box({ label: 'How I’ll get past them', color: 'mint', cls: 'grow', body: fill('lines') }) +
    `</div>`;
  return pageShell(ctx, body);
}
