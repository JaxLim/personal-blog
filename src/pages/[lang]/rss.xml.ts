import type { APIContext } from 'astro';
import { prefixedLocalePaths, type Locale } from '../../i18n/config';
import { feed } from '../../lib/feed';

export const getStaticPaths = prefixedLocalePaths;
export const GET = (context: APIContext) => feed(context.params.lang as Locale, context);
