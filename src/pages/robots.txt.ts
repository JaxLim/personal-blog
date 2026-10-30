import type { APIContext } from 'astro';
import { withBase } from '../i18n/config';

export function GET({ site }: APIContext) {
  const sitemap = new URL(withBase('/sitemap-index.xml'), site ?? 'https://jaxlim.github.io').href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
