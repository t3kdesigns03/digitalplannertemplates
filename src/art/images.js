// Loads the processed character + flower artwork (see tools/prepare-art.js)
// as data URIs. Each image is resized once and the same URI string is reused on
// every page, so Chromium embeds it in the PDF only once.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { nebulaBackground } from './background.js';
import { galacticSky } from './galactic.js';

const ROOT = path.resolve('assets/processed');

export async function loadArt(cfg, { maxHeight = 760 } = {}) {
  const manifestPath = path.join(ROOT, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Processed artwork not found. Run `npm run prepare-art` first (it cuts the characters out of assets/charachters).');
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const encode = async (file) => {
    const buf = await sharp(path.join(ROOT, file))
      .resize({ height: maxHeight, withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer();
    const meta = await sharp(buf).metadata();
    return { uri: `data:image/png;base64,${buf.toString('base64')}`, w: meta.width, h: meta.height };
  };

  const byId = Object.fromEntries(manifest.characters.map((c) => [c.id, c]));
  const characters = [];
  for (const ch of cfg.characters) {
    const entry = byId[ch.image ?? ch.id];
    if (!entry) throw new Error(`Character "${ch.name}" points at image "${ch.image}", which is not in ${manifestPath}`);
    characters.push({ ...ch, ...(await encode(entry.file)) });
  }
  const flowers = [];
  for (const fl of manifest.flowers) flowers.push({ ...fl, ...(await encode(fl.file)) });
  const nebula = cfg.decor.nebulaBackground ? await nebulaBackground(cfg) : null;
  const coverSky = cfg.styleDef.cover === 'galactic' ? await galacticSky(cfg) : null;
  return { characters, flowers, nebula, coverSky };
}
