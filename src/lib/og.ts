/**
 * Link preview images (1200 × 630), drawn at build time with Satori and
 * rasterised with resvg. One per page type, per language:
 *   - the site: the headline and the real contribution pulse
 *   - a post: its title and description
 *   - a case study: its name and tagline
 * The bars along the bottom are the site's signature; for posts and case
 * studies they form a pattern unique to the page.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import type { Locale } from '../i18n/config';

const require = createRequire(import.meta.url);
const pkgDir = (name: string) => dirname(require.resolve(`${name}/package.json`));

type Weight = 400 | 500 | 600 | 700;
interface FontEntry {
  name: string;
  data: Buffer;
  weight: Weight;
  style: 'normal';
}

const cache = new Map<string, Buffer>();
function read(path: string): Buffer {
  let b = cache.get(path);
  if (!b) {
    b = readFileSync(path);
    cache.set(path, b);
  }
  return b;
}

function latinFonts(): FontEntry[] {
  const grotesk = pkgDir('@fontsource/schibsted-grotesk');
  const mono = pkgDir('@fontsource/jetbrains-mono');
  return [
    { name: 'Schibsted', data: read(join(grotesk, 'files/schibsted-grotesk-latin-400-normal.woff')), weight: 400, style: 'normal' },
    { name: 'Schibsted', data: read(join(grotesk, 'files/schibsted-grotesk-latin-600-normal.woff')), weight: 600, style: 'normal' },
    { name: 'Mono', data: read(join(mono, 'files/jetbrains-mono-latin-500-normal.woff')), weight: 500, style: 'normal' },
  ];
}

/** Parses a Fontsource stylesheet into (woff file, unicode ranges) pairs. */
function subsets(pkg: string, weight: Weight): { file: string; ranges: [number, number][] }[] {
  const dir = pkgDir(pkg);
  const css = read(join(dir, `${weight}.css`)).toString('utf8');
  const out: { file: string; ranges: [number, number][] }[] = [];
  for (const block of css.split('@font-face').slice(1)) {
    const file = /url\(\.\/files\/([^)]+\.woff)\)/.exec(block)?.[1];
    const range = /unicode-range:\s*([^;]+);/.exec(block)?.[1];
    if (!file || !range) continue;
    const ranges = range.split(',').map((r) => {
      const [a, b] = r.trim().replace(/^U\+/i, '').split('-');
      const start = parseInt(a, 16);
      return [start, b ? parseInt(b, 16) : start] as [number, number];
    });
    out.push({ file: join(dir, 'files', file), ranges });
  }
  return out;
}

/** Only the CJK font slices that contain characters this image uses. */
function cjkFonts(locale: Locale, text: string): FontEntry[] {
  if (locale === 'en' && !/[　-鿿＀-￯]/.test(text)) return [];
  const pkg = locale === 'ja' ? '@fontsource/noto-sans-jp' : '@fontsource/noto-sans-sc';
  const name = locale === 'ja' ? 'Noto Sans JP' : 'Noto Sans SC';
  const codes = new Set([...text].map((c) => c.codePointAt(0)!).filter((c) => c > 0x2000));
  const fonts: FontEntry[] = [];
  for (const weight of [400, 600] as const) {
    subsets(pkg, weight).forEach((s, i) => {
      const used = [...codes].some((c) => s.ranges.some(([a, b]) => c >= a && c <= b));
      // Each slice gets its own name: Satori keeps one font per name and weight,
      // and falls back through every loaded font for missing glyphs.
      if (used) fonts.push({ name: `${name} ${i}`, data: read(s.file), weight, style: 'normal' });
    });
  }
  return fonts;
}

/* A tiny hyperscript for Satori's element tree. */
type Node = { type: string; props: Record<string, unknown> } | string | null;
function h(type: string, style: Record<string, unknown>, ...children: Node[]): Node {
  const kids = children.filter((c) => c !== null);
  return { type, props: { style, children: kids.length === 1 ? kids[0] : kids } };
}

const INK = '#15171c';
const GRAPHITE = '#646a76';
const IDLE = '#e3e5ea';
const ACCENT = '#2440c8';

export interface OgInput {
  locale: Locale;
  kind: string;
  title: string;
  subtitle?: string;
  /** Bar heights between 0 and 1, oldest first. */
  bars: number[];
  footer: string;
  name: string;
}

function clip(text: string, max: number): string {
  const chars = [...text];
  return chars.length > max ? chars.slice(0, max - 1).join('').trimEnd() + '…' : text;
}

export async function renderOg(input: OgInput): Promise<Buffer> {
  const cjk = input.locale !== 'en';
  const titleLen = [...input.title].length * (cjk ? 1.8 : 1);
  const titleSize = titleLen <= 22 ? 96 : titleLen <= 44 ? 74 : titleLen <= 70 ? 60 : 50;
  const subtitle = input.subtitle ? clip(input.subtitle, cjk ? 72 : 180) : '';

  const bars = input.bars.map((v, i) => {
    const last = i === input.bars.length - 1;
    return h(
      'div',
      {
        display: 'flex',
        width: 6,
        height: Math.max(4, Math.round(v * 84)),
        borderRadius: 2,
        background: last ? ACCENT : v > 0 ? INK : IDLE,
      },
      null,
    );
  });

  const tree = h(
    'div',
    {
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 60,
      paddingBottom: 56,
      paddingLeft: 72,
      paddingRight: 72,
      background: '#ffffff',
      color: INK,
      fontFamily: 'Schibsted',
    },
    h(
      'div',
      { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
      h(
        'div',
        { display: 'flex', alignItems: 'center', gap: 14 },
        h(
          'div',
          { display: 'flex', alignItems: 'flex-end', gap: 5, height: 30 },
          h('div', { display: 'flex', width: 6, height: 14, borderRadius: 2, background: INK }, null),
          h('div', { display: 'flex', width: 6, height: 22, borderRadius: 2, background: INK }, null),
          h('div', { display: 'flex', width: 6, height: 30, borderRadius: 2, background: ACCENT }, null),
        ),
        h('div', { display: 'flex', fontSize: 30, fontWeight: 600, letterSpacing: -0.5 }, input.name),
      ),
      h('div', { display: 'flex', fontFamily: 'Mono', fontSize: 17, letterSpacing: 2.5, color: GRAPHITE, textTransform: 'uppercase' }, input.kind),
    ),
    h(
      'div',
      { display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1, paddingBottom: 12 },
      h(
        'div',
        {
          display: 'flex',
          fontSize: titleSize,
          fontWeight: 600,
          lineHeight: cjk ? 1.25 : 1.02,
          letterSpacing: cjk ? 0 : -titleSize * 0.045,
          maxWidth: 1040,
        },
        input.title,
      ),
      subtitle
        ? h('div', { display: 'flex', marginTop: 26, fontSize: 28, lineHeight: 1.42, color: GRAPHITE, maxWidth: 980 }, subtitle)
        : null,
    ),
    h(
      'div',
      { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40 },
      h('div', { display: 'flex', alignItems: 'flex-end', gap: 5, height: 92 }, ...bars),
      h('div', { display: 'flex', fontFamily: 'Mono', fontSize: 17, letterSpacing: 1, color: GRAPHITE, paddingBottom: 2 }, input.footer),
    ),
  );

  const text = [input.title, subtitle, input.kind, input.footer, input.name].join(' ');
  const svg = await satori(tree as never, {
    width: 1200,
    height: 630,
    fonts: [...latinFonts(), ...cjkFonts(input.locale, text)],
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 }, font: { loadSystemFonts: false } }).render().asPng();
}

/** A pattern of bar heights unique to a string: the page's own trace. */
export function signature(seedText: string, count = 64): number[] {
  let seed = [...seedText].reduce((a, c) => (a * 31 + c.codePointAt(0)!) % 2147483647, 7) || 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: count }, (_, i) => {
    const wave = 0.5 + 0.35 * Math.sin(i / 5 + rand());
    return rand() < 0.18 ? 0 : Math.min(1, Math.max(0.12, wave * (0.5 + rand())));
  });
}
