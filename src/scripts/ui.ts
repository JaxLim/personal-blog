/**
 * Interface behaviours shared by every page. The module runs once; page
 * setup re-runs on `astro:page-load` after each navigation. Interaction
 * handlers use event delegation so they survive page swaps and the
 * persisted header.
 */
import './search';
import { scrollToElement, scrollToTop } from './motion';
import { splitLocale } from '../i18n/config';

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ */
/* Toast                                                               */
/* ------------------------------------------------------------------ */

let toastTimer: number | undefined;
export function toast(message: string) {
  const el = document.querySelector<HTMLElement>('[data-toast]');
  if (!el) return;
  el.textContent = message;
  el.setAttribute('data-show', '');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.removeAttribute('data-show'), 1800);
}

/* ------------------------------------------------------------------ */
/* Theme                                                               */
/* ------------------------------------------------------------------ */

type Theme = 'system' | 'light' | 'dark';
const THEME_ORDER: Theme[] = ['system', 'light', 'dark'];

function currentTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  return t === 'light' || t === 'dark' ? t : 'system';
}

function syncThemeButtons() {
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) => {
    try {
      const labels = JSON.parse(btn.dataset.labels ?? '{}') as Record<Theme, string>;
      btn.setAttribute('aria-label', labels[currentTheme()] ?? '');
    } catch {
      /* keep the server-rendered label */
    }
  });
}

function setTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
  try {
    if (theme === 'system') localStorage.removeItem('theme');
    else localStorage.setItem('theme', theme);
  } catch {
    /* storage unavailable: the choice lasts for this page only */
  }
  syncThemeButtons();
}

/* ------------------------------------------------------------------ */
/* Menus: language popover and mobile sheet                            */
/* ------------------------------------------------------------------ */

function langMenu() {
  const root = document.querySelector<HTMLElement>('[data-lang-menu]');
  return {
    root,
    button: root?.querySelector<HTMLButtonElement>('[data-lang-toggle]'),
    panel: root?.querySelector<HTMLElement>('[data-lang-panel]'),
  };
}

function setLangMenu(open: boolean, focusFirst = false) {
  const { button, panel } = langMenu();
  if (!button || !panel) return;
  button.setAttribute('aria-expanded', String(open));
  panel.hidden = !open;
  if (open && focusFirst) panel.querySelector<HTMLAnchorElement>('a[aria-current="true"], a')?.focus();
}

function setSheet(open: boolean) {
  const header = document.querySelector<HTMLElement>('[data-header]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const sheet = document.querySelector<HTMLElement>('[data-menu]');
  if (!header || !toggle || !sheet) return;
  toggle.setAttribute('aria-expanded', String(open));
  sheet.hidden = !open;
  header.toggleAttribute('data-menu-open', open);
  const label = toggle.querySelector<HTMLElement>('[data-menu-label]');
  if (label) label.textContent = (open ? label.dataset.close : label.dataset.open) ?? '';
}

/** Point every language option at this page's translation (the header persists across pages). */
function syncLanguageLinks() {
  const alternates = new Map<string, string>();
  document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][data-locale]').forEach((l) => {
    alternates.set(l.dataset.locale!, l.dataset.path!);
  });
  const current = document.documentElement.dataset.locale;
  document.querySelectorAll<HTMLAnchorElement>('header [data-lang-option]').forEach((a) => {
    const locale = a.dataset.langOption!;
    const path = alternates.get(locale);
    a.href = path ?? a.dataset.fallback ?? '/';
    const note = a.querySelector<HTMLElement>('[data-lang-note]');
    if (note) note.hidden = Boolean(path) || locale === current;
  });
}

/* ------------------------------------------------------------------ */
/* Click delegation                                                    */
/* ------------------------------------------------------------------ */

document.addEventListener('click', (event) => {
  const target = event.target as Element | null;
  if (!target) return;

  // Theme
  if (target.closest('[data-theme-toggle]')) {
    const next = THEME_ORDER[(THEME_ORDER.indexOf(currentTheme()) + 1) % THEME_ORDER.length];
    const swap = () => setTheme(next);
    if (document.startViewTransition && !reduceMotion()) document.startViewTransition(swap);
    else swap();
    return;
  }

  // Language menu
  const langToggle = target.closest('[data-lang-toggle]');
  if (langToggle) {
    setLangMenu(langToggle.getAttribute('aria-expanded') !== 'true');
    return;
  }
  if (!target.closest('[data-lang-panel]')) setLangMenu(false);

  // Choosing a language: remember it for later visits
  const option = target.closest<HTMLElement>('[data-lang-option]');
  if (option) {
    try {
      localStorage.setItem('lang', option.dataset.langOption!);
    } catch {
      /* storage unavailable */
    }
    setLangMenu(false);
    setSheet(false);
    return;
  }

  // Mobile sheet
  const menuToggle = target.closest('[data-menu-toggle]');
  if (menuToggle) {
    setSheet(menuToggle.getAttribute('aria-expanded') !== 'true');
    return;
  }
  if (target.closest('[data-menu] a')) setSheet(false);

  // Code: copy
  const copy = target.closest<HTMLButtonElement>('.code-copy');
  if (copy) {
    const code = copy.closest('.code-block')?.querySelector('pre code')?.textContent ?? '';
    const labels = proseLabels();
    navigator.clipboard?.writeText(code).then(() => {
      const text = copy.querySelector('span');
      if (text) text.textContent = labels.copied;
      copy.dataset.state = 'copied';
      window.setTimeout(() => {
        if (text) text.textContent = labels.copy;
        delete copy.dataset.state;
      }, 1600);
    });
    return;
  }

  // Heading anchors: copy the section link
  const anchor = target.closest<HTMLAnchorElement>('.heading-anchor');
  if (anchor) {
    event.preventDefault();
    const url = new URL(anchor.getAttribute('href')!, location.href).href;
    history.replaceState(history.state, '', anchor.getAttribute('href'));
    const section = document.getElementById(anchor.getAttribute('href')!.slice(1));
    if (section) scrollToElement(section);
    navigator.clipboard?.writeText(url).then(() => toast(proseLabels().linkCopied));
    return;
  }

  // Table of contents and footnote links: glide to the target
  const jump = target.closest<HTMLAnchorElement>('[data-toc-link], [data-footnote-ref], [data-footnote-backref]');
  if (jump) {
    const id = decodeURIComponent(jump.getAttribute('href')?.slice(1) ?? '');
    const el = id && document.getElementById(id);
    if (el) {
      event.preventDefault();
      history.replaceState(history.state, '', `#${id}`);
      scrollToElement(el);
    }
    return;
  }

  // Back to top
  if (target.closest('[data-back-to-top]')) {
    event.preventDefault();
    scrollToTop();
  }
});

document.addEventListener('keydown', (event) => {
  const { panel, button } = langMenu();
  if (event.key === 'Escape') {
    if (panel && !panel.hidden) {
      setLangMenu(false);
      button?.focus();
    }
    setSheet(false);
    return;
  }
  // Arrow keys move through the language options
  if (panel && !panel.hidden && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
    event.preventDefault();
    const links = [...panel.querySelectorAll<HTMLAnchorElement>('a')];
    const i = links.indexOf(document.activeElement as HTMLAnchorElement);
    const next = event.key === 'ArrowDown' ? (i + 1) % links.length : (i - 1 + links.length) % links.length;
    links[i === -1 ? 0 : next]?.focus();
    return;
  }
  if (document.activeElement === button && event.key === 'ArrowDown') {
    event.preventDefault();
    setLangMenu(true, true);
  }
});

/* ------------------------------------------------------------------ */
/* Header: hairline, reading progress, nav indicator                   */
/* ------------------------------------------------------------------ */

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const header = document.querySelector<HTMLElement>('[data-header]');
    if (!header) return;
    header.toggleAttribute('data-scrolled', window.scrollY > 8);

    const article = document.querySelector<HTMLElement>('[data-prose]');
    if (article) {
      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, total)));
      header.style.setProperty('--progress', progress.toFixed(4));
      header.toggleAttribute('data-reading', window.scrollY > 120 && progress < 1);
    } else {
      header.removeAttribute('data-reading');
    }
  });
}
window.addEventListener('scroll', onScroll, { passive: true });

function syncNav() {
  const { path } = splitLocale(location.pathname);
  document.querySelectorAll<HTMLAnchorElement>('header [data-nav]').forEach((a) => {
    const key = a.dataset.nav!;
    const current = path.startsWith(key) || (key === '/writing/' && path.startsWith('/tags/'));
    if (current) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  placeIndicator();
}

function placeIndicator() {
  const indicator = document.querySelector<HTMLElement>('[data-nav-indicator]');
  const list = document.querySelector<HTMLElement>('[data-nav-list]');
  if (!indicator || !list) return;
  const active = list.querySelector<HTMLElement>('[aria-current="page"]');
  if (!active) {
    indicator.style.setProperty('--o', '0');
    return;
  }
  const box = list.getBoundingClientRect();
  const r = active.getBoundingClientRect();
  const inset = 12; // matches the link's horizontal padding
  indicator.style.setProperty('--x', `${r.left - box.left + inset}px`);
  indicator.style.setProperty('--w', `${r.width - inset * 2}px`);
  indicator.style.setProperty('--o', '1');
}
window.addEventListener('resize', placeIndicator);

/* ------------------------------------------------------------------ */
/* Articles                                                            */
/* ------------------------------------------------------------------ */

function proseLabels() {
  const el = document.querySelector<HTMLElement>('[data-prose]');
  try {
    return JSON.parse(el?.dataset.labels ?? '') as { copy: string; copied: string; copyCode: string; linkCopied: string };
  } catch {
    return { copy: 'Copy', copied: 'Copied', copyCode: 'Copy code', linkCopied: 'Link copied' };
  }
}

const LANGUAGE_NAMES: Record<string, string> = {
  ts: 'TypeScript', typescript: 'TypeScript', tsx: 'TSX', js: 'JavaScript', javascript: 'JavaScript', jsx: 'JSX',
  astro: 'Astro', sh: 'Shell', bash: 'Shell', shell: 'Shell', zsh: 'Shell', powershell: 'PowerShell',
  yaml: 'YAML', yml: 'YAML', json: 'JSON', css: 'CSS', html: 'HTML', md: 'Markdown', mdx: 'MDX',
  py: 'Python', python: 'Python', go: 'Go', rust: 'Rust', rs: 'Rust', sql: 'SQL', diff: 'Diff',
  toml: 'TOML', dockerfile: 'Dockerfile', java: 'Java', kotlin: 'Kotlin', swift: 'Swift',
};

const COPY_ICON =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5.25" y="5.25" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M10.75 3.5V3.25a1.5 1.5 0 0 0-1.5-1.5h-5a1.5 1.5 0 0 0-1.5 1.5v5a1.5 1.5 0 0 0 1.5 1.5h.25" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';

let tocObserver: IntersectionObserver | undefined;

function setupArticle() {
  tocObserver?.disconnect();
  const prose = document.querySelector<HTMLElement>('[data-prose]');
  if (!prose) return;
  const labels = proseLabels();

  // Code blocks: a header bar with the language and a copy button
  prose.querySelectorAll('pre').forEach((pre) => {
    if (pre.parentElement?.classList.contains('code-block')) return;
    const wrap = document.createElement('div');
    wrap.className = 'code-block';
    const bar = document.createElement('div');
    bar.className = 'code-block__bar';
    const lang = pre.dataset.language ?? '';
    const name = document.createElement('span');
    const langName = LANGUAGE_NAMES[lang] ?? (lang && lang !== 'plaintext' ? lang : '');
    if (pre.dataset.title) {
      wrap.classList.add('code-block--titled');
      const file = document.createElement('span');
      file.className = 'code-block__file';
      file.textContent = pre.dataset.title;
      const tag = document.createElement('span');
      tag.className = 'code-block__lang';
      tag.textContent = langName;
      name.append(file, tag);
    } else {
      name.textContent = langName;
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy';
    btn.setAttribute('aria-label', labels.copyCode);
    btn.innerHTML = `${COPY_ICON}<span>${labels.copy}</span>`;
    bar.append(name, btn);
    pre.replaceWith(wrap);
    wrap.append(bar, pre);
  });

  // Wide tables scroll sideways instead of stretching the page
  prose.querySelectorAll('table').forEach((table) => {
    if (table.parentElement?.classList.contains('table-scroll')) return;
    const wrap = document.createElement('div');
    wrap.className = 'table-scroll';
    table.replaceWith(wrap);
    wrap.append(table);
  });

  // Linkable headings
  prose.querySelectorAll<HTMLHeadingElement>('h2[id], h3[id]').forEach((h) => {
    if (h.querySelector('.heading-anchor') || h.closest('.footnotes')) return;
    const a = document.createElement('a');
    a.className = 'heading-anchor';
    a.href = `#${h.id}`;
    a.textContent = '#';
    a.setAttribute('aria-label', h.textContent ?? '');
    h.prepend(a);
  });

  // Highlight the section being read in the table of contents
  const links = new Map<string, HTMLAnchorElement>();
  document.querySelectorAll<HTMLAnchorElement>('[data-toc-link]').forEach((a) => links.set(a.dataset.tocLink!, a));
  if (links.size === 0) return;

  const headings = [...prose.querySelectorAll<HTMLElement>('h2[id], h3[id]')].filter((h) => links.has(h.id));
  const visible = new Set<string>();
  const mark = () => {
    const active =
      headings.find((h) => visible.has(h.id))?.id ??
      headings.filter((h) => h.getBoundingClientRect().top < 0).at(-1)?.id;
    links.forEach((a, id) => a.setAttribute('aria-current', String(id === active)));
  };
  tocObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id)));
      mark();
    },
    { rootMargin: '-64px 0px -55% 0px' },
  );
  headings.forEach((h) => tocObserver!.observe(h));
}

/* ------------------------------------------------------------------ */
/* Page lifecycle                                                      */
/* ------------------------------------------------------------------ */

/**
 * Smaller reading aids: images open in the lightbox, footnote references
 * show their note on hover or focus, and the contents column counts down
 * the minutes left.
 */
function setupReadingAids() {
  const prose = document.querySelector<HTMLElement>('[data-prose]');
  if (!prose) return;

  prose.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    if (img.closest('a') || img.hasAttribute('data-zoom')) return;
    img.setAttribute('data-zoom', '');
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
  });

  prose.querySelectorAll<HTMLAnchorElement>('[data-footnote-ref]').forEach((ref) => {
    if (ref.dataset.previewed) return;
    ref.dataset.previewed = '1';
    const id = decodeURIComponent(ref.getAttribute('href')?.slice(1) ?? '');
    const note = id ? document.getElementById(id) : null;
    if (!note) return;
    const clone = note.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('[data-footnote-backref]').forEach((a) => a.remove());
    const tip = document.createElement('span');
    tip.className = 'footnote-tip';
    tip.setAttribute('role', 'tooltip');
    tip.innerHTML = clone.innerHTML;
    ref.parentElement?.classList.add('footnote-anchor');
    ref.parentElement?.append(tip);
  });

  const left = document.querySelector<HTMLElement>('[data-minutes-left]');
  const total = Number(prose.dataset.minutes ?? 0);
  if (left && total) {
    const format = (n: number) => {
      try {
        return (JSON.parse(left.dataset.format ?? '{}') as Record<string, string>)[n <= 0 ? 'done' : 'n']?.replace('{n}', String(n)) ?? '';
      } catch {
        return '';
      }
    };
    const update = () => {
      const rect = prose.getBoundingClientRect();
      const done = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - window.innerHeight * 0.6)));
      left.textContent = format(Math.ceil(total * (1 - done)));
    };
    update();
    window.removeEventListener('scroll', minutesHandler);
    minutesHandler = () => requestAnimationFrame(update);
    window.addEventListener('scroll', minutesHandler, { passive: true });
  }
}

let minutesHandler: () => void = () => {};

document.addEventListener('keydown', (event) => {
  // Enlargeable images respond to Enter like buttons
  const el = event.target as HTMLElement;
  if (event.key === 'Enter' && el.matches?.('img[data-zoom]')) el.click();
});

document.addEventListener('astro:before-swap', () => {
  window.removeEventListener('scroll', minutesHandler);
  setLangMenu(false);
  setSheet(false);
});

document.addEventListener('astro:page-load', () => {
  syncThemeButtons();
  syncLanguageLinks();
  syncNav();
  onScroll();
  setupArticle();
  setupReadingAids();
});
