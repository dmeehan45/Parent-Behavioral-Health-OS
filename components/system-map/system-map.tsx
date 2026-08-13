"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import { StageNode, type StageNodeData } from "@/components/stage-node/stage-node";

type Filter = "all" | "bets" | "questions" | "prototypes";
type Relationship = { from: string; to: string; relationship: string };
export type MapStage = StageNodeData & {
  order?: number;
  stepsList: Array<{ id: string; title: string }>;
  betsList: Array<{ id: string; title: string; confidence?: string; prototype?: { status: string; route?: string } }>;
};
type Props = { stages: MapStage[]; edges: Relationship[] };

const nodeTypes = { stage: StageNode };
const filters: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All stages" },
  { id: "bets", label: "With bets" },
  { id: "questions", label: "Open questions" },
  { id: "prototypes", label: "Working prototypes" },
];

function layout(stages: MapStage[], edges: Relationship[]) {
  const ids = new Set(stages.map((stage) => stage.id));
  const forward = edges.filter((edge) => edge.relationship !== "feedback_to" && ids.has(edge.from) && ids.has(edge.to));
  const depth = new Map(stages.map((stage) => [stage.id, 0]));

  for (let pass = 0; pass < stages.length; pass += 1) {
    let changed = false;
    for (const edge of forward) {
      const next = Math.min(stages.length - 1, (depth.get(edge.from) ?? 0) + 1);
      if (next > (depth.get(edge.to) ?? 0)) {
        depth.set(edge.to, next);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const columns = new Map<number, MapStage[]>();
  for (const stage of stages) {
    const column = depth.get(stage.id) ?? 0;
    columns.set(column, [...(columns.get(column) ?? []), stage]);
  }
  for (const column of columns.values()) column.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const position = new Map<string, { x: number; y: number }>();
  const wrapAt = Math.max(3, Math.ceil(Math.sqrt(columns.size)));
  for (const [column, items] of columns) {
    items.forEach((stage, row) => position.set(stage.id, {
      x: (column % wrapAt) * 300,
      y: Math.floor(column / wrapAt) * 285 + row * 180,
    }));
  }
  return position;
}

export function SystemMap({ stages, edges }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string>();
  const router = useRouter();
  const visible = useMemo(
    () => stages.filter((stage) => filter === "all" || (filter === "bets" && stage.bets > 0) || (filter === "questions" && stage.questions > 0) || (filter === "prototypes" && stage.prototypes > 0)),
    [filter, stages],
  );
  const positions = useMemo(() => layout(stages, edges), [stages, edges]);
  const visibleIds = new Set(visible.map((stage) => stage.id));
  const nodes: Node[] = visible.map((stage) => ({
    id: stage.id,
    type: "stage",
    position: positions.get(stage.id) ?? { x: 0, y: 0 },
    data: { ...stage, selected: stage.id === selected },
  }));
  const flowEdges: Edge[] = edges
    .filter((edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to))
    .map((edge, index) => {
      const feedback = edge.relationship === "feedback_to";
      return {
        id: `${edge.from}-${edge.to}-${index}`,
        source: edge.from,
        target: edge.to,
        label: edge.relationship.replaceAll("_", " "),
        markerEnd: { type: MarkerType.ArrowClosed, color: feedback ? "#917348" : "#547568" },
        animated: feedback,
        className: feedback ? "feedback-edge" : undefined,
        style: { stroke: feedback ? "#aa8959" : "#7b9187", strokeWidth: 1.4, strokeDasharray: feedback ? "5 5" : undefined },
        labelStyle: { fontSize: 9, fontWeight: 700, fill: "#68756f", textTransform: "uppercase" },
        labelBgStyle: { fill: "#f8faf8", fillOpacity: 0.9 },
      };
    });
  const current = stages.find((stage) => stage.id === selected);

  return (
    <section className="map-workspace" aria-label="Interactive system map">
      <div className="map-toolbar">
        <div className="filters" role="group" aria-label="Filter stages">
          {filters.map((item) => (
            <button key={item.id} className={`filter ${filter === item.id ? "active" : ""}`} onClick={() => { setFilter(item.id); setSelected(undefined); }} aria-pressed={filter === item.id}>
              {item.label}
              <span>{item.id === "all" ? stages.length : stages.filter((stage) => item.id === "bets" ? stage.bets > 0 : item.id === "questions" ? stage.questions > 0 : stage.prototypes > 0).length}</span>
            </button>
          ))}
        </div>
        <div className="map-legend" aria-label="Map legend"><span><i />Operating flow</span><span><i className="feedback" />Feedback loop</span></div>
      </div>
      <div className="map-layout">
        <div className="map-frame">
          <div className="map-hint"><strong>{visible.length}</strong> of {stages.length} stages · Select to preview · Double-click to enter</div>
          <ReactFlow
            nodes={nodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.16 }}
            minZoom={0.45}
            maxZoom={1.4}
            nodesDraggable={false}
            nodesConnectable={false}
            onPaneClick={() => setSelected(undefined)}
            onNodeClick={(_, node) => setSelected(node.id)}
            onNodeDoubleClick={(_, node) => router.push(`/stages/${node.id}`)}
          >
            <Background color="#dce4df" gap={24} size={1} />
            <MiniMap pannable zoomable nodeColor={(node) => node.id === selected ? "#1d5b45" : "#b8cec3"} maskColor="rgba(246,248,246,.72)" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
        <aside className="panel inspector" aria-live="polite">
          {current ? (
            <div className="inspector-content">
              <div><span className="eyebrow">Stage {String(current.order ?? "").padStart(2, "0")}</span><h2>{current.title}</h2><p className="muted">{current.summary ?? "No summary has been added yet."}</p></div>
              <div className="signal-row" aria-label="Stage signals"><span><strong>{current.steps}</strong> Steps</span><span><strong>{current.claims}</strong> Claims</span><span><strong>{current.questions}</strong> Questions</span></div>
              {current.stepsList.length > 0 && <div><h3>Inside this stage</h3><div className="inspector-links">{current.stepsList.slice(0, 4).map((step) => <Link key={step.id} href={`/steps/${step.id}`}>{step.title}<span>↗</span></Link>)}</div></div>}
              {current.betsList.length > 0 && <div><div className="section-label"><h3>Linked bets</h3><span>{current.betsList.length}</span></div><div className="inspector-bets">{current.betsList.map((bet) => <div key={bet.id} className="mini-bet"><span className="eyebrow">{bet.confidence ?? "unrated"} confidence</span><Link href={`/bets/${bet.id}`}>{bet.title} →</Link>{bet.prototype?.route && <Link className="prototype-jump" href={bet.prototype.route}>Launch {bet.prototype.status} prototype ↗</Link>}</div>)}</div></div>}
              <Link className="button" href={`/stages/${current.id}`}>Explore full stage <span>→</span></Link>
            </div>
          ) : (
            <div className="inspector-empty"><div className="map-symbol" aria-hidden="true"><span /><span /><span /></div><span className="eyebrow">Explore the operating model</span><h2>Select a stage</h2><p className="muted">Preview its process, evidence, bets, and prototypes here without leaving the system context.</p><div className="disclosure-note"><strong>Progressive by design</strong><p>The map stays compact. Each layer reveals more detail only when you ask for it.</p></div></div>
          )}
        </aside>
      </div>
    </section>
  );
}
