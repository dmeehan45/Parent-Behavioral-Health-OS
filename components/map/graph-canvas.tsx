"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  useReactFlow,
  useStore,
  type Edge,
  type NodeChange,
} from "@xyflow/react";
import { layoutGraph, NODE_SIZE } from "@/lib/model/layout";
import {
  EDGE_COLOR,
  KIND_COLOR,
  MINIMAP_MASK,
  UNKNOWN_NODE_COLOR,
} from "@/components/map/canvas-theme";
import { useLayoutOverrides } from "@/components/map/layout-overrides";
import { nodeTypes, type CanvasNode, type DetailTier, type NodeState } from "@/components/map/model-node";
import type { LensId, ModelGraph, ModelNode } from "@/lib/model/types";

type Props = {
  graph: ModelGraph;
  lens: LensId;
  selectedId?: string;
  expanded: string[];
  changed: Set<string>;
  /** Set when the reader jumps to a node from search; the canvas flies to it. */
  focusRequest?: { id: string; nonce: number };
  /** The detail panel covers the lower canvas on narrow screens. */
  sheetOpen: boolean;
  onSelect: (nodeId?: string) => void;
  onToggleExpand: (nodeId: string) => void;
};

/** Zoom thresholds for level of detail. Below the first, nodes are titles only. */
const COMPACT_BELOW = 0.5;
const DETAILED_ABOVE = 0.78;
const LABELS_ABOVE = 0.7;

/** The map never zooms out past this on its own; below it, nothing is readable. */
const READABLE_ZOOM = 0.5;
const MAX_FIT_ZOOM = 1;

function tierForZoom(zoom: number): DetailTier {
  if (zoom < COMPACT_BELOW) return "compact";
  if (zoom > DETAILED_ABOVE) return "detailed";
  return "standard";
}

export function GraphCanvas({
  graph,
  lens,
  selectedId,
  expanded,
  changed,
  focusRequest,
  sheetOpen,
  onSelect,
  onToggleExpand,
}: Props) {
  const { fitView, getViewport, setViewport, zoomIn, zoomOut } = useReactFlow();
  const zoom = useStore((state) => state.transform[2]);
  const width = useStore((state) => state.width);
  const height = useStore((state) => state.height);
  const tier = tierForZoom(zoom);
  const showLabels = zoom > LABELS_ABOVE;

  const { overrides, merge: mergeOverrides, reset: resetOverrides, hasOverrides } = useLayoutOverrides(lens);

  const expandedSet = useMemo(() => new Set(expanded), [expanded]);

  /* ---- What this lens shows -------------------------------------------- */

  const lensNodes = useMemo(() => {
    const visible = graph.nodes.filter((node) => node.lenses.includes(lens));
    if (lens !== "flow") return visible.filter((node) => node.kind !== "step" || node.lenses.includes(lens));
    // Steps only exist on the canvas while their stage is expanded.
    return visible.filter((node) => node.kind !== "step" || (node.parentId && expandedSet.has(node.parentId)));
  }, [graph.nodes, lens, expandedSet]);

  const lensEdges = useMemo(() => {
    const present = new Set(lensNodes.map((node) => node.id));
    return graph.edges.filter(
      (edge) => edge.lenses.includes(lens) && present.has(edge.source) && present.has(edge.target),
    );
  }, [graph.edges, lens, lensNodes]);

  const layout = useMemo(
    () => layoutGraph(lens, lensNodes, lensEdges, expandedSet),
    [lens, lensNodes, lensEdges, expandedSet],
  );

  /* ---- Focus and dim ---------------------------------------------------- */

  const related = useMemo(() => {
    if (!selectedId) return undefined;
    const set = new Set([selectedId]);
    for (const edge of lensEdges) {
      if (edge.source === selectedId) set.add(edge.target);
      if (edge.target === selectedId) set.add(edge.source);
    }
    for (const node of lensNodes) {
      if (node.parentId === selectedId || node.id === selectedId) {
        set.add(node.id);
        if (node.parentId) set.add(node.parentId);
      }
    }
    return set;
  }, [selectedId, lensEdges, lensNodes]);

  const stateFor = useCallback(
    (node: ModelNode): NodeState => {
      if (node.id === selectedId) return "selected";
      if (!related) return "default";
      return related.has(node.id) ? "related" : "dimmed";
    },
    [selectedId, related],
  );

  /* ---- React Flow nodes and edges --------------------------------------- */

  const stepCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const node of graph.nodes) {
      if (node.kind !== "step" || !node.parentId) continue;
      counts.set(node.parentId, (counts.get(node.parentId) ?? 0) + 1);
    }
    return counts;
  }, [graph.nodes]);

  const byId = useMemo(() => new Map(lensNodes.map((node) => [node.id, node])), [lensNodes]);

  const nodes: CanvasNode[] = useMemo(
    () =>
      layout.nodes.flatMap((placement) => {
        const model = byId.get(placement.id);
        if (!model) return [];
        const override = placement.parentId ? undefined : overrides[placement.id];
        const stepCount = stepCounts.get(placement.id) ?? 0;
        return [
          {
            id: placement.id,
            type: "model" as const,
            position: override ?? { x: placement.x, y: placement.y },
            width: placement.width,
            height: placement.height,
            style: { width: placement.width, height: placement.height },
            parentId: placement.parentId,
            extent: placement.parentId ? ("parent" as const) : undefined,
            draggable: !placement.parentId,
            selectable: false,
            focusable: false,
            ariaLabel: `${model.title}. ${model.kind}.`,
            data: {
              node: model,
              tier: placement.parentId ? ("standard" as DetailTier) : tier,
              insideParent: Boolean(placement.parentId),
              state: stateFor(model),
              expanded: expandedSet.has(placement.id),
              expandable: lens === "flow" && model.kind === "stage" && stepCount > 0,
              stepCount,
              changed: changed.has(placement.id),
              onOpen: onSelect,
              onToggleExpand,
            },
          },
        ];
      }),
    [layout.nodes, byId, overrides, stepCounts, tier, stateFor, expandedSet, lens, changed, onSelect, onToggleExpand],
  );

  const edges: Edge[] = useMemo(
    () =>
      lensEdges.map((edge) => {
        const feedback = edge.kind === "feedback";
        const vertical = edge.kind !== "flow" && edge.kind !== "feedback";
        const dimmed = related ? !(related.has(edge.source) && related.has(edge.target)) : false;
        const color = EDGE_COLOR[edge.kind];

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: feedback ? "sb" : vertical ? "sb" : "sr",
          targetHandle: feedback ? "tb" : vertical ? "tt" : "tl",
          type: feedback ? "default" : "smoothstep",
          pathOptions: feedback ? undefined : { borderRadius: 14 },
          animated: feedback,
          className: `edge edge-${edge.kind}${dimmed ? " edge-dimmed" : ""}`,
          label: showLabels ? edge.label : undefined,
          labelBgPadding: [5, 3] as [number, number],
          labelBgBorderRadius: 3,
          markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color },
          style: {
            stroke: color,
            strokeWidth: edge.kind === "flow" ? 1.6 : 1.2,
            strokeDasharray: feedback ? "6 5" : edge.kind === "state" ? "3 4" : undefined,
          },
        };
      }),
    [lensEdges, related, showLabels],
  );

  /* ---- Viewport behaviour ----------------------------------------------- */

  /**
   * On a narrow screen the sheet covers the lower half of the canvas, so the
   * usable area is shorter than the container.
   */
  const narrow = width > 0 && width < 860;
  const obscuredBottom = sheetOpen && narrow ? height * 0.46 : 0;

  const bounds = useMemo(() => {
    const top = layout.nodes.filter((placement) => !placement.parentId);
    if (top.length === 0) return undefined;
    return {
      minX: Math.min(...top.map((n) => n.x)),
      minY: Math.min(...top.map((n) => n.y)),
      maxX: Math.max(...top.map((n) => n.x + n.width)),
      maxY: Math.max(...top.map((n) => n.y + n.height)),
    };
  }, [layout.nodes]);

  /**
   * Frames the map without ever shrinking it past readability.
   *
   * A plain fit-to-screen is wrong for a long operating flow on a phone: it
   * technically shows everything and communicates nothing. Below the legible
   * floor the view stops zooming out and pins to where the flow starts
   * instead, leaving the minimap to carry the overview.
   */
  const fitEverything = useCallback(() => {
    if (!bounds || width === 0 || height === 0) return;
    const pad = 28;
    const graphWidth = Math.max(1, bounds.maxX - bounds.minX);
    const graphHeight = Math.max(1, bounds.maxY - bounds.minY);
    const usableHeight = Math.max(120, height - obscuredBottom);

    const wouldFit = Math.min((width - pad * 2) / graphWidth, (usableHeight - pad * 2) / graphHeight);
    const zoomLevel = Math.min(MAX_FIT_ZOOM, Math.max(READABLE_ZOOM, wouldFit));

    const fitsAcross = graphWidth * zoomLevel <= width - pad * 2;
    const fitsDown = graphHeight * zoomLevel <= usableHeight - pad * 2;

    setViewport(
      {
        zoom: zoomLevel,
        x: fitsAcross ? (width - graphWidth * zoomLevel) / 2 - bounds.minX * zoomLevel : pad - bounds.minX * zoomLevel,
        y: fitsDown
          ? (usableHeight - graphHeight * zoomLevel) / 2 - bounds.minY * zoomLevel
          : pad - bounds.minY * zoomLevel,
      },
      { duration: 420 },
    );
  }, [bounds, width, height, obscuredBottom, setViewport]);

  useEffect(() => {
    const timer = setTimeout(fitEverything, 120);
    return () => clearTimeout(timer);
  }, [fitEverything]);

  // Refit when the lens changes: a new lens is a new picture.
  const lastLens = useRef<LensId>(lens);
  useEffect(() => {
    if (lastLens.current === lens) return;
    lastLens.current = lens;
    const timer = setTimeout(fitEverything, 40);
    return () => clearTimeout(timer);
  }, [lens, fitEverything]);

  // Frame the stage that just expanded rather than rearranging the reader's view.
  const lastExpanded = useRef<string[]>(expanded);
  useEffect(() => {
    const opened = expanded.find((id) => !lastExpanded.current.includes(id));
    lastExpanded.current = expanded;
    if (!opened) return;
    const timer = setTimeout(() => {
      fitView({ nodes: [{ id: opened }], padding: 0.28, duration: 460, maxZoom: 1 });
    }, 40);
    return () => clearTimeout(timer);
  }, [expanded, fitView]);

  /**
   * Docking the detail panel shrinks the canvas, and on a phone it covers the
   * bottom of it. Either way the primitive the reader just opened can end up
   * behind the panel, so nudge it back into the visible area — but only when it
   * actually left, so an ordinary click never yanks the view around.
   */
  useEffect(() => {
    if (!selectedId || width === 0) return;
    const placement = layout.nodes.find((entry) => entry.id === selectedId);
    if (!placement) return;

    const timer = setTimeout(() => {
      const viewport = getViewport();
      const parent = placement.parentId ? layout.nodes.find((entry) => entry.id === placement.parentId) : undefined;
      const x = placement.x + (parent?.x ?? 0);
      const y = placement.y + (parent?.y ?? 0);

      const usableHeight = Math.max(120, height - obscuredBottom);
      const screenLeft = x * viewport.zoom + viewport.x;
      const screenTop = y * viewport.zoom + viewport.y;
      const screenRight = screenLeft + placement.width * viewport.zoom;
      const screenBottom = screenTop + placement.height * viewport.zoom;

      if (screenLeft >= 0 && screenTop >= 0 && screenRight <= width && screenBottom <= usableHeight) return;

      setViewport(
        {
          zoom: viewport.zoom,
          x: width / 2 - (x + placement.width / 2) * viewport.zoom,
          y: usableHeight / 2 - (y + placement.height / 2) * viewport.zoom,
        },
        { duration: 340 },
      );
    }, 60);

    return () => clearTimeout(timer);
  }, [selectedId, layout.nodes, width, height, obscuredBottom, getViewport, setViewport]);

  useEffect(() => {
    if (!focusRequest) return;
    const timer = setTimeout(() => {
      fitView({ nodes: [{ id: focusRequest.id }], padding: 0.45, duration: 520, maxZoom: 1.15 });
    }, 40);
    return () => clearTimeout(timer);
  }, [focusRequest, fitView]);

  const onNodesChange = useCallback(
    (changes: NodeChange<CanvasNode>[]) => {
      const moved = changes.filter(
        (change): change is Extract<NodeChange<CanvasNode>, { type: "position" }> =>
          change.type === "position" && change.dragging === false && Boolean(change.position),
      );
      if (moved.length === 0) return;
      const positions: Record<string, { x: number; y: number }> = {};
      for (const change of moved) if (change.position) positions[change.id] = change.position;
      mergeOverrides(positions);
    },
    [mergeOverrides],
  );

  const resetLayout = useCallback(() => {
    resetOverrides();
    setTimeout(fitEverything, 40);
  }, [resetOverrides, fitEverything]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onPaneClick={() => onSelect(undefined)}
      onNodeDoubleClick={(_, node) => {
        const model = byId.get(node.id);
        if (model?.kind === "stage" && (stepCounts.get(node.id) ?? 0) > 0) onToggleExpand(node.id);
      }}
      minZoom={0.08}
      maxZoom={1.8}
      nodesConnectable={false}
      nodesFocusable={false}
      edgesFocusable={false}
      elementsSelectable={false}
      panOnScroll={false}
      zoomOnDoubleClick={false}
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{ interactionWidth: 16 }}
    >
      <Background variant={BackgroundVariant.Dots} gap={26} size={1} className="canvas-background" />

      <Panel position="bottom-right" className="canvas-controls">
        <button type="button" onClick={() => zoomIn({ duration: 200 })} aria-label="Zoom in">
          +
        </button>
        <button type="button" onClick={() => zoomOut({ duration: 200 })} aria-label="Zoom out">
          –
        </button>
        <button type="button" onClick={fitEverything} aria-label="Fit the whole map in view">
          ⤢
        </button>
        {hasOverrides ? (
          <button type="button" onClick={resetLayout} aria-label="Reset moved nodes to the derived layout">
            ↺
          </button>
        ) : null}
      </Panel>

      {/* Size lives in `.canvas-minimap`, not here: an inline style outranks the
          media query that shrinks this on a phone. */}
      <MiniMap
        className="canvas-minimap"
        pannable
        zoomable
        ariaLabel="Map overview"
        nodeColor={(node) => {
          const model = byId.get(node.id);
          return model ? KIND_COLOR[model.kind] : UNKNOWN_NODE_COLOR;
        }}
        nodeStrokeWidth={0}
        maskColor={MINIMAP_MASK}
      />
    </ReactFlow>
  );
}

export { NODE_SIZE };
