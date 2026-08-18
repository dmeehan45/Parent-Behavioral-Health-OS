"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import type { FlowConnectionDepth, FlowLayerId } from "@/lib/model/types";

type ConnectionEdgeData = {
  connection?: FlowConnectionDepth;
  activeLayers?: FlowLayerId[];
  dimmed?: boolean;
};

/**
 * A Stage handoff that stays readable at the map's normal fitted zoom.
 *
 * The old SVG label was intentionally hidden until near 1x because SVG text
 * scales with the canvas. That made the richer connection model technically
 * present but invisible in the overview people actually use. The path remains
 * in React Flow; this DOM label sits over its midpoint and carries only the
 * compact boundary summary. Full explanation belongs in an inspector, not in
 * a larger node wedged between the stages.
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
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 14,
  });

  const detail = (data ?? {}) as ConnectionEdgeData;
  const connection = detail.connection;
  const active = new Set(detail.activeLayers ?? []);

  if (!connection) {
    return <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />;
  }

  const chips: Array<{ key: string; text: string; title?: string; tone: "neutral" | "data" | "gap" | "problem" }> = [];

  if (active.has("operating") && connection.layers.includes("operating")) {
    if (connection.processHandoffs.length > 0) {
      const titles = connection.processHandoffs
        .map((handoff) => `${handoff.sourceTitle} → ${handoff.targetTitle}`)
        .join("; ");
      chips.push({
        key: "work",
        text: `work · ${connection.processHandoffs.length} handoff${connection.processHandoffs.length === 1 ? "" : "s"}`,
        title: titles,
        tone: "neutral",
      });
    } else if (connection.gaps.includes("operating")) {
      chips.push({ key: "work-gap", text: "work · gap", title: "No cross-stage Step handoff is described.", tone: "gap" });
    }
  }

  if (active.has("data") && connection.layers.includes("data")) {
    if (connection.transfers.length > 0) {
      const first = connection.transfers[0];
      chips.push({
        key: "data",
        text: `data · ${first.label}`,
        title: connection.transfers.map((transfer) => transfer.label).join("; "),
        tone: "data",
      });
    } else {
      chips.push({ key: "data-gap", text: "data · gap", title: "The relationship is explicit; its payload is not.", tone: "gap" });
    }
  }

  if (active.has("experience") && connection.gaps.includes("experience")) {
    chips.push({
      key: "experience-gap",
      text: "experience · gap",
      title: "No cross-boundary participant-experience payload is explicit yet.",
      tone: "gap",
    });
  }

  if (connection.problems.length > 0) {
    chips.push({
      key: "problems",
      text: `${connection.problems.length} problem${connection.problems.length === 1 ? "" : "s"}`,
      title: connection.problems.map((problem) => problem.title).join("; "),
      tone: "problem",
    });
  }

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      {chips.length > 0 ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            aria-label="Handoff detail"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              display: "grid",
              gap: 3,
              maxWidth: 180,
              padding: "4px 5px",
              background: "var(--surface)",
              border: "1px solid var(--line-strong)",
              borderRadius: "var(--radius)",
              boxShadow: "var(--shadow-sm)",
              opacity: detail.dimmed ? 0.28 : 0.96,
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontSize: 8,
                lineHeight: 1.2,
                fontWeight: 750,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
              }}
            >
              handoff
            </span>
            {chips.map((chip) => (
              <span
                key={chip.key}
                title={chip.title}
                style={{
                  display: "block",
                  minWidth: 0,
                  maxWidth: 168,
                  padding: "2px 5px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  borderRadius: "var(--radius-pill)",
                  border: `1px solid ${chipBorder(chip.tone)}`,
                  background: chipBackground(chip.tone),
                  color: chipInk(chip.tone),
                  fontSize: 9,
                  lineHeight: 1.25,
                  fontWeight: 650,
                }}
              >
                {chip.text}
              </span>
            ))}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

function chipBorder(tone: ConnectionEdgeData extends never ? never : "neutral" | "data" | "gap" | "problem") {
  if (tone === "data") return "color-mix(in srgb, var(--kind-metric) 45%, var(--line))";
  if (tone === "problem") return "color-mix(in srgb, var(--kind-problem) 45%, var(--line))";
  if (tone === "gap") return "var(--line-strong)";
  return "color-mix(in srgb, var(--kind-stage) 40%, var(--line))";
}

function chipBackground(tone: "neutral" | "data" | "gap" | "problem") {
  if (tone === "data") return "color-mix(in srgb, var(--kind-metric) 10%, var(--surface))";
  if (tone === "problem") return "color-mix(in srgb, var(--kind-problem) 10%, var(--surface))";
  if (tone === "gap") return "var(--surface-2)";
  return "color-mix(in srgb, var(--kind-stage) 8%, var(--surface))";
}

function chipInk(tone: "neutral" | "data" | "gap" | "problem") {
  if (tone === "data") return "var(--kind-metric)";
  if (tone === "problem") return "var(--kind-problem)";
  if (tone === "gap") return "var(--ink-3)";
  return "var(--ink-2)";
}
