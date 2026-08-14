import { nodeId } from "@/lib/model/kinds";
import type { Repository } from "@/lib/content/repository";
import type { ModelGraph } from "@/lib/model/types";

/**
 * Does the projection do anything with what the content actually says?
 *
 * `requireRef` in the repository proves a reference points at something real.
 * Nothing proved the projection then *used* it — so a field could be in the
 * schema, validated on every run, rendered in a block, and still invisible to
 * every surface that reads edges. That is not a hypothetical: `step.claims`
 * shipped that way. The step page listed the claim, the evidence lens drew no
 * line, and the step's open ends could not see it was resting on a
 * low-confidence hypothesis. Two surfaces, same content, different answer, and
 * nothing failing anywhere.
 *
 * This closes that hole. Every reference the repository validates has to be
 * declared here as either an edge the projection must derive, or a deliberate
 * block-only decision with the reason written down. A new reference field
 * fails the build until somebody chooses, which is the point: the failure mode
 * was never a wrong choice, it was nobody making one.
 */

type Resolution =
  | { edge: string; note: string }
  | { blockOnly: true; note: string }
  | { structural: true; note: string };

/**
 * Every reference in the model, and what the projection owes it.
 *
 * Keyed by the field as the repository reports it. `docs/relationships.md`
 * explains the reasoning; this is the machine-checkable half of it.
 */
export const RELATIONSHIPS: Record<string, Resolution> = {
  "map.edges.from": { structural: true, note: "Stage-to-stage flow, derived directly from map.yaml as a `flow` edge." },

  "step.stage": { structural: true, note: "Containment, not a relation between peers. Becomes the step node's parentId." },
  "step.next": { edge: "process", note: "The order work moves through a stage." },
  "step.entity": { edge: "state", note: "What a step consumes and leaves behind." },
  "step.claims": { edge: "evidence", note: "What a step rests on. The same link as claim.targets, from the other side." },
  "step.metrics": { edge: "evidence", note: "What would tell us this step is working." },

  "stage.metrics": { edge: "evidence", note: "The same link as metric.targets, from the other side." },

  "claim.targets": { edge: "evidence", note: "What a claim is about." },
  "metric.targets": { edge: "evidence", note: "What a metric measures." },

  "problem.targets": { edge: "problem", note: "Where the machine is thought to break." },
  "problem.claims": { edge: "evidence", note: "What the problem's case rests on, as the problem file itself names it." },
  "problem.metrics": { edge: "evidence", note: "What would show the problem is real." },

  "bet.problem": { edge: "bet", note: "The one problem a bet answers." },
  "bet.claims": { edge: "evidence", note: "What the bet's reasoning rests on." },
  "bet.metrics": { edge: "evidence", note: "What would tell us the bet worked." },

  "metric.perspectives.actor": {
    blockOnly: true,
    note:
      "Whose number this is. Rendered on the metric as 'Who this serves'. An edge would put entities on the evidence " +
      "lens, where the question is what we believe rather than what moves through the machine — and the entities lens " +
      "already answers the other question.",
  },
  "metric.decisionOwner": {
    blockOnly: true,
    note: "Who acts on the number. Same reasoning as perspectives.actor: rendered where it is read, not drawn.",
  },
  "bet.participant": {
    blockOnly: true,
    note:
      "The actor an experiment studies. Read on the bet and in the prototype packet; drawing it would put an entity on " +
      "the bets lens, which answers what we are trying rather than who is involved.",
  },
};

export type Unrepresented = {
  field: string;
  from: string;
  to: string;
  file: string;
  reason: string;
};

/** Both directions: an edge represents a relationship however it was authored. */
function hasEdge(graph: ModelGraph, a: string, b: string, kind: string) {
  return graph.edges.some(
    (edge) => edge.kind === kind && ((edge.source === a && edge.target === b) || (edge.source === b && edge.target === a)),
  );
}

const NODE_KIND_OF_FIELD: Record<string, string> = {
  "step.next": "step",
  "step.entity": "entity",
  "step.claims": "claim",
  "step.metrics": "metric",
  "stage.metrics": "metric",
  "claim.targets": "",
  "metric.targets": "",
  "problem.targets": "",
  "problem.claims": "claim",
  "problem.metrics": "metric",
  "bet.problem": "problem",
  "bet.claims": "claim",
  "bet.metrics": "metric",
};

/** Resolve a target id to its node, since some fields may name a stage or a step. */
function targetNodeId(graph: ModelGraph, contentId: string, declared: string) {
  if (declared) return nodeId(declared as never, contentId);
  const found = graph.nodes.find((node) => node.contentId === contentId && (node.kind === "stage" || node.kind === "step"));
  return found?.id ?? "";
}

export function checkProjection(repo: Repository, graph: ModelGraph): Unrepresented[] {
  const problems: Unrepresented[] = [];

  for (const reference of repo.references) {
    const resolution = RELATIONSHIPS[reference.field];
    if (!resolution) {
      problems.push({
        ...reference,
        reason:
          `is a reference the projection has never been asked about. Add '${reference.field}' to RELATIONSHIPS in ` +
          `lib/model/conformance.ts — as an edge the projection derives, or as a deliberate block-only decision with ` +
          `the reason written down.`,
      });
      continue;
    }
    if (!("edge" in resolution)) continue;

    const from = nodeId(reference.fromKind as never, reference.from);
    const to = targetNodeId(graph, reference.to, NODE_KIND_OF_FIELD[reference.field] ?? "");
    if (to && hasEdge(graph, from, to, resolution.edge)) continue;

    problems.push({
      ...reference,
      reason:
        `should produce a '${resolution.edge}' edge and does not. The content says it; the projection does not know ` +
        `it. Surfaces that read edges — the map's lenses, open ends — will disagree with the record page, which reads ` +
        `the field directly. Derive it in lib/model/graph.ts.`,
    });
  }

  return problems;
}
