/**
 * Command palette. Opens with Ctrl/⌘ K, "/" or the search button; searches
 * the current language's index (/search/<lang>.json), which loads on first
 * open. Fully keyboard operable: arrows to move, Enter to open, Esc to close.
 */
import { navigate } from 'astro:transitions/client';

interface Entry {
  type: 'page' | 'post' | 'repo' | 'work';
  title: string;
  url: string;
  text?: string;
  keywords?: string;
  badge?: string;
  external?: boolean;
}

interface Strings {
  empty: string;
  loading: string;
  error: string;
  groups: Record<Entry['type'], string>;
}

const indexes = new Map<string, Promise<Entry[]>>();
let results: Entry[] = [];
let selected = 0;

const isMac = () => /Mac|iPhone|iPad/.test(navigator.userAgent);

function els() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-search]');
  return {
    dialog,
    input: dialog?.querySelector<HTMLInputElement>('[data-search-input]'),
    list: dialog?.querySelector<HTMLElement>('[data-search-results]'),
    status: dialog?.querySelector<HTMLElement>('[data-search-status]'),
    strings: JSON.parse(dialog?.dataset.strings ?? '{}') as Strings,
  };
}

function loadIndex(url: string): Promise<Entry[]> {
  if (!indexes.has(url)) {
    const request = fetch(url).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<Entry[]>;
    });
    request.catch(() => indexes.delete(url)); // allow a retry next time
    indexes.set(url, request);
  }
  return indexes.get(url)!;
}

export async function openSearch() {
  const { dialog, input, status, strings } = els();
  if (!dialog || !input || dialog.open) return;
  dialog.showModal();
  input.value = '';
  input.focus();
  if (status) status.textContent = strings.loading;
  try {
    const index = await loadIndex(dialog.dataset.index!);
    if (status) status.textContent = '';
    update(index, '');
    input.oninput = () => update(index, input.value);
  } catch {
    if (status) status.textContent = strings.error;
  }
}

function closeSearch() {
  els().dialog?.close();
}

const normalize = (s: string) => s.toLowerCase().normalize('NFKC');

function score(entry: Entry, terms: string[]): number {
  const title = normalize(entry.title);
  const text = normalize(entry.text ?? '');
  const keys = normalize(entry.keywords ?? '');
  let total = 0;
  for (const term of terms) {
    if (title.startsWith(term)) total += 6;
    else if (title.includes(term)) total += 4;
    else if (keys.includes(term)) total += 2;
    else if (text.includes(term)) total += 1;
    else return 0; // every term must match somewhere
  }
  return total + (entry.type === 'post' ? 0.5 : entry.type === 'work' ? 0.8 : 0);
}

function update(index: Entry[], query: string) {
  const { list, status, strings } = els();
  if (!list || !status) return;
  const terms = normalize(query).split(/\s+/).filter(Boolean);

  if (terms.length === 0) {
    // Before typing: the pages, then the latest posts
    results = [...index.filter((e) => e.type === 'page'), ...index.filter((e) => e.type === 'work'), ...index.filter((e) => e.type === 'post').slice(0, 5)];
  } else {
    results = index
      .map((e) => ({ e, s: score(e, terms) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.e);
  }

  const order: Entry['type'][] = ['page', 'work', 'post', 'repo'];
  const grouped = order.map((type) => ({ type, items: results.filter((r) => r.type === type).slice(0, 6) }));
  results = grouped.flatMap((g) => g.items);
  selected = 0;

  status.textContent = results.length === 0 && terms.length ? strings.empty.replace('%s', query.trim()) : '';
  list.innerHTML = grouped
    .filter((g) => g.items.length)
    .map(
      (g) =>
        `<div role="presentation"><p class="search__group" role="presentation">${escape(strings.groups[g.type])}</p>${g.items
          .map((item) => option(item, results.indexOf(item), terms))
          .join('')}</div>`,
    )
    .join('');
  highlight();
}

function option(item: Entry, i: number, terms: string[]): string {
  return `<div role="option" id="search-opt-${i}" data-index="${i}" aria-selected="false">
    <span class="search__title">${mark(item.title, terms)}${item.badge ? `<span class="search__badge">${escape(item.badge)}</span>` : ''}</span>
    ${item.text ? `<span class="search__text">${escape(item.text)}</span>` : ''}
  </div>`;
}

function highlight() {
  const { list, input } = els();
  if (!list || !input) return;
  list.querySelectorAll<HTMLElement>('[role="option"]').forEach((el) => {
    const on = Number(el.dataset.index) === selected;
    el.setAttribute('aria-selected', String(on));
    if (on) el.scrollIntoView({ block: 'nearest' });
  });
  input.setAttribute('aria-activedescendant', results.length ? `search-opt-${selected}` : '');
}

function go(i: number) {
  const item = results[i];
  if (!item) return;
  closeSearch();
  if (item.external) window.open(item.url, '_blank', 'noopener');
  else navigate(item.url);
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
function escape(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ESCAPES[c]);
}

/** Underline the first match of any search term in the title. */
function mark(title: string, terms: string[]): string {
  const lower = normalize(title);
  for (const term of terms) {
    const at = lower.indexOf(term);
    if (at >= 0 && lower.length === title.length) {
      return escape(title.slice(0, at)) + '<mark>' + escape(title.slice(at, at + term.length)) + '</mark>' + escape(title.slice(at + term.length));
    }
  }
  return escape(title);
}

/* ---------- Events ---------- */

document.addEventListener('click', (event) => {
  const target = event.target as Element;
  if (target.closest('[data-search-open]')) {
    openSearch();
    return;
  }
  if (target.closest('[data-search-close]')) {
    closeSearch();
    return;
  }
  const opt = target.closest<HTMLElement>('[data-search] [role="option"]');
  if (opt) {
    go(Number(opt.dataset.index));
    return;
  }
  // Clicking the backdrop closes the dialog
  const { dialog } = els();
  if (dialog?.open && target === dialog) closeSearch();
});

document.addEventListener('mousemove', (event) => {
  const opt = (event.target as Element).closest<HTMLElement>('[data-search] [role="option"]');
  if (opt && Number(opt.dataset.index) !== selected) {
    selected = Number(opt.dataset.index);
    highlight();
  }
});

document.addEventListener('keydown', (event) => {
  const { dialog } = els();
  const typing = (event.target as HTMLElement).closest('input, textarea, [contenteditable="true"]');

  if ((event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    if (dialog?.open) closeSearch();
    else openSearch();
    return;
  }
  if (event.key === '/' && !typing && !dialog?.open) {
    event.preventDefault();
    openSearch();
    return;
  }
  if (!dialog?.open) return;

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    if (!results.length) return;
    selected = (selected + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
    highlight();
  } else if (event.key === 'Enter') {
    event.preventDefault();
    go(selected);
  }
});

document.addEventListener('astro:page-load', () => {
  document.querySelectorAll<HTMLElement>('[data-shortcut]').forEach((k) => (k.textContent = isMac() ? '⌘ K' : 'Ctrl K'));
});

document.addEventListener('astro:before-swap', closeSearch);
