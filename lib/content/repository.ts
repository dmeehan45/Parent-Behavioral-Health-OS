import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import yaml from "js-yaml";
import { ZodType, ZodError } from "zod";
import {
  mapSchema,
  stageSchema,
  stepSchema,
  entitySchema,
  claimSchema,
  metricSchema,
  betSchema,
  type SystemMap,
  type Stage,
  type Step,
  type Entity,
  type Claim,
  type Metric,
  type Bet,
} from "@/lib/schemas";
import { parseBody, RENDERED_SECTIONS } from "./body";

const ROOT = process.cwd();
const MAP_FILE = "content/map.yaml";

function explain(file: string, error: ZodError) {
  const issues = error.issues.map((i) => `${i.path.join(".") || "document"}: ${i.message}`).join("; ");
  return new Error(`Invalid content in ${file}: ${issues}`);
}

/**
 * Reject body headings the projection does not render.
 *
 * Without this, renaming `# Current model` to `# How this works today` produces
 * no error and no output — the prose simply disappears from the stage page and
 * the map's question count silently drops to zero.
 */
function checkHeadings(file: string, folder: string, headings: string[]) {
  const allowed = RENDERED_SECTIONS[folder] ?? [];
  for (const heading of headings) {
    if (allowed.includes(heading)) continue;
    const expected = allowed.length
      ? `expected one of ${allowed.map((h) => `"${h}"`).join(", ")}`
      : "this primitive renders its body as prose and supports no headings";
    throw new Error(
      `Unrendered heading in ${file}: "# ${heading}" would never be displayed — ${expected}. ` +
        `Rename the heading, or move the content into frontmatter.`,
    );
  }
}

function loadMarkdown<T>(folder: string, schema: ZodType<T>) {
  const dir = path.join(ROOT, "content", folder);
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => {
      const file = path.join("content", folder, name);
      const parsed = matter(fs.readFileSync(path.join(ROOT, file), "utf8"));
      const { sections, headings } = parseBody(parsed.content);
      checkHeadings(file, folder, headings);
      try {
        return { ...schema.parse(parsed.data), body: parsed.content.trim(), sections, file };
      } catch (error) {
        if (error instanceof ZodError) throw explain(file, error);
        throw error;
      }
    });
}

function unique<T extends { id: string; file: string }>(items: T[], kind: string) {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) throw new Error(`Duplicate ${kind} id '${item.id}' in ${item.file}`);
    seen.add(item.id);
  }
}

function requireRef(value: string, allowed: Set<string>, file: string, field: string) {
  if (!allowed.has(value)) throw new Error(`Invalid reference in ${file}: ${field} '${value}' does not exist`);
}

export function getRepository() {
  const stages = loadMarkdown("stages", stageSchema) as Stage[];
  const steps = loadMarkdown("steps", stepSchema) as Step[];
  const entities = loadMarkdown("entities", entitySchema) as Entity[];
  const claims = loadMarkdown("claims", claimSchema) as Claim[];
  const metrics = loadMarkdown("metrics", metricSchema) as Metric[];
  const bets = loadMarkdown("bets", betSchema) as Bet[];

  let map: SystemMap;
  try {
    map = mapSchema.parse(yaml.load(fs.readFileSync(path.join(ROOT, MAP_FILE), "utf8")));
  } catch (error) {
    if (error instanceof ZodError) throw explain(MAP_FILE, error);
    throw error;
  }

  unique(stages, "stage");
  unique(steps, "step");
  unique(entities, "entity");
  unique(claims, "claim");
  unique(metrics, "metric");
  unique(bets, "bet");

  const stageIds = new Set(stages.map((x) => x.id));
  const stepIds = new Set(steps.map((x) => x.id));
  const targetIds = new Set([...stageIds, ...stepIds]);
  const entityIds = new Set(entities.map((x) => x.id));
  const claimIds = new Set(claims.map((x) => x.id));
  const metricIds = new Set(metrics.map((x) => x.id));
  const betIds = new Set(bets.map((x) => x.id));

  map.stages.forEach((id, i) => requireRef(id, stageIds, MAP_FILE, `stages.${i}`));
  map.edges.forEach((edge, i) => {
    requireRef(edge.from, stageIds, MAP_FILE, `edges.${i}.from`);
    requireRef(edge.to, stageIds, MAP_FILE, `edges.${i}.to`);
  });

  steps.forEach((step) => {
    requireRef(step.stage, stageIds, step.file, "stage");
    step.next?.forEach((id) => requireRef(id, stepIds, step.file, "next"));
    [...(step.inputs ?? []), ...(step.outputs ?? [])].forEach((ref) =>
      requireRef(ref.entity, entityIds, step.file, "entity"),
    );
    step.claims?.forEach((id) => requireRef(id, claimIds, step.file, "claims"));
    step.metrics?.forEach((id) => requireRef(id, metricIds, step.file, "metrics"));
    step.bets?.forEach((id) => requireRef(id, betIds, step.file, "bets"));
  });

  stages.forEach((stage) => stage.metrics?.forEach((id) => requireRef(id, metricIds, stage.file, "metrics")));
  claims.forEach((claim) => claim.targets.forEach((id) => requireRef(id, targetIds, claim.file, "targets")));
  metrics.forEach((metric) => metric.targets?.forEach((id) => requireRef(id, targetIds, metric.file, "targets")));
  bets.forEach((bet) => {
    bet.targets.forEach((id) => requireRef(id, targetIds, bet.file, "targets"));
    bet.claims?.forEach((id) => requireRef(id, claimIds, bet.file, "claims"));
    bet.metrics?.forEach((id) => requireRef(id, metricIds, bet.file, "metrics"));
  });

  return { map, stages, steps, entities, claims, metrics, bets };
}

export type Repository = ReturnType<typeof getRepository>;
