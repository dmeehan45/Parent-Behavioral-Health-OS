import { projectModel } from "@/lib/model/graph";
import type { ModelGraph, ModelNode, NodeKind } from "@/lib/model/types";

/**
 * Resolves one primitive for a detail route.
 *
 * Every model-driven page goes through here, so all of them stay projections of
 * `content/` rather than bespoke readers of it.
 */
export function findNode(
  kind: NodeKind,
  contentId: string,
): { graph: ModelGraph; node: ModelNode } | undefined {
  const graph = projectModel();
  const node = graph.nodes.find((candidate) => candidate.kind === kind && candidate.contentId === contentId);
  return node ? { graph, node } : undefined;
}

/** Title used for a detail route's document title and link previews. */
export function nodeMetadata(kind: NodeKind, contentId: string) {
  const found = findNode(kind, contentId);
  if (!found) return { title: "Not found" };
  return {
    title: `${found.node.title} · Parent Behavioral Health OS`,
    description: found.node.summary ?? undefined,
  };
}
