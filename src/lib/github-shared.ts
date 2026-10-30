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
  homepage: string | null;
  topics: string[];
  isFork: boolean;
  isArchived: boolean;
  /** Translations from src/content/projects.yaml, merged in at build time. */
  descriptions?: Partial<Record<Locale, string>>;
  /** Pinned to the top of the home page list (projects.yaml). */
  featured?: boolean;
}

/** The repository description in the reader's language, falling back to GitHub's. */
export function repoDescription(repo: Repo, locale: Locale): string | null {
  return repo.descriptions?.[locale] || repo.description;
}

export interface ActivityEvent {
  id: string;
  type: string;
  /** Repository name without the owner. */
  repo: string;
  createdAt: string;
  /** One-line human summary, e.g. a commit message. */
  title: string;
  url: string;
  /** How much this event adds to the day's activity (commits in a push, otherwise 1). */
  weight: number;
}

export interface GitHubData {
  username: string;
  /** True when no username is configured or the API could not be reached. */
  sample: boolean;
  fetchedAt: string;
  source: 'graphql' | 'events' | 'sample';
  repos: Repo[];
  /** Contributions per day, keyed by YYYY-MM-DD. */
  days: Record<string, number>;
  /** Most recent activity, newest first. */
  events: ActivityEvent[];
  /**
   * First day the counts are complete for (YYYY-MM-DD). Set when the public
   * events API ran out of history before the pulse window began; earlier
   * days are shown as unavailable rather than as zero.
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
    size?: number;
    commits?: { sha: string; message: string }[];
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
  const branch = p.ref?.replace('refs/heads/', '') ?? 'main';
  const base = { id: e.id, type: e.type, repo, createdAt: e.created_at };

  switch (e.type) {
    case 'PushEvent': {
      const commits = p.commits ?? [];
      const last = commits.at(-1);
      const weight = p.size ?? (commits.length || 1);
      return {
        ...base,
        title: last ? firstLine(last.message) : `Pushed to ${branch}`,
        url: last ? `${repoUrl}/commit/${last.sha}` : p.head ? `${repoUrl}/commit/${p.head}` : repoUrl,
        weight: Math.max(1, weight),
      };
    }
    case 'PullRequestEvent': {
      const pr = p.pull_request;
      const verb = p.action === 'closed' && pr?.merged ? 'Merged' : capitalize(p.action ?? 'Updated');
      return {
        ...base,
        title: `${verb} pull request #${pr?.number ?? ''}${pr?.title ? `: ${pr.title}` : ''}`,
        url: pr?.html_url ?? repoUrl,
        weight: 1,
      };
    }
    case 'IssuesEvent': {
      const issue = p.issue;
      return {
        ...base,
        title: `${capitalize(p.action ?? 'Updated')} issue #${issue?.number ?? ''}${issue?.title ? `: ${issue.title}` : ''}`,
        url: issue?.html_url ?? repoUrl,
        weight: 1,
      };
    }
    case 'CreateEvent':
      return {
        ...base,
        title: p.ref_type === 'repository' ? 'Created the repository' : `Created ${p.ref_type} ${p.ref ?? ''}`.trim(),
        url: repoUrl,
        weight: 1,
      };
    case 'ReleaseEvent':
      return {
        ...base,
        title: `Released ${p.release?.name || p.release?.tag_name || 'a new version'}`,
        url: p.release?.html_url ?? `${repoUrl}/releases`,
        weight: 1,
      };
    case 'PublicEvent':
      return { ...base, title: 'Made the repository public', url: repoUrl, weight: 1 };
    case 'PullRequestReviewEvent':
      return { ...base, title: `Reviewed pull request #${p.pull_request?.number ?? ''}`, url: p.pull_request?.html_url ?? repoUrl, weight: 1 };
    case 'IssueCommentEvent':
      return { ...base, title: `Commented on #${p.issue?.number ?? ''}`, url: p.issue?.html_url ?? repoUrl, weight: 1 };
    default:
      return null;
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "271 contributions in the last 13 weeks", or "… since Oct 16" when history is partial. */
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
  Ruby: '#701516',
  PHP: '#4F5D95',
  Dart: '#00B4AB',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Astro: '#ff5a03',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Shell: '#89e051',
  Lua: '#000080',
  Zig: '#ec915c',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  'Jupyter Notebook': '#DA5B0B',
  MDX: '#fcb32c',
  Dockerfile: '#384d54',
  Nix: '#7e7eff',
};
