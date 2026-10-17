// Tiles preview PNGs into contact sheets: node tools/contact.js <dir> <cols> <outPrefix> [perSheet]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const [dir, colsArg = '4', prefix = 'build/contact', perArg = '8'] = process.argv.slice(2);
const cols = Number(colsArg), per = Number(perArg);
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
const tileW = 420;
for (let s = 0; s * per < files.length; s++) {
  const batch = files.slice(s * per, s * per + per);
  const imgs = await Promise.all(batch.map((f) => sharp(path.join(dir, f)).resize({ width: tileW }).toBuffer({ resolveWithObject: true })));
  const tileH = Math.max(...imgs.map((i) => i.info.height));
  const rows = Math.ceil(batch.length / cols);
  await sharp({ create: { width: cols * (tileW + 10) + 10, height: rows * (tileH + 10) + 10, channels: 3, background: '#d8d0e4' } })
    .composite(imgs.map((im, i) => ({ input: im.data, left: 10 + (i % cols) * (tileW + 10), top: 10 + Math.floor(i / cols) * (tileH + 10) })))
    .jpeg({ quality: 85 }).toFile(`${prefix}-${s + 1}.jpg`);
  console.log(`${prefix}-${s + 1}.jpg`, batch.map((f) => f.split('--')[1]).join(' '));
}
