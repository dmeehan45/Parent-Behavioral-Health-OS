import type { Repository } from "./repository";

export type TargetLink = { id: string; title: string; href: string };

/**
 * Resolve Stage or Step IDs to titles and routes.
 *
 * Claims, metrics, and bets all target the same union of Stages and Steps, so
 * each of their pages needs the same lookup. Unknown IDs cannot occur — the
 * loader validates every target — but they are dropped rather than thrown on,
 * so a rendering path never fails on data validation already guarantees.
 */
export function targetLinks(repo: Repository, ids: string[]): TargetLink[] {
  return ids
    .map((id) => {
      const stage = repo.stages.find((s) => s.id === id);
      if (stage) return { id, title: stage.title, href: `/stages/${id}` };
      const step = repo.steps.find((s) => s.id === id);
      return step ? { id, title: step.title, href: `/steps/${id}` } : null;
    })
    .filter((link) => link !== null);
}
