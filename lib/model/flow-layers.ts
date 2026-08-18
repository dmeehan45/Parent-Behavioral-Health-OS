import type { ModelEdge, ModelGraph } from "@/lib/model/types";

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

export type FlowTransfer = {
  layer: FlowLayerId;
  /** Human-readable entity state, e.g. `Clinician: match-ready`. */
  label: string;
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

/**
 * A stage-to-stage arrow is only the headline. The Step graph already says
 * which entity states actually cross many of those boundaries, so expose that
 * existing fact rather than asking authors to repeat it on `map.yaml`.
 */
export function edgeFlowTransfers(graph: Pick<ModelGraph, "nodes" | "edges">, edge: ModelEdge): FlowTransfer[] {
  if (edge.kind !== "flow") return [];

  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const boundarySteps = graph.edges.filter((candidate) => {
    if (candidate.kind !== "process") return false;
    const source = nodeById.get(candidate.source);
    const target = nodeById.get(candidate.target);
    return source?.parentId === edge.source && target?.parentId === edge.target;
  });

  const transfers = new Map<string, FlowTransfer>();
  for (const process of boundarySteps) {
    const produced = graph.edges.filter((candidate) => candidate.kind === "state" && candidate.source === process.source);
    const consumed = graph.edges.filter((candidate) => candidate.kind === "state" && candidate.target === process.target);

    for (const output of produced) {
      const input = consumed.find((candidate) => candidate.source === output.target && candidate.label === output.label);
      if (!input || !output.label) continue;
      const entity = nodeById.get(output.target);
      const label = `${entity?.title ?? output.target.replace(/^entity:/, "")}: ${output.label}`;
      transfers.set(`${output.target}:${output.label}`, { layer: "data", label });
    }
  }

  return [...transfers.values()].sort((a, b) => a.label.localeCompare(b.label));
}

/** Layers visible on an edge after adding state transfers already present in the Step graph. */
export function edgeProjectedFlowLayers(graph: Pick<ModelGraph, "nodes" | "edges">, edge: ModelEdge): FlowLayerId[] {
  const layers = new Set(edgeFlowLayers(edge));
  for (const transfer of edgeFlowTransfers(graph, edge)) layers.add(transfer.layer);
  return FLOW_LAYER_IDS.filter((id) => layers.has(id));
}

export function hasActiveProjectedFlowLayer(
  graph: Pick<ModelGraph, "nodes" | "edges">,
  edge: ModelEdge,
  active: Set<FlowLayerId>,
): boolean {
  const layers = edgeProjectedFlowLayers(graph, edge);
  return layers.length === 0 || layers.some((layer) => active.has(layer));
}

/**
 * Only operating progression determines left-to-right rank. Data couplings and
 * feedback remain real edges, but they overlay the topology instead of turning
 * every relationship into another step in a funnel.
 */
export function isOperatingProgression(edge: Pick<ModelEdge, "kind" | "label">): boolean {
  return edge.kind === "flow" && edgeFlowLayers(edge).includes("operating");
}
