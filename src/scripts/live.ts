/**
 * Live GitHub updates in the browser.
 *
 * The build embeds a snapshot of your GitHub data in the page. While the page
 * is open, this module polls GitHub's public events API and folds new activity
 * into the pulse, the latest-activity line and the repository ledger.
 *
 * It is polite with the API: conditional requests with ETags, it honours
 * GitHub's X-Poll-Interval header, it pauses while the tab is hidden, and it
 * backs off when the anonymous rate limit (60 requests per hour) runs low.
 *
 * It also runs the pulse's hover and keyboard reading, and the ledger's sort
 * and filter controls.
 */
import {
  dayKey,
  eventDetail,
  eventTitle,
  lastDays,
  normalizeEvent,
  pulseSummary,
  PULSE_DAYS,
  type ActivityEvent,
  type GitHubData,
  type RawEvent,
} from '../lib/github-shared';
import { compactNumber, relativeTime } from '../lib/format';
import { LOCALE_INFO, isLocale, type Locale } from '../i18n/config';
import { UI_TEXT } from '../i18n/ui';

const API = 'https://api.github.com';
const MIN_EVENTS_INTERVAL = 60_000;
const REPOS_INTERVAL = 10 * 60_000;

interface State {
  data: GitHubData;
  seen: Set<string>;
  etags: Record<string, string>;
  eventsInterval: number;
  lastEventsPoll: number;
  lastReposPoll: number;
  pausedUntil: number;
  timer?: number;
}

let state: State | undefined;
let clock: number | undefined;
let drawnOnce = false;
let sortMode: 'recent' | 'stars' = 'recent';

function locale(): Locale {
  const l = document.documentElement.dataset.locale;
  return isLocale(l) ? l : 'en';
}

/** Called on every page load. Binds the current page to the shared live state. */
export function mountLive() {
  const el = document.getElementById('github-data');
  if (!el) return;

  if (!state) {
    const data = JSON.parse(el.textContent || '{}') as GitHubData;
    state = {
      data,
      seen: new Set(data.events.map((e) => e.id)),
      etags: {},
      eventsInterval: MIN_EVENTS_INTERVAL,
      lastEventsPoll: 0,
      lastReposPoll: Date.now(),
      pausedUntil: 0,
    };
    if (!data.sample && data.username) {
      document.addEventListener('visibilitychange', onVisibility);
      schedule(4_000); // the build may be hours old, so catch up soon after load
    }
  }

  sortMode = 'recent';
  renderPulse(state.data.days);
  bindPulse();
  renderLatest(state.data.events[0], false);
  applyRepos(false);
  bindLedgerControls();
  refreshTimes();

  const pulse = document.querySelector<HTMLElement>('[data-pulse]');
  if (pulse) {
    if (drawnOnce) pulse.setAttribute('data-drawn', '');
    else window.setTimeout(() => pulse.setAttribute('data-drawn', ''), 1800);
    drawnOnce = true;
  }

  window.clearInterval(clock);
  clock = window.setInterval(refreshTimes, 30_000);
}

/* ------------------------------------------------------------------ */
/* Polling                                                             */
/* ------------------------------------------------------------------ */

function schedule(delay: number) {
  if (!state) return;
  window.clearTimeout(state.timer);
  state.timer = window.setTimeout(tick, Math.max(0, delay));
}

async function tick() {
  if (!state || document.hidden) return; // resumed by onVisibility
  const now = Date.now();
  if (now < state.pausedUntil) return schedule(state.pausedUntil - now + 1000);

  try {
    await pollEvents();
    if (now - state.lastReposPoll >= REPOS_INTERVAL) await pollRepos();
    markSynced();
  } catch {
    // Network hiccup: try again on the next tick without bothering the reader.
  }
  schedule(state.eventsInterval);
}

function onVisibility() {
  if (!state || document.hidden) return;
  const since = Date.now() - state.lastEventsPoll;
  schedule(since >= state.eventsInterval ? 0 : state.eventsInterval - since);
}

async function request<T>(path: string): Promise<T | null> {
  if (!state) return null;
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  const etag = state.etags[path];
  if (etag) headers['If-None-Match'] = etag;

  const res = await fetch(API + path, { headers, cache: 'no-cache' });

  const remaining = Number(res.headers.get('X-RateLimit-Remaining') ?? NaN);
  const reset = Number(res.headers.get('X-RateLimit-Reset') ?? NaN) * 1000;
  if (res.status === 403 || res.status === 429 || (Number.isFinite(remaining) && remaining <= 3)) {
    state.pausedUntil = Number.isFinite(reset) && reset > Date.now() ? reset : Date.now() + 15 * 60_000;
  }

  const poll = Number(res.headers.get('X-Poll-Interval'));
  if (poll) state.eventsInterval = Math.max(MIN_EVENTS_INTERVAL, poll * 1000);

  if (res.status === 304) return null;
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const newTag = res.headers.get('ETag');
  if (newTag) state.etags[path] = newTag;
  return (await res.json()) as T;
}

async function pollEvents() {
  if (!state) return;
  const s = state;
  s.lastEventsPoll = Date.now();
  const raw = await request<RawEvent[]>(`/users/${s.data.username}/events/public?per_page=30`);
  if (!raw) return;

  const fresh = raw
    .map(normalizeEvent)
    .filter((e): e is ActivityEvent => e !== null && !s.seen.has(e.id))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (fresh.length === 0) return;

  const bumped = new Set<string>();
  for (const e of fresh) {
    s.seen.add(e.id);
    // Only count activity the build snapshot could not have included.
    if (e.createdAt > s.data.fetchedAt) {
      const key = dayKey(new Date(e.createdAt));
      s.data.days[key] = (s.data.days[key] ?? 0) + e.weight;
      bumped.add(key);
    }
    const repo = s.data.repos.find((r) => r.name === e.repo);
    if (repo && e.kind === 'push' && e.createdAt > repo.pushedAt) repo.pushedAt = e.createdAt;
  }

  s.data.events = [...fresh, ...s.data.events].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 40);

  renderPulse(s.data.days, bumped);
  renderLatest(s.data.events[0], true);
  applyRepos(true);
}

interface RawRepo {
  name: string;
  stargazers_count: number;
  pushed_at: string;
}

async function pollRepos() {
  if (!state) return;
  const s = state;
  s.lastReposPoll = Date.now();
  const raw = await request<RawRepo[]>(`/users/${s.data.username}/repos?per_page=100&sort=pushed&type=owner`);
  if (!raw) return;
  for (const r of raw) {
    const repo = s.data.repos.find((x) => x.name === r.name);
    if (!repo) continue;
    repo.stars = r.stargazers_count;
    if (r.pushed_at > repo.pushedAt) repo.pushedAt = r.pushed_at;
  }
  applyRepos(true);
}

function markSynced() {
  document.querySelectorAll<HTMLTimeElement>('time[data-synced]').forEach((t) => {
    t.dateTime = new Date().toISOString();
    t.textContent = relativeTime(t.dateTime, locale());
  });
}

/* ------------------------------------------------------------------ */
/* Pulse                                                               */
/* ------------------------------------------------------------------ */

function renderPulse(days: Record<string, number>, bumped = new Set<string>()) {
  const plot = document.querySelector<HTMLElement>('[data-pulse-plot]');
  if (!plot) return;

  const keys = lastDays(PULSE_DAYS);
  const coverageFrom = state?.data.coverageFrom;
  const counts = keys.map((k) => days[k] ?? 0);
  const max = Math.max(1, ...counts);
  const total = counts.reduce((a, b) => a + b, 0);
  const height = (n: number) => (n ? 0.1 + 0.9 * Math.sqrt(n / max) : 0);

  let ticks = [...plot.querySelectorAll<HTMLElement>('.tick')];
  // The reader's calendar may differ from the build's (a new day, another time zone).
  if (ticks.length !== keys.length || ticks.some((t, i) => t.dataset.date !== keys[i])) {
    const scope = [...plot.attributes].find((a) => a.name.startsWith('data-astro-cid'));
    ticks.forEach((t) => t.remove());
    const anchor = plot.querySelector('[data-pulse-cursor]');
    ticks = keys.map((k, i) => {
      const t = document.createElement('span');
      t.className = 'tick';
      t.dataset.date = k;
      t.style.setProperty('--i', String(i));
      // Astro scopes component styles with an attribute; new nodes need it too.
      if (scope) t.setAttribute(scope.name, '');
      plot.insertBefore(t, anchor);
      return t;
    });
  }

  ticks.forEach((t, i) => {
    t.dataset.count = String(counts[i]);
    t.style.setProperty('--h', height(counts[i]).toFixed(3));
    t.classList.toggle('tick--idle', counts[i] === 0);
    t.classList.toggle('tick--nodata', Boolean(coverageFrom && keys[i] < coverageFrom));
    t.classList.toggle('tick--today', i === keys.length - 1);
    if (bumped.has(keys[i])) {
      t.removeAttribute('data-bumped');
      void t.offsetWidth;
      t.setAttribute('data-bumped', '');
    }
  });

  const label = pulseSummary(total, coverageFrom, locale());
  plot.setAttribute('aria-label', label);
  document.querySelectorAll('[data-pulse-summary], [data-pulse-total]').forEach((el) => (el.textContent = label));
}

/** Hover with a pointer, or focus the plot and use the arrow keys, to read a day. */
function bindPulse() {
  const plot = document.querySelector<HTMLElement>('[data-pulse-plot]');
  const tip = plot?.querySelector<HTMLElement>('[data-pulse-tip]');
  const cursor = plot?.querySelector<HTMLElement>('[data-pulse-cursor]');
  const live = document.querySelector<HTMLElement>('[data-pulse-live]');
  if (!plot || !tip || !cursor || plot.dataset.bound) return;
  plot.dataset.bound = '1';

  let active = -1;
  const ticks = () => plot.querySelectorAll<HTMLElement>('.tick');

  const show = (i: number, announce: boolean) => {
    const all = ticks();
    i = Math.min(all.length - 1, Math.max(0, i));
    if (i === active) return;
    all[active]?.removeAttribute('data-active');
    active = i;
    const t = all[i];
    t.setAttribute('data-active', '');
    plot.setAttribute('data-reading', '');

    const text = UI_TEXT[locale()].pulse;
    const isToday = i === all.length - 1;
    const date = new Intl.DateTimeFormat(LOCALE_INFO[locale()].intl, { weekday: 'short', month: 'short', day: 'numeric' }).format(
      new Date(t.dataset.date + 'T12:00:00'),
    );
    const value = t.classList.contains('tick--nodata') ? text.unavailable : text.day(Number(t.dataset.count));
    const label = isToday ? `${text.today}, ${date}` : date;
    tip.innerHTML = `${escapeHtml(label)}<strong>${escapeHtml(value)}</strong>`;
    tip.hidden = false;
    if (announce && live) live.textContent = `${label}: ${value}`;

    const width = plot.clientWidth;
    const x = ((i + 0.5) / all.length) * width;
    const half = tip.offsetWidth / 2;
    tip.style.left = `${Math.min(width - half, Math.max(half, x))}px`;
    cursor.style.setProperty('--cx', `${x}px`);
  };

  const clear = () => {
    ticks()[active]?.removeAttribute('data-active');
    active = -1;
    tip.hidden = true;
    plot.removeAttribute('data-reading');
  };

  plot.addEventListener('pointermove', (e) => {
    const rect = plot.getBoundingClientRect();
    show(Math.floor(((e.clientX - rect.left) / rect.width) * ticks().length), false);
  });
  plot.addEventListener('pointerleave', () => {
    if (document.activeElement !== plot) clear();
  });

  plot.addEventListener('focus', () => show(ticks().length - 1, true));
  plot.addEventListener('blur', clear);
  plot.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, PageUp: -7, PageDown: 7 }[e.key];
    if (step !== undefined) {
      e.preventDefault();
      show((active < 0 ? ticks().length - 1 : active) + step, true);
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      show(e.key === 'Home' ? 0 : ticks().length - 1, true);
    } else if (e.key === 'Escape') {
      plot.blur();
    }
  });
}

/* ------------------------------------------------------------------ */
/* Latest activity                                                     */
/* ------------------------------------------------------------------ */

function renderLatest(event: ActivityEvent | undefined, animate: boolean) {
  const link = document.querySelector<HTMLAnchorElement>('[data-latest]');
  if (!link || !event) return;
  const title = link.querySelector<HTMLElement>('[data-latest-title]');
  const text = eventTitle(event, locale());
  const unchanged = title?.textContent?.trim() === text && link.getAttribute('href') === event.url;

  link.href = event.url;
  if (title) {
    title.textContent = text;
    if (event.subject) title.lang = 'en';
    else title.removeAttribute('lang');
  }
  const detail = link.querySelector('[data-latest-detail]');
  if (detail) detail.textContent = eventDetail(event, locale());
  const repo = link.querySelector('[data-latest-repo]');
  if (repo) repo.textContent = event.repo;
  const time = link.querySelector<HTMLTimeElement>('[data-latest-time]');
  if (time) {
    time.dateTime = event.createdAt;
    time.textContent = relativeTime(event.createdAt, locale());
  }
  if (animate && !unchanged) {
    link.removeAttribute('data-fresh');
    void link.offsetWidth;
    link.setAttribute('data-fresh', '');
  }
}

/* ------------------------------------------------------------------ */
/* Ledger                                                              */
/* ------------------------------------------------------------------ */

/** Update rows from state and keep them in the chosen order (animated). */
function applyRepos(animate: boolean) {
  const tbody = document.querySelector<HTMLElement>('[data-ledger] tbody');
  if (!tbody || !state) return;
  const rows = [...tbody.querySelectorAll<HTMLTableRowElement>('tr[data-repo]')];

  for (const row of rows) {
    const repo = state.data.repos.find((r) => r.name === row.dataset.repo);
    if (!repo) continue;
    const changed = row.dataset.pushed !== repo.pushedAt;
    row.dataset.pushed = repo.pushedAt;
    row.dataset.starsCount = String(repo.stars);
    const time = row.querySelector<HTMLTimeElement>('time[data-time]');
    if (time) {
      time.dateTime = repo.pushedAt;
      time.textContent = relativeTime(repo.pushedAt, locale());
    }
    const stars = row.querySelector('[data-stars]');
    if (stars) stars.textContent = compactNumber(repo.stars, locale());
    if (animate && changed) {
      row.removeAttribute('data-fresh');
      void row.offsetWidth;
      row.setAttribute('data-fresh', '');
    }
  }
  if (animate) reorder(tbody, true);
}

function reorder(tbody: HTMLElement, animate: boolean) {
  const rows = [...tbody.querySelectorAll<HTMLTableRowElement>('tr[data-repo]')];
  const featured = new Set(state?.data.repos.filter((r) => r.featured).map((r) => r.name));
  const sorted = [...rows].sort((a, b) => {
    if (sortMode === 'stars') return Number(b.dataset.starsCount) - Number(a.dataset.starsCount);
    // Recent: featured repositories stay first, in their configured order
    const fa = featured.has(a.dataset.repo!);
    const fb = featured.has(b.dataset.repo!);
    if (fa || fb) return fa && fb ? 0 : fa ? -1 : 1;
    return (b.dataset.pushed ?? '').localeCompare(a.dataset.pushed ?? '');
  });
  if (sorted.every((r, i) => r === rows[i])) return;

  const before = new Map(rows.map((r) => [r, r.getBoundingClientRect().top]));
  sorted.forEach((r) => tbody.append(r));
  if (!animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (const row of sorted) {
    const dy = (before.get(row) ?? 0) - row.getBoundingClientRect().top;
    if (!dy) continue;
    row.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], {
      duration: 480,
      easing: 'cubic-bezier(0.2, 0.7, 0.1, 1)',
    });
  }
}

function bindLedgerControls() {
  const filter = document.querySelector<HTMLElement>('[data-repo-filter]');
  if (filter && !filter.dataset.bound) {
    filter.dataset.bound = '1';
    filter.addEventListener('click', (e) => {
      const btn = (e.target as Element).closest<HTMLButtonElement>('button[data-lang]');
      if (!btn) return;
      const lang = btn.dataset.lang ?? '';
      filter.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      document.querySelectorAll<HTMLTableRowElement>('[data-ledger] tr[data-repo]').forEach((row) => {
        row.hidden = lang !== '' && row.dataset.lang !== lang;
      });
    });
  }

  const sort = document.querySelector<HTMLElement>('[data-repo-sort]');
  if (sort && !sort.dataset.bound) {
    sort.dataset.bound = '1';
    sort.addEventListener('click', (e) => {
      const btn = (e.target as Element).closest<HTMLButtonElement>('button[data-sort]');
      const tbody = document.querySelector<HTMLElement>('[data-ledger] tbody');
      if (!btn || !tbody) return;
      sortMode = btn.dataset.sort === 'stars' ? 'stars' : 'recent';
      sort.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      reorder(tbody, true);
    });
  }
}

function refreshTimes() {
  const l = locale();
  document.querySelectorAll<HTMLTimeElement>('time[data-time]').forEach((t) => {
    if (t.dateTime) t.textContent = relativeTime(t.dateTime, l);
  });
}

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => HTML_ESCAPES[c]);
}
