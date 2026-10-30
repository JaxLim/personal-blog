import { getCollection, type CollectionEntry } from 'astro:content';
import { DEFAULT_LOCALE, LOCALES, isLocale, localePath, type Locale } from '../i18n/config';

export type Post = CollectionEntry<'posts'>;

/** A post as shown in one language's listing. */
export interface ListedPost {
  post: Post;
  slug: string;
  /** Language the post is written in. */
  locale: Locale;
  /** True when shown in another language's listing because no translation exists. */
  fallback: boolean;
  url: string;
}

/** "zh/my-post" → { locale: 'zh', slug: 'my-post' } */
export function parsePostId(id: string): { locale: Locale; slug: string } {
  const [first, ...rest] = id.split('/');
  return isLocale(first) ? { locale: first, slug: rest.join('/') } : { locale: DEFAULT_LOCALE, slug: id };
}

export function postUrl(post: Post): string {
  const { locale, slug } = parsePostId(post.id);
  return localePath(locale, `/writing/${slug}/`);
}

let all: Promise<Post[]> | undefined;

/** Every published post in every language. Drafts are included only in development. */
export function getAllPosts(): Promise<Post[]> {
  all ??= getCollection('posts', ({ data }) => (import.meta.env.PROD ? !data.draft : true));
  return all;
}

const byDate = (a: ListedPost, b: ListedPost) => b.post.data.date.valueOf() - a.post.data.date.valueOf();

/**
 * Posts for one language, newest first. Posts not translated into this
 * language appear in their original language (English first), marked
 * as a fallback.
 */
export async function getPosts(locale: Locale): Promise<ListedPost[]> {
  const posts = await getAllPosts();
  const bySlug = new Map<string, Map<Locale, Post>>();
  for (const post of posts) {
    const { locale: l, slug } = parsePostId(post.id);
    const versions = bySlug.get(slug) ?? new Map<Locale, Post>();
    versions.set(l, post);
    bySlug.set(slug, versions);
  }

  const order: Locale[] = [locale, DEFAULT_LOCALE, ...LOCALES];
  const listed: ListedPost[] = [];
  for (const [slug, versions] of bySlug) {
    const chosen = order.find((l) => versions.has(l))!;
    const post = versions.get(chosen)!;
    listed.push({ post, slug, locale: chosen, fallback: chosen !== locale, url: postUrl(post) });
  }
  return listed.sort(byDate);
}

/** Only posts actually written in this language (for its RSS feed and article routes). */
export async function getNativePosts(locale: Locale): Promise<ListedPost[]> {
  return (await getPosts(locale)).filter((p) => !p.fallback);
}

/** Every language a post exists in, keyed by locale. */
export async function getTranslations(slug: string): Promise<Partial<Record<Locale, Post>>> {
  const posts = await getAllPosts();
  const out: Partial<Record<Locale, Post>> = {};
  for (const post of posts) {
    const parsed = parsePostId(post.id);
    if (parsed.slug === slug) out[parsed.locale] = post;
  }
  return out;
}

/** Posts for the home page: pinned first, then newest. */
export async function getHomePosts(locale: Locale, limit = 5): Promise<ListedPost[]> {
  const posts = await getPosts(locale);
  return [...posts.filter((p) => p.post.data.pinned), ...posts.filter((p) => !p.post.data.pinned)].slice(0, limit);
}

export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

export interface Tag {
  tag: string;
  slug: string;
  posts: ListedPost[];
}

/** Every tag in one language's listing, most used first. */
export async function getTags(locale: Locale): Promise<Tag[]> {
  const posts = await getPosts(locale);
  const map = new Map<string, Tag>();
  for (const item of posts) {
    for (const tag of item.post.data.tags) {
      const slug = tagSlug(tag);
      const entry = map.get(slug) ?? { tag, slug, posts: [] };
      entry.posts.push(item);
      map.set(slug, entry);
    }
  }
  return [...map.values()].sort((a, b) => b.posts.length - a.posts.length || a.tag.localeCompare(b.tag));
}

/**
 * Estimated reading time in minutes. Latin text is counted in words
 * (230 a minute), Chinese and Japanese in characters (500 a minute).
 */
export function readingMinutes(body: string | undefined): number {
  if (!body) return 1;
  const text = body
    .replace(/^---[\s\S]*?---/, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`~\-[\]()!|]/g, ' ');
  const cjk = text.match(/[぀-ヿ㐀-鿿豈-﫿]/g)?.length ?? 0;
  const words = text.replace(/[぀-ヿ㐀-鿿豈-﫿]/g, ' ').split(/\s+/).filter(Boolean).length;
  const codeBlocks = (body.match(/```/g)?.length ?? 0) / 2;
  return Math.max(1, Math.round(words / 230 + cjk / 500 + codeBlocks * 0.25));
}
