/**
 * Motion shared by every page:
 *  - smooth, inertial scrolling with a pointer (Lenis); native on touch
 *  - reveals: [data-reveal] blocks and [data-lines] headlines settle in
 *    as they enter the viewport
 *  - the header slides away while scrolling down and returns on the way up
 *  - a hairline progress bar across the top while a page loads
 *  - [data-count] numbers count up once when they appear
 *  - [data-parallax] images drift slightly against the scroll
 *  - [data-spotlight] cards light up under the pointer
 *  - [data-zoom] images open in a lightbox
 *
 * Everything respects prefers-reduced-motion.
 */
import Lenis from 'lenis';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ------------------------------------------------------------------ */
/* Smooth scrolling                                                    */
/* ------------------------------------------------------------------ */

let lenis: Lenis | undefined;

function startLenis() {
  if (lenis || reduced() || !finePointer()) return;
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95, anchors: { offset: -88 }, autoRaf: true });
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { duration: 1.1 });
  else window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
}

export function scrollToElement(el: Element) {
  if (lenis) lenis.scrollTo(el as HTMLElement, { offset: -88, duration: 1 });
  else el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
}

/** Stop smooth scrolling while a dialog is open. */
export function lockScroll(locked: boolean) {
  if (!lenis) return;
  if (locked) lenis.stop();
  else lenis.start();
}

/* ------------------------------------------------------------------ */
/* Header: hide on the way down, show on the way up                    */
/* ------------------------------------------------------------------ */

let lastY = 0;
let travelled = 0;

function onScroll() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;
  const y = window.scrollY;
  const dy = y - lastY;
  lastY = y;
  if (header.hasAttribute('data-menu-open') || document.querySelector('dialog[open]')) return;
  // Count distance in one direction, so tiny jitters don't toggle it.
  travelled = Math.sign(dy) === Math.sign(travelled) ? travelled + dy : dy;
  if (y < 160) header.removeAttribute('data-hidden');
  else if (travelled > 48) header.setAttribute('data-hidden', '');
  else if (travelled < -24) header.removeAttribute('data-hidden');
}

window.addEventListener('scroll', onScroll, { passive: true });

/* ------------------------------------------------------------------ */
/* Reveals                                                             */
/* ------------------------------------------------------------------ */

let revealObserver: IntersectionObserver | undefined;

/** Wraps each line of a [data-lines] headline so it can rise from a mask. */
function splitLines(el: HTMLElement) {
  if (el.dataset.split) return;
  el.dataset.split = '1';
  const lines = el.querySelectorAll<HTMLElement>(':scope > .line');
  lines.forEach((line, i) => {
    line.style.setProperty('--i', String(i));
    if (!line.querySelector(':scope > span')) {
      const inner = document.createElement('span');
      inner.append(...line.childNodes);
      line.append(inner);
    }
  });
}

function setupReveals() {
  revealObserver?.disconnect();
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in), [data-lines]:not(.is-in)');
  targets.forEach((el) => el.hasAttribute('data-lines') && splitLines(el));
  if (reduced() || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }
  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        revealObserver?.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  // Stagger siblings that share a [data-stagger] parent.
  document.querySelectorAll<HTMLElement>('[data-stagger]').forEach((group) => {
    const step = Number(group.dataset.stagger) || 80;
    group.querySelectorAll<HTMLElement>(':scope > [data-reveal]').forEach((child, i) => {
      child.style.setProperty('--reveal-delay', String(i * step));
    });
  });
  targets.forEach((el) => revealObserver!.observe(el));
}

/* ------------------------------------------------------------------ */
/* Count-up numbers                                                    */
/* ------------------------------------------------------------------ */

let countObserver: IntersectionObserver | undefined;

function setupCounts() {
  countObserver?.disconnect();
  const els = document.querySelectorAll<HTMLElement>('[data-count]');
  if (reduced()) return;
  countObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        countObserver?.unobserve(entry.target);
        animateCount(entry.target as HTMLElement);
      }
    },
    { threshold: 0.6 },
  );
  els.forEach((el) => {
    if (el.dataset.counted) return;
    countObserver!.observe(el);
  });
}

/** Counts every number inside the text up from zero, keeping the rest of the text as is. */
function animateCount(el: HTMLElement) {
  el.dataset.counted = '1';
  const final = el.textContent ?? '';
  const parts = final.split(/(\d+)/);
  const targets = parts.map((p) => (/^\d+$/.test(p) ? Number(p) : null));
  if (targets.every((t) => t === null)) return;
  const start = performance.now();
  const duration = 1100;
  el.style.minWidth = `${el.offsetWidth}px`;
  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = parts.map((p, i) => (targets[i] === null ? p : String(Math.round(targets[i]! * eased)))).join('');
    if (t < 1) requestAnimationFrame(frame);
    else el.textContent = final;
  };
  requestAnimationFrame(frame);
}

/* ------------------------------------------------------------------ */
/* Parallax and spotlight                                              */
/* ------------------------------------------------------------------ */

let parallaxEls: HTMLElement[] = [];
let rafId = 0;

function parallaxLoop() {
  rafId = 0;
  const vh = window.innerHeight;
  for (const el of parallaxEls) {
    const r = el.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) continue;
    const progress = (r.top + r.height / 2 - vh / 2) / vh; // -1 … 1 around the centre
    const amount = Number(el.dataset.parallax) || 40;
    el.style.setProperty('--parallax', `${(progress * -amount).toFixed(1)}px`);
  }
}

function requestParallax() {
  if (!rafId && parallaxEls.length) rafId = requestAnimationFrame(parallaxLoop);
}

function setupParallax() {
  parallaxEls = reduced() ? [] : [...document.querySelectorAll<HTMLElement>('[data-parallax]')];
  requestParallax();
}

window.addEventListener('scroll', requestParallax, { passive: true });
window.addEventListener('resize', requestParallax);

document.addEventListener('pointermove', (e) => {
  const card = (e.target as Element | null)?.closest?.<HTMLElement>('[data-spotlight]');
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty('--mx', `${e.clientX - r.left}px`);
  card.style.setProperty('--my', `${e.clientY - r.top}px`);
});

/* ------------------------------------------------------------------ */
/* Lightbox                                                            */
/* ------------------------------------------------------------------ */

document.addEventListener('click', (e) => {
  const trigger = (e.target as Element | null)?.closest<HTMLElement>('[data-zoom]');
  if (!trigger) return;
  const img = trigger.matches('img') ? (trigger as HTMLImageElement) : trigger.querySelector('img');
  const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox]');
  if (!img || !dialog) return;
  e.preventDefault();
  const big = dialog.querySelector('img')!;
  big.src = trigger.dataset.zoom || img.currentSrc || img.src;
  big.alt = img.alt;
  const caption = dialog.querySelector('figcaption')!;
  caption.textContent = trigger.dataset.caption ?? img.alt;
  dialog.showModal();
  lockScroll(true);
});

document.addEventListener(
  'close',
  (e) => {
    if ((e.target as Element).matches?.('[data-lightbox]')) lockScroll(false);
  },
  true,
);

document.addEventListener('click', (e) => {
  const dialog = e.target as HTMLElement;
  if (dialog.matches?.('[data-lightbox]')) (dialog as HTMLDialogElement).close();
});

/* ------------------------------------------------------------------ */
/* Route progress                                                      */
/* ------------------------------------------------------------------ */

function progress(state: 'loading' | 'done') {
  const bar = document.querySelector<HTMLElement>('[data-route-progress]');
  if (!bar || reduced()) return;
  if (state === 'loading') {
    bar.removeAttribute('data-state');
    void bar.offsetWidth;
  }
  bar.dataset.state = state;
}

document.addEventListener('astro:before-preparation', () => progress('loading'));
document.addEventListener('astro:after-swap', () => {
  progress('done');
  lastY = window.scrollY;
  document.querySelector('[data-header]')?.removeAttribute('data-hidden');
  lenis?.resize();
});

/* ------------------------------------------------------------------ */
/* Lifecycle                                                           */
/* ------------------------------------------------------------------ */

document.addEventListener('astro:page-load', () => {
  startLenis();
  // The router has just set the scroll position; tell Lenis so it doesn't animate back.
  lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
  setupReveals();
  setupCounts();
  setupParallax();
});
