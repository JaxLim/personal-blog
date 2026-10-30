/**
 * Build-time GitHub data, read from src/data/github.json. That file is
 * written by scripts/fetch-github.mjs before every build (and committed, so
 * a build without network access still has real data). The browser keeps
 * the numbers fresh afterwards (see src/scripts/live.ts).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { site } from '../site.config';
import {
  lastDays,
  normalizeEvent,
  PULSE_DAYS,
  type ActivityEvent,
  type GitHubData,
  type RawEvent,
  type Repo,
} from './github-shared';

interface Snapshot extends Omit<GitHubData, 'events'> {
  events: RawEvent[];
}

let cached: GitHubData | undefined;

export async function getGitHubData(): Promise<GitHubData> {
  cached ??= load();
  return cached;
}

function load(): GitHubData {
  const username = site.github.username.trim();
  if (!username) return sampleData();

  const file = join(process.cwd(), 'src', 'data', 'github.json');
  const snap: Snapshot | null = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
  if (!snap || snap.username !== username) {
    console.warn(`[github] No saved data for "${username}". Run \`npm run github\` to fetch it.`);
    return { username, sample: false, fetchedAt: new Date(0).toISOString(), source: 'events', repos: [], days: {}, events: [] };
  }

  const repos = snap.repos
    .filter((r) => !(site.github.hideForks && r.isFork))
    .filter((r) => !(site.github.hideArchived && r.isArchived));

  const events = snap.events
    .map(normalizeEvent)
    .filter((e): e is ActivityEvent => e !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { ...snap, repos, events };
}

/* ------------------------------------------------------------------ */
/* Sample data, so the design can be judged before a username is set.  */
/* ------------------------------------------------------------------ */

function sampleData(): GitHubData {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();

  const rows: [string, string, string, number, number][] = [
    ['personal-blog', 'This website. Astro, TypeScript and a live feed from the GitHub API.', 'Astro', 3, 0.3],
    ['ledger-kit', 'Double-entry bookkeeping primitives for TypeScript, with exact decimal arithmetic.', 'TypeScript', 41, 7],
    ['tidepool', 'An offline-first notes app that syncs through CRDTs.', 'TypeScript', 128, 30],
    ['quill-api', 'A small REST API for drafting and scheduling posts, written in Go.', 'Go', 19, 52],
  ];
  const repos: Repo[] = rows.map(([name, description, language, stars, h]) => ({
    name,
    url: 'https://github.com/',
    description,
    language,
    stars,
    forks: Math.round(stars / 6),
    pushedAt: hoursAgo(h),
    homepage: null,
    topics: [],
    isFork: false,
    isArchived: false,
  }));

  const messages: [string, string][] = [
    ['personal-blog', 'Tune the pulse animation timing'],
    ['ledger-kit', 'Handle rounding for zero-decimal currencies'],
    ['tidepool', 'Merge concurrent edits to the same list item'],
  ];
  const events: ActivityEvent[] = messages.map(([repo, subject], i) => ({
    id: `sample-${i}`,
    kind: 'push',
    repo,
    createdAt: hoursAgo(i === 0 ? 0.3 : 2 + i * 9),
    subject,
    ref: 'main',
    count: 1,
    url: 'https://github.com/',
    weight: 1,
  }));

  const days: Record<string, number> = {};
  lastDays(PULSE_DAYS).forEach((key, i) => {
    const r = rand();
    if (r < 0.35) return;
    days[key] = Math.max(1, Math.round((0.55 + 0.45 * Math.sin(i / 6.5)) * (2 + r * 11)));
  });

  return { username: '', sample: true, fetchedAt: new Date().toISOString(), source: 'sample', repos, days, events };
}
