// Embeds the bundled @fontsource fonts as base64 so the PDF render never needs
// the network. Chromium subsets them when it writes the PDF.
import fs from 'node:fs';
import path from 'node:path';

const FONTS = {
  Fredoka: { pkg: 'fredoka', weights: [400, 500, 600, 700] },
  Nunito: { pkg: 'nunito', weights: [400, 600, 700, 800] },
  Caveat: { pkg: 'caveat', weights: [500, 700] },
  'Cormorant Garamond': { pkg: 'cormorant-garamond', weights: [500, 600] },
};

export function fontFaceCss(cfg) {
  const wanted = new Set([...Object.values(cfg.fonts), ...(cfg.styleDef?.extraFonts ?? [])]);
  let css = '';
  for (const family of wanted) {
    const spec = FONTS[family];
    if (!spec) continue; // any other family falls back to system fonts
    for (const w of spec.weights) {
      const file = path.resolve('node_modules', '@fontsource', spec.pkg, 'files', `${spec.pkg}-latin-${w}-normal.woff2`);
      if (!fs.existsSync(file)) continue;
      const b64 = fs.readFileSync(file).toString('base64');
      css += `@font-face{font-family:"${family}";font-weight:${w};font-style:normal;src:url(data:font/woff2;base64,${b64}) format("woff2");}\n`;
    }
  }
  return css;
}
