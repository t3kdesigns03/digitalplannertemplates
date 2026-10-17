import { weekOrder } from '../model.js';
import {
  esc, c, link, pill, header, box, fill, checks, charImg, pickChar,
  monthColor, moodFace, waterDrop, arrowL, arrowR, pageShell,
} from '../render/components.js';

const pad = (n) => String(n).padStart(2, '0');

export const css = `
.cal { flex: 1 1 0; min-height: 0; display: grid; grid-template-columns: 2.1rem repeat(7, 1fr); gap: .3rem; }
.cal .dh { font: 700 .72rem/1 var(--display); text-transform: uppercase; letter-spacing: .08em; text-align: center;
  padding: .42rem 0; border-radius: .55rem; background: rgba(var(--c-rgb), .4); }
.cal .dh.corner { background: transparent; }
.cal .wno { display: flex; align-items: center; justify-content: center; border-radius: .55rem;
  background: rgba(var(--c-rgb), .22); font: 700 .66rem/1 var(--display); color: var(--ink); }
.cell { position: relative; min-height: 0; background: var(--writing); border: 1.2px solid color-mix(in srgb, rgb(var(--c-rgb)) 60%, #fff); border-radius: .6rem; }
.cell.we { background: rgba(var(--c-rgb), .08); }
.cell.off { background: transparent; border-style: dashed; border-color: color-mix(in srgb, rgb(var(--c-rgb)) 45%, #fff); }
.cell .dtap { position: absolute; left: 0; right: 0; top: 0; height: 2.1rem; display: flex; align-items: flex-start; padding: .25rem; }
.cell .dn { min-width: 1.6rem; height: 1.6rem; padding: 0 .3rem; border-radius: .8rem; display: flex; align-items: center; justify-content: center;
  font: 700 .82rem/1 var(--display); background: rgba(var(--c-rgb), .45); color: var(--ink); }
.cell.off .dn { background: transparent; color: rgba(var(--ink-rgb), .35); }
.cell .dn.blank { background: transparent; border: 1.2px dashed color-mix(in srgb, rgb(var(--ink-rgb)) 30%, #fff); }
.daystrip { display: grid; grid-template-columns: repeat(16, 1fr); gap: .22rem; }
.daystrip a { display: flex; align-items: center; justify-content: center; height: 1.6rem; border-radius: .45rem;
  background: rgba(var(--c-rgb), .3); font: 700 .68rem/1 var(--display); }
.strip { display: grid; grid-template-columns: repeat(7, 1fr); gap: .3rem; flex: none; }
.strip > a, .strip > span { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .1rem;
  height: 2.5rem; border-radius: .65rem; background: rgba(var(--c-rgb), .22); font: 600 .64rem/1 var(--display); color: var(--ink); }
.strip b { font-size: 1rem; font-weight: 700; }
.strip > .on { background: rgb(var(--c-rgb)); }
.strip > .off { color: color-mix(in srgb, var(--ink) 40%, #fff); }
.dbox { flex: 1 1 0; padding-top: .45rem; }
.dlabel { display: flex; align-items: center; gap: .5rem; margin-bottom: .1rem; flex: none; }
.dlabel .dname { font: 700 .95rem/1 var(--display); }
.dlabel .dsub { font: 500 1.05rem/1 var(--script); color: var(--inkSoft); }
.dlabel .dpill { margin-left: auto; }
.dbody { flex: 1 1 0; min-height: 0; display: flex; gap: .8rem; }
.sched { flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; }
.sched .hr { flex: 1 1 0; display: flex; align-items: stretch; border-bottom: 1px solid var(--line); min-height: 0; }
.sched .hr span { width: 2.6rem; flex: none; font: 700 .66rem/1 var(--display); color: var(--inkSoft); padding-top: .25rem; }
.sched .hr i { flex: 1; border-left: 1px solid var(--line); position: relative; }
.sched .hr i::after { content: ""; position: absolute; left: 0; right: 0; top: 50%; border-top: 1px dashed var(--line); }
.datechip { width: 4.6rem; height: 4.6rem; border-radius: 1.2rem; flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: rgb(var(--c-rgb)); font: 700 2.3rem/1 var(--display); color: var(--ink); }
.datechip small { font: 700 .62rem/1 var(--display); letter-spacing: .1em; text-transform: uppercase; margin-top: .1rem; }
.icons { display: flex; align-items: center; justify-content: space-between; gap: .25rem; flex: 1; }
.habit { flex: 1 1 0; min-height: 0; display: grid; gap: 0; border: 1.4px solid color-mix(in srgb, rgb(var(--c-rgb)) 70%, #fff); border-radius: var(--radius); overflow: hidden; background: var(--writing); }
.habit > div { display: flex; align-items: center; justify-content: center; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); min-height: 0; }
.habit .hh { background: rgba(var(--c-rgb), .2); align-items: flex-end; padding: .25rem; }
.habit .hh i { width: 100%; border-bottom: 1px solid color-mix(in srgb, rgb(var(--ink-rgb)) 30%, #fff); height: 1.2rem; }
.habit .hd { justify-content: flex-start; padding-left: .45rem; gap: .35rem; font: 700 .7rem/1 var(--display); }
.habit .hd em { font-style: normal; font-weight: 500; color: var(--inkSoft); font-size: .62rem; }
.habit .we { background: rgba(var(--c-rgb), .08); }
.habit .cb { width: .9rem; height: .9rem; }
.habit .corner { background: rgba(var(--c-rgb), .45); font: 700 .66rem/1 var(--display); }
`;

function monthLabel(cfg, mo) {
  return mo.undated ? esc(mo.name) : esc(cfg.labels.monthNames[mo.m]);
}

// ---------------------------------------------------------------- month
export function month(ctx) {
  const { cfg, model, page } = ctx;
  const mo = page.month;
  const L = cfg.labels;
  const color = monthColor(mo.index);
  const order = weekOrder(cfg.weekStart);
  const actions = [
    pill(model.href(mo.habitId), 'Habits', 'mint'),
    pill(model.href(mo.weeks[0]?.id), 'Weeks', 'sky'),
    pill(model.sectionHref.year, L.year, 'lavender'),
  ].join('');

  let cells = `<div class="dh corner"></div>` + order.map((d) => `<div class="dh">${esc(L.dayShort[d])}</div>`).join('');
  for (const week of mo.weeks) {
    cells += link(model.weekHref(week), `W${week.num}`, { cls: 'wno' });
    for (let i = 0; i < 7; i++) {
      if (mo.undated) {
        cells += `<div class="cell${i >= 5 && cfg.weekStart === 'monday' ? ' we' : ''}"><div class="dtap"><span class="dn blank"></span></div></div>`;
        continue;
      }
      const wd = week.days[i];
      const inMonth = wd.inRange && wd.key.startsWith(mo.key);
      const we = wd.dow === 0 || wd.dow === 6;
      const href = wd.inRange ? model.dayHref(wd.key) : null;
      cells += `<div class="cell${we ? ' we' : ''}${inMonth ? '' : ' off'}">${link(href, `<span class="dn">${wd.d}</span>`, { cls: 'dtap' })}</div>`;
    }
  }

  const strip = mo.undated
    ? box({ label: 'Jump to a day', color, cls: 'soft', style: 'flex:none', body: `<div class="daystrip">${mo.days.map((d) => link(model.dayHref(d.key), d.d)).join('')}</div>` })
    : '';

  const body = header({
    kicker: mo.undated ? 'Undated month &middot; write your month here: ____________' : String(mo.y),
    title: monthLabel(cfg, mo),
    actions,
    mascot: charImg(pickChar(ctx, mo.index), { height: '5.6rem', cls: 'mascot' }),
  }) +
    `<div class="cal" style="${c(color)};grid-template-rows:auto repeat(${mo.weeks.length},1fr)">${cells}</div>` +
    strip +
    `<div class="row" style="flex:0 0 ${mo.undated ? 17 : 21}%">` +
    box({ label: 'Monthly focus', color, cls: 'grow', body: fill('lines') }) +
    box({ label: 'Don’t forget', color: 'pink', cls: 'grow', body: fill('checks') }) +
    box({ label: 'Little joys', color: 'yellow', cls: 'grow', body: fill('lines') }) +
    `</div>`;
  return pageShell(ctx, body);
}

// ---------------------------------------------------------------- habits
export function monthHabits(ctx) {
  const { cfg, model, page } = ctx;
  const mo = page.month;
  const n = cfg.counts.habitsPerMonth;
  const color = 'mint';
  const rows = mo.daysInMonth;
  let grid = `<div class="corner">Day</div>` + Array.from({ length: n }, () => `<div class="hh"><i></i></div>`).join('');
  for (let d = 1; d <= rows; d++) {
    let we = false;
    let dayLabel = `${d}`;
    if (!mo.undated) {
      const day = mo.days[d - 1];
      we = day.dow === 0 || day.dow === 6;
      dayLabel = `${link(model.dayHref(day.key), d)} <em>${esc(cfg.labels.dayShort[day.dow].slice(0, 2))}</em>`;
    }
    grid += `<div class="hd${we ? ' we' : ''}">${dayLabel}</div>` + Array.from({ length: n }, () => `<div class="${we ? 'we' : ''}"><b class="cb round"></b></div>`).join('');
  }
  const body = header({
    kicker: mo.undated ? esc(mo.name) : `${esc(cfg.labels.monthNames[mo.m])} ${mo.y}`,
    title: 'Habit Tracker',
    actions: pill(model.href(mo.id), mo.undated ? mo.name : cfg.labels.monthNames[mo.m], monthColor(mo.index)) + pill(model.sectionHref.habits, cfg.labels.habits, 'mint'),
    mascot: charImg(pickChar(ctx, mo.index + 3), { height: '5.4rem', cls: 'mascot' }),
  }) +
    `<div class="habit" style="${c(color)};grid-template-columns:3.4rem repeat(${n},1fr);grid-template-rows:3rem repeat(${rows},1fr)">${grid}</div>` +
    `<div class="row" style="flex:0 0 9%">` +
    box({ label: 'My reward', color: 'pink', cls: 'grow', body: fill('lines') }) +
    box({ label: 'How it went', color: 'lavender', cls: 'grow', body: fill('lines') }) +
    `</div>`;
  return pageShell(ctx, body);
}

// ---------------------------------------------------------------- weekly
function weekTitle(cfg, week) {
  if (week.undated) return { kicker: '', title: `Week ${week.num}` };
  const a = week.days[0], b = week.days[6];
  const S = cfg.labels.monthShort;
  return {
    kicker: `Week ${pad(week.num)} &middot; ${new Date(week.start).getUTCFullYear()}`,
    title: `${esc(S[a.m])} ${a.d} &ndash; ${a.m !== b.m ? esc(S[b.m]) + ' ' : ''}${b.d}`,
  };
}

function weekStrip(ctx, week, activeKey) {
  const { cfg, model } = ctx;
  if (week.undated) return '';
  return `<div class="strip" style="${c('lavender')}">${week.days.map((wd) => {
    const inner = `<span>${esc(cfg.labels.dayShort[wd.dow])}</span><b>${wd.d}</b>`;
    const cls = `${wd.key === activeKey ? 'on' : ''} ${wd.inRange ? '' : 'off'}`;
    return wd.inRange ? link(model.dayHref(wd.key), inner, { cls }) : `<span class="${cls}">${inner}</span>`;
  }).join('')}</div>`;
}

function dayBox(ctx, week, i, color) {
  const { cfg, model } = ctx;
  const order = weekOrder(cfg.weekStart);
  const dname = esc(cfg.labels.dayNames[order[i]]);
  if (week.undated) {
    return `<div class="box dbox" style="${c(color)}"><div class="dlabel"><span class="dname">${dname}</span><span class="dsub">date: ______</span></div><div class="dbody">${fill('lines')}</div></div>`;
  }
  const wd = week.days[i];
  const S = cfg.labels.monthShort;
  const dp = wd.inRange ? pill(model.dayHref(wd.key), `${esc(S[wd.m])} ${wd.d} ${arrowR}`, color, 'dpill') : `<span class="pill ghost dpill">${esc(S[wd.m])} ${wd.d}</span>`;
  return `<div class="box dbox" style="${c(color)}"><div class="dlabel"><span class="dname">${dname}</span>${dp}</div><div class="dbody">${fill('lines')}</div></div>`;
}

function weekActions(ctx, week, half) {
  const { cfg, model } = ctx;
  const list = model.byKind.weekA ?? [];
  const idx = list.findIndex((p) => p.week === week);
  const prev = list[idx - 1], next = list[idx + 1];
  const mo = model.monthByKey[week.monthKey];
  return [
    pill(prev ? `#${prev.id}` : null, `${arrowL}`, 'lavender'),
    pill(next ? `#${next.id}` : null, `${arrowR}`, 'lavender'),
    pill(model.monthHref(week.monthKey), mo.undated ? mo.name : cfg.labels.monthNames[mo.m], monthColor(mo.index)),
    half === 'A' ? pill(model.href(week.id2), `Page 2 ${arrowR}`, 'pink', 'solid') : pill(model.href(week.id), `${arrowL} Page 1`, 'pink', 'solid'),
  ].join('');
}

const DAY_COLORS = ['pink', 'peach', 'yellow', 'mint', 'teal', 'sky', 'lavender'];

export function weekA(ctx) {
  const { page } = ctx;
  const week = page.week;
  const t = weekTitle(ctx.cfg, week);
  const kicker = week.undated ? `${esc(ctx.model.monthByKey[week.monthKey].name)}` : t.kicker;
  const body = header({ kicker, title: t.title, actions: weekActions(ctx, week, 'A'), mascot: charImg(pickChar(ctx, week.index), { height: '5.2rem', cls: 'mascot' }) }) +
    weekStrip(ctx, week) +
    [0, 1, 2, 3].map((i) => dayBox(ctx, week, i, DAY_COLORS[i])).join('');
  return pageShell(ctx, body);
}

export function weekB(ctx) {
  const { page } = ctx;
  const week = page.week;
  const t = weekTitle(ctx.cfg, week);
  const kicker = week.undated ? `${esc(ctx.model.monthByKey[week.monthKey].name)}` : t.kicker;
  const body = header({ kicker, title: t.title, actions: weekActions(ctx, week, 'B'), mascot: charImg(pickChar(ctx, week.index + 1), { height: '5.2rem', cls: 'mascot' }) }) +
    weekStrip(ctx, week) +
    [4, 5, 6].map((i) => dayBox(ctx, week, i, DAY_COLORS[i])).join('') +
    `<div class="row" style="flex:1.15 1 0">` +
    box({ label: 'Top priorities', color: 'pink', cls: 'grow', body: fill('checks') }) +
    box({ label: 'Weekly win', hint: 'what made you proud?', color: 'yellow', cls: 'grow', body: fill('lines') }) +
    `</div>`;
  return pageShell(ctx, body);
}

// ---------------------------------------------------------------- daily
function hourLabel(cfg, h) {
  if (cfg.daily.clock === '24h') return `${pad(h)}:00`;
  const hh = h % 12 || 12;
  return `${hh} ${h < 12 || h === 24 ? 'am' : 'pm'}`;
}

export function day(ctx) {
  const { cfg, model, page } = ctx;
  const d = page.day;
  const L = cfg.labels;
  const mo = model.monthByKey[d.monthKey];
  const list = model.byKind.day;
  const idx = list.indexOf(page);
  const prev = list[idx - 1], next = list[idx + 1];
  const color = monthColor(mo.index);

  let kicker, title, small, chip, strip = '', weekHref;
  if (d.undated) {
    kicker = `${esc(mo.name)} &middot; date: ______________`;
    title = `Day ${pad(d.d)}`;
    small = '';
    chip = `<div class="datechip" style="${c(color)}">${d.d}<small>day</small></div>`;
    weekHref = model.href(mo.weeks[0]?.id);
  } else {
    const week = model.weeks.find((w) => w.id === d.weekId);
    kicker = `${esc(L.dayNames[d.dow])} &middot; Week ${week.num}`;
    title = esc(L.monthNames[d.m]) + ' ' + d.d;
    small = String(d.y);
    chip = `<div class="datechip" style="${c(color)}">${d.d}<small>${esc(L.dayShort[d.dow])}</small></div>`;
    strip = weekStrip(ctx, week, d.key);
    weekHref = model.weekHref(week);
  }
  const actions = [
    pill(prev ? `#${prev.id}` : null, arrowL, 'lavender'),
    pill(next ? `#${next.id}` : null, arrowR, 'lavender'),
    pill(weekHref, 'Week', 'sky'),
    pill(model.monthHref(mo.key), mo.undated ? mo.name : L.monthShort[mo.m], color),
  ].join('');

  const hours = [];
  for (let h = cfg.daily.startHour; h <= cfg.daily.endHour; h++) hours.push(`<div class="hr"><span>${hourLabel(cfg, h)}</span><i></i></div>`);

  const moods = L.moods.map((_, i) => moodFace(cfg, i, '1.75rem')).join('');
  const drops = Array.from({ length: 8 }, () => waterDrop('1.15rem')).join('');

  const body =
    `<div class="ph">${chip}<div class="titles"><div class="kicker">${kicker}</div><div class="title">${title}${small ? `<small>${small}</small>` : ''}</div></div><div class="actions">${actions}</div>${charImg(pickChar(ctx, (d.d ?? 0) + mo.index), { height: '5.2rem', cls: 'mascot' })}</div>` +
    strip +
    `<div class="row grow">` +
    `<div class="col" style="flex:0 0 46%">` +
    box({ label: 'Schedule', color: 'sky', cls: 'grow', body: `<div class="sched">${hours.join('')}</div>` }) +
    `</div>` +
    `<div class="col grow">` +
    box({ label: 'Top 3', color: 'pink', style: 'flex:0 0 auto;height:8.2rem', body: checks(3, { round: true }) }) +
    box({ label: 'To do', color: 'lavender', cls: 'grow', body: fill('checks') }) +
    `<div class="row" style="flex:none">` +
    box({ label: 'Water', color: 'sky', cls: 'grow', body: `<div class="icons">${drops}</div>` }) +
    `</div>` +
    box({ label: 'Mood', hint: 'circle one', color: 'yellow', style: 'flex:none', body: `<div class="icons">${moods}</div>` }) +
    box({ label: 'Grateful for', color: 'peach', style: 'flex:0 0 18%', body: fill('lines') }) +
    `</div></div>` +
    box({ label: 'Notes', color: 'mint', style: 'flex:0 0 17%', body: fill('lines') });
  return pageShell(ctx, body);
}
