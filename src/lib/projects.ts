import { getCollection } from 'astro:content';
import { getGitHubData } from './github';
import type { GitHubData, Repo } from './github-shared';
import { caseStudyForRepo } from '../work';

let merged: Promise<GitHubData> | undefined;

/**
 * GitHub data with the notes from src/content/projects.yaml applied:
 * translated descriptions, featured flags, hidden repositories removed, and
 * a link to the case study for repositories that have one.
 */
export function getProjectData(): Promise<GitHubData> {
  merged ??= (async () => {
    const [data, notes] = await Promise.all([getGitHubData(), getCollection('projects')]);
    const byName = new Map(notes.map((n) => [n.id.toLowerCase(), n.data]));
    const featuredOrder = notes.filter((n) => n.data.featured).map((n) => n.id.toLowerCase());

    const repos: Repo[] = data.repos
      .filter((r) => !byName.get(r.name.toLowerCase())?.hidden)
      .map((r) => {
        const note = byName.get(r.name.toLowerCase());
        const study = caseStudyForRepo(r.name);
        return {
          ...r,
          ...(note ? { descriptions: note.description, featured: note.featured } : {}),
          ...(study ? { caseStudy: study.slug } : {}),
        };
      });

    // Featured repositories first, in the order they appear in projects.yaml.
    const rank = (r: Repo) => (r.featured ? featuredOrder.indexOf(r.name.toLowerCase()) : Infinity);
    repos.sort((a, b) => rank(a) - rank(b));
    return { ...data, repos };
  })();
  return merged;
}
