/**
 * The site's languages. English lives at the root (/writing/…), the others
 * under a prefix (/zh/writing/…, /ja/writing/…).
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

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Path for `path` (written as the English path, e.g. "/writing/") in `locale`. */
export function localePath(locale: Locale, path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return locale === DEFAULT_LOCALE ? clean : `/${locale}${clean === '/' ? '/' : clean}`;
}

/** Splits "/ja/writing/x/" into { locale: 'ja', path: '/writing/x/' }. */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const [, first, ...rest] = pathname.split('/');
  if (isLocale(first) && first !== DEFAULT_LOCALE) return { locale: first, path: `/${rest.join('/')}` };
  return { locale: DEFAULT_LOCALE, path: pathname };
}

/** getStaticPaths for the prefixed (non-default) locales. */
export function prefixedLocalePaths() {
  return LOCALES.filter((l) => l !== DEFAULT_LOCALE).map((lang) => ({ params: { lang } }));
}
