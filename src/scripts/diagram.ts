/**
 * Interaction for src/components/work/ArchDiagram.astro.
 *
 * - Selecting a part (click, Enter or Space) explains it and highlights its
 *   connections.
 * - Choosing a request plays it: each step lights the edge it travels and
 *   sends a small packet along it, with a note underneath. Play/pause and
 *   step buttons give full control; arrow keys step while the panel has focus.
 * - The first request plays once by itself when the diagram scrolls into view.
 */

interface Step {
  edge?: string;
  node?: string;
  note: string;
  blocked: boolean;
  reverse: boolean;
}

interface Payload {
  nodes: Record<string, { label: string; detail: string }>;
  edges: Record<string, { from: string; to: string }>;
  traces: { id: string; steps: Step[] }[];
  text: { stepOf: string; pick: string; play: string; pause: string };
}

const STEP_MS = 3200;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mountDiagrams() {
  document.querySelectorAll<HTMLElement>('[data-arch]').forEach((root) => {
    if (root.dataset.bound) return;
    root.dataset.bound = '1';
    mount(root);
  });
}

function mount(root: HTMLElement) {
  const data = JSON.parse(root.querySelector('[data-arch-data]')!.textContent!) as Payload;
  const svg = root.querySelector<SVGSVGElement>('[data-arch-svg]')!;
  const packet = svg.querySelector<SVGCircleElement>('[data-packet]')!;
  const stepEl = root.querySelector<HTMLElement>('[data-arch-step]')!;
  const titleEl = root.querySelector<HTMLElement>('[data-arch-title]')!;
  const noteEl = root.querySelector<HTMLElement>('[data-arch-note]')!;
  const progressEl = root.querySelector<HTMLElement>('[data-arch-progress]')!;
  const prevBtn = root.querySelector<HTMLButtonElement>('[data-arch-prev]')!;
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-arch-next]')!;
  const playBtn = root.querySelector<HTMLButtonElement>('[data-arch-play]')!;
  const traceBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-trace]')];
  const nodeEls = new Map([...svg.querySelectorAll<SVGGElement>('[data-node]')].map((n) => [n.dataset.node!, n]));
  const edgeEls = new Map([...svg.querySelectorAll<SVGGElement>('[data-edge]')].map((e) => [e.dataset.edge!, e]));

  let trace = -1;
  let step = -1;
  let timer: number | undefined;
  let anim: Animation | undefined;
  let rafId = 0;

  const clearMarks = () => {
    svg.querySelectorAll('.is-active, .is-related, .is-selected, .is-blocked, .is-reverse').forEach((el) =>
      el.classList.remove('is-active', 'is-related', 'is-selected', 'is-blocked', 'is-reverse'),
    );
    nodeEls.forEach((n) => n.setAttribute('aria-pressed', 'false'));
    root.removeAttribute('data-blocked');
  };

  const stop = () => {
    window.clearTimeout(timer);
    timer = undefined;
    root.removeAttribute('data-playing');
    playBtn.setAttribute('aria-label', data.text.play);
  };

  /* ---------------- selecting a part ---------------- */

  const select = (id: string) => {
    stop();
    trace = -1;
    step = -1;
    traceBtns.forEach((b) => b.setAttribute('aria-pressed', 'false'));
    clearMarks();
    hidePacket();
    const node = nodeEls.get(id);
    if (!node) return;
    node.classList.add('is-selected');
    node.setAttribute('aria-pressed', 'true');
    for (const [eid, e] of Object.entries(data.edges)) {
      if (e.from !== id && e.to !== id) continue;
      edgeEls.get(eid)?.classList.add('is-related');
      nodeEls.get(e.from === id ? e.to : e.from)?.classList.add('is-related');
    }
    root.setAttribute('data-focus', '');
    stepEl.textContent = '';
    titleEl.textContent = data.nodes[id].label;
    noteEl.textContent = data.nodes[id].detail;
    progressEl.style.setProperty('--p', '0');
    updateButtons();
  };

  svg.addEventListener('click', (e) => {
    const node = (e.target as Element).closest<SVGGElement>('[data-node]');
    if (node) select(node.dataset.node!);
  });

  svg.addEventListener('keydown', (e) => {
    const node = (e.target as Element).closest<SVGGElement>('[data-node]');
    if (node && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      select(node.dataset.node!);
    }
  });

  /* ---------------- playing a request ---------------- */

  const show = (i: number, animate = true) => {
    const steps = data.traces[trace].steps;
    step = Math.max(0, Math.min(steps.length - 1, i));
    const s = steps[step];
    clearMarks();
    root.setAttribute('data-focus', '');

    // Everything already travelled stays faintly lit.
    for (let k = 0; k < step; k++) {
      const prev = steps[k];
      if (prev.edge) edgeEls.get(prev.edge)?.classList.add('is-related');
    }

    let target = s.node;
    if (s.edge) {
      const edge = data.edges[s.edge];
      const el = edgeEls.get(s.edge);
      el?.classList.add('is-active');
      if (s.reverse) el?.classList.add('is-reverse');
      const [from, to] = s.reverse ? [edge.to, edge.from] : [edge.from, edge.to];
      nodeEls.get(from)?.classList.add('is-related');
      target = to;
      if (animate) sendPacket(el?.querySelector<SVGPathElement>('.edge__line') ?? null, s.reverse, s.blocked);
      else hidePacket();
    } else {
      hidePacket();
    }
    const node = target ? nodeEls.get(target) : undefined;
    node?.classList.add(s.blocked ? 'is-blocked' : 'is-active');
    if (s.blocked) root.setAttribute('data-blocked', '');

    stepEl.textContent = data.text.stepOf.replace('{}', String(step + 1)).replace('{}', String(steps.length));
    titleEl.textContent = target ? data.nodes[target].label : '';
    noteEl.textContent = s.note;
    progressEl.style.setProperty('--p', String((step + 1) / steps.length));
    updateButtons();
  };

  const updateButtons = () => {
    const steps = trace >= 0 ? data.traces[trace].steps : [];
    prevBtn.disabled = trace < 0 || step <= 0;
    nextBtn.disabled = trace < 0 || step >= steps.length - 1;
    playBtn.disabled = trace < 0;
  };

  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      const steps = data.traces[trace].steps;
      if (step >= steps.length - 1) {
        stop();
        return;
      }
      show(step + 1);
      schedule();
    }, STEP_MS);
  };

  const play = (fromStart = false) => {
    if (trace < 0) return;
    const steps = data.traces[trace].steps;
    if (fromStart || step >= steps.length - 1) show(0);
    root.setAttribute('data-playing', '');
    playBtn.setAttribute('aria-label', data.text.pause);
    schedule();
  };

  const chooseTrace = (i: number, autoplay = true) => {
    stop();
    trace = i;
    traceBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    show(0);
    if (autoplay && !reduced()) play();
    else updateButtons();
  };

  traceBtns.forEach((btn, i) => btn.addEventListener('click', () => chooseTrace(i)));
  playBtn.addEventListener('click', () => (root.hasAttribute('data-playing') ? stop() : play()));
  prevBtn.addEventListener('click', () => {
    stop();
    show(step - 1);
  });
  nextBtn.addEventListener('click', () => {
    stop();
    show(step + 1);
  });

  root.querySelector('.arch__panel')?.addEventListener('keydown', (e) => {
    const ke = e as KeyboardEvent;
    if (trace < 0) return;
    if (ke.key === 'ArrowRight' || ke.key === 'ArrowLeft') {
      ke.preventDefault();
      stop();
      show(step + (ke.key === 'ArrowRight' ? 1 : -1));
    }
  });

  /* ---------------- the packet ---------------- */

  function hidePacket() {
    anim?.cancel();
    cancelAnimationFrame(rafId);
    packet.classList.remove('is-moving', 'is-blocked');
  }

  function sendPacket(path: SVGPathElement | null, reverse: boolean, blocked: boolean) {
    hidePacket();
    if (!path || reduced()) return;
    const length = path.getTotalLength();
    const duration = 1100;
    const start = performance.now();
    packet.classList.add('is-moving');
    packet.classList.toggle('is-blocked', blocked);
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const p = path.getPointAtLength(length * (reverse ? 1 - eased : eased));
      packet.setAttribute('cx', String(p.x));
      packet.setAttribute('cy', String(p.y));
      if (t < 1) rafId = requestAnimationFrame(frame);
      else window.setTimeout(() => packet.classList.remove('is-moving'), 500);
    };
    rafId = requestAnimationFrame(frame);
  }

  /* ---------------- autoplay once in view ---------------- */

  if (data.traces.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        if (trace < 0 && !root.querySelector('.is-selected')) chooseTrace(0, !reduced());
      },
      { threshold: 0.5 },
    );
    // Watch the stage, not the drawing: on small screens the drawing is wider than the view.
    io.observe(root.querySelector('.arch__stage') ?? svg);
    document.addEventListener('astro:before-swap', () => {
      io.disconnect();
      stop();
      hidePacket();
    }, { once: true });
  }
}
