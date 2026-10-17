import { fontFaceCss } from './fonts.js';
import { stylesCss } from './styles.js';
import { pageShell, header, esc } from './components.js';
import { renderers, pageCss } from '../pages/index.js';

// Runs inside Chromium after layout: measures every [data-fill] area and fills
// it with exactly as many lines / checkbox rows / dots as fit at --line-gap.
const FILL_SCRIPT = `
(() => {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;height:var(--line-gap);width:1px;visibility:hidden';
  document.body.appendChild(probe);
  const base = probe.getBoundingClientRect().height;
  probe.remove();
  const STAR = '<svg viewBox="0 0 20 20"><polygon points="10,1.5 12.6,7.2 18.6,7.6 14,11.6 15.4,17.6 10,14.4 4.6,17.6 6,11.6 1.4,7.6 7.4,7.2" fill="none" stroke="var(--inkSoft)" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  const els = [...document.querySelectorAll('[data-fill]')];
  const sizes = els.map((el) => { const r = el.getBoundingClientRect(); return [r.width, r.height]; });
  els.forEach((el, k) => {
    const [w, h] = sizes[k];
    const gap = base * (parseFloat(el.dataset.gap) || 1);
    const kind = el.dataset.fill;
    if (kind === 'lines' || kind === 'checks' || kind === 'rated') {
      const n = Math.max(1, Math.floor(h / gap));
      const row = kind === 'lines' ? '<i class="ln"></i>'
        : kind === 'rated' ? '<i class="ck rated"><b class="cb"></b><span class="sp"></span>' + STAR.repeat(5) + '</i>'
        : '<i class="ck"><b class="cb' + (el.dataset.round ? ' round' : '') + '"></b></i>';
      el.innerHTML = row.repeat(n);
    } else if (kind === 'dots' || kind === 'grid') {
      const cols = Math.floor(w / gap), rows = Math.floor(h / gap);
      const ox = (w - cols * gap) / 2, oy = (h - rows * gap) / 2;
      let s = '';
      if (kind === 'dots') {
        for (let y = 0; y <= rows; y++) for (let x = 0; x <= cols; x++) s += '<circle cx="' + (ox + x * gap).toFixed(2) + '" cy="' + (oy + y * gap).toFixed(2) + '" r="' + (gap * 0.055).toFixed(2) + '"/>';
        s = '<g fill="var(--dot)">' + s + '</g>';
      } else {
        let d = '';
        for (let x = 0; x <= cols; x++) d += 'M' + (ox + x * gap).toFixed(2) + ' ' + oy.toFixed(2) + 'v' + (rows * gap).toFixed(2);
        for (let y = 0; y <= rows; y++) d += 'M' + ox.toFixed(2) + ' ' + (oy + y * gap).toFixed(2) + 'h' + (cols * gap).toFixed(2);
        s = '<path d="' + d + '" fill="none" stroke="var(--line)" stroke-width="0.8"/>';
      }
      el.innerHTML = '<svg class="fill-svg" viewBox="0 0 ' + w.toFixed(2) + ' ' + h.toFixed(2) + '">' + s + '</svg>';
    }
  });
  document.documentElement.dataset.filled = '1';
})();
`;

export function buildHtml({ cfg, model, art, sizeKey }) {
  const pages = model.pages.map((page, pageIndex) => {
    const ctx = { cfg, model, art, page, pageIndex, sizeKey };
    const render = renderers[page.kind];
    if (!render) return pageShell(ctx, header({ title: esc(page.kind) }));
    return render(ctx);
  });
  return `<!doctype html>
<html lang="${esc((cfg.locale || 'en').split('-')[0])}">
<head>
<meta charset="utf-8">
<title>${esc(cfg.title)} ${esc(cfg.subtitle)} ${esc(cfg.yearLabel)}</title>
<style>${fontFaceCss(cfg)}</style>
<style>${stylesCss(cfg, sizeKey, { nebula: art.nebula })}${pageCss}</style>
</head>
<body>
${pages.join('\n')}
<script>document.fonts.ready.then(() => {${FILL_SCRIPT}});</script>
</body>
</html>`;
}
