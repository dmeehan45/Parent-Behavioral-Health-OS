import type { LensId, NodeKind } from "@/lib/model/types";

/**
 * Pure facts about node kinds, safe to import from client components.
 *
 * These live apart from `lib/model/graph.ts` deliberately: the projection reads
 * the filesystem, so anything the browser needs has to sit on this side of the
 * boundary.
 */

export const KIND_LABELS: Record<NodeKind, string> = {
  stage: "Stage",
  step: "Step",
  bet: "Bet",
  prototype: "Prototype",
  claim: "Claim",
  metric: "Metric",
  entity: "Entity",
};

/**
 * How each satellite lens stacks its node kinds, outermost band first. The
 * layout engine places later bands beneath the spine they attach to; the
 * operating-flow lens is laid out as a directed graph instead.
 */
export const LENS_BANDS: Partial<Record<LensId, NodeKind[][]>> = {
  bets: [["stage"], ["step"], ["bet"], ["prototype"]],
  evidence: [["stage"], ["step"], ["claim"], ["metric"]],
  entities: [["entity"], ["step"]],
};

/** Canonical detail route for each primitive. */
export const ROUTES: Record<NodeKind, (contentId: string) => string> = {
  stage: (id) => `/stages/${id}`,
  step: (id) => `/steps/${id}`,
  bet: (id) => `/bets/${id}`,
  prototype: (id) => `/bets/${id}`,
  claim: (id) => `/claims/${id}`,
  metric: (id) => `/metrics/${id}`,
  entity: (id) => `/entities/${id}`,
};

export function nodeId(kind: NodeKind, contentId: string): string {
  return `${kind}:${contentId}`;
}

export function parseNodeId(id: string): { kind: NodeKind; contentId: string } | undefined {
  const separator = id.indexOf(":");
  if (separator < 0) return undefined;
  return { kind: id.slice(0, separator) as NodeKind, contentId: id.slice(separator + 1) };
}
