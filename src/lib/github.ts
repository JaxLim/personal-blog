/**
 * Build-time GitHub data. Runs once per build; every page shares the result.
 * The browser keeps it fresh afterwards (see src/scripts/live.ts).
 */
import { site } from '../site.config';
import {
  dayKey,
  lastDays,
  normalizeEvent,
  PULSE_DAYS,
  type ActivityEvent,
  type GitHubData,
  type RawEvent,
  type Repo,
} from './github-shared';

const API = 'https://api.github.com';
const token = import.meta.env.GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;

let cached: Promise<GitHubData> | undefined;

export function getGitHubData(): Promise<GitHubData> {
  cached ??= load();
  return cached;
}

async function load(): Promise<GitHubData> {
  const username = site.github.username.trim();
  if (!username) return sampleData();

  try {
    const [repos, events, calendar] = await Promise.all([
      fetchRepos(username),
      fetchEvents(username),
      token ? fetchCalendar(username).catch(() => null) : Promise.resolve(null),
    ]);

    const days = calendar ?? daysFromEvents(events.list);
    // Days before the oldest event we could see are unknown, not empty.
    const coverageFrom = !calendar && events.truncated && events.oldest ? dayKey(new Date(events.oldest)) : undefined;
    return {
      username,
      sample: false,
      fetchedAt: new Date().toISOString(),
      source: calendar ? 'graphql' : 'events',
      repos,
      days,
      events: events.list.slice(0, 40),
      ...(coverageFrom ? { coverageFrom } : {}),
    };
  } catch (error) {
    console.warn(`[github] Could not load data for "${username}", using sample data instead.`, error);
    return { ...sampleData(), username };
  }
}

async function gh<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'personal-blog-build',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

interface RawRepo {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  homepage: string | null;
  topics?: string[];
  fork: boolean;
  archived: boolean;
}

async function fetchRepos(username: string): Promise<Repo[]> {
  const raw = await gh<RawRepo[]>(`/users/${username}/repos?per_page=100&sort=pushed&type=owner`);
  return raw
    .filter((r) => !(site.github.hideForks && r.fork))
    .filter((r) => !(site.github.hideArchived && r.archived))
    .map((r) => ({
      name: r.name,
      url: r.html_url,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      forks: r.forks_count,
      pushedAt: r.pushed_at,
      homepage: r.homepage || null,
      topics: r.topics ?? [],
      isFork: r.fork,
      isArchived: r.archived,
    }));
}

/**
 * Recent public events. GitHub serves at most 300, in pages of 100, and later
 * pages sometimes jump back years; only pages that continue the timeline are
 * kept. `truncated` says the history ran out before the pulse window did.
 */
async function fetchEvents(username: string): Promise<{ list: ActivityEvent[]; truncated: boolean; oldest?: string }> {
  const DAY = 86400_000;
  const accepted: RawEvent[] = [];
  let truncated = false;

  for (const page of [1, 2, 3]) {
    const batch = await gh<RawEvent[]>(`/users/${username}/events/public?per_page=100&page=${page}`).catch(() => null);
    const prevOldest = accepted.at(-1)?.created_at;
    const continues =
      batch && batch.length > 0 && (!prevOldest || Date.parse(batch[0].created_at) >= Date.parse(prevOldest) - 2 * DAY);
    if (!batch || !continues) {
      // A full previous page with nothing usable after it: the history was cut off.
      truncated = accepted.length > 0 && accepted.length % 100 === 0;
      break;
    }
    accepted.push(...batch);
    if (batch.length < 100) break; // reached the real end of the history
    if (page === 3) truncated = true;
  }

  const seen = new Set<string>();
  const list = accepted
    .filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)))
    .map(normalizeEvent)
    .filter((e): e is ActivityEvent => e !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const oldest = accepted.reduce<string | undefined>((min, e) => (!min || e.created_at < min ? e.created_at : min), undefined);
  return { list, truncated: truncated && Boolean(oldest), oldest };
}

function daysFromEvents(events: ActivityEvent[]): Record<string, number> {
  const days: Record<string, number> = {};
  for (const e of events) {
    const key = dayKey(new Date(e.createdAt));
    days[key] = (days[key] ?? 0) + e.weight;
  }
  return days;
}

interface CalendarResponse {
  data?: {
    user?: {
      contributionsCollection: {
        contributionCalendar: { weeks: { contributionDays: { date: string; contributionCount: number }[] }[] };
      };
    };
  };
}

/** Exact daily contribution counts. Needs a token (GraphQL has no anonymous access). */
async function fetchCalendar(username: string): Promise<Record<string, number>> {
  const to = new Date();
  const from = new Date(to.getTime() - PULSE_DAYS * 86400_000);
  const query = `query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar { weeks { contributionDays { date contributionCount } } }
      }
    }
  }`;
  const res = await fetch(`${API}/graphql`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'personal-blog-build' },
    body: JSON.stringify({ query, variables: { login: username, from: from.toISOString(), to: to.toISOString() } }),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}`);
  const json = (await res.json()) as CalendarResponse;
  const weeks = json.data?.user?.contributionsCollection.contributionCalendar.weeks;
  if (!weeks) throw new Error('GitHub GraphQL returned no calendar');
  const days: Record<string, number> = {};
  for (const w of weeks) for (const d of w.contributionDays) if (d.contributionCount) days[d.date] = d.contributionCount;
  return days;
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
    ['shardcache', 'A consistent-hashing cache client with request coalescing.', 'Rust', 64, 120],
    ['type-scale', 'Generate modular type scales and CSS custom properties from the command line.', 'JavaScript', 22, 300],
    ['dotfiles', 'Shell, editor and terminal configuration.', 'Shell', 5, 410],
    ['ml-notebooks', 'Experiments and notes from working through applied machine learning.', 'Jupyter Notebook', 2, 900],
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
    ['personal-blog', 'Add reading progress to articles'],
    ['tidepool', 'Merge concurrent edits to the same list item'],
    ['quill-api', 'Return 409 when a schedule slot is taken'],
    ['ledger-kit', 'Document the balance invariant'],
    ['tidepool', 'Debounce sync on flaky connections'],
    ['shardcache', 'Coalesce identical in-flight requests'],
  ];
  const events: ActivityEvent[] = messages.map(([repo, title], i) => ({
    id: `sample-${i}`,
    type: 'PushEvent',
    repo,
    createdAt: hoursAgo(i === 0 ? 0.3 : 2 + i * 9),
    title,
    url: 'https://github.com/',
    weight: 1 + (i % 3),
  }));

  const days: Record<string, number> = {};
  const keys = lastDays(PULSE_DAYS);
  keys.forEach((key, i) => {
    const date = new Date(key + 'T12:00:00');
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    // A believable rhythm: busy stretches, quiet weekends, a short break.
    const wave = 0.55 + 0.45 * Math.sin(i / 6.5);
    const breakWeek = i > 38 && i < 45;
    const r = rand();
    if (breakWeek || (weekend && r < 0.6) || r < 0.12) return;
    days[key] = Math.max(1, Math.round(wave * (2 + r * 11)));
  });
  days[keys[keys.length - 1]] = 4;

  return { username: '', sample: true, fetchedAt: new Date().toISOString(), source: 'sample', repos, days, events };
}
