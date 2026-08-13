"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Background, Controls, MarkerType, ReactFlow, type Edge, type Node } from "@xyflow/react";
import { StepNode, type StepNodeData } from "@/components/step-node/step-node";

const nodeTypes = { step: StepNode };
type StepView = StepNodeData & { order?: number; purpose?: string; next?: string[]; betsList: Array<{ id: string; title: string; prototypeRoute?: string }> };

export function StageMap({ steps }: { steps: StepView[] }) {
  const [selected, setSelected] = useState<string>();
  const router = useRouter();
  const nodes: Node[] = steps.map((step, index) => ({
    id: step.id,
    type: "step",
    position: { x: index * 285, y: index % 2 === 0 ? 35 : 165 },
    data: { ...step, selected: step.id === selected },
  }));
  const edges: Edge[] = steps.flatMap((step) => (step.next ?? []).map((next) => ({
    id: `${step.id}-${next}`,
    source: step.id,
    target: next,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#547568" },
    style: { stroke: "#7b9187", strokeWidth: 1.5 },
  })));
  const current = steps.find((step) => step.id === selected);

  return <div className="stage-map-layout"><div className="map-frame stage-map-frame"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{padding:.2}} nodesDraggable={false} nodesConnectable={false} onPaneClick={()=>setSelected(undefined)} onNodeClick={(_,node)=>setSelected(node.id)} onNodeDoubleClick={(_,node)=>router.push(`/steps/${node.id}`)}><Background color="#dce4df" gap={24}/><Controls showInteractive={false}/></ReactFlow></div><aside className="step-inspector">{current?<><span className="eyebrow">Step {String(current.order??"").padStart(2,"0")}</span><h3>{current.title}</h3><p className="muted">{current.purpose??"This step has not been described yet."}</p><div className="counts"><span><b>{current.rules}</b> rules</span><span><b>{current.metrics}</b> metrics</span><span><b>{current.bets}</b> bets</span></div>{current.betsList.map(bet=><div className="mini-bet" key={bet.id}><span className="eyebrow">Linked bet</span><Link href={`/bets/${bet.id}`}>{bet.title} →</Link>{bet.prototypeRoute&&<Link className="prototype-jump" href={bet.prototypeRoute}>Open prototype ↗</Link>}</div>)}<Link className="button" href={`/steps/${current.id}`}>Inspect full step →</Link></>:<><span className="eyebrow">Process detail</span><h3>Select a step</h3><p className="muted">Preview what happens here, then open the semantic detail when you need it.</p></>}</aside></div>;
}
