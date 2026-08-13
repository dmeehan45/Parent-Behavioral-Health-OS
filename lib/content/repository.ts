import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import yaml from "js-yaml";
import { ZodType, ZodError } from "zod";
import { mapSchema, stageSchema, stepSchema, entitySchema, claimSchema, metricSchema, betSchema, type SystemMap, type Stage, type Step, type Entity, type Claim, type Metric, type Bet } from "@/lib/schemas";

const ROOT = process.cwd();
function sections(body: string) {
  const result: Record<string, string> = {};
  let key = "Overview";
  for (const part of body.split(/^#\s+/m)) {
    const clean = part.trim(); if (!clean) continue;
    const [first, ...rest] = clean.split("\n");
    if (rest.length) { key = first.trim(); result[key] = rest.join("\n").trim(); } else result[key] = clean;
  }
  return result;
}
function explain(file: string, error: ZodError) {
  const issues = error.issues.map((i) => `${i.path.join(".") || "document"}: ${i.message}`).join("; ");
  return new Error(`Invalid content in ${file}: ${issues}`);
}
function loadMarkdown<T>(folder: string, schema: ZodType<T>): Array<T & { body: string; sections: Record<string,string>; file: string }> {
  const dir = path.join(ROOT, "content", folder);
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort().map((name) => {
    const file = path.join("content", folder, name); const parsed = matter(fs.readFileSync(path.join(ROOT, file), "utf8"));
    try { return { ...schema.parse(parsed.data), body: parsed.content.trim(), sections: sections(parsed.content), file }; }
    catch (error) { if (error instanceof ZodError) throw explain(file, error); throw error; }
  });
}
function unique<T extends {id:string; file:string}>(items:T[], kind:string) { const seen = new Set<string>(); for (const item of items) { if(seen.has(item.id)) throw new Error(`Duplicate ${kind} id '${item.id}' in ${item.file}`); seen.add(item.id); } }
function requireRef(value:string, allowed:Set<string>, file:string, field:string) { if(!allowed.has(value)) throw new Error(`Invalid reference in ${file}: ${field} '${value}' does not exist`); }
export function getRepository() {
  const stages = loadMarkdown("stages", stageSchema) as Stage[]; const steps = loadMarkdown("steps", stepSchema) as Step[];
  const entities = loadMarkdown("entities", entitySchema) as Entity[]; const claims = loadMarkdown("claims", claimSchema) as Claim[];
  const metrics = loadMarkdown("metrics", metricSchema) as Metric[]; const bets = loadMarkdown("bets", betSchema) as Bet[];
  const mapFile = "content/map.yaml"; let map: SystemMap;
  try { map = mapSchema.parse(yaml.load(fs.readFileSync(path.join(ROOT, mapFile), "utf8"))); } catch(error) { if(error instanceof ZodError) throw explain(mapFile,error); throw error; }
  unique(stages,"stage"); unique(steps,"step"); unique(entities,"entity"); unique(claims,"claim"); unique(metrics,"metric"); unique(bets,"bet");
  const stageIds=new Set(stages.map(x=>x.id)), stepIds=new Set(steps.map(x=>x.id)), targetIds=new Set([...stageIds,...stepIds]);
  const entityIds=new Set(entities.map(x=>x.id)), claimIds=new Set(claims.map(x=>x.id)), metricIds=new Set(metrics.map(x=>x.id)), betIds=new Set(bets.map(x=>x.id));
  map.stages.forEach((id,i)=>requireRef(id,stageIds,mapFile,`stages.${i}`)); map.edges.forEach((e,i)=>{requireRef(e.from,stageIds,mapFile,`edges.${i}.from`);requireRef(e.to,stageIds,mapFile,`edges.${i}.to`)});
  steps.forEach(s=>{ requireRef(s.stage,stageIds,s.file,"stage"); s.next?.forEach(x=>requireRef(x,stepIds,s.file,"next")); [...(s.inputs??[]),...(s.outputs??[])].forEach(x=>requireRef(x.entity,entityIds,s.file,"entity")); s.claims?.forEach(x=>requireRef(x,claimIds,s.file,"claims")); s.metrics?.forEach(x=>requireRef(x,metricIds,s.file,"metrics")); s.bets?.forEach(x=>requireRef(x,betIds,s.file,"bets")); });
  stages.forEach(s=>s.metrics?.forEach(x=>requireRef(x,metricIds,s.file,"metrics"))); claims.forEach(c=>c.targets.forEach(x=>requireRef(x,targetIds,c.file,"targets"))); metrics.forEach(m=>m.targets?.forEach(x=>requireRef(x,targetIds,m.file,"targets"))); bets.forEach(b=>{b.targets.forEach(x=>requireRef(x,targetIds,b.file,"targets"));b.claims?.forEach(x=>requireRef(x,claimIds,b.file,"claims"));b.metrics?.forEach(x=>requireRef(x,metricIds,b.file,"metrics"));});
  return { map, stages, steps, entities, claims, metrics, bets };
}
export type Repository = ReturnType<typeof getRepository>;
