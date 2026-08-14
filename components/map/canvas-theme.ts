import type { EdgeKind, NodeKind } from "@/lib/model/types";

/**
 * Colours that have to exist as values rather than CSS custom properties,
 * because SVG markers and the minimap are painted from JavaScript.
 *
 * These are the same Family Health Provider ramp steps that `--kind-*` aliases
 * in `globals.css` — the one place a brand value is repeated, because a canvas
 * marker cannot read a custom property. If a hue changes there, change it here.
 * `npm run lint:design` checks the two stay in step.
 */

export const KIND_COLOR: Record<NodeKind, string> = {
  stage: "#0074ac", // blue — the machine as it is
  step: "#004a6b", // blue-darkest — a step inside a stage
  problem: "#cf2038", // coral — where the machine breaks
  claim: "#850009", // coral-darkest — the belief underneath it
  bet: "#9a6100", // gold — what we propose to change
  prototype: "#856600", // gold-darkest — the bet made concrete
  metric: "#007e4a", // green — what we can measure
  entity: "#676f70", // neutral — what moves through it
};

/** What the minimap paints for a node the projection no longer knows about. */
export const UNKNOWN_NODE_COLOR = "#d6d6d6";

/** The minimap's out-of-view wash. Ink at low alpha, not a hue. */
export const MINIMAP_MASK = "rgba(20, 20, 20, 0.08)";

/**
 * Edges take a lighter step of the hue of whatever they connect, so a line
 * reads as belonging to the same category as its endpoints.
 */
export const EDGE_COLOR: Record<EdgeKind, string> = {
  flow: "#39a9dc", // blue-medium
  feedback: "#d69a00", // gold-dark
  process: "#0074ac", // blue
  problem: "#f64c57", // coral-medium
  bet: "#9a6100", // gold
  prototype: "#856600", // gold-darkest
  evidence: "#007e4a", // green
  state: "#959e9f", // neutral
};
