#!/usr/bin/env node
/**
 * Renders the PNG icons in public/ from the site mark. Run once after
 * changing the mark or colours:  npm run icons
 */
import sharp from 'sharp';

// The mark on a solid tile, for home screens (no transparency allowed on iOS).
const tile = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 180 180">
  <rect width="180" height="180" fill="#15171c"/>
  <rect x="52" y="98" width="18" height="38" rx="5" fill="#e9ebef"/>
  <rect x="81" y="70" width="18" height="66" rx="5" fill="#e9ebef"/>
  <rect x="110" y="44" width="18" height="92" rx="5" fill="#93a6ff"/>
</svg>`;

await sharp(Buffer.from(tile(180))).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(tile(512))).png().toFile('public/icon-512.png');
console.log('Wrote public/apple-touch-icon.png and public/icon-512.png');
