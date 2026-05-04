import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const markSvg = readFileSync('public/brand/logo-mark.svg');
const horizontalSloganSvg = readFileSync('public/brand/logo-horizontal-slogan.svg');

function ensureDir(p) {
  mkdirSync(dirname(p), { recursive: true });
}

// Square PWA / Apple icons — owl on light NAJAH background, with padding
async function squareIcon(size, outPath) {
  const padding = Math.round(size * 0.125);
  const inner = size - padding * 2;
  const owl = await sharp(markSvg).resize(inner, inner, { fit: 'contain', background: { r: 230, g: 244, b: 250, alpha: 1 } }).png().toBuffer();
  const buf = await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 230, g: 244, b: 250, alpha: 1 } },
  })
    .composite([{ input: owl, gravity: 'center' }])
    .png()
    .toBuffer();
  ensureDir(outPath);
  writeFileSync(outPath, buf);
  console.log(`wrote ${outPath} (${buf.length} bytes)`);
}

await squareIcon(180, 'src/app/apple-icon.png');
await squareIcon(192, 'src/app/icon-192.png');
await squareIcon(512, 'src/app/icon-512.png');

// OG image — 1200×630 with horizontal-slogan logo centered on NAJAH bg
const ogBg = await sharp({
  create: { width: 1200, height: 630, channels: 4, background: { r: 230, g: 244, b: 250, alpha: 1 } },
}).png().toBuffer();
const ogLogo = await sharp(horizontalSloganSvg).resize({ width: 720 }).png().toBuffer();
const og = await sharp(ogBg).composite([{ input: ogLogo, gravity: 'center' }]).png().toBuffer();
writeFileSync('src/app/opengraph-image.png', og);
writeFileSync('src/app/twitter-image.png', og);
console.log(`wrote src/app/opengraph-image.png (${og.length} bytes)`);
console.log(`wrote src/app/twitter-image.png (${og.length} bytes)`);

// Favicon ICO — 32×32 PNG renamed (browsers accept this)
const ico = await sharp(markSvg).resize(32, 32).png().toBuffer();
writeFileSync('src/app/favicon.ico', ico);
console.log(`wrote src/app/favicon.ico (${ico.length} bytes)`);
