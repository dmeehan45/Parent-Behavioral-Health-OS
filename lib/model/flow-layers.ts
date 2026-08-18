import type { ModelEdge } from "@/lib/model/types";

/**
 * Layers are a reading aid over relationships the model already asserts.
 * They do not create new edges or move content out of `content/`; they let a
 * reader isolate different kinds of movement without changing the underlying
 * graph.
 */
export const FLOW_LAYER_IDS = ["operating", "data", "experience", "learning"] as const;
export type FlowLayerId = (typeof FLOW_LAYER_IDS)[number];

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
    description: "Participant experience carried across a boundary. None is explicit at stage level yet.",
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
 * Stage topology currently preserves the authored relationship as `label`.
 * These categories therefore classify the relationship vocabulary rather than
 * inferring anything from stage IDs or drawing position. If the projection
 * later carries the relationship enum directly, this function is the one place
 * that should switch to it.
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

export function hasActiveFlowLayer(edge: Pick<ModelEdge, "kind" | "label">, active: Set<FlowLayerId>): boolean {
  const layers = edgeFlowLayers(edge);
  return layers.length === 0 || layers.some((layer) => active.has(layer));
}
