// Generate the optimized multi-size PWA icon set from the master app icon
// (asset-manifest §1; deferred from M5, built in M6). Run with `npm run gen:icons`.
// Output PNGs are committed into public/icons/ as static assets, so the build and the
// GitHub Pages deploy need no image tooling — only (re)generation needs sharp.
//
//   icon-192 / icon-512      — manifest `any` (full-bleed squircle, resized)
//   icon-512-maskable        — manifest `maskable` (master inset on the bg color so
//                              Android's safe-area mask never clips the claw)
//   apple-touch-icon (180)   — iOS home screen (referenced from index.html)
//   favicon-32               — browser tab
//
// Master: public/icons/app-icon.jpg (1254×1254 black squircle + green claw).

import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'public', 'icons', 'app-icon.jpg');
const OUT = path.join(root, 'public', 'icons');
const BG = { r: 0x0b, g: 0x0b, b: 0x0c, alpha: 1 }; // tokens --bg / manifest background_color

/** Square resize, full-bleed (the master is already a centred squircle). */
async function square(size, name) {
  await sharp(SRC).resize(size, size, { fit: 'cover' }).png().toFile(path.join(OUT, name));
  console.log('  ', name);
}

/** Maskable: inset the master to ~78% on the app bg so the mask's safe area keeps the
 *  claw intact (the unpadded master would clip on Android's circular mask). */
async function maskable(size, name, scale = 0.78) {
  const inner = Math.round(size * scale);
  const img = await sharp(SRC).resize(inner, inner, { fit: 'cover' }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: img, gravity: 'center' }])
    .png()
    .toFile(path.join(OUT, name));
  console.log('  ', name);
}

console.log('Generating PWA icons from', path.relative(root, SRC));
await square(192, 'icon-192.png');
await square(512, 'icon-512.png');
await square(180, 'apple-touch-icon.png');
await square(32, 'favicon-32.png');
await maskable(512, 'icon-512-maskable.png');
console.log('Done.');
