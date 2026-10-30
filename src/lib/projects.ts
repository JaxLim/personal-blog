import { getCollection } from 'astro:content';
import { getGitHubData } from './github';
import type { GitHubData, Repo } from './github-shared';

let merged: Promise<GitHubData> | undefined;

/**
 * GitHub data with the notes from src/content/projects.yaml applied:
 * translated descriptions, featured flags, and hidden repositories removed.
 */
export function getProjectData(): Promise<GitHubData> {
  merged ??= (async () => {
    const [data, notes] = await Promise.all([getGitHubData(), getCollection('projects')]);
    const byName = new Map(notes.map((n) => [n.id, n.data]));
    const featuredOrder = notes.filter((n) => n.data.featured).map((n) => n.id);

    const repos: Repo[] = data.repos
      .filter((r) => !byName.get(r.name)?.hidden)
      .map((r) => {
        const note = byName.get(r.name);
        return note ? { ...r, descriptions: note.description, featured: note.featured } : r;
      });

    // Featured repositories first, in the order they appear in projects.yaml.
    const rank = (r: Repo) => (r.featured ? featuredOrder.indexOf(r.name) : Infinity);
    repos.sort((a, b) => rank(a) - rank(b));
    return { ...data, repos };
  })();
  return merged;
}
