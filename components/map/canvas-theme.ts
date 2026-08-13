import type { EdgeKind, NodeKind } from "@/lib/model/types";

/**
 * Colours that have to exist as values rather than CSS custom properties,
 * because SVG markers and the minimap are painted from JavaScript. Everything
 * else in the interface is themed with tokens in `globals.css`; these are
 * chosen to hold up on both the light and dark surface.
 */

export const KIND_COLOR: Record<NodeKind, string> = {
  stage: "#1d5b45",
  step: "#3f6b7d",
  bet: "#8a5f27",
  prototype: "#6b4a86",
  claim: "#8a4a58",
  metric: "#276b6b",
  entity: "#5d6a72",
};

export const EDGE_COLOR: Record<EdgeKind, string> = {
  flow: "#6e8a7d",
  feedback: "#b08a52",
  process: "#7f9aa8",
  bet: "#b08a52",
  prototype: "#8f74a8",
  evidence: "#7f9aa8",
  state: "#8d979e",
};
