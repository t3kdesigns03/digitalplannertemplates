import { sparkle, svg } from '../art/flora.js';
import { characterMarkup } from '../art/characters.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
/** Inline style that sets the accent colour used by .box/.pill/.label etc. */
export const c = (name) => `--c-rgb:var(--${name}-rgb)`;
/** "#ff9ecb" -> "255,158,203" for use as --c-rgb */
export const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',');

export const SECTION_COLORS = { home: 'pink', year: 'lavender', goals: 'peach', habits: 'mint', wellness: 'teal', notes: 'sky', fun: 'yellow', calendar: 'lavender' };
const MONTH_COLORS = ['pink', 'peach', 'yellow', 'mint', 'teal', 'sky', 'lavender'];
export const monthColor = (i) => MONTH_COLORS[i % MONTH_COLORS.length];

export function link(href, inner, { cls = '', style = '', title } = {}) {
  const t = title ? ` title="${esc(title)}"` : '';
  if (!href) return `<span class="${cls}" style="${style}"${t}>${inner}</span>`;
  return `<a href="${href}" class="${cls}" style="${style}"${t}>${inner}</a>`;
}

export function pill(href, text, color = 'lavender', cls = '') {
  return link(href, text, { cls: `pill ${cls}`, style: c(color) });
}

const tinySparkle = svg(20, 20, sparkle(10, 10, 8, '#fff', { ink: '#4a3a6b' }));

export function topTabs(ctx) {
  const { cfg, model, page } = ctx;
  const L = cfg.labels;
  const tabs = [
    ['home', L.home], ['year', L.year], ['goals', L.goals], ['habits', L.habits],
    ['wellness', L.wellness], ['notes', L.notes], ['fun', L.fun],
  ].filter(([key]) => model.sectionHref[key]);
  return `<nav class="toptabs">${tabs.map(([key, label]) => {
    const on = page.section === key;
    return `<a href="${model.sectionHref[key]}" class="${on ? 'on' : ''}" style="${c(SECTION_COLORS[key])}">${on ? tinySparkle : ''}${esc(label)}</a>`;
  }).join('')}</nav>`;
}

export function sideTabs(ctx) {
  const { model, page } = ctx;
  return `<nav class="sidetabs" style="--tabs:${Math.max(12, model.months.length)}">${model.months.map((mo, i) => {
    const on = page.monthKey === mo.key;
    return link(model.monthHref(mo.key), esc(mo.tab), { cls: on ? 'on' : '', style: c(monthColor(i)) });
  }).join('')}</nav>`;
}

export function pageShell(ctx, inner, { decor = '', nebula = ctx.cfg.decor.nebulaBackground, cls = '' } = {}) {
  return `<section class="page ${nebula ? 'nebula' : ''} ${cls}" id="${ctx.page.id}">${topTabs(ctx)}${sideTabs(ctx)}<div class="content">${inner}</div>${decor}</section>`;
}

export function header({ kicker = '', title = '', small = '', actions = '', mascot = '' }) {
  return `<div class="ph"><div class="titles">${kicker ? `<div class="kicker">${kicker}</div>` : ''}<div class="title">${title}${small ? `<small>${small}</small>` : ''}</div></div>${actions ? `<div class="actions">${actions}</div>` : ''}${mascot}</div>`;
}

export function box({ label = '', hint = '', color = 'lavender', cls = '', style = '', body = '' }) {
  const lab = label ? `<div class="label">${esc(label)}${hint ? `<span class="hint">${esc(hint)}</span>` : ''}</div>` : '';
  return `<div class="box ${cls}" style="${c(color)};${style}">${lab}${body}</div>`;
}

/** A writing area the layout script fills with lines / checkboxes / dots / grid. */
export const fill = (kind = 'lines', { gap, style = '', round = false } = {}) =>
  `<div data-fill="${kind}"${gap ? ` data-gap="${gap}"` : ''}${round ? ' data-round="1"' : ''} style="${style}"></div>`;

/** Fixed number of checkbox rows (for "Top 3" style lists). */
export const checks = (n, { round = false } = {}) =>
  `<div style="flex:1;display:flex;flex-direction:column;min-height:0">${Array.from({ length: n }, () => `<i class="ck"><b class="cb${round ? ' round' : ''}"></b></i>`).join('')}</div>`;

export function charImg(ch, { height = '5rem', cls = '', style = '' } = {}) {
  if (!ch) return '';
  return `<img class="char ${cls}" src="${ch.uri}" alt="${esc(ch.name)}" style="height:${height};${style}">`;
}

/** Rotates through the crew deterministically so pages feel varied. */
export const pickChar = (ctx, n = ctx.pageIndex) => ctx.art.characters[((n % ctx.art.characters.length) + ctx.art.characters.length) % ctx.art.characters.length];
export const pickFlower = (ctx, n = ctx.pageIndex) => (ctx.art.flowers.length ? ctx.art.flowers[n % ctx.art.flowers.length] : null);

export function flowerImg(fl, { height = '3rem', cls = '', style = '' } = {}) {
  if (!fl) return '';
  return `<img class="char ${cls}" src="${fl.uri}" alt="" style="height:${height};${style}">`;
}

const MOOD_KEYS = ['radiant', 'happy', 'calm', 'meh', 'sad', 'stressed'];
/** Small vector star-face for mood trackers. */
export function moodFace(cfg, i, size = '1.6rem') {
  const color = cfg.moodColors[i % cfg.moodColors.length];
  const inner = characterMarkup({ species: 'star', color }, { mood: MOOD_KEYS[i % MOOD_KEYS.length], ink: cfg.colors.ink, blush: cfg.colors.blush });
  return `<svg viewBox="-2 -2 104 104" width="${size}" height="${size}" style="flex:none">${inner}</svg>`;
}

export function waterDrop(size = '1.2rem') {
  return `<svg viewBox="0 0 20 26" width="${size}" height="${size}" style="flex:none"><path d="M10 1.5 C10 1.5 2 11 2 16.5 a8 8 0 0 0 16 0 C18 11 10 1.5 10 1.5Z" fill="#fff" stroke="var(--sky)" stroke-width="1.6"/><path d="M6 16 a4 4 0 0 0 3 4" fill="none" stroke="var(--sky)" stroke-width="1.3" stroke-linecap="round"/></svg>`;
}

export const arrowL = '&#8249;';
export const arrowR = '&#8250;';
