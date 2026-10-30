# personal-blog

A personal site in English, Simplified Chinese and Japanese, with a writing
archive and a live record of GitHub activity. Built with
[Astro](https://astro.build) and TypeScript. It's a static site: fast, free to
host, and nothing to keep running.

## Quick start

```sh
npm install
npm run dev        # http://localhost:4321
```

Then open `src/site.config.ts` and fill in your details: your GitHub username,
tagline, availability line and About page, each in all three languages. Until
the username is set, the site shows sample activity so you can judge the
design.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Local server with live reload. Drafts are visible here. |
| `npm run new "Title"` | Creates a draft post. Add `-- --lang zh --slug my-post` for another language. |
| `npm run build` | Builds the production site into `dist/`. |
| `npm run preview` | Serves the production build locally. |
| `npm run check` | Type-checks the whole project, including every translation. |
| `npm run icons` | Re-renders the PNG app icons from the site mark. |

## Languages

| Language | URL prefix | Example |
| --- | --- | --- |
| English (default) | none | `/writing/` |
| Simplified Chinese | `/zh/` | `/zh/writing/` |
| Japanese | `/ja/` | `/ja/writing/` |

- **Interface text** lives in `src/i18n/ui.ts`. English defines the keys; the
  other languages must provide every one of them, so a missing translation is
  a type error, not a blank on the page.
- **Personal text** (tagline, status, About page) lives in `src/site.config.ts`.
- **The language menu** opens the current page in the chosen language. The
  choice is saved, so returning visitors land in their language. On a first
  visit to the home page, the browser's language is used once.
- **SEO:** every page has `hreflang` alternates and an `x-default`, the
  sitemap lists alternates, each language has its own RSS feed
  (`/rss.xml`, `/zh/rss.xml`, `/ja/rss.xml`), and articles carry
  `BlogPosting` structured data.
- **Typography:** Chinese and Japanese use the system's own sans for the
  interface and self-hosted Noto Serif SC / JP for articles, with no negative
  tracking, taller line height, CJK punctuation trimming, Latin/CJK spacing,
  and phrase-aware line breaking for Japanese. The CJK fonts are split into
  small pieces; a page downloads only the characters it uses.

## Writing posts

Posts are Markdown or MDX files in one folder per language. A translation is a
file with the **same name** in another folder:

```
src/content/posts/en/edge-caching.mdx   →  /writing/edge-caching/
src/content/posts/zh/edge-caching.mdx   →  /zh/writing/edge-caching/
src/content/posts/ja/edge-caching.mdx   →  /ja/writing/edge-caching/
```

```yaml
---
title: Notes on edge caching
description: One or two sentences for the archive and link previews.
date: 2026-11-02
updated: 2026-11-10   # optional
tags: [Infrastructure]
draft: true           # optional: hidden in production
pinned: false         # optional: first on the home page
---
```

A post that hasn't been translated still appears in every language's archive,
labelled with the language it's written in. Translations link to each other
automatically. MDX posts can use `<Callout>` without importing it. The post
*Writing and managing posts on this site* shows every supported element.

## Projects

The repository list comes from GitHub. To translate a description, feature a
repository on the home page, or hide one, add it to `src/content/projects.yaml`:

```yaml
my-repo:
  featured: true
  description:
    zh: 中文描述
    ja: 日本語の説明
old-experiment:
  hidden: true
```

The file ships with entries for the sample repositories; replace them with
your own (keep at least one entry, or leave a `{}` in the file).

## Live GitHub activity

1. **At build time** (`src/lib/github.ts`) the site fetches your repositories
   and recent activity and renders them into the HTML.
2. **In the browser** (`src/scripts/live.ts`) the page polls GitHub's public
   events API about once a minute and folds new activity into the pulse, the
   latest-activity line and the repository list. It uses conditional
   requests, follows GitHub's poll interval, pauses in background tabs and
   backs off before the rate limit.

### Add a token for the full trace (recommended)

Without a token, GitHub only shares your last 300 public events. For a busy
account that can cover less than the pulse's 13 weeks; earlier days are then
shown as unavailable rather than as zero. Add a `GITHUB_TOKEN` environment
variable in your host (or a local `.env`, see `.env.example`) and the build
reads your exact contribution calendar instead. A fine-grained token with no
extra permissions is enough; it's used only during the build.

### Keep the static HTML fresh

`.github/workflows/refresh.yml` rebuilds the site every four hours. Create a
deploy hook in your host and save it as the repository secret
`DEPLOY_HOOK_URL`.

## Search

Press <kbd>Ctrl</kbd> <kbd>K</kbd> (<kbd>⌘</kbd> <kbd>K</kbd> on a Mac) or
<kbd>/</kbd> anywhere. The palette searches pages, posts (titles, tags,
headings and text) and repositories in the current language. Its index is
built at `/search/<lang>.json` and loads on first use.

## Images

| File | Size | Used for |
| --- | --- | --- |
| `public/og/default.png` | 1200 × 630 | Link previews on social sites and chat apps |
| `src/assets/portrait.jpg` | 4:5, at least 960 × 1200 | Portrait on the About page |

Both are optional: the site picks them up automatically when the files exist.

## Deploying

Any static host works. Push the project to a GitHub repository, then import it:

- **Vercel / Netlify / Cloudflare Pages:** framework preset *Astro*, build
  command `npm run build`, output directory `dist`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `SITE_URL` | Yes | Your public URL, for canonical links, hreflang, RSS and the sitemap |
| `GITHUB_TOKEN` | Recommended | Exact contribution calendar, higher API limits |

## Project structure

```
src/
  site.config.ts        Your name, links and personal text in each language
  i18n/                 Languages and interface text
  content/posts/        Articles, one folder per language
  content/projects.yaml Notes about your repositories
  pages/                Routes (English at the root, [lang]/ for zh and ja)
  views/                The page templates every language shares
  layouts/Base.astro    Head tags, language handling, header and footer
  components/           Header, language menu, search, pulse, ledger, lists
  lib/                  Posts, GitHub data, formatting, RSS
  scripts/              Browser code: live updates, search, menus, theme
  styles/               Design tokens, base styles, article typography
scripts/                new-post, copy-fonts, make-icons
```

## Design notes

- **Type:** Schibsted Grotesk for the interface, Newsreader for reading,
  JetBrains Mono for code; Noto Serif SC / JP for Chinese and Japanese.
- **Colour:** cool porcelain paper, graphite ink and one ink-blue accent,
  reserved for links, focus and the live signal. Light and dark themes follow
  the system unless the reader picks one.
- **Layout:** a two-column "rail" grid throughout. Section names sit in a
  narrow left column, content in the wide right one, like a technical manual.
- **Motion:** one orchestrated moment, the activity trace drawing in on load.
  Everything else moves only in response to the reader (menus, the search
  palette, page transitions, post titles that carry over into the article)
  or to new activity. All motion respects reduced-motion settings.

Tokens live in `src/styles/tokens.css`; change the accent there and the whole
site follows.
