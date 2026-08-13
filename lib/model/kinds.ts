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
 * What each word means, written for someone who has never seen this model.
 *
 * The legend names the primitives; this explains them. It describes the
 * schema rather than any particular stage or bet, which is why it can live in
 * code: adding content never changes it.
 */
export const KIND_MEANING: Record<NodeKind, string> = {
  stage: "One part of the machine. Getting a clinician ready to see families is a stage. Matching a family to a clinician is another.",
  step: "Something that has to happen inside a stage, with what it needs before it starts and what it leaves behind.",
  bet: "A change we think is worth making, written down with the reason we believe it and what would show us we were wrong.",
  prototype: "Working software for a single bet, built to find out whether the idea holds up. It runs on made-up data.",
  claim: "Something we believe, marked with how sure we are and where the belief came from.",
  metric: "A number that would tell us whether this part of the machine is working, whether or not anyone measures it today.",
  entity: "Something the machine handles and changes as work moves through it, such as a family, a clinician, or a match.",
};

/**
 * The few words a reader needs before the rest of the model makes sense.
 * Everything else is explained where it appears.
 */
export const ORIENTATION_KINDS: NodeKind[] = ["stage", "bet", "prototype"];

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
