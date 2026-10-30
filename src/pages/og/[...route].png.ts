/**
 * Link preview images: /og/{locale}/site.png, /og/{locale}/posts/{slug}.png
 * and /og/{locale}/work/{slug}.png. See src/lib/og.ts.
 */
import type { APIContext } from 'astro';
import { LOCALES, type Locale } from '../../i18n/config';
import { useTranslations } from '../../i18n/ui';
import { getAllPosts, parsePostId } from '../../lib/posts';
import { getGitHubData } from '../../lib/github';
import { lastDays } from '../../lib/github-shared';
import { renderOg, signature, type OgInput } from '../../lib/og';
import { site } from '../../site.config';
import { caseStudies } from '../../work';

const host = new URL(process.env.SITE_URL || 'https://jaxlim.github.io').host + (process.env.BASE_PATH || '').replace(/\/$/, '');

export async function getStaticPaths() {
  const data = await getGitHubData();
  const days = lastDays(64).map((d) => data.days[d] ?? 0);
  const max = Math.max(1, ...days);
  const pulse = days.map((n) => (n ? 0.15 + 0.85 * Math.sqrt(n / max) : 0));

  const paths: { params: { route: string }; props: OgInput }[] = [];
  for (const locale of LOCALES) {
    const t = useTranslations(locale);
    paths.push({
      params: { route: `${locale}/site` },
      props: {
        locale,
        name: site.name,
        kind: t.meta.role,
        title: site.headline[locale].join(locale === 'en' ? ' ' : ''),
        subtitle: site.tagline[locale],
        bars: pulse,
        footer: host,
      },
    });
    for (const study of caseStudies) {
      paths.push({
        params: { route: `${locale}/work/${study.slug}` },
        props: {
          locale,
          name: site.name,
          kind: `${t.work.label} · ${study.year}`,
          title: study.name,
          subtitle: study.tagline[locale],
          bars: signature(study.slug),
          footer: host,
        },
      });
    }
  }
  for (const post of await getAllPosts()) {
    const { locale, slug } = parsePostId(post.id);
    const t = useTranslations(locale as Locale);
    paths.push({
      params: { route: `${locale}/posts/${slug}` },
      props: {
        locale,
        name: site.name,
        kind: t.nav.writing,
        title: post.data.title,
        subtitle: post.data.description,
        bars: signature(slug),
        footer: host,
      },
    });
  }
  return paths;
}

export async function GET({ props }: APIContext) {
  const png = await renderOg(props as OgInput);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
}
