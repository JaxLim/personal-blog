/**
 * Search index for the command palette, one per language:
 * /search/en.json, /search/zh.json, /search/ja.json
 */
import type { APIContext } from 'astro';
import { render } from 'astro:content';
import { LOCALES, LOCALE_INFO, localePath, type Locale } from '../../i18n/config';
import { useTranslations } from '../../i18n/ui';
import { getPosts } from '../../lib/posts';
import { getProjectData } from '../../lib/projects';
import { repoDescription } from '../../lib/github-shared';
import { site } from '../../site.config';
import { caseStudies, caseStudyUrl } from '../../work';

export function getStaticPaths() {
  return LOCALES.map((locale) => ({ params: { locale } }));
}

export interface SearchEntry {
  type: 'page' | 'post' | 'repo' | 'work';
  title: string;
  url: string;
  text?: string;
  /** Extra words that should match but aren't shown: tags, headings. */
  keywords?: string;
  /** Language label when the entry is in another language. */
  badge?: string;
  external?: boolean;
}

/** Article body as plain text, so search also finds words that only appear in the text. */
function plainText(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 6000);
}

export async function GET({ params }: APIContext) {
  const locale = params.locale as Locale;
  const t = useTranslations(locale);
  const [posts, data] = await Promise.all([getPosts(locale), getProjectData()]);

  const pages: SearchEntry[] = [
    { type: 'page', title: t.nav.home, url: localePath(locale, '/'), text: site.tagline[locale] },
    { type: 'page', title: t.nav.writing, url: localePath(locale, '/writing/'), text: t.writing.lede },
    { type: 'page', title: t.nav.projects, url: localePath(locale, '/projects/'), text: t.projects.lede },
    { type: 'page', title: t.nav.about, url: localePath(locale, '/about/'), text: site.about[locale].intro[0] },
  ];

  const postEntries: SearchEntry[] = await Promise.all(
    posts.map(async ({ post, url, fallback, locale: postLocale }) => {
      const { headings } = await render(post);
      return {
        type: 'post' as const,
        title: post.data.title,
        url,
        text: post.data.description,
        keywords: [...post.data.tags, ...headings.map((h) => h.text), plainText(post.body ?? '')].join(' '),
        ...(fallback ? { badge: LOCALE_INFO[postLocale].label } : {}),
      };
    }),
  );

  const workEntries: SearchEntry[] = caseStudies.map((s) => ({
    type: 'work',
    title: s.name,
    url: caseStudyUrl(s, locale),
    text: s.tagline[locale],
    keywords: [
      ...s.stack.flatMap((g) => g.items),
      ...s.problems.flatMap((p) => [p.title[locale], p.problem[locale], p.solution[locale], p.proof]),
      ...s.diagram.nodes.map((n) => n.label),
    ].join(' '),
  }));

  const repoEntries: SearchEntry[] = data.repos.map((r) => ({
    type: 'repo',
    title: r.name,
    url: r.url,
    text: repoDescription(r, locale) ?? undefined,
    keywords: [r.language ?? '', ...r.topics].join(' '),
    external: true,
  }));

  return new Response(JSON.stringify([...pages, ...workEntries, ...postEntries, ...repoEntries]), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
