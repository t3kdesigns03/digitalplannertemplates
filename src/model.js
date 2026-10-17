// Calendar model + ordered page list. Everything is computed in UTC so the
// output never depends on the machine's timezone.

const DAY = 86400000;
const pad = (n) => String(n).padStart(2, '0');
export const dateKey = (t) => {
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};
const utc = (y, m, d) => Date.UTC(y, m, d);
const dow = (t) => new Date(t).getUTCDay();

function weekStartOnOrBefore(t, weekStart) {
  const offset = weekStart === 'monday' ? (dow(t) + 6) % 7 : dow(t);
  return t - offset * DAY;
}

function weekNumber(start, weekStart) {
  if (weekStart === 'monday') {
    const thursday = start + 3 * DAY;
    const y = new Date(thursday).getUTCFullYear();
    return Math.round((start - weekStartOnOrBefore(utc(y, 0, 4), 'monday')) / (7 * DAY)) + 1;
  }
  const y = new Date(start + 6 * DAY).getUTCFullYear();
  return Math.round((start - weekStartOnOrBefore(utc(y, 0, 1), 'sunday')) / (7 * DAY)) + 1;
}

/** Day-of-week indexes (0=Sun) in display order for the configured week start. */
export const weekOrder = (weekStart) => (weekStart === 'monday' ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6]);

export const SECTION_IDS = {
  cover: 'cover',
  welcome: 'welcome',
  home: 'home',
  year: 'year',
  yearPlan: 'year-plan',
  habits: 'habits',
  goals: 'goals',
  vision: 'vision',
  wellness: 'wellness',
  notes: 'notes',
  journal: 'journal',
  fun: 'fun',
  garden: 'garden',
  mood: 'mood',
  bucket: 'bucket',
  reads: 'reads',
  doodle: 'doodle',
  stickers: 'stickers',
};

function buildDated(cfg) {
  const { labels } = cfg;
  const start = utc(cfg.year, cfg.startMonth - 1, 1);
  const end = utc(cfg.year, cfg.startMonth - 1 + cfg.months, 1) - DAY;

  const months = [];
  for (let i = 0; i < cfg.months; i++) {
    const first = utc(cfg.year, cfg.startMonth - 1 + i, 1);
    const d = new Date(first);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const key = `${y}-${pad(m + 1)}`;
    months.push({
      key, y, m, index: i,
      id: `m-${key}`,
      habitId: `mh-${key}`,
      name: labels.monthNames[m],
      short: labels.monthShort[m],
      tab: labels.monthShort[m].slice(0, 3),
      daysInMonth: new Date(utc(y, m + 1, 0)).getUTCDate(),
      first,
      days: [],
    });
  }
  const monthByKey = Object.fromEntries(months.map((mo) => [mo.key, mo]));

  const days = [];
  const dayByKey = {};
  for (let t = start; t <= end; t += DAY) {
    const d = new Date(t);
    const key = dateKey(t);
    const day = {
      key, t, id: `d-${key}`,
      y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), dow: d.getUTCDay(),
      monthKey: key.slice(0, 7),
    };
    days.push(day);
    dayByKey[key] = day;
    monthByKey[day.monthKey].days.push(day);
  }

  const weeks = [];
  for (let ws = weekStartOnOrBefore(start, cfg.weekStart); ws <= end; ws += 7 * DAY) {
    const wdays = Array.from({ length: 7 }, (_, i) => {
      const t = ws + i * DAY;
      const key = dateKey(t);
      const d = new Date(t);
      return { key, t, d: d.getUTCDate(), m: d.getUTCMonth(), dow: d.getUTCDay(), inRange: !!dayByKey[key] };
    });
    const firstIn = wdays.find((x) => x.inRange);
    const key = dateKey(ws);
    const week = {
      id: `w-${key}`, id2: `w-${key}-b`, index: weeks.length,
      num: weekNumber(ws, cfg.weekStart), start: ws, days: wdays,
      monthKey: firstIn.key.slice(0, 7),
    };
    weeks.push(week);
    for (const wd of wdays) if (wd.inRange) dayByKey[wd.key].weekId = week.id;
  }
  for (const mo of months) mo.weeks = weeks.filter((w) => w.days.some((x) => x.inRange && x.key.startsWith(mo.key)));

  return { months, monthByKey, days, dayByKey, weeks };
}

function buildUndated(cfg) {
  const months = [];
  const days = [];
  const dayByKey = {};
  const weeks = [];
  for (let i = 0; i < 12; i++) {
    const key = `u${pad(i + 1)}`;
    const mo = {
      key, index: i, undated: true,
      id: `m-${key}`, habitId: `mh-${key}`,
      name: `Month ${pad(i + 1)}`, short: pad(i + 1), tab: pad(i + 1),
      daysInMonth: cfg.undated.daysPerMonth || 31,
      days: [], weeks: [],
    };
    for (let w = 1; w <= cfg.undated.weeksPerMonth; w++) {
      const week = { id: `w-${key}-${w}`, id2: `w-${key}-${w}-b`, index: weeks.length, num: w, monthKey: key, undated: true };
      weeks.push(week);
      mo.weeks.push(week);
    }
    for (let d = 1; d <= cfg.undated.daysPerMonth; d++) {
      const dk = `${key}-${pad(d)}`;
      const day = { key: dk, id: `d-${dk}`, d, monthKey: key, undated: true };
      days.push(day);
      dayByKey[dk] = day;
      mo.days.push(day);
    }
    months.push(mo);
  }
  return { months, monthByKey: Object.fromEntries(months.map((m) => [m.key, m])), days, dayByKey, weeks };
}

export function buildModel(cfg, variant) {
  const cal = variant === 'dated' ? buildDated(cfg) : buildUndated(cfg);
  const S = cfg.sections;
  const C = cfg.counts;

  // Link resolution with graceful fallbacks when a section is switched off.
  const has = new Set();
  const href = (id) => (has.has(id) ? `#${id}` : null);
  const monthHref = (mk) => href(cal.monthByKey[mk]?.id) ?? href(SECTION_IDS.year) ?? href(SECTION_IDS.home);
  const weekHref = (week) => href(week.id) ?? monthHref(week.monthKey);
  const dayHref = (key) => {
    const day = cal.dayByKey[key];
    if (!day) return null;
    if (has.has(day.id)) return `#${day.id}`;
    const week = cal.weeks.find((w) => w.id === day.weekId);
    return week && has.has(week.id) ? `#${week.id}` : monthHref(day.monthKey);
  };

  const pages = [];
  const add = (kind, id, section, extra = {}) => {
    pages.push({ kind, id, section, ...extra });
    has.add(id);
  };
  const ids = SECTION_IDS;

  if (S.cover) add('cover', ids.cover, 'home');
  if (S.welcome) add('welcome', ids.welcome, 'home');
  if (S.dashboard) add('dashboard', ids.home, 'home');
  if (S.yearOverview) add('yearOverview', ids.year, 'year');
  if (S.yearPlan) add('yearPlan', ids.yearPlan, 'year');

  if (S.goals) {
    add('goals', ids.goals, 'goals');
    add('vision', ids.vision, 'goals');
    for (let i = 1; i <= C.goalPlanners; i++) add('goalPlanner', `goal-${i}`, 'goals', { n: i });
  }
  if (S.habits) add('habitsYear', ids.habits, 'habits');

  // Calendar block: month, its habit tracker, then weekly spreads + daily pages
  // in chronological order.
  for (const mo of cal.months) {
    if (S.monthly) add('month', mo.id, 'calendar', { monthKey: mo.key, month: mo });
    if (S.monthlyHabits) add('monthHabits', mo.habitId, 'habits', { monthKey: mo.key, month: mo });
    if (variant === 'dated') {
      for (const day of mo.days) {
        const week = cal.weeks.find((w) => w.id === day.weekId);
        const firstOfWeek = week.days.find((x) => x.inRange).key === day.key;
        if (S.weekly && firstOfWeek) {
          add('weekA', week.id, 'calendar', { monthKey: week.monthKey, week });
          add('weekB', week.id2, 'calendar', { monthKey: week.monthKey, week });
        }
        if (S.daily) add('day', day.id, 'calendar', { monthKey: mo.key, day });
      }
    } else {
      if (S.weekly) {
        for (const week of mo.weeks) {
          add('weekA', week.id, 'calendar', { monthKey: mo.key, week });
          add('weekB', week.id2, 'calendar', { monthKey: mo.key, week });
        }
      }
      if (S.daily) for (const day of mo.days) add('day', day.id, 'calendar', { monthKey: mo.key, day });
    }
  }

  if (S.wellness) {
    add('wellness', ids.wellness, 'wellness');
    for (let i = 1; i <= C.wellnessCheckins; i++) add('checkin', `checkin-${i}`, 'wellness', { n: i });
    for (let i = 1; i <= C.gratitudePages; i++) add('gratitude', `gratitude-${i}`, 'wellness', { n: i });
  }
  if (S.notes) {
    add('notesIndex', ids.notes, 'notes');
    for (let i = 1; i <= C.notesPages; i++) add('notePage', `note-${i}`, 'notes', { n: i });
    for (let i = 1; i <= C.dotGridPages; i++) add('dotPage', `dot-${i}`, 'notes', { n: i });
  }
  if (S.journal) {
    add('journalIndex', ids.journal, 'notes');
    cfg.labels.journalPrompts.forEach((prompt, i) => add('journalPage', `journal-${i + 1}`, 'notes', { n: i + 1, prompt }));
  }
  if (S.fun) {
    add('fun', ids.fun, 'fun');
    add('garden', ids.garden, 'fun');
    add('mood', ids.mood, 'fun');
    add('bucket', ids.bucket, 'fun');
    add('reads', ids.reads, 'fun');
    add('doodle', ids.doodle, 'fun');
  }
  if (S.stickers) {
    add('stickers', ids.stickers, 'fun', { sheet: 1 });
    add('stickers', `${ids.stickers}-2`, 'fun', { sheet: 2 });
  }

  // Previous/next links within a run of same-kind pages (days, weeks, notes...).
  const byKind = {};
  for (const p of pages) (byKind[p.kind] ??= []).push(p);

  const sectionHref = {
    home: href(ids.home) ?? href(ids.cover),
    year: href(ids.year) ?? href(ids.yearPlan),
    goals: href(ids.goals),
    habits: href(ids.habits) ?? (cal.months[0] && href(cal.months[0].habitId)),
    wellness: href(ids.wellness),
    notes: href(ids.notes) ?? href(ids.journal),
    fun: href(ids.fun) ?? href(ids.stickers),
  };

  return { variant, ...cal, pages, byKind, has, href, monthHref, weekHref, dayHref, sectionHref };
}
