"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { DetailBlocks } from "@/components/model/detail-blocks";
import {
  AuthorityBadge,
  Badge,
  ConfidenceBadge,
  KindBadge,
  Provenance,
} from "@/components/model/badges";
import { KIND_LABELS } from "@/lib/model/kinds";
import type { ModelGraph, ModelNode } from "@/lib/model/types";

type SnapState = "peek" | "full";

/**
 * The detail layer.
 *
 * Opening a primitive never navigates away from the map: on a wide screen the
 * sheet docks beside the canvas, on a narrow one it rises from the bottom and
 * can be dragged between a peek and a full read. Links inside it move *within*
 * the sheet and push onto a trail, so following a bet to its claim to the step
 * it describes still leaves the whole graph behind you.
 */
export function DetailSheet({
  graph,
  node,
  missing,
  trailDepth,
  onBack,
  onClose,
  onNavigate,
  onFocus,
}: {
  graph: ModelGraph;
  node?: ModelNode;
  /** True when the open node disappeared from the model in a live update. */
  missing: boolean;
  trailDepth: number;
  onBack: () => void;
  onClose: () => void;
  onNavigate: (nodeId: string) => void;
  onFocus: (nodeId: string) => void;
}) {
  // Remounted per primitive by its caller, so a newly opened record always
  // starts at the top of the panel and at the peek height.
  const [snap, setSnap] = useState<SnapState>("peek");
  const [drag, setDrag] = useState(0);
  const dragOrigin = useRef<number | undefined>(undefined);
  // A pointer drag is followed by a click on the same element, which would
  // immediately undo the snap the drag just chose.
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

  if (!node && !missing) return null;

  return (
    <aside
      className={`detail-sheet snap-${snap}`}
      style={drag !== 0 ? { transform: `translateY(${Math.max(0, drag)}px)` } : undefined}
      aria-label={node ? `${KIND_LABELS[node.kind]} detail` : "Detail"}
    >
      <div
        className="sheet-grip"
        role="button"
        tabIndex={0}
        aria-label={snap === "full" ? "Collapse detail panel" : "Expand detail panel"}
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
          {trailDepth > 0 ? (
            <button type="button" className="icon-button" onClick={onBack} aria-label="Back to the previous primitive">
              ←
            </button>
          ) : null}
          {node ? <KindBadge kind={node.kind} /> : null}
          <button type="button" className="icon-button sheet-close" onClick={onClose} aria-label="Close detail panel">
            ✕
          </button>
        </div>

        {missing || !node ? (
          <>
            <h2>No longer in the model</h2>
            <p className="sheet-summary">
              This primitive was removed from <code>content/</code> in the latest revision.
            </p>
          </>
        ) : (
          <>
            <h2>{node.title}</h2>
            {node.subtitle ? <p className="sheet-subtitle">{node.subtitle}</p> : null}
            {node.summary ? <p className="sheet-summary">{node.summary}</p> : null}

            <div className="sheet-badges">
              <AuthorityBadge
                authority={node.authority}
                title={graph.vocab.authority.find((term) => term.id === node.authority)?.description}
              />
              <ConfidenceBadge confidence={node.confidence} />
              {node.status ? <Badge tone="quiet">{node.status}</Badge> : null}
              {node.dataStatus ? <Badge tone="quiet">data {node.dataStatus}</Badge> : null}
            </div>
          </>
        )}
      </header>

      {node ? (
        <div className="sheet-body">
          {/* Substance first. The panel is narrow, and a reader who opened a
              primitive wants to read it, not audit how completely it is filled in. */}
          {/* Level three: inside the sheet these sit under the record's own h2. */}
          <DetailBlocks blocks={node.blocks} onNavigate={onNavigate} headingLevel={3} />

          <footer className="sheet-foot">
            <Link className="button" href={node.href}>
              {node.kind === "prototype" ? "Launch prototype" : `Open ${KIND_LABELS[node.kind].toLowerCase()} page`}
              <span aria-hidden="true">→</span>
            </Link>
            {node.lenses.length > 0 ? (
              <button type="button" className="button secondary" onClick={() => onFocus(node.id)}>
                Centre on map
              </button>
            ) : null}
          </footer>

          <Provenance
            provenance={node.provenance}
            lastReviewed={node.lastReviewed}
            coverage={node.coverage}
            file={node.file}
            sourceUrl={graph.sourceUrl}
          />
        </div>
      ) : null}
    </aside>
  );
}
