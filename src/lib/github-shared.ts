/**
 * Types and helpers shared by the build (src/lib/github.ts) and the browser
 * (src/scripts/live.ts). Keep this file free of Node or DOM APIs.
 */
import { LOCALE_INFO, type Locale } from '../i18n/config';
import { UI_TEXT } from '../i18n/ui';

export interface Repo {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  pushedAt: string;
  createdAt?: string;
  homepage: string | null;
  topics: string[];
  isFork: boolean;
  isArchived: boolean;
  /** Bytes of code per language, from GitHub's languages API. */
  languages?: Record<string, number>;
  /** Translations from src/content/projects.yaml, merged in at build time. */
  descriptions?: Partial<Record<Locale, string>>;
  /** Pinned to the top of the lists (projects.yaml). */
  featured?: boolean;
  /** Slug of a case study page for this repository, if there is one. */
  caseStudy?: string;
}

/** The repository description in the reader's language, falling back to GitHub's. */
export function repoDescription(repo: Repo, locale: Locale): string | null {
  return repo.descriptions?.[locale] || repo.description;
}

export type EventKind = 'push' | 'pr' | 'issue' | 'create' | 'release' | 'public' | 'review' | 'comment';

/**
 * One piece of public activity, stored as data rather than as an English
 * sentence, so every language can phrase it (see eventTitle).
 */
export interface ActivityEvent {
  id: string;
  kind: EventKind;
  /** Repository name without the owner. */
  repo: string;
  createdAt: string;
  url: string;
  /** How much this event adds to the day's activity (commits in a push, otherwise 1). */
  weight: number;
  /** Commit message, pull request title, release name… written by the author. */
  subject?: string;
  action?: string;
  number?: number;
  ref?: string;
  refType?: string;
  /** Commits in a push. */
  count?: number;
}

export interface GitHubData {
  username: string;
  /** True only when no username is configured. */
  sample: boolean;
  fetchedAt: string;
  source: 'graphql' | 'graphql+events' | 'events' | 'sample';
  /** Sources that could not be refreshed in the last fetch and were kept from the saved copy. */
  partial?: string[];
  profile?: { login: string; name: string | null; avatar: string; followers: number; publicRepos: number; createdAt: string } | null;
  /** Contributions in the last 365 days, from the GitHub calendar. */
  yearTotal?: number | null;
  repos: Repo[];
  /** Contributions per day, keyed by YYYY-MM-DD. */
  days: Record<string, number>;
  /** Most recent activity, newest first. */
  events: ActivityEvent[];
  /**
   * First day the counts are complete for (YYYY-MM-DD). Set when only the
   * public events API was available and its history ran out inside the
   * pulse window; earlier days are shown as unavailable rather than zero.
   */
  coverageFrom?: string;
}

export const PULSE_DAYS = 91;

/** Activity GitHub returns that we don't treat as your own work. */
const IGNORED = new Set(['WatchEvent', 'ForkEvent', 'MemberEvent', 'GollumEvent', 'SponsorshipEvent']);

// GitHub's REST event payload, loosely typed: only the fields we read.
export interface RawEvent {
  id: string;
  type: string;
  created_at: string;
  repo: { name: string };
  payload: {
    action?: string;
    ref?: string | null;
    ref_type?: string;
    head?: string;
    before?: string;
    size?: number;
    commits?: { sha: string; message: string }[];
    /** Added by scripts/fetch-github.mjs for pushes without a commit list. */
    enriched?: { count: number; message: string | null };
    pull_request?: { number: number; title?: string; html_url?: string; merged?: boolean };
    issue?: { number: number; title?: string; html_url?: string };
    release?: { tag_name?: string; name?: string; html_url?: string };
  };
}

const firstLine = (s: string) => s.split('\n')[0].trim();

export function normalizeEvent(e: RawEvent): ActivityEvent | null {
  if (IGNORED.has(e.type)) return null;
  const [owner, repo] = e.repo.name.split('/');
  const repoUrl = `https://github.com/${owner}/${repo}`;
  const p = e.payload ?? {};
  const ref = p.ref?.replace('refs/heads/', '').replace('refs/tags/', '') ?? undefined;
  const base = { id: e.id, repo, createdAt: e.created_at };

  switch (e.type) {
    case 'PushEvent': {
      const commits = p.commits ?? [];
      const last = commits.at(-1);
      const count = Math.max(1, p.size ?? (commits.length || p.enriched?.count || 1));
      const subject = last ? firstLine(last.message) : (p.enriched?.message ?? undefined);
      return {
        ...base,
        kind: 'push',
        ref,
        count,
        subject,
        url: last ? `${repoUrl}/commit/${last.sha}` : p.head ? `${repoUrl}/commit/${p.head}` : repoUrl,
        weight: count,
      };
    }
    case 'PullRequestEvent': {
      const pr = p.pull_request;
      const action = p.action === 'closed' && pr?.merged ? 'merged' : (p.action ?? 'updated');
      return { ...base, kind: 'pr', action, number: pr?.number, subject: pr?.title, url: pr?.html_url ?? `${repoUrl}/pulls`, weight: 1 };
    }
    case 'IssuesEvent':
      return { ...base, kind: 'issue', action: p.action ?? 'updated', number: p.issue?.number, subject: p.issue?.title, url: p.issue?.html_url ?? repoUrl, weight: 1 };
    case 'CreateEvent':
      return { ...base, kind: 'create', refType: p.ref_type, ref, url: repoUrl, weight: 1 };
    case 'ReleaseEvent':
      return { ...base, kind: 'release', subject: p.release?.name || p.release?.tag_name, url: p.release?.html_url ?? `${repoUrl}/releases`, weight: 1 };
    case 'PublicEvent':
      return { ...base, kind: 'public', url: repoUrl, weight: 1 };
    case 'PullRequestReviewEvent':
      return { ...base, kind: 'review', number: p.pull_request?.number, url: p.pull_request?.html_url ?? repoUrl, weight: 1 };
    case 'IssueCommentEvent':
      return { ...base, kind: 'comment', number: p.issue?.number, url: p.issue?.html_url ?? repoUrl, weight: 1 };
    default:
      return null;
  }
}

/** A one-line description of an event in the reader's language. */
export function eventTitle(e: ActivityEvent, locale: Locale): string {
  const t = UI_TEXT[locale].events;
  switch (e.kind) {
    case 'push':
      return e.subject || t.pushed(e.ref ?? 'main');
    case 'pr':
      return t.pr(e.action ?? 'updated', e.number) + (e.subject ? t.colon + e.subject : '');
    case 'issue':
      return t.issue(e.action ?? 'updated', e.number) + (e.subject ? t.colon + e.subject : '');
    case 'create':
      return e.refType === 'repository' || !e.refType ? t.createdRepo : t.created(e.refType, e.ref ?? '');
    case 'release':
      return t.released(e.subject ?? '');
    case 'public':
      return t.madePublic;
    case 'review':
      return t.reviewed(e.number);
    case 'comment':
      return t.commented(e.number);
  }
}

/** Extra detail for a push: "22 commits on main". Empty for single commits. */
export function eventDetail(e: ActivityEvent, locale: Locale): string {
  if (e.kind !== 'push' || !e.subject) return '';
  return UI_TEXT[locale].events.commits(e.count ?? 1, e.ref ?? 'main');
}

/** "37 contributions in the last 13 weeks", or "… since Oct 16" when history is partial. */
export function pulseSummary(total: number, coverageFrom: string | undefined, locale: Locale): string {
  const t = UI_TEXT[locale].pulse;
  const windowStart = lastDays(PULSE_DAYS)[0];
  if (coverageFrom && coverageFrom > windowStart) {
    const since = new Intl.DateTimeFormat(LOCALE_INFO[locale].intl, { month: 'short', day: 'numeric' }).format(
      new Date(coverageFrom + 'T12:00:00'),
    );
    return t.since(total, since);
  }
  return t.summary(total, Math.round(PULSE_DAYS / 7));
}

/** Local calendar date as YYYY-MM-DD. */
export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** The last `count` calendar days ending today, oldest first. */
export function lastDays(count = PULSE_DAYS, today = new Date()): string[] {
  const out: string[] = [];
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  for (let i = count - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    out.push(dayKey(x));
  }
  return out;
}

/** Share of each language in a repository, largest first, as fractions of 1. */
export function languageShares(repo: Repo, limit = 4): { name: string; share: number }[] {
  const entries = Object.entries(repo.languages ?? {});
  const total = entries.reduce((a, [, n]) => a + n, 0);
  if (!total) return repo.language ? [{ name: repo.language, share: 1 }] : [];
  const sorted = entries.sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, share: n / total }));
  const head = sorted.slice(0, limit);
  const rest = sorted.slice(limit).reduce((a, x) => a + x.share, 0);
  return rest > 0.005 ? [...head, { name: 'Other', share: rest }] : head;
}

/** GitHub's own language colours for the languages people use most. */
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  CMake: '#DA3434',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Dart: '#00B4AB',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Astro: '#ff5a03',
  HTML: '#e34c26',
  CSS: '#663399',
  SCSS: '#c6538c',
  Shell: '#89e051',
  PowerShell: '#012456',
  Lua: '#000080',
  Zig: '#ec915c',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  'Jupyter Notebook': '#DA5B0B',
  MDX: '#fcb32c',
  Dockerfile: '#384d54',
  Nix: '#7e7eff',
  Other: '#9aa0aa',
};
