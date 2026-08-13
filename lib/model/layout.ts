/**
 * Deterministic layout for the map canvas.
 *
 * Positions are computed from topology, never stored in content or in
 * components. Two people opening the same revision see the same picture, which
 * is what makes the map shareable; anyone who drags a node is overriding a
 * derived position, not editing the model.
 *
 * Two strategies:
 *
 * - `dag` for the operating-flow lens. Stages are ranked left to right by
 *   longest path over non-feedback edges, then ordered within each rank to
 *   reduce edge crossings. An expanded stage becomes a container whose steps
 *   are laid out vertically inside it, so drilling in grows the stage downward
 *   instead of rearranging the whole graph.
 * - `bands` for the satellite lenses. The stage spine stays on top and the
 *   attached primitives settle beneath the things they point at.
 */

import { LENS_BANDS } from "@/lib/model/kinds";
import type { LensId, ModelEdge, ModelNode, NodeKind } from "@/lib/model/types";

export type LayoutNode = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Present when the node is drawn inside an expanded stage container. */
  parentId?: string;
};

export type LayoutResult = {
  nodes: LayoutNode[];
  /** Stage rank, reused by the band layout to keep the spine in flow order. */
  ranks: Map<string, number>;
};

/** Intrinsic node sizes. Kept here so layout maths and CSS cannot disagree. */
export const NODE_SIZE: Record<NodeKind, { width: number; height: number }> = {
  stage: { width: 256, height: 150 },
  step: { width: 212, height: 104 },
  problem: { width: 252, height: 130 },
  bet: { width: 244, height: 124 },
  prototype: { width: 212, height: 88 },
  claim: { width: 252, height: 124 },
  metric: { width: 204, height: 92 },
  entity: { width: 196, height: 92 },
};

const COLUMN_GAP = 72;
const ROW_GAP = 40;
const BAND_GAP = 92;
const SATELLITE_GAP = 40;

const CONTAINER_PADDING_X = 16;
const CONTAINER_HEADER = 132;
const CONTAINER_PADDING_BOTTOM = 18;
const INNER_COLUMN_GAP = 24;
const INNER_ROW_GAP = 20;

/* -------------------------------------------------------------------------- */
/* Ranking                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Longest-path ranking over a directed acyclic edge set.
 *
 * Nodes that never appear as a target start at rank 0. Any node left unresolved
 * by the topological sweep — which can only happen if content introduces a
 * cycle the schema does not forbid — is appended after the resolved ranks so it
 * still renders somewhere sensible rather than disappearing.
 */
function longestPathRanks(ids: string[], edges: Array<{ source: string; target: string }>): Map<string, number> {
  const present = new Set(ids);
  const usable = edges.filter((edge) => present.has(edge.source) && present.has(edge.target) && edge.source !== edge.target);

  const outgoing = new Map<string, string[]>();
  const indegree = new Map<string, number>(ids.map((id) => [id, 0]));
  for (const edge of usable) {
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  }

  const rank = new Map<string, number>(ids.map((id) => [id, 0]));
  const queue = ids.filter((id) => (indegree.get(id) ?? 0) === 0);
  const settled = new Set<string>();

  while (queue.length > 0) {
    const id = queue.shift() as string;
    settled.add(id);
    for (const next of outgoing.get(id) ?? []) {
      rank.set(next, Math.max(rank.get(next) ?? 0, (rank.get(id) ?? 0) + 1));
      const remaining = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, remaining);
      if (remaining === 0) queue.push(next);
    }
  }

  const maxSettled = Math.max(0, ...[...settled].map((id) => rank.get(id) ?? 0));
  let overflow = maxSettled + 1;
  for (const id of ids) {
    if (!settled.has(id)) rank.set(id, overflow++);
  }
  return rank;
}

/**
 * Orders nodes inside each rank so edges cross as little as possible, using
 * barycentre sweeps. Ties fall back to the stable order the caller supplied,
 * which keeps layout deterministic across revisions.
 */
function orderColumns(
  columns: Map<number, string[]>,
  edges: Array<{ source: string; target: string }>,
  rank: Map<string, number>,
): void {
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  for (const edge of edges) {
    if (rank.get(edge.source) === undefined || rank.get(edge.target) === undefined) continue;
    incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge.source]);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
  }

  const indexIn = (column: string[], id: string) => column.indexOf(id);
  const sweep = (rankOrder: number[], neighbours: Map<string, string[]>, neighbourRank: number) => {
    for (const index of rankOrder) {
      const column = columns.get(index);
      const reference = columns.get(index + neighbourRank);
      if (!column || !reference) continue;
      const barycentre = new Map<string, number>();
      column.forEach((id, position) => {
        const related = (neighbours.get(id) ?? []).map((other) => indexIn(reference, other)).filter((value) => value >= 0);
        barycentre.set(id, related.length > 0 ? related.reduce((a, b) => a + b, 0) / related.length : position);
      });
      column.sort((a, b) => (barycentre.get(a) ?? 0) - (barycentre.get(b) ?? 0));
    }
  };

  const indices = [...columns.keys()].sort((a, b) => a - b);
  sweep(indices, incoming, -1);
  sweep([...indices].reverse(), outgoing, 1);
}

/* -------------------------------------------------------------------------- */
/* Expanded-stage interiors                                                    */
/* -------------------------------------------------------------------------- */

type Interior = { width: number; height: number; children: LayoutNode[] };

/**
 * Lays a stage's steps out vertically inside its container: one row per rank
 * along `next`, siblings side by side. Steps with no sequence recorded stack in
 * `order`, which is honest about a stage whose process is not yet sequenced.
 */
function layoutInterior(steps: ModelNode[], edges: ModelEdge[], parentId: string): Interior {
  const ids = steps.map((step) => step.id);
  const sequence = edges.filter((edge) => edge.kind === "process");
  const connected = new Set(sequence.flatMap((edge) => [edge.source, edge.target]));

  const ordered = [...steps].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title));
  const ranks = longestPathRanks(ids, sequence);

  // Steps outside the sequence get their own rows in declared order, appended
  // after anything the sequence positions.
  const sequencedMax = Math.max(-1, ...ids.filter((id) => connected.has(id)).map((id) => ranks.get(id) ?? 0));
  let loose = sequencedMax + 1;
  for (const step of ordered) {
    if (!connected.has(step.id)) ranks.set(step.id, loose++);
  }

  const rows = new Map<number, ModelNode[]>();
  for (const step of ordered) {
    const row = ranks.get(step.id) ?? 0;
    rows.set(row, [...(rows.get(row) ?? []), step]);
  }

  const rowIndices = [...rows.keys()].sort((a, b) => a - b);
  const size = NODE_SIZE.step;
  const width = Math.max(
    ...rowIndices.map((index) => {
      const count = rows.get(index)?.length ?? 0;
      return count * size.width + Math.max(0, count - 1) * INNER_COLUMN_GAP;
    }),
    size.width,
  );

  const children: LayoutNode[] = [];
  let y = 0;
  for (const index of rowIndices) {
    const row = rows.get(index) ?? [];
    const rowWidth = row.length * size.width + Math.max(0, row.length - 1) * INNER_COLUMN_GAP;
    let x = (width - rowWidth) / 2;
    for (const step of row) {
      children.push({
        id: step.id,
        x: CONTAINER_PADDING_X + x,
        y: CONTAINER_HEADER + y,
        width: size.width,
        height: size.height,
        parentId,
      });
      x += size.width + INNER_COLUMN_GAP;
    }
    y += size.height + INNER_ROW_GAP;
  }

  return {
    width: width + CONTAINER_PADDING_X * 2,
    height: CONTAINER_HEADER + Math.max(0, y - INNER_ROW_GAP) + CONTAINER_PADDING_BOTTOM,
    children,
  };
}

/* -------------------------------------------------------------------------- */
/* Layout strategies                                                           */
/* -------------------------------------------------------------------------- */

function layoutFlow(nodes: ModelNode[], edges: ModelEdge[], expanded: Set<string>): LayoutResult {
  const stages = nodes.filter((node) => node.kind === "stage");
  const stepsByParent = new Map<string, ModelNode[]>();
  for (const node of nodes) {
    if (node.kind !== "step" || !node.parentId) continue;
    stepsByParent.set(node.parentId, [...(stepsByParent.get(node.parentId) ?? []), node]);
  }

  const stageIds = stages.map((stage) => stage.id);
  const forward = edges.filter((edge) => edge.kind === "flow");
  const ranks = longestPathRanks(stageIds, forward);

  const columns = new Map<number, string[]>();
  for (const stage of [...stages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title))) {
    const rank = ranks.get(stage.id) ?? 0;
    columns.set(rank, [...(columns.get(rank) ?? []), stage.id]);
  }
  orderColumns(columns, forward, ranks);

  // Size every stage first: an expanded one is as tall as its interior.
  const interiors = new Map<string, Interior>();
  const sizes = new Map<string, { width: number; height: number }>();
  for (const stage of stages) {
    const children = stepsByParent.get(stage.id) ?? [];
    if (expanded.has(stage.id) && children.length > 0) {
      const interior = layoutInterior(children, edges, stage.id);
      interiors.set(stage.id, interior);
      sizes.set(stage.id, {
        width: Math.max(NODE_SIZE.stage.width, interior.width),
        height: interior.height,
      });
    } else {
      sizes.set(stage.id, NODE_SIZE.stage);
    }
  }

  const indices = [...columns.keys()].sort((a, b) => a - b);
  const columnHeights = new Map<number, number>();
  for (const index of indices) {
    const ids = columns.get(index) ?? [];
    columnHeights.set(
      index,
      ids.reduce((total, id) => total + (sizes.get(id)?.height ?? 0), 0) + Math.max(0, ids.length - 1) * ROW_GAP,
    );
  }
  const tallest = Math.max(0, ...columnHeights.values());

  const placed: LayoutNode[] = [];
  let x = 0;
  for (const index of indices) {
    const ids = columns.get(index) ?? [];
    const columnWidth = Math.max(...ids.map((id) => sizes.get(id)?.width ?? 0), NODE_SIZE.stage.width);
    let y = (tallest - (columnHeights.get(index) ?? 0)) / 2;
    for (const id of ids) {
      const size = sizes.get(id) ?? NODE_SIZE.stage;
      placed.push({ id, x: x + (columnWidth - size.width) / 2, y, width: size.width, height: size.height });
      const interior = interiors.get(id);
      if (interior) placed.push(...interior.children);
      y += size.height + ROW_GAP;
    }
    x += columnWidth + COLUMN_GAP;
  }

  return { nodes: placed, ranks };
}

function layoutBands(
  lens: LensId,
  nodes: ModelNode[],
  edges: ModelEdge[],
  stageRanks: Map<string, number>,
): LayoutResult {
  const bands = LENS_BANDS[lens] ?? [];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const neighbours = new Map<string, string[]>();
  for (const edge of edges) {
    if (!byId.has(edge.source) || !byId.has(edge.target)) continue;
    neighbours.set(edge.source, [...(neighbours.get(edge.source) ?? []), edge.target]);
    neighbours.set(edge.target, [...(neighbours.get(edge.target) ?? []), edge.source]);
  }

  const placed: LayoutNode[] = [];
  const centreOf = new Map<string, number>();
  let bandTop = 0;

  for (const kinds of bands) {
    const allowed = new Set(kinds);
    const members = nodes.filter((node) => allowed.has(node.kind));
    if (members.length === 0) continue;

    const desired = new Map<string, number>();
    for (const node of members) {
      const anchors = (neighbours.get(node.id) ?? [])
        .map((id) => centreOf.get(id))
        .filter((value): value is number => value !== undefined);

      // A step that is only linked to something in a *later* band — a bet, say —
      // has no anchor yet, so fall back to the stage that contains it. Without
      // this it would drift to the far left, away from everything it belongs to.
      const containing = node.parentId ? centreOf.get(node.parentId) : undefined;
      if (anchors.length > 0) {
        desired.set(node.id, anchors.reduce((a, b) => a + b, 0) / anchors.length);
      } else if (containing !== undefined) {
        desired.set(node.id, containing);
      }
    }

    const sorted = [...members].sort((a, b) => {
      const left = desired.get(a.id);
      const right = desired.get(b.id);
      if (left !== undefined && right !== undefined && left !== right) return left - right;
      if (left !== undefined && right === undefined) return -1;
      if (left === undefined && right !== undefined) return 1;
      const rankDelta = (stageRanks.get(a.id) ?? 0) - (stageRanks.get(b.id) ?? 0);
      if (rankDelta !== 0) return rankDelta;
      return (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title);
    });

    // Sweep left to right, pulling each node toward the things it connects to
    // while never letting two nodes overlap.
    let cursor = -Infinity;
    let bandHeight = 0;
    for (const node of sorted) {
      const size = NODE_SIZE[node.kind];
      const target = desired.get(node.id);
      const left = target === undefined ? (cursor === -Infinity ? 0 : cursor) : Math.max(target - size.width / 2, cursor === -Infinity ? target - size.width / 2 : cursor);
      placed.push({ id: node.id, x: left, y: bandTop, width: size.width, height: size.height });
      centreOf.set(node.id, left + size.width / 2);
      cursor = left + size.width + SATELLITE_GAP;
      bandHeight = Math.max(bandHeight, size.height);
    }

    bandTop += bandHeight + BAND_GAP;
  }

  // Normalise so the graph starts at the origin regardless of negative pulls.
  const minX = Math.min(0, ...placed.map((node) => node.x));
  if (minX < 0) for (const node of placed) node.x -= minX;

  return { nodes: placed, ranks: stageRanks };
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                 */
/* -------------------------------------------------------------------------- */

export function layoutGraph(
  lens: LensId,
  nodes: ModelNode[],
  edges: ModelEdge[],
  expanded: Set<string>,
): LayoutResult {
  if (lens === "flow") return layoutFlow(nodes, edges, expanded);

  // Satellite lenses keep the spine in operating-flow order, so switching lens
  // never scrambles the reader's mental model of the system.
  const stageIds = nodes.filter((node) => node.kind === "stage").map((node) => node.id);
  const stageRanks = longestPathRanks(stageIds, edges.filter((edge) => edge.kind === "flow"));
  return layoutBands(lens, nodes, edges, stageRanks);
}
