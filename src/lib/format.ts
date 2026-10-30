import { LOCALE_INFO, type Locale } from '../i18n/config';
import { UI_TEXT } from '../i18n/ui';

const cache = new Map<string, Intl.DateTimeFormat | Intl.RelativeTimeFormat | Intl.NumberFormat>();
function memo<T extends Intl.DateTimeFormat | Intl.RelativeTimeFormat | Intl.NumberFormat>(key: string, make: () => T): T {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key) as T;
}

/** "October 29, 2026" / "2026年10月29日" */
export function formatLongDate(d: Date, locale: Locale): string {
  return memo(`long-${locale}`, () =>
    new Intl.DateTimeFormat(LOCALE_INFO[locale].intl, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }),
  ).format(d);
}

/** "Oct 2026" / "2026年10月" */
export function formatShortDate(d: Date, locale: Locale): string {
  return memo(`short-${locale}`, () =>
    new Intl.DateTimeFormat(LOCALE_INFO[locale].intl, { year: 'numeric', month: 'short', timeZone: 'UTC' }),
  ).format(d);
}

/** "Oct 18" / "10月18日" */
export function formatMonthDay(d: Date, locale: Locale): string {
  return memo(`md-${locale}`, () =>
    new Intl.DateTimeFormat(LOCALE_INFO[locale].intl, { month: 'short', day: 'numeric' }),
  ).format(d);
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31557600],
  ['month', 2629800],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];

/** "3 minutes ago" / "3 分钟前" / "3 分前" */
export function relativeTime(iso: string, locale: Locale, now = Date.now()): string {
  const diff = (new Date(iso).getTime() - now) / 1000;
  const abs = Math.abs(diff);
  if (abs < 45) return UI_TEXT[locale].time.justNow;
  const rtf = memo(`rel-${locale}`, () => new Intl.RelativeTimeFormat(LOCALE_INFO[locale].intl, { numeric: 'auto' }));
  for (const [unit, seconds] of UNITS) {
    if (abs >= seconds * 0.95 || unit === 'minute') return rtf.format(Math.round(diff / seconds), unit);
  }
  return UI_TEXT[locale].time.justNow;
}

export function compactNumber(n: number, locale: Locale): string {
  return memo(`num-${locale}`, () =>
    new Intl.NumberFormat(LOCALE_INFO[locale].intl, { notation: 'compact', maximumFractionDigits: 1 }),
  ).format(n);
}
