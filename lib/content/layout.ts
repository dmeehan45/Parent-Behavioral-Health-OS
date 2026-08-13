/**
 * Layout for the top-level system map.
 *
 * Node positions used to live in a literal array inside the React component,
 * indexed by a stage's position in `map.yaml`. That made the map a second source
 * of truth: adding a ninth stage or reordering `map.yaml` required editing
 * application code to keep the graph readable.
 *
 * Positions are now derived from the model's own topology, with optional
 * per-stage overrides in `map.yaml` for when the derived arrangement is not the
 * one an author wants. Either way, adding a stage never requires touching React.
 */

export type Point = { x: number; y: number };

export type LayoutEdge = { from: string; to: string; relationship: string };

const COLUMN_GAP = 290;
const ROW_GAP = 260;

/**
 * A long chain of stages wraps into bands rather than running off to the right.
 *
 * The top-level map is meant to fit on a normal laptop display; an eight-stage
 * model laid out purely by depth is a 2000px ribbon that has to be panned. Flow
 * still reads left to right within a band, and bands stack downward.
 */
const MAX_COLUMNS = 5;
const BAND_GAP = 340;

/**
 * Relationships that do not imply forward progression through the machine.
 *
 * Feedback edges are what make the operating model non-linear — quality and
 * outcomes feed back into supply and matching — so they must not drag their
 * target leftward or introduce cycles into the layering.
 */
const NON_LAYERING = new Set(["feedback_to"]);

/**
 * Assign each stage a depth: one greater than the deepest stage flowing into it.
 *
 * Uses Kahn's algorithm over forward edges only. Any stage left unresolved sits
 * in a residual cycle; it is placed after its resolved predecessors rather than
 * being dropped, so a cyclic model still renders.
 */
function depths(stages: string[], edges: LayoutEdge[]): Map<string, number> {
  const known = new Set(stages);
  const forward = edges.filter((e) => !NON_LAYERING.has(e.relationship) && known.has(e.from) && known.has(e.to));

  const incoming = new Map(stages.map((id) => [id, 0]));
  const outgoing = new Map<string, string[]>(stages.map((id) => [id, []]));
  for (const edge of forward) {
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
    outgoing.get(edge.from)!.push(edge.to);
  }

  const depth = new Map(stages.map((id) => [id, 0]));
  const queue = stages.filter((id) => incoming.get(id) === 0);
  const settled = new Set<string>();

  while (queue.length) {
    const id = queue.shift()!;
    settled.add(id);
    for (const next of outgoing.get(id)!) {
      depth.set(next, Math.max(depth.get(next)!, depth.get(id)! + 1));
      incoming.set(next, incoming.get(next)! - 1);
      if (incoming.get(next) === 0) queue.push(next);
    }
  }

  // Residual cycle: place each remaining stage past its settled predecessors.
  for (const id of stages) {
    if (settled.has(id)) continue;
    const before = forward.filter((e) => e.to === id && settled.has(e.from));
    depth.set(id, before.length ? Math.max(...before.map((e) => depth.get(e.from)! + 1)) : 0);
  }

  return depth;
}

/**
 * Position every stage on the map.
 *
 * Stages are laid out left to right by depth and stacked vertically within a
 * depth, each column centred on the same axis. `overrides` from `map.yaml` win
 * for any stage that specifies one.
 */
export function layoutStages(
  stages: string[],
  edges: LayoutEdge[],
  overrides: Record<string, Point> = {},
): Record<string, Point> {
  const depth = depths(stages, edges);

  const columns = new Map<number, string[]>();
  for (const id of stages) {
    const d = depth.get(id) ?? 0;
    if (!columns.has(d)) columns.set(d, []);
    columns.get(d)!.push(id);
  }

  // Bands are as tall as their tallest column, so wrapped rows never collide.
  const bandHeights = new Map<number, number>();
  for (const [d, ids] of columns) {
    const band = Math.floor(d / MAX_COLUMNS);
    bandHeights.set(band, Math.max(bandHeights.get(band) ?? 0, ids.length));
  }
  const bandOffsets = new Map<number, number>();
  let offset = 0;
  for (const band of [...bandHeights.keys()].sort((a, b) => a - b)) {
    bandOffsets.set(band, offset);
    offset += Math.max(BAND_GAP, bandHeights.get(band)! * ROW_GAP);
  }

  const positions: Record<string, Point> = {};
  for (const [d, ids] of columns) {
    const band = Math.floor(d / MAX_COLUMNS);
    ids.forEach((id, row) => {
      positions[id] = {
        x: (d % MAX_COLUMNS) * COLUMN_GAP,
        y: Math.round((row - (ids.length - 1) / 2) * ROW_GAP) + bandOffsets.get(band)!,
      };
    });
  }

  return { ...positions, ...overrides };
}
