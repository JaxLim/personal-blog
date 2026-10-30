/**
 * The site's languages. English lives at the root (/writing/…), the others
 * under a prefix (/zh/writing/…, /ja/writing/…).
 *
 * Every internal link goes through localePath() or withBase(), so the site
 * also works when it is served from a sub-path (BASE_PATH, e.g. GitHub
 * Pages at /personal-blog/).
 */
export const LOCALES = ['en', 'zh', 'ja'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

interface LocaleInfo {
  /** Name in its own language, for the switcher. */
  label: string;
  /** Short form for compact controls. */
  short: string;
  /** <html lang> and hreflang value. */
  htmlLang: string;
  /** Open Graph locale. */
  og: string;
  /** Locale used by Intl date and number formatting. */
  intl: string;
}

export const LOCALE_INFO: Record<Locale, LocaleInfo> = {
  en: { label: 'English', short: 'EN', htmlLang: 'en', og: 'en_US', intl: 'en-US' },
  zh: { label: '简体中文', short: '中', htmlLang: 'zh-Hans', og: 'zh_CN', intl: 'zh-CN' },
  ja: { label: '日本語', short: '日', htmlLang: 'ja', og: 'ja_JP', intl: 'ja-JP' },
};

/** The deploy sub-path without a trailing slash: '' at a domain root, '/personal-blog' on GitHub Pages. */
export const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '');

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** A site path ("/favicon.svg") with the deploy sub-path in front. */
export function withBase(path: string): string {
  return BASE + (path.startsWith('/') ? path : `/${path}`);
}

/** Removes the deploy sub-path from a pathname. */
export function stripBase(pathname: string): string {
  if (BASE && (pathname === BASE || pathname.startsWith(BASE + '/'))) return pathname.slice(BASE.length) || '/';
  return pathname;
}

/** Path for `path` (written as the English path, e.g. "/writing/") in `locale`. */
export function localePath(locale: Locale, path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return withBase(locale === DEFAULT_LOCALE ? clean : `/${locale}${clean}`);
}

/** Splits "/ja/writing/x/" (with or without the sub-path) into { locale: 'ja', path: '/writing/x/' }. */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const local = stripBase(pathname);
  const [, first, ...rest] = local.split('/');
  if (isLocale(first) && first !== DEFAULT_LOCALE) return { locale: first, path: `/${rest.join('/')}` };
  return { locale: DEFAULT_LOCALE, path: local };
}

/** getStaticPaths for the prefixed (non-default) locales. */
export function prefixedLocalePaths() {
  return LOCALES.filter((l) => l !== DEFAULT_LOCALE).map((lang) => ({ params: { lang } }));
}
