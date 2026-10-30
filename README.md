# Ethan — portfolio and technical blog

The source of [jaxlim.github.io/personal-blog](https://jaxlim.github.io/personal-blog/): case studies of the systems I build, technical writing, and my GitHub activity, live. In English, Simplified Chinese and Japanese.

Built with [Astro](https://astro.build) and TypeScript. Static HTML, no server, no tracking.

## What's inside

- **Case studies** for [OrderPilot](https://github.com/JaxLim/OrderPilot) and [OperationAgent](https://github.com/JaxLim/OperationAgent). Each one includes the hard problems and the tests that prove them, an architecture diagram you can explore (select a part, or play a request through the system), and an interactive demo:
  - **OrderPilot:** an oversell lab, with forty buyers competing for ten units.
  - **OperationAgent:** the worker-isolation gate, shown as a console.
- **Writing** with a reading layout built for technical posts:
  - table of contents with scroll spy and a minutes-left counter
  - code blocks with file titles, highlighted lines, diffs and a copy button
  - footnote previews, zoomable figures, and heading links you can copy
  - previous/next navigation and a link to the related case study
- **Live GitHub data:**
  - the contribution calendar as an activity "pulse"
  - your latest push, with its commit message
  - every public repository, with sorting and a language filter
  - the browser keeps all of it current while a page is open
- **Three languages** at their own URLs (`/`, `/zh/`, `/ja/`):
  - a remembered choice and a language menu
  - `hreflang`, a sitemap and an RSS feed for each language
  - typography tuned for CJK
- **Link previews**: an Open Graph image is generated for every page, post and case study, in each language.
- **Motion with restraint**:
  - smooth scrolling and reveals as you scroll
  - headlines that rise line by line, and labels that roll on hover
  - shared-element page transitions
  - everything turns off under `prefers-reduced-motion`

## Quick start

```sh
npm install
npm run dev        # http://localhost:4321
```

Node 22.12 or newer.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server. Refreshes GitHub data if the saved copy is over 30 minutes old. |
| `npm run build` | Fetches GitHub data, then builds the site into `dist/`. |
| `npm run preview` | Serves the built site. |
| `npm run check` | Type-checks everything, including every translation. |
| `npm run github` | Fetches GitHub data now (`GITHUB_TOKEN=… npm run github` for the exact calendar). |
| `npm run new "Title" -- --lang zh` | Starts a draft post (`--md` for plain Markdown, `--slug` to choose the file name). |

## Deploying

The site deploys to **GitHub Pages** from `.github/workflows/deploy.yml`. The workflow runs on every push to `main`, every six hours (so new visitors get fresh GitHub data in the HTML), and on demand from the Actions tab.

One-time setup, already done for this repository: **Settings → Pages → Source: GitHub Actions**.

The workflow sets `SITE_URL` and `BASE_PATH` from the Pages configuration, so the same code works:

- at a project URL (`/personal-blog/`)
- at a user site (rename the repository to `jaxlim.github.io`)
- at a custom domain (add it under Settings → Pages)

To host elsewhere (Vercel, Netlify, Cloudflare Pages), build with `npm run build`, publish `dist/`, and set `SITE_URL` to the public origin. Set `BASE_PATH` only if the site isn't at the root.

| Variable | Used for |
| --- | --- |
| `SITE_URL` | Canonical URLs, `hreflang`, RSS, sitemap, link previews |
| `BASE_PATH` | Serving from a sub-path, e.g. `/personal-blog` |
| `GITHUB_TOKEN` | The exact contribution calendar (GraphQL) and a higher API rate limit |

## GitHub data

`scripts/fetch-github.mjs` runs before every build and saves `src/data/github.json`, which the site reads. That file is committed on purpose:

- **Sources fail independently.** Repositories, events and the contribution calendar are fetched separately; if one fails, its saved copy is kept and the rest still refresh.
- **Builds work offline.** A build without network shows real (if older) data. Sample data appears only when no username is set.
- **Push events are enriched.** GitHub's events API no longer lists commits in push events, so the newest pushes get their commit count and message from the compare API. The result is cached by event id.
- **The calendar matches your profile.** With a token, contributions come from the GraphQL calendar, exactly as on your GitHub profile. Without one, they're counted from public events and merged with the saved days.

In the browser, `src/scripts/live.ts` polls the public events API politely:

- ETags, with GitHub's `X-Poll-Interval` respected
- paused while the tab is hidden
- backs off when the anonymous rate limit runs low

New activity is folded into the pulse, the latest-activity line and the repository table.

The username lives in `src/site.config.ts`. Repository descriptions in other languages, featured order and hidden repositories are set in `src/content/projects.yaml`.

## Content

### Posts

One folder per language: `src/content/posts/{en,zh,ja}/`. A file with the same name in another folder is its translation. Untranslated posts still appear in every language's list, marked with their language.

```yaml
---
title: Selling exactly ten
description: One or two sentences for lists and link previews.
date: 2026-10-30
updated: 2026-11-02   # optional
tags: [Java, MySQL]
pinned: true          # optional: first on the home page
draft: true           # optional: only visible in `npm run dev`
project: orderpilot   # optional: links the case study at the end
---
```

In MDX you can use `<Callout type="tip" title="…">` and `<Figure src={image} caption="…" />` (or put an inline SVG inside `<Figure>`). Code fences accept a `title="path/to/file.ts"`, line ranges like `{3-5}`, and `// [!code highlight]`, `// [!code ++]`, `// [!code --]` markers. Root-relative links (`/projects/orderpilot/`) are rewritten to include the deploy sub-path.

`src/content/posts/en/writing-posts-on-this-site.mdx` is a draft reference of every formatting element; run `npm run dev` to see it.

### Case studies

Each case study is a typed file in `src/work/` (see `types.ts`). Every string is written in all three languages, and the type checker reports any missing translation. A case study holds:

- the summary, metrics, problems and stack
- the architecture diagram: nodes on a grid, edges between them, and the "traces" that play a request through it
- which demo to show

To add one, write a file next to the others and list it in `src/work/index.ts`. Screenshots live in `src/assets/work/` and are resized and converted at build time.

### Personal details

`src/site.config.ts` holds your name, the home page headline and tagline, the availability line, the About page text, links and the toolbox strip. Set `email` there to show an email button in the footer and on the About page.

## Assets

Everything visual is drawn in code: the wordmark, icons, diagrams, link previews and the activity graphics. Two optional files are picked up automatically:

| File | Size | Where it appears |
| --- | --- | --- |
| `src/assets/portrait.jpg` | 4:5, at least 960 × 1200 | About page, beside "Who I am" |
| `public/og/default.png` | 1200 × 630 | Not needed: link previews are generated per page |

## Project structure

```
src/
  pages/          routes; [lang]/ holds the /zh/ and /ja/ versions; og/ generates link previews
  views/          page templates shared by every language
  components/     UI; work/ has the diagram, demos and case-study cards
  work/           case-study content (typed, trilingual)
  content/        posts and projects.yaml
  data/           github.json, written by scripts/fetch-github.mjs
  i18n/           languages, URL helpers and all interface text
  lib/            posts, GitHub data, formatting, OG image rendering
  scripts/        browser code: motion, live data, search, diagram, UI
  styles/         tokens, global styles, article typography
scripts/          fetch-github, copy-fonts, new-post, make-icons
```

## Design notes

- **One accent, used only for meaning.** White paper, graphite ink and one ink-blue mark the live signal, links, focus and the current step. Red appears only when something is refused or oversold.
- **Signature.** Three bars from the activity pulse form the wordmark, the favicon, the link previews and the full stop of the headline.
- **Rail layout.** A narrow column names each section with a mono index; the wide column holds the content, like a technical manual.
- **Type.** Schibsted Grotesk for interface and display, Newsreader for reading, JetBrains Mono for labels and code. Chinese and Japanese use system sans for the interface and Noto Serif for articles, with no negative tracking and taller lines.
- **Motion.** Large movements ease out on an exponential curve and never block reading. Smooth scrolling is on only for a mouse or trackpad, and everything respects reduced motion.
