import type { FlowLayerId, FlowTransfer, ModelEdge } from "@/lib/model/types";

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
    description: "Primary progression and process sequence through the system.",
  },
  {
    id: "data",
    label: "Data & state",
    shortLabel: "data",
    description: "Information or state passed between parts of the system.",
  },
  {
    id: "experience",
    label: "Experience",
    shortLabel: "experience",
    description: "Participant experience carried across a boundary. Gaps stay explicit rather than inferred.",
  },
  {
    id: "learning",
    label: "Learning",
    shortLabel: "learning",
    description: "Feedback that changes how earlier work is done.",
  },
];

export const DEFAULT_FLOW_LAYERS: FlowLayerId[] = [...FLOW_LAYER_IDS];

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

export function edgeFlowLayers(edge: Pick<ModelEdge, "kind" | "label">): FlowLayerId[] {
  if (edge.kind === "feedback") return ["learning"];
  if (edge.kind === "state" || edge.kind === "evidence") return ["data"];
  if (edge.kind === "process") return ["operating"];
  if (edge.kind !== "flow") return [];

  const relationship = edge.label?.trim().toLowerCase();
  return relationship && DATA_RELATIONSHIPS.has(relationship) ? ["data"] : ["operating"];
}

/** State or information transfers already projected onto a Stage connection. */
export function edgeFlowTransfers(edge: ModelEdge): FlowTransfer[] {
  return edge.connection?.transfers ?? [];
}

/** Layers visible on an edge after the projection has assembled connection depth. */
export function edgeProjectedFlowLayers(edge: ModelEdge): FlowLayerId[] {
  return edge.connection?.layers ?? edgeFlowLayers(edge);
}

export function hasActiveProjectedFlowLayer(edge: ModelEdge, active: Set<FlowLayerId>): boolean {
  const layers = edgeProjectedFlowLayers(edge);
  return layers.length === 0 || layers.some((layer) => active.has(layer));
}

/**
 * Only operating progression determines left-to-right rank. Data couplings and
 * feedback remain real edges, but they overlay the topology instead of turning
 * every relationship into another step in a funnel.
 */
export function isOperatingProgression(edge: Pick<ModelEdge, "kind" | "label" | "connection">): boolean {
  const layers = edge.connection?.layers ?? edgeFlowLayers(edge);
  return edge.kind === "flow" && layers.includes("operating");
}
