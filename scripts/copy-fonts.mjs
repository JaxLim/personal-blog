#!/usr/bin/env node
/**
 * Copies the Chinese and Japanese text serifs from node_modules into
 * public/fonts, so pages in those languages can load them with a plain
 * <link> (and English pages never download them). Runs before dev and build.
 * Each font is split into small unicode-range files; browsers fetch only
 * the pieces a page actually uses.
 */
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const fonts = ['noto-serif-sc', 'noto-serif-jp'];

for (const name of fonts) {
  const from = join('node_modules', '@fontsource-variable', name);
  const to = join('public', 'fonts', name);
  if (!existsSync(from)) {
    console.warn(`[fonts] ${from} is missing. Run npm install.`);
    continue;
  }
  if (existsSync(join(to, 'index.css'))) continue; // already copied
  mkdirSync(to, { recursive: true });
  cpSync(join(from, 'index.css'), join(to, 'index.css'));
  cpSync(join(from, 'files'), join(to, 'files'), { recursive: true });
  console.log(`[fonts] copied ${name}`);
}
