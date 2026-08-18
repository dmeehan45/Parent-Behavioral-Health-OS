import type { FlowLayerId, FlowTransfer, ModelEdge, ModelGraph } from "@/lib/model/types";

export type { FlowLayerId, FlowTransfer } from "@/lib/model/types";

/**
 * Layers are a reading aid over relationships the model already asserts.
 * They do not create new edges or move content out of `content/`; they let a
 * reader isolate different kinds of movement without changing the underlying
 * graph.
 */
export const FLOW_LAYER_IDS = ["operating", "data", "experience", "learning"] as const satisfies readonly FlowLayerId[];

export type FlowLayerTerm = {
  id: FlowLayerId;
  label: string;
  shortLabel: string;
  description: string;
};

export const FLOW_LAYER_TERMS: FlowLayerTerm[] = [
  {
    id: "operating",
    label: "Operating flow",
    shortLabel: "work",
    description: "Primary progression, process sequence, and rework through the system.",
  },
  {
    id: "data",
    label: "Data & state",
    shortLabel: "data",
    description: "Information or entity state passed between parts of the system.",
  },
  {
    // Keep the persisted id for existing shared URLs. What the current model can
    // prove at this layer is actor continuity, not subjective experience.
    id: "experience",
    label: "Actors",
    shortLabel: "actors",
    description: "People or operating roles that remain involved across a stage boundary.",
  },
  {
    id: "learning",
    label: "Learning",
    shortLabel: "learning",
    description: "Feedback that changes how earlier work is done.",
  },
];

/**
 * Start with the machine and its return/learning loops. Data and actors are
 * opt-in because painting every layer at once obscures the stage topology before
 * the reader has asked a more specific question.
 */
export const DEFAULT_FLOW_LAYERS: FlowLayerId[] = ["operating", "learning"];

export function isFlowLayerId(value: string): value is FlowLayerId {
  return FLOW_LAYER_IDS.includes(value as FlowLayerId);
}

/**
 * Stage topology preserves the authored relationship as `label`. These
 * categories classify that vocabulary for layout and as a fallback for edges
 * that are not Stage connections. Stage connection depth itself is projected
 * in `graph.ts` so every consumer, including `/api/model`, sees the same answer.
 */
const DATA_RELATIONSHIPS = new Set(["informs", "influences", "depends on", "constrains"]);
const RETURN_RELATIONSHIPS = new Set(["returns to"]);

export function edgeFlowLayers(edge: Pick<ModelEdge, "kind" | "label">): FlowLayerId[] {
  const relationship = edge.label?.trim().toLowerCase();
  if (edge.kind === "feedback") return relationship && RETURN_RELATIONSHIPS.has(relationship) ? ["operating"] : ["learning"];
  if (edge.kind === "state" || edge.kind === "evidence") return ["data"];
  if (edge.kind === "process") return ["operating"];
  if (edge.kind !== "flow") return [];

  return relationship && DATA_RELATIONSHIPS.has(relationship) ? ["data"] : ["operating"];
}

/**
 * Resolve the old `(graph, edge)` call shape as well as the new `(edge)` shape.
 * The graph argument is deliberately ignored: connection depth now ships on the
 * edge from `projectModel()` rather than being re-derived by a React consumer.
 */
function projectedEdge(first: ModelEdge | Pick<ModelGraph, "nodes" | "edges">, second?: ModelEdge): ModelEdge {
  return second ?? (first as ModelEdge);
}

/** State, information, or actor transfers already projected onto a Stage connection. */
export function edgeFlowTransfers(edge: ModelEdge): FlowTransfer[];
export function edgeFlowTransfers(graph: Pick<ModelGraph, "nodes" | "edges">, edge: ModelEdge): FlowTransfer[];
export function edgeFlowTransfers(first: ModelEdge | Pick<ModelGraph, "nodes" | "edges">, second?: ModelEdge): FlowTransfer[] {
  return projectedEdge(first, second).connection?.transfers ?? [];
}

/** Layers whose movement is explicitly asserted on an edge. */
export function edgeProjectedFlowLayers(edge: ModelEdge): FlowLayerId[];
export function edgeProjectedFlowLayers(graph: Pick<ModelGraph, "nodes" | "edges">, edge: ModelEdge): FlowLayerId[];
export function edgeProjectedFlowLayers(
  first: ModelEdge | Pick<ModelGraph, "nodes" | "edges">,
  second?: ModelEdge,
): FlowLayerId[] {
  const edge = projectedEdge(first, second);
  return edge.connection?.layers ?? edgeFlowLayers(edge);
}

/** Layers worth inspecting on this boundary, including an explicit gap. */
export function edgeInspectableFlowLayers(edge: ModelEdge): FlowLayerId[] {
  const visible = new Set<FlowLayerId>(edgeProjectedFlowLayers(edge));
  for (const gap of edge.connection?.gaps ?? []) visible.add(gap);
  return FLOW_LAYER_IDS.filter((layer) => visible.has(layer));
}

export function hasActiveProjectedFlowLayer(edge: ModelEdge, active: Set<FlowLayerId>): boolean;
export function hasActiveProjectedFlowLayer(
  graph: Pick<ModelGraph, "nodes" | "edges">,
  edge: ModelEdge,
  active: Set<FlowLayerId>,
): boolean;
export function hasActiveProjectedFlowLayer(
  first: ModelEdge | Pick<ModelGraph, "nodes" | "edges">,
  second: ModelEdge | Set<FlowLayerId>,
  third?: Set<FlowLayerId>,
): boolean {
  const edge = third ? (second as ModelEdge) : (first as ModelEdge);
  const active = third ?? (second as Set<FlowLayerId>);
  const layers = edgeInspectableFlowLayers(edge);
  return layers.length === 0 || layers.some((layer) => active.has(layer));
}

/**
 * Only forward operating progression determines left-to-right rank. Data
 * couplings, return loops, and learning feedback overlay the topology instead
 * of turning every relationship into another step in a funnel.
 */
export function isOperatingProgression(edge: Pick<ModelEdge, "kind" | "label" | "connection">): boolean {
  const layers = edge.connection?.layers ?? edgeFlowLayers(edge);
  return edge.kind === "flow" && layers.includes("operating");
}
