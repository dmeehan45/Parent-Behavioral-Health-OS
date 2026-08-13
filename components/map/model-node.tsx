"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { CoverageMeter } from "@/components/model/badges";
import { KIND_LABELS } from "@/lib/model/kinds";
import type { ModelNode } from "@/lib/model/types";

/** How much of a node is drawn. Driven by canvas zoom, not by node type. */
export type DetailTier = "compact" | "standard" | "detailed";

/** How a node relates to the current selection. Drives the focus/dim treatment. */
export type NodeState = "default" | "selected" | "related" | "dimmed";

export type CanvasNodeData = {
  node: ModelNode;
  tier: DetailTier;
  state: NodeState;
  expanded: boolean;
  expandable: boolean;
  stepCount: number;
  /** True for steps drawn inside their expanded stage, which already names it. */
  insideParent: boolean;
  /** True for a few seconds after this node changed in the repository. */
  changed: boolean;
  onOpen: (nodeId: string) => void;
  onToggleExpand: (nodeId: string) => void;
  [key: string]: unknown;
};

export type CanvasNode = Node<CanvasNodeData, "model">;

export function ModelNodeCard({ data }: NodeProps<CanvasNode>) {
  const { node, tier, state, expanded, expandable, stepCount, insideParent, changed, onOpen, onToggleExpand } =
    data;

  // At a glance only the signals that carry information, and only as many as
  // fit; the detail sheet is where the full set is always shown.
  const visibleSignals =
    tier === "detailed" ? node.signals : node.signals.filter((signal) => signal.value > 0).slice(0, 4);
  // A primitive with nothing counted yet says so. One with nothing countable —
  // a prototype — has no signals at all, and should stay quiet instead.
  const nothingRecorded = node.signals.length > 0 && node.signals.every((signal) => signal.value === 0);

  return (
    <div
      className={`node node-${node.kind} node-${state}${expanded ? " node-expanded" : ""}${
        expandable ? " node-expandable" : ""
      }${changed ? " node-changed" : ""}`}
      data-tier={tier}
    >
      <Handle type="target" position={Position.Left} id="tl" />
      <Handle type="target" position={Position.Top} id="tt" />
      <Handle type="source" position={Position.Right} id="sr" />
      <Handle type="source" position={Position.Bottom} id="sb" />
      <Handle type="target" position={Position.Bottom} id="tb" />

      <button type="button" className="node-main" onClick={() => onOpen(node.id)}>
        <span className="node-head">
          <span className="node-kind">
            {node.order !== undefined ? `${String(node.order).padStart(2, "0")} · ` : ""}
            {KIND_LABELS[node.kind]}
          </span>
          {node.status ? <span className="node-status">{node.status}</span> : null}
        </span>

        <span className="node-title">{node.title}</span>

        {tier !== "compact" && node.subtitle && !insideParent ? (
          <span className="node-subtitle">{node.subtitle}</span>
        ) : null}
        {tier !== "compact" && node.summary ? <span className="node-summary">{node.summary}</span> : null}

        {tier !== "compact" ? (
          <span className="node-signals">
            {visibleSignals.length > 0 ? (
              visibleSignals.map((signal) => (
                <span className={`node-signal tone-${signal.tone}`} key={signal.label}>
                  <b>{signal.value}</b> {signal.label}
                </span>
              ))
            ) : nothingRecorded ? (
              <span className="node-signal tone-quiet">nothing recorded yet</span>
            ) : null}
          </span>
        ) : null}
      </button>

      {tier === "detailed" ? (
        <div className="node-foot">
          <CoverageMeter coverage={node.coverage} />
          {node.authority ? <span className="node-authority">{node.authority}</span> : null}
        </div>
      ) : null}

      {expandable ? (
        <button
          type="button"
          className="node-expand nodrag nopan"
          aria-expanded={expanded}
          aria-label={
            expanded
              ? `Collapse ${node.title} and hide its ${stepCount} steps`
              : `Expand ${node.title} to show its ${stepCount} steps`
          }
          onClick={(event) => {
            event.stopPropagation();
            onToggleExpand(node.id);
          }}
        >
          <span aria-hidden="true">{expanded ? "–" : "+"}</span>
          <span className="node-expand-count">{stepCount}</span>
        </button>
      ) : null}
    </div>
  );
}

export const nodeTypes = { model: ModelNodeCard };
