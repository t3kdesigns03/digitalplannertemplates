// The soft "nebula" page wash. Rendered once to a small JPEG from the config
// colours and reused on every page (Chromium embeds it once). CSS radial
// gradients would be re-emitted per page, and at some page sizes Chromium
// rasterises each one separately.
import sharp from 'sharp';

export async function nebulaBackground(cfg) {
  const C = cfg.colors;
  const W = 600, H = 800;
  const blob = (id, color, opacity) => `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${opacity}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>${blob('a', C.pink, 0.17)}${blob('b', C.lavender, 0.22)}${blob('c', C.sky, 0.13)}</defs>
    <rect width="${W}" height="${H}" fill="${C.paper}"/>
    <ellipse cx="0" cy="0" rx="${W * 0.55}" ry="${H * 0.38}" fill="url(#a)"/>
    <ellipse cx="${W}" cy="${H}" rx="${W * 0.6}" ry="${H * 0.4}" fill="url(#b)"/>
    <ellipse cx="${W}" cy="0" rx="${W * 0.4}" ry="${H * 0.3}" fill="url(#c)"/>
  </svg>`;
  const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 90, chromaSubsampling: '4:4:4' }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}
