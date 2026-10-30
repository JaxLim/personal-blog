/**
 * Case studies, in the order they appear on the site. To add one, write a
 * file next to these (see types.ts for the shape) and list it here.
 */
import { localePath, type Locale } from '../i18n/config';
import { orderpilot } from './orderpilot';
import { operationagent } from './operationagent';
import type { CaseStudy } from './types';

export const caseStudies: CaseStudy[] = [orderpilot, operationagent];

export function caseStudyUrl(study: CaseStudy | string, locale: Locale): string {
  const slug = typeof study === 'string' ? study : study.slug;
  return localePath(locale, `/projects/${slug}/`);
}

export function caseStudyForRepo(repo: string): CaseStudy | undefined {
  return caseStudies.find((s) => s.repo.toLowerCase() === repo.toLowerCase());
}

export type { CaseStudy } from './types';
