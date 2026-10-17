import * as calendar from './calendar.js';
import * as cover from './cover.js';
import * as overview from './overview.js';
import * as goals from './goals.js';
import * as wellness from './wellness.js';
import * as notes from './notes.js';
import * as fun from './fun.js';

const modules = [calendar, cover, overview, goals, wellness, notes, fun];

/** page.kind -> template function(ctx) => <section class="page"> HTML */
export const renderers = {
  cover: cover.cover,
  welcome: overview.welcome,
  dashboard: overview.dashboard,
  yearOverview: overview.yearOverview,
  yearPlan: overview.yearPlan,
  habitsYear: overview.habitsYear,
  month: calendar.month,
  monthHabits: calendar.monthHabits,
  weekA: calendar.weekA,
  weekB: calendar.weekB,
  day: calendar.day,
  goals: goals.goals,
  vision: goals.vision,
  goalPlanner: goals.goalPlanner,
  wellness: wellness.wellness,
  checkin: wellness.checkin,
  gratitude: wellness.gratitude,
  notesIndex: notes.notesIndex,
  notePage: notes.notePage,
  dotPage: notes.dotPage,
  journalIndex: notes.journalIndex,
  journalPage: notes.journalPage,
  fun: fun.fun,
  garden: fun.garden,
  mood: fun.mood,
  bucket: fun.bucket,
  reads: fun.reads,
  doodle: fun.doodle,
  stickers: fun.stickers,
};

export const pageCss = modules.map((m) => m.css ?? '').join('\n');
