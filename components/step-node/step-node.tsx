"use client";
import Link from "next/link"; import { Handle, Position, type NodeProps } from "@xyflow/react";
export type StepNodeData={id:string;title:string;metrics:number;bets:number;rules:number};
export function StepNode({data}:{data:StepNodeData}&NodeProps){return <div className="flow-node"><Handle type="target" position={Position.Top}/><strong>{data.title}</strong><div className="counts" style={{marginTop:10}}><span>{data.rules} rules</span><span>{data.metrics} metrics</span><span>{data.bets} bets</span></div><div style={{marginTop:12}}><Link className="explore" href={`/steps/${data.id}`}>Inspect step →</Link></div><Handle type="source" position={Position.Bottom}/></div>}
