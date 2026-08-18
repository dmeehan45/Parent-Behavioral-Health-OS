"use client";

import { useCallback, useRef, useState } from "react";
import { DetailBlocks } from "@/components/model/detail-blocks";
import { Badge } from "@/components/model/badges";
import { FLOW_LAYER_TERMS } from "@/lib/model/flow-layers";
import type { DetailBlock, FlowLayerId, ModelEdge, ModelGraph, ModelNode } from "@/lib/model/types";

type SnapState = "peek" | "full";

const GAP_LABEL: Record<FlowLayerId, string> = {
  operating: "Operating handoff is not described at Step level",
  data: "Information or state payload is not described",
  experience: "Actor continuity across this boundary is not described",
  learning: "Feedback payload, attribution, cadence, or permitted use is not described",
};

const LAYER_LABEL = new Map(FLOW_LAYER_TERMS.map((term) => [term.id, term.label]));

/**
 * The inspection layer for a Stage connection.
 *
 * It renders only depth already projected onto the edge. Research staging does
 * not appear here: an unresolved layer is shown as a gap until a reviewed model
 * change gives the projection something canonical to say.
 */
export function ConnectionSheet({
  graph,
  edge,
  onClose,
  onNavigate,
}: {
  graph: ModelGraph;
  edge?: ModelEdge;
  onClose: () => void;
  onNavigate: (nodeId: string) => void;
}) {
  const [snap, setSnap] = useState<SnapState>("peek");
  const [drag, setDrag] = useState(0);
  const dragOrigin = useRef<number | undefined>(undefined);
  const draggedRef = useRef(false);

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    dragOrigin.current = event.clientY;
    draggedRef.current = false;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    if (dragOrigin.current === undefined) return;
    const travelled = event.clientY - dragOrigin.current;
    if (Math.abs(travelled) > 6) draggedRef.current = true;
    setDrag(travelled);
  }, []);

  const onPointerUp = useCallback(
    (event: React.PointerEvent) => {
      if (dragOrigin.current === undefined) return;
      const travelled = event.clientY - dragOrigin.current;
      dragOrigin.current = undefined;
      setDrag(0);
      if (travelled < -40) setSnap("full");
      else if (travelled > 90) onClose();
      else if (travelled > 40) setSnap("peek");
    },
    [onClose],
  );

  const toggleSnap = useCallback(() => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    setSnap((current) => (current === "peek" ? "full" : "peek"));
  }, []);

  if (!edge?.connection) return null;

  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const source = byId.get(edge.source);
  const target = byId.get(edge.target);
  const depth = edge.connection;
  const dataTransfers = depth.transfers.filter((transfer) => transfer.layer === "data");
  const actorTransfers = depth.transfers.filter((transfer) => transfer.layer === "experience");

  const blocks: DetailBlock[] = [];
  if (depth.processHandoffs.length > 0) {
    blocks.push({
      type: "list",
      label: "Operating handoffs",
      items: depth.processHandoffs.map((handoff) => `${handoff.sourceTitle} → ${handoff.targetTitle}`),
    });
  }
  if (dataTransfers.length > 0) {
    blocks.push({
      type: "list",
      label: "Data & state crossing",
      items: dataTransfers.map((transfer) => transfer.label),
    });
  }
  if (actorTransfers.length > 0) {
    blocks.push({
      type: "list",
      label: "Actors continuing across the boundary",
      items: actorTransfers.map((transfer) => transfer.label),
    });
  }
  if (depth.problems.length > 0) {
    blocks.push({
      type: "links",
      label: "Problems that span this boundary",
      items: depth.problems.map((problem) => ({
        id: problem.id,
        title: problem.title,
        href: problem.href,
        kind: "problem" as const,
      })),
    });
  }
  if (depth.gaps.length > 0) {
    blocks.push({
      type: "list",
      label: "Still unmodelled",
      items: depth.gaps.map((gap) => GAP_LABEL[gap]),
    });
  }

  return (
    <aside
      className={`detail-sheet snap-${snap}`}
      style={drag !== 0 ? { transform: `translateY(${Math.max(0, drag)}px)` } : undefined}
      aria-label="Stage connection detail"
    >
      <div
        className="sheet-grip"
        role="button"
        tabIndex={0}
        aria-label={snap === "full" ? "Collapse connection panel" : "Expand connection panel"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={toggleSnap}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setSnap((current) => (current === "peek" ? "full" : "peek"));
          }
        }}
      >
        <span aria-hidden="true" />
      </div>

      <header className="sheet-head">
        <div className="sheet-head-row">
          <Badge tone="quiet">Connection</Badge>
          <button type="button" className="icon-button sheet-close" onClick={onClose} aria-label="Close connection panel">
            ✕
          </button>
        </div>
        <h2>{source?.title ?? edge.source} → {target?.title ?? edge.target}</h2>
        <p className="sheet-subtitle">{edge.label ?? "stage relationship"}</p>
        <p className="sheet-summary">
          The canvas stays sparse; this view shows what the model can actually prove crosses this boundary.
        </p>
        <div className="sheet-badges">
          {depth.layers.map((layer) => <Badge key={layer} tone="quiet">{LAYER_LABEL.get(layer) ?? layer}</Badge>)}
          {depth.gaps.length > 0 ? <Badge tone="warn">{depth.gaps.length} gap{depth.gaps.length === 1 ? "" : "s"}</Badge> : null}
        </div>
      </header>

      <div className="sheet-body">
        <div className="sheet-actions">
          {source ? <StageButton node={source} label="Open source stage" onNavigate={onNavigate} /> : null}
          {target ? <StageButton node={target} label="Open target stage" onNavigate={onNavigate} /> : null}
        </div>

        <DetailBlocks blocks={blocks} onNavigate={onNavigate} headingLevel={3} />

        <p className="legend-note" style={{ marginTop: 24 }}>
          Derived from canonical stage topology, Step sequence, Entity states, roles, and Problems. Missing detail remains a gap until reviewed model content supplies it.
        </p>
      </div>
    </aside>
  );
}

function StageButton({ node, label, onNavigate }: { node: ModelNode; label: string; onNavigate: (nodeId: string) => void }) {
  return (
    <button type="button" className="button secondary" onClick={() => onNavigate(node.id)}>
      {label}
    </button>
  );
}
