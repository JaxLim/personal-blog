import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { file, glob } from 'astro/loaders';

/**
 * Posts live in one folder per language:
 *   src/content/posts/en/my-post.mdx
 *   src/content/posts/zh/my-post.mdx   ← same file name = translation
 */
const posts = defineCollection({
  loader: glob({ pattern: '{en,zh,ja}/**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    /** Drafts are visible in `npm run dev` and excluded from production builds. */
    draft: z.boolean().default(false),
    /** Pinned posts appear first on the home page. */
    pinned: z.boolean().default(false),
    /** Slug of a case study this post belongs to (src/work/), linked at the end. */
    project: z.string().optional(),
  }),
});

const localized = z.object({ en: z.string(), zh: z.string(), ja: z.string() }).partial();

/**
 * Optional notes about your repositories (src/content/projects.yaml):
 * translated descriptions, featured order on the home page, or hiding one.
 */
const projects = defineCollection({
  loader: file('./src/content/projects.yaml'),
  schema: z.object({
    description: localized.optional(),
    featured: z.boolean().default(false),
    hidden: z.boolean().default(false),
  }),
});

export const collections = { posts, projects };
