// Visual styles. A style only changes the cover and the intensity of the soft
// page wash; every other template is shared. Select with `"style"` in
// planner.config.json or the PLANNER_STYLE env var.
//
// Reference art for each direction lives in assets/covers/<style>/.
export const STYLES = {
  soft: {
    label: 'Soft pastel',
    cover: 'soft', // src/pages/cover.js -> softCover (the original Cosmic Bloom cover)
    wash: 1, // multiplier for the nebula page-wash strength
    extraFonts: [],
  },
  'galactic-cute': {
    label: 'Galactic cute',
    cover: 'galactic', // src/pages/cover.js -> galacticCover
    wash: 1.45,
    washStars: true,
    extraFonts: ['Cormorant Garamond'], // elegant serif title, as in the concepts
  },
};

export const STYLE_ALIASES = { pastel: 'soft' };
export const DEFAULT_STYLE = 'soft';

export function resolveStyle(name) {
  const key = STYLE_ALIASES[name] ?? name ?? DEFAULT_STYLE;
  return STYLES[key] ? key : null;
}

/** True for a value that names several styles ("all" or "soft,galactic-cute"). */
export const isStyleList = (value) => value === 'all' || String(value ?? '').includes(',');

/** Expands "all" or a comma-separated list into style keys; throws on unknown names. */
export function expandStyles(value) {
  const names = value === 'all' ? Object.keys(STYLES) : String(value).split(',').map((s) => s.trim()).filter(Boolean);
  const keys = names.map((n) => {
    const key = resolveStyle(n);
    if (!key) throw new Error(`Unknown style "${n}" (available: ${Object.keys(STYLES).join(', ')}, or "all")`);
    return key;
  });
  return [...new Set(keys)];
}
