# Cosmic Bloom Planner

A Node.js generator for a fully hyperlinked digital planner PDF: cute alien crew, space flowers, soft nebula washes, and plenty of clean writing space. It's built for GoodNotes, Notability and Noteshelf, and it prints well too.

The pages are HTML/CSS templates. Playwright's Chromium renders them to PDF, and `pdf-lib` then post-processes the file: it hardens the links, adds a bookmark outline and shrinks the file.

## Quick start

```bash
npm install
npm run setup        # downloads the Chromium build Playwright needs (once)
npm run sample       # ~80-page January sample -> output/sample/
npm run build        # full planners -> output/
```

`npm run build` uses `planner.config.json` and writes every size × variant listed there. By default that's four files:

| File | Pages | Links | Size |
|---|---|---|---|
| `cosmic-bloom-2026-dated-letter.pdf` | 554 | 17,585 | 15.1 MB |
| `cosmic-bloom-2026-dated-a5.pdf` | 554 | 17,585 | 13.4 MB |
| `cosmic-bloom-undated-letter.pdf` | 575 | 14,018 | 14.8 MB |
| `cosmic-bloom-undated-a5.pdf` | 575 | 14,018 | 13.2 MB |

Each full build takes about a minute per file.

## What's inside

| Section | Pages |
|---|---|
| Cover | Night-sky cover with the crew, title and a "belongs to" line |
| Welcome | Meet-the-crew cards plus how-to-use tips |
| Mission Control | Dashboard tiles linking to every section, a month grid, word of the year |
| Year | Year at a Glance (12 mini calendars, every date clickable) and a Year Plan |
| Goals | Dreams & Goals by life area, a Vision Board, and Goal Launchpad planners |
| Habits | Habit Galaxy (habit of the year, 12×31) and a monthly habit tracker for each month |
| Calendar | Each month: a calendar, then a 2-page weekly spread per week and a daily page per day, in date order |
| Wellness | Self-Care Constellation menu, weekly Wellness Check-Ins, Gratitude Garden |
| Notes | Notes index, lined pages, dot-grid pages, and 12 journal prompts each with its own page |
| Fun | Space Garden (one petal per day), Moods in Orbit (year in pixels), Bucket List, Reads & Watches, Doodle page, 2 sticker sheets |

**Navigation:** every page has section tabs across the top and 12 month tabs down the right edge. The active tab is highlighted.

- On a monthly page, tap a date to open that day, or a `W#` to open that week.
- Weekly pages have a 7-day strip that links to each daily page.
- Daily and weekly pages have ‹ › buttons for the previous/next day or week, plus links back to the week and month.
- The year overview, habit trackers, garden and mood pages also link to their months and days.

**Undated variant:** months are named "Month 01–12" with a write-in line. Each month has 5 weekly spreads and 31 daily pages, and a "Jump to a day" strip on the month page links to them.

## Configuration

Edit `planner.config.json`, or create a small override file that `extends` it (see `configs/`):

```json
{ "extends": "../planner.config.json", "year": 2027, "sizes": ["a4"], "variants": ["dated"] }
```

| Key | What it does |
|---|---|
| `title`, `subtitle`, `tagline`, `owner`, `author` | Cover text and PDF metadata |
| `year`, `startMonth`, `months` | Date range. For example, `startMonth: 8, months: 12` gives an Aug–Jul academic planner. 1–24 months are supported |
| `weekStart` | `"monday"` (ISO week numbers) or `"sunday"` (US week numbers) |
| `locale` | Month and weekday names via `Intl` (e.g. `"fr-FR"`). You can override them in `labels.monthNames` etc. |
| `variants` | `["dated", "undated"]` |
| `sizes` | Any keys of `pageSizes`. Letter, A4 and A5 are built in |
| `pageSizes.<size>` | `width`, `height`, `baseFont` (everything scales from this) and `lineGap` (writing-line spacing) |
| `sections.*` | Turn any section off. Links fall back sensibly: with `daily: false`, calendar dates open the weekly spread instead |
| `counts.*` | How many goal planners, check-ins, gratitude pages, notes pages, dot-grid pages and habit columns to include |
| `daily` | `startHour`, `endHour`, `clock` (`"12h"`/`"24h"`) for the daily schedule |
| `undated` | `weeksPerMonth`, `daysPerMonth` |
| `decor` | `nebulaBackground` (the soft page wash; set `false` for print-friendly white pages) |
| `colors` | The whole palette. `ink` is the text color, `paper` the page, `line` the writing lines |
| `fonts` | `display`, `body`, `script`. Fredoka, Nunito and Caveat are bundled and work offline |
| `characters` | The crew: `id`, `name`, `image` (file name in `assets/charachters`), `color`, `tagline` |
| `moodColors` | Colors for the six mood star-faces |
| `labels` | Every visible string: tab names, page titles, life areas, moods, affirmations, journal prompts |
| `output` | `dir`, `filename` pattern (`{slug} {yearLabel} {variant} {size}`), `keepHtml` |
| `pdf` | `explicitDestinations`, `outline` |

Included variant configs:
- `configs/sample.json`: January only, small counts. This is the fast check.
- `configs/academic-a4.json`: Aug–Jul, Sunday start, A4.
- `configs/print-friendly.json`: white pages, no daily pages.

### CLI

```bash
node src/cli.js --config configs/academic-a4.json
node src/cli.js --size a5 --variant undated
node src/cli.js --year 2027
node src/cli.js --html-only          # just write build/*.html for browser preview
```

## Characters & artwork

Put character art in `assets/charachters/`. `npm run prepare-art` runs automatically before a build whenever those files change, and writes clean transparent PNGs to `assets/processed/`.

The supplied JPGs have a fake transparency checkerboard baked in. JPEG has no alpha channel, and the grid drifts across each image, so the tool doesn't predict tile positions. It detects the checkerboard by its texture: light, unsaturated pixels with sharp edges in both directions. It then flood-fills from the edges, also catches enclosed gaps (for example between an arm and the body), and softens antenna glows so no squares show through.

Real transparent PNGs are used as-is.

`spaceflowers.jpg` is treated as a sticker sheet and split into individual flowers automatically.

**To add or swap a character:** drop the image into `assets/charachters/` and add an entry to `characters` in the config (`"image"` is the file name without the extension). `ssy.jpg` is configured as "Sky". Rename it in the config if you prefer.

`npm run stickers` builds a GoodNotes/Notability sticker pack in `output/stickers/`:
- the crew and flower cutouts as PNGs
- vector extras (mood star-faces, planets, moon, flowers) as SVG and PNG
- a contact sheet for previewing everything

## How the PDF is made

1. `src/model.js` builds the calendar (UTC, timezone-proof) and the ordered page list. Each page has a stable id such as `d-2026-03-17`, `w-2026-03-16`, `m-2026-03` or `goals`.
2. `src/pages/*.js` render each page kind to an HTML `<section class="page">`. Every link is a plain `<a href="#id">`.
3. A small in-page script measures each writing area and fills it with exactly as many lines, checkboxes or dots as fit at the configured `lineGap`. Areas always end cleanly and never overflow.
4. Chromium prints to PDF at the CSS page size.
5. `src/pdf.js` post-processes the file:
   - **Links:** named destinations become explicit `[page /Fit]` destinations, the most compatible form across GoodNotes, Notability, Preview and Acrobat.
   - **Outline:** adds a bookmark outline (sections, months, goal/check-in pages).
   - **File size:** merges Chromium's over-segmented rounded corners back into single arcs (each merge is checked to stay within 0.03 pt), rounds coordinates to 0.01 pt, and recompresses. This cut the Letter build from 43 MB to 15 MB with no visible change. About 5.5 MB of what's left is the character artwork.
   - **Page count check:** fails the build if any template overflowed onto an extra page.

Images are embedded once and shared by every page. The nebula wash is one small JPEG for the same reason.

## Testing

```bash
npm test                         # builds the sample, then verifies it
npm run verify                   # verifies every PDF in output/
node src/verify.js path/to/file.pdf
```

`verify` checks every PDF it's given:
- every internal link points at a real page
- every page has navigation links
- no named destinations are left over
- it also reports page size, link count, image weight, outline presence, and any pages nothing links to

It exits non-zero on failure.

**Visual checks without a PDF app:**

```bash
npm run html                                          # build/*.html, opens in any browser
node tools/preview.js build/<file>.html m-2026-03 d-2026-03-17     # screenshot pages from the HTML
node tools/render-pdf.js output/<file>.pdf 1,12,30 --scale 2       # render the real PDF via pdf.js
```

`render-pdf` also prints the page each link on a page resolves to. That's an independent check of the link table using a second PDF engine.

To rule out the size optimization when chasing a rendering issue, build with `PLANNER_COMPACT=none` and compare. The optimization is transform-aware: it only touches path coordinates, never matrices or text. A pixel diff of all 80 sample pages against an unoptimized build shows only sub-pixel antialiasing differences.

**Manual checklist on a tablet:**
1. Import into GoodNotes (Files → Import) and into Notability.
2. Tap each top tab and a few side month tabs.
3. On a monthly page, tap a date and a `W#`.
4. On a daily page, tap ‹ › and the Week/Month pills.
5. Open the outline / bookmarks panel and jump to a month.
6. Write in a few lined areas and the habit tracker to check the spacing feels right. Adjust `pageSizes.*.lineGap` if not.
7. In GoodNotes, links respond to a finger tap (or with the pen tool off). This is normal GoodNotes behavior.

**Print check:** print a monthly and a daily page at 100% / "actual size" on the matching paper. Content keeps a ≥ 0.3 in margin. The tabs reach the page edge by design; printers that can't print edge-to-edge will clip them slightly.

## Deploying (Netlify)

`npm run build` is deploy-ready:
- `prebuild` downloads Playwright's headless Chromium (`playwright install chromium --only-shell`). If it's already there, this is a no-op.
- The PDFs render, then `postbuild` (`tools/site.js`) assembles `dist/`: every PDF plus an `index.html` download page with a cover thumbnail for each.

The included `netlify.toml` publishes `dist/` and stores Chromium inside `node_modules` (`PLAYWRIGHT_BROWSERS_PATH=0`), so Netlify's dependency cache keeps it between deploys.

You can tune the build from **Site settings → Environment variables** without touching code:

| Variable | Example | Effect |
|---|---|---|
| `PLANNER_SIZES` | `letter` | Only build these sizes |
| `PLANNER_VARIANTS` | `dated` | Only build these variants |
| `PLANNER_CONFIG` | `configs/academic-a4.json` | Use a different config |
| `PLANNER_JOBS` | `2` | PDFs rendered in parallel (each needs ~1–2 GB RAM) |

Locally, the four default planners take about 2–3 minutes with 2 parallel jobs. Netlify's builders are slower, so if a deploy nears the build time limit, set `PLANNER_SIZES`/`PLANNER_VARIANTS` to build fewer files.

## Project layout

```
planner.config.json      main config        configs/          variant configs
assets/charachters/      source art         assets/processed/ generated cutouts (+ manifest.json)
src/cli.js               build entry        src/model.js      calendar + page list + link resolution
src/pages/*.js           page templates     src/render/       shared components, styles, fonts, HTML assembly
src/art/                 vector decor, mood faces, image loading, nebula wash
src/pdf.js               Chromium render + pdf-lib post-processing
src/verify.js            PDF link checker   src/stickers.js   sticker pack export
tools/                   prepare-art, preview, render-pdf, contact sheets
```

## Notes & limits

- Fonts are embedded and subset, so the PDF looks the same everywhere. Custom font names that aren't bundled fall back to system fonts.
- In HTML previews, page breaks are simulated with margins. The PDF is always exact.
- Planners longer than 12 months (up to 24) shrink the side tabs to fit; above ~18 months they get small, so 12 is the sweet spot.
#   d i g i t a l p l a n n e r t e m p l a t e s  
 