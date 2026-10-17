// Print stylesheet. All geometry is in rem; the root font size comes from the
// page size config, so one layout scales cleanly across Letter / A4 / A5.

const rgb = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',');
};

export function stylesCss(cfg, sizeKey, { nebula } = {}) {
  const size = cfg.pageSizes[sizeKey];
  const C = cfg.colors;
  const F = cfg.fonts;
  const vars = Object.entries(C).map(([k, v]) => `--${k}:${v};--${k}-rgb:${rgb(v)};`).join('');

  return `
@page { size: ${size.width} ${size.height}; margin: 0; }
:root {
  ${vars}
  --line-gap: ${size.lineGap};
  --tab-h: 2.35rem;
  --side-w: 2.6rem;
  --m-left: 2.3rem;
  --m-bottom: 1.7rem;
  --radius: .9rem;
  --display: "${F.display}", "Nunito", "Segoe UI", sans-serif;
  --body: "${F.body}", "Segoe UI", sans-serif;
  --script: "${F.script}", "Segoe Print", cursive;
}
* { box-sizing: border-box; }
html { font-size: ${size.baseFont}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font-family: var(--body); color: var(--ink); background: #e9e4f0; }
a { color: inherit; text-decoration: none; }
.page {
  position: relative; width: ${size.width}; height: ${size.height}; overflow: hidden;
  background: var(--paper); break-after: page; page-break-after: always;
}
.page:last-child { break-after: auto; page-break-after: auto; }
@media screen { .page { margin: 16px auto; box-shadow: 0 2px 14px rgba(60,40,90,.18); } }
${nebula ? `.page.nebula { background: url(${nebula}) center / 100% 100% no-repeat, var(--paper); }` : ''}

/* ---------- navigation ---------- */
.toptabs {
  position: absolute; top: 0; left: var(--m-left); right: calc(var(--side-w) + .9rem);
  height: var(--tab-h); display: flex; gap: .28rem; z-index: 5;
}
.toptabs a {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: .3rem;
  border-radius: 0 0 .75rem .75rem; height: calc(var(--tab-h) - .35rem);
  background: rgba(var(--c-rgb), .32); color: var(--ink);
  font: 600 .8rem/1 var(--display); letter-spacing: .02em;
}
.toptabs a.on { height: var(--tab-h); background: rgb(var(--c-rgb)); box-shadow: inset 0 -.18rem 0 rgba(var(--ink-rgb), .18); }
.toptabs a svg { width: .75rem; height: .75rem; }
.sidetabs {
  position: absolute; right: 0; top: calc(var(--tab-h) + .7rem); bottom: 1.3rem; width: var(--side-w);
  display: flex; flex-direction: column; gap: .24rem; z-index: 5;
}
.sidetabs a {
  flex: 0 0 calc((100% - (var(--tabs, 12) - 1) * .24rem) / var(--tabs, 12)); display: flex; align-items: center; justify-content: center;
  border-radius: .75rem 0 0 .75rem; background: rgba(var(--c-rgb), .34); color: var(--ink);
  font: 600 .72rem/1 var(--display); letter-spacing: .04em; text-transform: uppercase;
  margin-left: .35rem;
}
.sidetabs a.on { margin-left: 0; background: rgb(var(--c-rgb)); box-shadow: inset .18rem 0 0 rgba(var(--ink-rgb), .2); }

/* ---------- content frame ---------- */
.content {
  position: absolute; top: calc(var(--tab-h) + .95rem); left: var(--m-left);
  right: calc(var(--side-w) + 1.05rem); bottom: var(--m-bottom);
  display: flex; flex-direction: column; gap: .75rem; z-index: 2;
}
.row { display: flex; gap: .75rem; min-height: 0; }
.col { display: flex; flex-direction: column; gap: .75rem; min-height: 0; min-width: 0; }
.grow { flex: 1 1 0; min-height: 0; min-width: 0; }
.decor { position: absolute; pointer-events: none; z-index: 1; }
.decor svg, svg.decor { overflow: visible; }

/* page header */
.ph { display: flex; align-items: flex-end; gap: .8rem; min-height: 4.2rem; position: relative; }
.ph .titles { flex: 1; min-width: 0; }
.ph .kicker { font: 600 1.35rem/1 var(--script); color: var(--inkSoft); margin-bottom: .1rem; }
.ph .title { font: 600 2.5rem/1.02 var(--display); color: var(--ink); letter-spacing: -.01em; }
.ph .title small { font-size: .5em; font-weight: 500; color: var(--inkSoft); margin-left: .35rem; letter-spacing: 0; }
.ph .actions { display: flex; gap: .35rem; flex-wrap: wrap; justify-content: flex-end; align-items: flex-end; }
.ph .mascot { height: 5.2rem; width: auto; margin: -1rem -.2rem -.3rem 0; }

/* pills / buttons */
.pill {
  display: inline-flex; align-items: center; justify-content: center; gap: .25rem;
  min-height: 1.75rem; padding: .3rem .75rem; border-radius: .9rem;
  background: rgba(var(--c-rgb, var(--lavender-rgb)), .35); color: var(--ink);
  font: 600 .75rem/1 var(--display); white-space: nowrap;
}
.pill.solid { background: rgb(var(--c-rgb, var(--lavender-rgb))); }
.pill.ghost { background: transparent; border: 1.3px solid color-mix(in srgb, rgb(var(--ink-rgb)) 25%, #fff); }

/* boxes */
.box {
  position: relative; display: flex; flex-direction: column; min-height: 0; min-width: 0;
  background: var(--writing); border: 1.4px solid color-mix(in srgb, rgb(var(--c-rgb, var(--lavender-rgb))) 70%, #fff);
  border-radius: var(--radius); padding: .55rem .75rem .6rem;
}
.box.soft { background: rgba(var(--c-rgb, var(--lavender-rgb)), .12); }
.box.plain { border-color: transparent; background: transparent; padding: 0; }
.label {
  display: flex; align-items: center; gap: .35rem; flex: none;
  font: 700 .74rem/1.2 var(--display); text-transform: uppercase; letter-spacing: .08em; color: var(--ink);
  margin-bottom: .3rem;
}
.label::before {
  content: ""; width: .55rem; height: .55rem; border-radius: 50%; flex: none;
  background: rgb(var(--c-rgb, var(--lavender-rgb)));
}
.label .hint { font: 500 .95rem/1 var(--script); text-transform: none; letter-spacing: 0; color: var(--inkSoft); margin-left: auto; }

/* fillable writing areas (populated by the layout script) */
[data-fill] { flex: 1 1 0; min-height: 0; position: relative; display: flex; flex-direction: column; }
.ln { flex: 1; border-bottom: 1px solid var(--line); }
.ck { flex: 1; display: flex; align-items: center; gap: .5rem; border-bottom: 1px solid var(--line); }
.cb {
  width: .95rem; height: .95rem; flex: none; border-radius: .28rem;
  border: 1.3px solid color-mix(in srgb, rgb(var(--ink-rgb)) 45%, #fff); background: var(--writing);
}
.cb.round { border-radius: 50%; }
.fill-svg { position: absolute; inset: 0; width: 100%; height: 100%; }

/* small calendar */
.mini { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font: 600 .66rem/1 var(--display); }
.mini .dh { color: var(--inkSoft); font-weight: 500; padding: .15rem 0; }
.mini a, .mini span { padding: .22rem 0; border-radius: .35rem; }
.mini a:not(.off) { color: var(--ink); }
.mini .off { color: rgba(var(--ink-rgb), .25); }
.mini .wk { background: rgba(var(--c-rgb, var(--lavender-rgb)), .35); }

/* misc */
.script { font-family: var(--script); }
.muted { color: var(--inkSoft); }
.center { text-align: center; }
.field { display: flex; align-items: flex-end; gap: .5rem; font: 700 .74rem/1.2 var(--display); text-transform: uppercase; letter-spacing: .08em; }
.field i { flex: 1; border-bottom: 1.2px solid var(--line); height: 1.5rem; }
.write-line { border-bottom: 1.2px solid var(--line); min-height: 1.6rem; flex: 1; }
.chip { display: inline-flex; align-items: center; justify-content: center; border-radius: .45rem; font: 700 .7rem/1 var(--display); }
img.char { display: block; height: auto; }
`;
}
