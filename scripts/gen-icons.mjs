/* Rasterise public/icon.svg into the PNG sizes the manifest and iOS need.
   Run with `npm run icons` after changing the icon. */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const pub = (p) => fileURLToPath(new URL(`../public/${p}`, import.meta.url));
const svg = readFileSync(pub('icon.svg'));

const targets = [
  [192, 'pwa-192.png'],
  [512, 'pwa-512.png'],
  [180, 'apple-touch-icon.png'],
];

await Promise.all(
  targets.map(([size, name]) =>
    sharp(svg, { density: 300 }).resize(size, size).png().toFile(pub(name)),
  ),
);

console.log('generated:', targets.map(([, name]) => name).join(', '));
