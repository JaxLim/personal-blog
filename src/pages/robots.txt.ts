import type { APIContext } from 'astro';

export function GET({ site }: APIContext) {
  const sitemap = new URL('sitemap-index.xml', site ?? 'https://example.com').href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
