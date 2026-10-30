/**
 * The shape of a case study. Each one lives in its own file in this folder
 * and is written in every language (L = { en, zh, ja }).
 */
import type { ImageMetadata } from 'astro';
import type { Locale } from '../i18n/config';

export type L = Record<Locale, string>;

export interface DiagramNode {
  id: string;
  /** Top-left corner and size in diagram units (the viewBox). */
  x: number;
  y: number;
  w?: number;
  h?: number;
  label: string;
  sub?: L;
  /** What this part owns, shown when it is selected. */
  detail: L;
  /** The edge of the system, the core, storage, or something outside it. */
  tone?: 'client' | 'core' | 'store' | 'external';
}

export interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  label?: L;
  /** Asynchronous or supervisory links are dashed. */
  dashed?: boolean;
  /** Which sides to connect: 'h' left/right, 'v' top/bottom. Default: whichever is further apart. */
  axis?: 'h' | 'v';
}

export interface TraceStep {
  edge?: string;
  node?: string;
  note: L;
  /** A step where the request is refused. */
  blocked?: boolean;
  /** Travel the edge from `to` back to `from`. */
  reverse?: boolean;
}

export interface Trace {
  id: string;
  label: L;
  steps: TraceStep[];
}

export interface Diagram {
  width: number;
  height: number;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  traces: Trace[];
}

export interface CaseStudy {
  slug: string;
  /** Repository name on GitHub (under site.github.username). */
  repo: string;
  name: string;
  year: string;
  tagline: L;
  summary: L[];
  role: L;
  status: L;
  /** Large numbers with a short caption. */
  metrics: { value: string; label: L }[];
  problems: { title: L; problem: L; solution: L; proof: string }[];
  stack: { group: L; items: string[] }[];
  diagram: Diagram;
  diagramIntro: L;
  demo: 'oversell' | 'gate';
  demoIntro: L;
  screens: { image: ImageMetadata; alt: L; caption: L; zh?: ImageMetadata }[];
  lessons: L[];
  /** Which schematic the project card draws. */
  motif: 'ledger' | 'layers';
}
