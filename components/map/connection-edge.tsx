"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  useStore,
  type EdgeProps,
} from "@xyflow/react";
import type { FlowConnectionDepth, FlowLayerId, FlowTransfer } from "@/lib/model/types";

type ConnectionEdgeData = {
  connection?: FlowConnectionDepth;
  activeLayers?: FlowLayerId[];
  dimmed?: boolean;
  feedback?: boolean;
  returnLoop?: boolean;
  onOpen?: (edgeId: string) => void;
};

type LabelTone = "neutral" | "data" | "actor" | "learning" | "gap";

/**
 * Stage connections carry richer detail than the overview should print.
 *
 * With several layers active, the line itself is the overview and the canvas
 * stays text-free. Once a reader isolates one layer, a single compact label can
 * expose the most specific thing that layer knows about the boundary. This
 * avoids repeating "handoff", "1 handoff", and the same gap on every edge while
 * preserving a way to inspect the underlying connection.
 */
export function ConnectionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps) {
  const zoom = useStore((state) => state.transform[2]);
  const detail = (data ?? {}) as ConnectionEdgeData;
  const pathArgs = { sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition };
  const [path, labelX, labelY] = detail.feedback
    ? getBezierPath(pathArgs)
    : getSmoothStepPath({ ...pathArgs, borderRadius: 14 });

  const connection = detail.connection;
  if (!connection) return <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />;

  const activeLayers = detail.activeLayers ?? [];
  const isolated = activeLayers.length === 1 ? activeLayers[0] : undefined;
  const label = isolated ? labelForLayer(isolated, connection, detail.returnLoop) : undefined;

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      {label ? (
        <EdgeLabelRenderer>
          <button
            type="button"
            className="connection-detail-label nodrag nopan"
            aria-label={`Inspect ${layerName(isolated!)}`}
            onClick={(event) => {
              event.stopPropagation();
              detail.onOpen?.(id);
            }}
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px) scale(${readabilityScale(zoom)})`,
              transformOrigin: "center",
              maxWidth: 170,
              minHeight: 30,
              padding: "5px 8px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              background: labelBackground(label.tone),
              border: `1px solid ${labelBorder(label.tone)}`,
              borderRadius: "var(--radius-pill)",
              boxShadow: "var(--shadow-sm)",
              color: labelInk(label.tone),
              fontSize: 10,
              lineHeight: 1.2,
              fontWeight: 680,
              textAlign: "left",
              cursor: "pointer",
              pointerEvents: "all",
              opacity: detail.dimmed ? 0.28 : 0.96,
            }}
            title={label.title}
          >
            {label.text}
          </button>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

function labelForLayer(
  layer: FlowLayerId,
  connection: FlowConnectionDepth,
  returnLoop?: boolean,
): { text: string; title?: string; tone: LabelTone } | undefined {
  if (layer === "operating") {
    if (returnLoop) return { text: "return to earlier work", tone: "neutral" };
    if (connection.gaps.includes("operating")) {
      return { text: "handoff not modelled", tone: "gap" };
    }
    // A single ordinary cross-stage Step is already communicated by the arrow.
    // Print only when this boundary is structurally denser than that.
    if (connection.processHandoffs.length > 1) {
      return {
        text: `${connection.processHandoffs.length} operating handoffs`,
        title: connection.processHandoffs.map((handoff) => `${handoff.sourceTitle} → ${handoff.targetTitle}`).join("; "),
        tone: "neutral",
      };
    }
    return undefined;
  }

  if (layer === "data") {
    const transfers = layerTransfers(connection.transfers, "data");
    if (transfers.length > 0) return transferLabel(transfers, "data");
    if (connection.gaps.includes("data")) return { text: "payload not modelled", tone: "gap" };
    return undefined;
  }

  if (layer === "experience") {
    const transfers = layerTransfers(connection.transfers, "experience");
    if (transfers.length > 0) return transferLabel(transfers, "actor");
    return undefined;
  }

  if (layer === "learning") {
    if (!connection.layers.includes("learning")) return undefined;
    return connection.gaps.includes("learning")
      ? { text: "feedback payload not modelled", tone: "gap" }
      : { text: "learning feedback", tone: "learning" };
  }

  return undefined;
}

function layerTransfers(transfers: FlowTransfer[], layer: FlowLayerId): FlowTransfer[] {
  return transfers.filter((transfer) => transfer.layer === layer);
}

function transferLabel(
  transfers: FlowTransfer[],
  tone: Extract<LabelTone, "data" | "actor">,
): { text: string; title?: string; tone: LabelTone } {
  const text = transfers.length <= 2
    ? transfers.map((transfer) => transfer.label).join(" + ")
    : `${transfers.slice(0, 2).map((transfer) => transfer.label).join(" + ")} +${transfers.length - 2}`;
  return {
    text,
    title: transfers.map((transfer) => transfer.label).join("; "),
    tone,
  };
}

function layerName(layer: FlowLayerId): string {
  if (layer === "operating") return "operating connection";
  if (layer === "data") return "data connection";
  if (layer === "experience") return "actor connection";
  return "learning connection";
}

function readabilityScale(zoom: number): number {
  return zoom > 0 && zoom < 1 ? Math.min(1.18, 1 / zoom) : 1;
}

function labelBorder(tone: LabelTone) {
  if (tone === "data") return "color-mix(in srgb, var(--kind-metric) 45%, var(--line))";
  if (tone === "actor") return "color-mix(in srgb, var(--kind-entity) 45%, var(--line))";
  if (tone === "learning") return "color-mix(in srgb, var(--kind-bet) 45%, var(--line))";
  if (tone === "gap") return "var(--line-strong)";
  return "color-mix(in srgb, var(--kind-stage) 40%, var(--line))";
}

function labelBackground(tone: LabelTone) {
  if (tone === "data") return "color-mix(in srgb, var(--kind-metric) 10%, var(--surface))";
  if (tone === "actor") return "color-mix(in srgb, var(--kind-entity) 10%, var(--surface))";
  if (tone === "learning") return "color-mix(in srgb, var(--kind-bet) 10%, var(--surface))";
  if (tone === "gap") return "var(--surface-2)";
  return "color-mix(in srgb, var(--kind-stage) 8%, var(--surface))";
}

function labelInk(tone: LabelTone) {
  if (tone === "data") return "var(--kind-metric)";
  if (tone === "actor") return "var(--kind-entity)";
  if (tone === "learning") return "var(--kind-bet)";
  if (tone === "gap") return "var(--ink-3)";
  return "var(--ink-2)";
}
