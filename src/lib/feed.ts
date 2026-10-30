import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { LOCALE_INFO, localePath, type Locale } from '../i18n/config';
import { useTranslations } from '../i18n/ui';
import { site } from '../site.config';
import { getNativePosts } from './posts';

/** RSS feed of the posts written in one language. */
export async function feed(locale: Locale, context: APIContext) {
  const posts = await getNativePosts(locale);
  return rss({
    title: `${site.name}: ${useTranslations(locale).nav.writing}`,
    description: site.description[locale],
    // The channel links to this language's home page, including any sub-path.
    site: new URL(localePath(locale, '/'), context.site ?? 'https://jaxlim.github.io').href,
    items: posts.map(({ post, url }) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      categories: post.data.tags,
      link: url,
    })),
    customData: `<language>${LOCALE_INFO[locale].htmlLang.toLowerCase()}</language>`,
  });
}
