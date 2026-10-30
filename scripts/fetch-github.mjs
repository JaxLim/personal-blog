#!/usr/bin/env node
/**
 * Fetches your public GitHub data and saves it to src/data/github.json,
 * which the site reads at build time. Runs before every build.
 *
 *   npm run github                 fetch now
 *   node scripts/fetch-github.mjs --if-stale   skip if the file is under 30 minutes old
 *
 * Reliability rules:
 * - Each source (repositories, events, contribution calendar) is fetched on
 *   its own. If one fails, the previous saved value is kept for that source.
 * - The saved file is committed, so a build without network access still
 *   shows real (if older) data. Sample data is used only when no username
 *   is configured.
 * - GitHub's events API no longer lists commits in push events, so the
 *   newest pushes are enriched with their commit count and message through
 *   the compare API. Enrichment is cached by event id across runs.
 * - With GITHUB_TOKEN set, the contribution calendar comes from GraphQL and
 *   matches your GitHub profile. Without it, days are counted from events.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'src', 'data', 'github.json');
const API = 'https://api.github.com';
const DAY = 86_400_000;
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const ifStale = process.argv.includes('--if-stale');

const config = readFileSync(join(ROOT, 'src', 'site.config.ts'), 'utf8');
const username = (process.env.GITHUB_USERNAME || /username:\s*'([^']*)'/.exec(config)?.[1] || '').trim();

const previous = existsSync(OUT) ? safeJson(readFileSync(OUT, 'utf8')) : null;

if (!username) {
  console.log('[github] No username in src/site.config.ts; the site will show sample data.');
  write({ username: '', sample: true, fetchedAt: new Date().toISOString(), source: 'sample', repos: [], days: {}, events: [] });
  process.exit(0);
}

if (ifStale && previous?.username === username && Date.now() - Date.parse(previous.fetchedAt) < 30 * 60_000) {
  console.log('[github] Saved data is recent; skipping fetch.');
  process.exit(0);
}

const prev = previous?.username === username ? previous : null;
const notes = [];

const [repos, events, calendar, profile] = await Promise.all([
  fetchRepos().catch((e) => fallback('repositories', e, prev?.repos ?? [])),
  fetchEvents().catch((e) => fallback('events', e, null)),
  token ? fetchCalendar().catch((e) => fallback('contribution calendar', e, null)) : Promise.resolve(null),
  gh(`/users/${username}`).catch((e) => fallback('profile', e, null)),
]);

// Events: merge with what we saved before, so history outlives the API's 90-day window.
const byId = new Map((prev?.events ?? []).map((e) => [e.id, e]));
for (const e of events?.list ?? []) byId.set(e.id, { ...byId.get(e.id), ...e, payload: { ...byId.get(e.id)?.payload, ...e.payload } });
const mergedEvents = [...byId.values()].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 80);
await enrichPushes(mergedEvents);

// Days: the GraphQL calendar is authoritative. Without it, combine the
// saved days with what the events show, never lowering a saved count.
let days;
let source;
let coverageFrom;
if (calendar) {
  days = calendar.days;
  source = 'graphql';
} else {
  days = { ...(prev?.days ?? {}) };
  const counted = {};
  for (const e of mergedEvents) {
    const key = e.created_at.slice(0, 10);
    counted[key] = (counted[key] ?? 0) + weight(e);
  }
  // Days already covered by a saved GitHub calendar are exact; leave them alone.
  // Only days since that calendar was fetched are filled in from events.
  const calendarUntil = prev?.source?.startsWith('graphql') ? (prev.calendarUntil ?? prev.fetchedAt.slice(0, 10)) : '';
  for (const [k, v] of Object.entries(counted)) {
    if (k >= calendarUntil) days[k] = Math.max(days[k] ?? 0, v);
  }
  source = calendarUntil ? 'graphql+events' : 'events';
  if (source === 'events' && events?.truncated && events.oldest) coverageFrom = events.oldest.slice(0, 10);
}

const languages = await fetchLanguages(repos);

const data = {
  username,
  sample: false,
  fetchedAt: new Date().toISOString(),
  source,
  ...(notes.length ? { partial: notes } : {}),
  profile: profile
    ? { login: profile.login, name: profile.name, avatar: profile.avatar_url, followers: profile.followers, publicRepos: profile.public_repos, createdAt: profile.created_at }
    : (prev?.profile ?? null),
  yearTotal: calendar?.total ?? prev?.yearTotal ?? null,
  // The last day the saved counts came from the GitHub calendar.
  ...(calendar ? { calendarUntil: new Date().toISOString().slice(0, 10) } : prev?.calendarUntil ? { calendarUntil: prev.calendarUntil } : {}),
  repos: repos.map((r) => ({ ...r, languages: languages[r.name] ?? prev?.repos?.find((p) => p.name === r.name)?.languages ?? {} })),
  days,
  events: mergedEvents,
  ...(coverageFrom ? { coverageFrom } : {}),
};

write(data);
const total = Object.values(days).reduce((a, b) => a + b, 0);
console.log(
  `[github] ${username}: ${data.repos.length} repositories, ${mergedEvents.length} events, ${total} contributions in the saved calendar (${source})` +
    (notes.length ? `. Kept saved data for: ${notes.join(', ')}` : ''),
);

/* ------------------------------------------------------------------ */

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function write(obj) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(obj, null, 2) + '\n');
}

function fallback(what, error, value) {
  notes.push(what);
  console.warn(`[github] Could not fetch ${what} (${error.message}); keeping the saved copy.`);
  return value;
}

async function gh(path) {
  const res = await fetch(API + path, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': `${username}-personal-site`,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${path}`);
  return res.json();
}

async function fetchRepos() {
  const raw = await gh(`/users/${username}/repos?per_page=100&sort=pushed&type=owner`);
  return raw.map((r) => ({
    name: r.name,
    url: r.html_url,
    description: r.description,
    language: r.language,
    stars: r.stargazers_count,
    forks: r.forks_count,
    pushedAt: r.pushed_at,
    createdAt: r.created_at,
    homepage: r.homepage || null,
    topics: r.topics ?? [],
    isFork: r.fork,
    isArchived: r.archived,
  }));
}

/** Up to 300 public events from the last 90 days, keeping only pages that continue the timeline. */
async function fetchEvents() {
  const accepted = [];
  let truncated = false;
  for (const page of [1, 2, 3]) {
    const batch = await gh(`/users/${username}/events/public?per_page=100&page=${page}`).catch(() => null);
    const prevOldest = accepted.at(-1)?.created_at;
    const continues = batch?.length > 0 && (!prevOldest || Date.parse(batch[0].created_at) >= Date.parse(prevOldest) - 2 * DAY);
    if (!continues) {
      truncated = accepted.length > 0 && accepted.length % 100 === 0;
      break;
    }
    accepted.push(...batch);
    if (batch.length < 100) break;
    if (page === 3) truncated = true;
  }
  const list = accepted.map(slim);
  const oldest = list.reduce((min, e) => (!min || e.created_at < min ? e.created_at : min), undefined);
  return { list, truncated: truncated && Boolean(oldest), oldest };
}

/** Keep only the event fields the site reads. */
function slim(e) {
  const p = e.payload ?? {};
  return {
    id: e.id,
    type: e.type,
    created_at: e.created_at,
    repo: { name: e.repo.name },
    payload: {
      ...(p.action ? { action: p.action } : {}),
      ...(p.ref !== undefined ? { ref: p.ref } : {}),
      ...(p.ref_type ? { ref_type: p.ref_type } : {}),
      ...(p.head ? { head: p.head } : {}),
      ...(p.before ? { before: p.before } : {}),
      ...(p.size !== undefined ? { size: p.size } : {}),
      ...(p.commits?.length ? { commits: p.commits.map((c) => ({ sha: c.sha, message: c.message })) } : {}),
      ...(p.pull_request
        ? { pull_request: { number: p.pull_request.number ?? p.number, title: p.pull_request.title, html_url: p.pull_request.html_url, merged: p.pull_request.merged } }
        : {}),
      ...(p.issue ? { issue: { number: p.issue.number, title: p.issue.title, html_url: p.issue.html_url } } : {}),
      ...(p.release ? { release: { tag_name: p.release.tag_name, name: p.release.name, html_url: p.release.html_url } } : {}),
    },
  };
}

function weight(e) {
  if (e.type !== 'PushEvent') return 1;
  return Math.max(1, e.payload.size ?? e.payload.commits?.length ?? e.payload.enriched?.count ?? 1);
}

/** Adds commit counts and messages to recent pushes that lack them. */
async function enrichPushes(list) {
  const todo = list.filter((e) => e.type === 'PushEvent' && !e.payload.commits && !e.payload.enriched && e.payload.head).slice(0, 20);
  await Promise.all(
    todo.map(async (e) => {
      const repo = e.repo.name;
      try {
        const zero = !e.payload.before || /^0+$/.test(e.payload.before);
        if (!zero) {
          const cmp = await gh(`/repos/${repo}/compare/${e.payload.before}...${e.payload.head}`);
          const last = cmp.commits?.at(-1);
          e.payload.enriched = { count: cmp.total_commits ?? cmp.commits?.length ?? 1, message: last?.commit?.message?.split('\n')[0] ?? null };
        } else {
          const c = await gh(`/repos/${repo}/commits/${e.payload.head}`);
          e.payload.enriched = { count: 1, message: c.commit?.message?.split('\n')[0] ?? null };
        }
      } catch {
        // Force-pushed or deleted history: leave the event as a plain push.
        e.payload.enriched = { count: 1, message: null };
      }
    }),
  );
}

async function fetchLanguages(list) {
  const out = {};
  await Promise.all(
    list
      .filter((r) => !r.isFork)
      .slice(0, 12)
      .map(async (r) => {
        out[r.name] = await gh(`/repos/${username}/${r.name}/languages`).catch(() => undefined);
      }),
  );
  return out;
}

/** A year of daily contribution counts, exactly as on the GitHub profile. */
async function fetchCalendar() {
  const to = new Date();
  const from = new Date(to.getTime() - 365 * DAY);
  const query = `query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
      }
    }
  }`;
  const res = await fetch(`${API}/graphql`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': `${username}-personal-site` },
    body: JSON.stringify({ query, variables: { login: username, from: from.toISOString(), to: to.toISOString() } }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`GraphQL ${res.status}`);
  const json = await res.json();
  const cal = json.data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal) throw new Error(json.errors?.[0]?.message ?? 'no calendar in response');
  const days = {};
  for (const w of cal.weeks) for (const d of w.contributionDays) if (d.contributionCount) days[d.date] = d.contributionCount;
  return { days, total: cal.totalContributions };
}
