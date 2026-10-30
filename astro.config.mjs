// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Set SITE_URL in your hosting provider (e.g. https://ethan.dev).
// It is used for canonical URLs, hreflang links, the RSS feeds and the sitemap.
const site = process.env.SITE_URL || 'https://example.com';

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  integrations: [
    mdx(),
    sitemap({
      // Adds hreflang alternates for pages that exist in several languages.
      i18n: { defaultLocale: 'en', locales: { en: 'en', zh: 'zh-Hans', ja: 'ja' } },
      filter: (page) => !/\/search\//.test(page),
    }),
  ],
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark-dimmed' },
      defaultColor: false,
      wrap: false,
    },
  },
});
