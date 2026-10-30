#!/usr/bin/env node
/**
 * Create a new draft post.
 *   npm run new "Notes on edge caching"                 English, MDX
 *   npm run new "边缘缓存笔记" -- --lang zh --slug edge-caching
 *   npm run new "Notes on edge caching" -- --md         plain Markdown
 *
 * A translation is a file with the same name in another language's folder:
 *   src/content/posts/en/edge-caching.mdx
 *   src/content/posts/zh/edge-caching.mdx
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const LOCALES = ['en', 'zh', 'ja'];
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const flagValues = new Set(['lang', 'slug'].map(flag).filter(Boolean));
const markdown = args.includes('--md');
const lang = flag('lang') ?? 'en';
const title = args.filter((a) => !a.startsWith('--') && !flagValues.has(a)).join(' ').trim();

if (!title) {
  console.error('Give the post a title:  npm run new "Notes on edge caching"');
  process.exit(1);
}
if (!LOCALES.includes(lang)) {
  console.error(`--lang must be one of: ${LOCALES.join(', ')}`);
  process.exit(1);
}

const fromTitle = title
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');
const slug = flag('slug') ?? fromTitle;

if (!slug) {
  console.error('This title has no Latin letters to build a file name from. Add one with --slug, e.g. --slug edge-caching');
  process.exit(1);
}

const dir = join(process.cwd(), 'src', 'content', 'posts', lang);
const file = join(dir, `${slug}.${markdown ? 'md' : 'mdx'}`);

if (existsSync(file)) {
  console.error(`A post already exists at ${file}`);
  process.exit(1);
}

const now = new Date();
const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const prefix = lang === 'en' ? '' : `/${lang}`;

mkdirSync(dir, { recursive: true });
writeFileSync(
  file,
  `---
title: ${JSON.stringify(title)}
description: ""
date: ${date}
tags: []
draft: true
---

Start writing here.
`,
);

console.log(`Created ${file}`);
console.log(`Preview it at http://localhost:4321${prefix}/writing/${slug}/ while \`npm run dev\` is running.`);
