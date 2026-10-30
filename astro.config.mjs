// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import { transformerMetaHighlight, transformerNotationDiff, transformerNotationHighlight } from '@shikijs/transformers';

// SITE_URL: the public origin (https://jaxlim.github.io). Used for canonical
// URLs, hreflang links, the RSS feeds, the sitemap and link previews.
// BASE_PATH: the sub-path the site is served from ('/personal-blog' on a
// GitHub Pages project site, '/' on your own domain).
// The GitHub Pages workflow sets both automatically.
const site = process.env.SITE_URL || 'https://jaxlim.github.io';
const base = process.env.BASE_PATH || '/';

/**
 * Code block titles: ```ts title="src/lib/posts.ts"
 * Puts the title on <pre data-title>, where the article script shows it.
 * @type {import('shiki').ShikiTransformer}
 */
const transformerTitle = {
  name: 'title',
  pre(node) {
    const meta = this.options.meta?.__raw ?? '';
    const title = /title="([^"]+)"/.exec(meta)?.[1];
    if (title) node.properties['data-title'] = title;
  },
};

/**
 * Root-relative links in posts ("/projects/orderpilot/") get the sub-path in
 * front, so posts can link to pages without knowing where the site is served.
 */
function rehypeBasePath() {
  const prefix = base.replace(/\/+$/, '');
  /** @param {any} node */
  const walk = (node) => {
    if (node.type === 'element' && node.tagName === 'a') {
      const href = node.properties?.href;
      if (prefix && typeof href === 'string' && href.startsWith('/') && !href.startsWith('//') && !href.startsWith(prefix + '/')) {
        node.properties.href = prefix + href;
      }
    }
    node.children?.forEach(walk);
  };
  return (/** @type {any} */ tree) => walk(tree);
}

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  integrations: [
    mdx(),
    sitemap({
      // Adds hreflang alternates for pages that exist in several languages.
      i18n: { defaultLocale: 'en', locales: { en: 'en', zh: 'zh-Hans', ja: 'ja' } },
      filter: (page) => !/\/(search|og)\//.test(page),
    }),
  ],
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  markdown: {
    // The unified (remark/rehype) pipeline, for GitHub-flavoured footnotes, Shiki transformers and the plugin above.
    processor: unified({ rehypePlugins: [rehypeBasePath] }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark-dimmed' },
      defaultColor: false,
      wrap: false,
      transformers: [transformerNotationHighlight(), transformerNotationDiff(), transformerMetaHighlight(), transformerTitle],
    },
  },
});
