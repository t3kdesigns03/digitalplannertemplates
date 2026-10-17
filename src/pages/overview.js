import { weekOrder, SECTION_IDS as ID } from '../model.js';
import {
  esc, c, rgbOf, link, pill, header, box, fill, charImg, pickChar, flowerImg, monthColor, pageShell,
} from '../render/components.js';
import { sparkle, svg } from '../art/flora.js';

export const css = `
.lead { font: 500 1.02rem/1.5 var(--body); color: var(--ink); margin: 0; }
.crew { display: grid; grid-template-columns: repeat(4, 1fr); gap: .7rem; flex: 1 1 0; min-height: 0; }
.crew .card { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; min-height: 0;
  border-radius: 1.1rem; padding: .5rem .5rem .65rem; background: linear-gradient(180deg, rgba(var(--c-rgb), .12), rgba(var(--c-rgb), .38)); }
.crew .card img { flex: 1 1 0; min-height: 0; width: auto; max-width: 100%; object-fit: contain; }
.crew .card b { font: 700 1.05rem/1.1 var(--display); margin-top: .25rem; }
.crew .card span { font: 600 1rem/1.05 var(--script); color: var(--inkSoft); text-align: center; }
.crew .card.hello { justify-content: center; text-align: center; background: rgba(var(--c-rgb), .18); border: 1.4px dashed color-mix(in srgb, rgb(var(--c-rgb)) 80%, #fff); }
.tips { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: .45rem 1.2rem; }
.tips li { display: flex; gap: .45rem; align-items: flex-start; font: 500 .86rem/1.35 var(--body); }
.tips li svg { width: .95rem; height: .95rem; flex: none; margin-top: .1rem; }
.tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: .6rem; flex: 1 1 0; min-height: 0; }
.tile { display: flex; flex-direction: column; justify-content: space-between; border-radius: 1rem; padding: .6rem .7rem; min-height: 0; position: relative; overflow: hidden;
  background: rgba(var(--c-rgb), .26); border: 1.4px solid color-mix(in srgb, rgb(var(--c-rgb)) 70%, #fff); }
.tile b { font: 700 .98rem/1.1 var(--display); position: relative; z-index: 1; }
.tile span { font: 600 .95rem/1 var(--script); color: var(--inkSoft); position: relative; z-index: 1; }
.tile img { position: absolute; right: .3rem; bottom: .25rem; height: 58%; width: auto; opacity: .95; }
.months12 { display: grid; grid-template-columns: repeat(6, 1fr); gap: .4rem; }
.months12 a, .months12 span { display: flex; align-items: center; justify-content: center; height: 2.3rem; border-radius: .7rem;
  background: rgba(var(--c-rgb), .4); font: 700 .85rem/1 var(--display); }
.minis { flex: 1 1 0; min-height: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: .6rem; }
.minis .box { padding: .45rem .55rem; }
.minis .mt { display: block; font: 700 .95rem/1 var(--display); margin-bottom: .3rem; text-align: center; padding: .3rem; border-radius: .55rem; background: rgba(var(--c-rgb), .4); }
.minis .mini { flex: 1 1 0; grid-auto-rows: 1fr; align-items: center; }
.minis .mini a, .minis .mini span { display: flex; align-items: center; justify-content: center; height: 100%; padding: 0; }
.minis .mini .we { color: var(--inkSoft); }
.plan12 { flex: 1 1 0; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
.plan12 .box .label a { margin-left: auto; }
.yearpix { flex: 1 1 0; min-height: 0; display: grid; gap: 2px; }
.yearpix > * { display: flex; align-items: center; justify-content: center; font: 700 .58rem/1 var(--display); min-height: 0; }
.yearpix .px { border: 1px solid color-mix(in srgb, rgb(var(--c-rgb)) 55%, #fff); border-radius: .3rem; background: var(--writing); }
.yearpix .px.no { border: none; background: transparent; }
.yearpix .mh { border-radius: .35rem; background: rgba(var(--c-rgb), .45); }
.yearpix .dl { color: var(--inkSoft); }
`;

const tick = svg(20, 20, sparkle(10, 10, 9, '#ffdf7e', { ink: '#4a3a6b' }));

// ---------------------------------------------------------------- welcome
export function welcome(ctx) {
  const { cfg, model, art } = ctx;
  const L = cfg.labels;
  const crew = art.characters.slice(0, 7);
  const cards = crew.map((ch) => `<div class="card" style="--c-rgb:${rgbOf(ch.color)}"><img src="${ch.uri}" alt="${esc(ch.name)}"><b>${esc(ch.name)}</b><span>${esc(ch.tagline || '')}</span></div>`);
  if (cards.length % 4) {
    cards.push(`<div class="card hello" style="${c('pink')}"><b>Meet the crew!</b><span>They'll pop up all over your planner to cheer you on.</span><div style="margin-top:.6rem">${pill(model.sectionHref.home, 'Let’s go &#8250;', 'pink', 'solid')}</div></div>`);
  }
  const tips = [
    'Tap the <b>top tabs</b> to fly between sections, and the <b>side tabs</b> to open any month.',
    'Tap a <b>date</b> on any calendar to open that day, or a <b>W#</b> to open the week.',
    'Use the <b>&#8249; &#8250;</b> buttons to flip to the previous or next day or week.',
    'Lasso a sticker from the <b>sticker sheets</b>, copy it, and paste it on any page.',
    'Duplicate any undated page (notes, check-ins, gratitude) whenever you need more.',
    'Made for GoodNotes, Notability and Noteshelf, and it prints beautifully too.',
  ];
  const body = header({ kicker: 'hello, hello', title: esc(L.welcomeTitle) }) +
    box({ color: 'pink', cls: 'soft', style: 'flex:none', body: `<p class="lead">${esc(L.welcomeMessage)}</p>` }) +
    `<div class="crew">${cards.join('')}</div>` +
    box({ label: 'How to use your planner', color: 'lavender', style: 'flex:none', body: `<ul class="tips">${tips.map((t) => `<li>${tick}<span>${t}</span></li>`).join('')}</ul>` });
  return pageShell(ctx, body);
}

// ---------------------------------------------------------------- dashboard
export function dashboard(ctx) {
  const { cfg, model, art } = ctx;
  const L = cfg.labels;
  const t = [
    [ID.year, L.yearTitle, 'see it all', 'lavender'],
    [ID.yearPlan, L.yearPlanTitle, 'plan ahead', 'sky'],
    [ID.goals, L.goalsTitle, 'dream big', 'peach'],
    [ID.vision, L.visionTitle, 'picture it', 'pink'],
    [ID.habits, L.habitsTitle, 'tiny steps', 'mint'],
    [ID.wellness, L.wellnessTitle, 'be gentle', 'teal'],
    ['gratitude-1', L.gratitudeTitle, 'thank you', 'yellow'],
    ['checkin-1', L.checkinTitle, 'how are you?', 'lavender'],
    [ID.notes, L.notesTitle, 'jot it down', 'sky'],
    [ID.journal, L.journalTitle, 'write it out', 'pink'],
    [ID.garden, L.gardenTitle, 'watch it grow', 'mint'],
    [ID.mood, L.moodTitle, 'feel it all', 'yellow'],
    [ID.bucket, L.bucketTitle, 'someday soon', 'peach'],
    [ID.reads, L.readsTitle, 'stories', 'teal'],
    [ID.stickers, L.stickersTitle, 'decorate', 'pink'],
    [ID.welcome, 'Meet the Crew', 'say hi', 'lavender'],
  ].filter(([id]) => model.has.has(id));
  const tiles = t.map(([id, title, sub, col], i) => link(`#${id}`, `<b>${esc(title)}</b><span>${esc(sub)}</span>${flowerImg(art.flowers[i % art.flowers.length], { height: '58%' })}`, { cls: 'tile', style: c(col) }));
  const months = model.months.map((mo, i) => link(model.monthHref(mo.key), esc(mo.undated ? mo.short : cfg.labels.monthShort[mo.m]), { style: c(monthColor(i)) }));
  const body = header({
    kicker: model.variant === 'dated' ? esc(cfg.yearLabel.replace('-', ' – ')) : 'Undated',
    title: esc(L.dashboardTitle),
    actions: pill(model.href(ID.cover), 'Cover', 'pink'),
    mascot: charImg(art.characters.find((x) => x.id === 'sunny') ?? pickChar(ctx), { height: '6rem', cls: 'mascot' }),
  }) +
    `<div class="tiles">${tiles.join('')}</div>` +
    box({ label: 'Months', color: 'lavender', style: 'flex:none', body: `<div class="months12">${months.join('')}</div>` }) +
    `<div class="row" style="flex:0 0 17%">` +
    box({ label: 'Word of the year', color: 'yellow', cls: 'grow', body: fill('lines', { gap: 1.6 }) }) +
    box({ label: 'Right now I’m focusing on', color: 'pink', cls: 'grow', body: fill('lines') }) +
    `</div>`;
  return pageShell(ctx, body);
}

// ---------------------------------------------------------------- year
function miniCal(ctx, mo, i) {
  const { cfg, model } = ctx;
  const order = weekOrder(cfg.weekStart);
  let cells = order.map((d) => `<span class="dh">${esc(cfg.labels.dayShort[d].slice(0, 1))}</span>`).join('');
  if (mo.undated) {
    cells = mo.days.map((d) => link(model.dayHref(d.key), d.d)).join('');
  } else {
    const lead = order.indexOf(new Date(mo.first).getUTCDay());
    cells += '<span></span>'.repeat(lead);
    cells += mo.days.map((d) => link(model.dayHref(d.key), d.d, { cls: d.dow === 0 || d.dow === 6 ? 'we' : '' })).join('');
  }
  const title = mo.undated ? mo.name : cfg.labels.monthNames[mo.m];
  return `<div class="box" style="${c(monthColor(i))}">${link(model.monthHref(mo.key), esc(title), { cls: 'mt' })}<div class="mini">${cells}</div></div>`;
}

export function yearOverview(ctx) {
  const { cfg, model } = ctx;
  const body = header({
    kicker: model.variant === 'dated' ? esc(cfg.yearLabel.replace('-', ' – ')) : 'Undated',
    title: esc(cfg.labels.yearTitle),
    actions: pill(model.href(ID.yearPlan), cfg.labels.yearPlanTitle, 'sky') + pill(model.href(ID.goals), cfg.labels.goalsTitle, 'peach'),
    mascot: charImg(pickChar(ctx, 3), { height: '5.6rem', cls: 'mascot' }),
  }) + `<div class="minis" style="grid-template-rows:repeat(${Math.max(4, Math.ceil(model.months.length / 3))},1fr)">${model.months.map((mo, i) => miniCal(ctx, mo, i)).join('')}</div>`;
  return pageShell(ctx, body);
}

export function yearPlan(ctx) {
  const { cfg, model } = ctx;
  const boxes = model.months.map((mo, i) => {
    const title = mo.undated ? mo.name : `${cfg.labels.monthNames[mo.m]}`;
    return `<div class="box" style="${c(monthColor(i))}"><div class="label">${link(model.monthHref(mo.key), esc(title))}</div>${fill('lines')}</div>`;
  });
  const body = header({
    kicker: 'events, trips & big days',
    title: esc(cfg.labels.yearPlanTitle),
    actions: pill(model.href(ID.year), cfg.labels.yearTitle, 'lavender'),
    mascot: charImg(pickChar(ctx, 5), { height: '5.6rem', cls: 'mascot' }),
  }) + `<div class="plan12" style="grid-template-rows:repeat(${Math.max(6, Math.ceil(boxes.length / 2))},1fr)">${boxes.join('')}</div>`;
  return pageShell(ctx, body);
}

// ---------------------------------------------------------------- habit of the year
export function habitsYear(ctx) {
  const { cfg, model } = ctx;
  const months = model.months;
  const trackers = months.map((mo, i) => link(model.href(mo.habitId), esc(mo.undated ? mo.short : cfg.labels.monthShort[mo.m]), { style: c(monthColor(i)) }));
  let grid = `<span></span>` + months.map((mo, i) => link(model.monthHref(mo.key), esc(mo.undated ? mo.short : cfg.labels.monthShort[mo.m].slice(0, 3)), { cls: 'mh', style: c(monthColor(i)) })).join('');
  for (let d = 1; d <= 31; d++) {
    grid += `<span class="dl">${d}</span>`;
    for (const mo of months) grid += `<span class="px${d > mo.daysInMonth ? ' no' : ''}"></span>`;
  }
  const body = header({
    kicker: 'one habit, every day',
    title: esc(cfg.labels.habitsTitle),
    mascot: charImg(pickChar(ctx, 4), { height: '5.6rem', cls: 'mascot' }),
  }) +
    box({ label: 'Monthly habit trackers', color: 'mint', style: 'flex:none', body: `<div class="months12">${trackers.join('')}</div>` }) +
    `<div class="row" style="flex:none">` +
    box({ label: 'My habit of the year', color: 'mint', cls: 'grow', body: `<div class="write-line" style="flex:none"></div>` }) +
    box({ label: 'Why it matters', color: 'pink', cls: 'grow', body: `<div class="write-line" style="flex:none"></div>` }) +
    `</div>` +
    `<div class="yearpix" style="${c('mint')};grid-template-columns:1.6rem repeat(${Math.max(12, months.length)},1fr);grid-template-rows:1.6rem repeat(31,1fr)">${grid}</div>`;
  return pageShell(ctx, body);
}
