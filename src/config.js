import fs from 'node:fs';
import path from 'node:path';
import { STYLES, resolveStyle } from './styles.js';

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

export function deepMerge(base, over) {
  if (!isObj(base) || !isObj(over)) return over === undefined ? base : over;
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = isObj(v) && isObj(base[k]) ? deepMerge(base[k], v) : v;
  return out;
}

/** Loads a config file, resolving `extends` chains relative to each file. */
export function loadConfigFile(file) {
  const abs = path.resolve(file);
  const raw = JSON.parse(fs.readFileSync(abs, 'utf8'));
  if (!raw.extends) return raw;
  const parent = loadConfigFile(path.resolve(path.dirname(abs), raw.extends));
  const { extends: _ignored, ...rest } = raw;
  return deepMerge(parent, rest);
}

export function normalizeConfig(cfg) {
  const errors = [];
  if (!Number.isInteger(cfg.year)) errors.push('year must be an integer');
  if (!(cfg.startMonth >= 1 && cfg.startMonth <= 12)) errors.push('startMonth must be 1-12');
  if (!(cfg.months >= 1 && cfg.months <= 24)) errors.push('months must be 1-24');
  if (!['monday', 'sunday'].includes(cfg.weekStart)) errors.push('weekStart must be "monday" or "sunday"');
  for (const s of cfg.sizes) if (!cfg.pageSizes[s]) errors.push(`unknown size "${s}" (define it under pageSizes)`);
  for (const v of cfg.variants) if (!['dated', 'undated'].includes(v)) errors.push(`unknown variant "${v}"`);
  if (!cfg.characters?.length) errors.push('at least one character is required');
  const style = resolveStyle(cfg.style);
  if (!style) errors.push(`unknown style "${cfg.style}" (available: ${Object.keys(STYLES).join(', ')})`);
  if (errors.length) throw new Error('Invalid planner config:\n  - ' + errors.join('\n  - '));

  const locale = cfg.locale || 'en-US';
  const monthFmt = new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' });
  const monthShortFmt = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  const dayFmt = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' });
  const dayShortFmt = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  const labels = { ...cfg.labels };
  labels.monthNames ??= Array.from({ length: 12 }, (_, m) => monthFmt.format(Date.UTC(2026, m, 1)));
  labels.monthShort ??= Array.from({ length: 12 }, (_, m) => monthShortFmt.format(Date.UTC(2026, m, 1)).replace('.', ''));
  // 2026-01-04 is a Sunday, so index 0 = Sunday.
  labels.dayNames ??= Array.from({ length: 7 }, (_, d) => dayFmt.format(Date.UTC(2026, 0, 4 + d)));
  labels.dayShort ??= Array.from({ length: 7 }, (_, d) => dayShortFmt.format(Date.UTC(2026, 0, 4 + d)));

  const slug = String(cfg.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'planner';
  const endYear = new Date(Date.UTC(cfg.year, cfg.startMonth - 1 + cfg.months - 1, 1)).getUTCFullYear();
  const yearLabel = endYear === cfg.year ? String(cfg.year) : `${cfg.year}-${endYear}`;

  return { ...cfg, style, styleDef: STYLES[style], labels, slug, yearLabel, endYear };
}

export function resolveConfig({ configPath, overrides = {} }) {
  const defaults = loadConfigFile(path.resolve('planner.config.json'));
  const fromFile = configPath ? loadConfigFile(configPath) : {};
  // PLANNER_STYLE lets CI (e.g. Netlify) pick a style without editing files
  const env = process.env.PLANNER_STYLE ? { style: process.env.PLANNER_STYLE } : {};
  return normalizeConfig(deepMerge(deepMerge(deepMerge(defaults, fromFile), env), overrides));
}
