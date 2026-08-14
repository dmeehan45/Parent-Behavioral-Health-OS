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
  problemSchema,
  betSchema,
  type SystemMap,
  type Stage,
  type Step,
  type Entity,
  type Claim,
  type Metric,
  type Problem,
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

/**
 * A Bet is a proposed solution, so it has to say what it is solving.
 *
 * This is the link that stops the model collapsing back into a list of things
 * we felt like building: the Problem states where the machine breaks, and the
 * Bet answers it. Where the work lands follows from the Problem's targets, so
 * there is only ever one statement of where the trouble is.
 */
function requireProblem(problemId: string, allowed: Set<string>, file: string) {
  if (allowed.has(problemId)) return;
  throw new Error(
    `Invalid reference in ${file}: problem '${problemId}' does not exist. ` +
      `Every Bet answers a Problem — create content/problems/${problemId}.md, or point at an existing Problem.`,
  );
}

/**
 * Check that a Bet's declared prototype route is actually implemented.
 *
 * The Bet page renders a prominent "Launch prototype" control from this field,
 * so a stale or mistyped route sends a reader to a 404. A Bet with no prototype
 * simply omits `route`.
 */
function requirePrototypeRoute(route: string, file: string) {
  const base = path.join(ROOT, "app", route);
  const exists = ["page.tsx", "page.ts", "page.jsx", "page.js"].some((page) => fs.existsSync(path.join(base, page)));
  if (!exists) {
    throw new Error(
      `Missing prototype in ${file}: route '${route}' has no implementation at app${route}/page.tsx. ` +
        `Build the route, or remove 'route' until the prototype exists.`,
    );
  }
}

/**
 * A Stage that `content/map.yaml` does not list is unreachable: it never appears
 * on the system map, and nothing links to its detail page. `map.yaml` owns
 * top-level topology, so membership there is what makes a Stage part of the model.
 */
function requireMapMembership(stages: Stage[], listed: string[]) {
  const onMap = new Set(listed);
  for (const stage of stages) {
    if (!onMap.has(stage.id)) {
      throw new Error(
        `Orphan stage in ${stage.file}: '${stage.id}' is not listed in ${MAP_FILE}, so it would never appear on the map. ` +
          `Add it to 'stages' in ${MAP_FILE}.`,
      );
    }
  }
}

/**
 * Check `{ entity, state }` references against the states an Entity declares.
 *
 * Entities that declare no `states` are skipped, so an entity whose state model
 * is not yet understood stays unconstrained. Once states are declared, this is
 * what stops a Step from claiming a clinician is `open` — a caseload state —
 * rather than `match-ready`.
 */
function checkEntityStates(steps: Step[], entities: Entity[]) {
  const declared = new Map(entities.filter((e) => e.states?.length).map((e) => [e.id, e.states!]));
  for (const step of steps) {
    for (const [field, refs] of [
      ["inputs", step.inputs],
      ["outputs", step.outputs],
    ] as const) {
      for (const ref of refs ?? []) {
        const states = declared.get(ref.entity);
        if (!states || states.includes(ref.state)) continue;
        throw new Error(
          `Unknown state in ${step.file}: ${field} references '${ref.entity}' in state '${ref.state}', ` +
            `but '${ref.entity}' declares ${states.map((s) => `'${s}'`).join(", ")}. ` +
            `Correct the state, or add it to content/entities/${ref.entity}.md.`,
        );
      }
    }
  }
}

export function getRepository() {
  const stages = loadMarkdown("stages", stageSchema) as Stage[];
  const steps = loadMarkdown("steps", stepSchema) as Step[];
  const entities = loadMarkdown("entities", entitySchema) as Entity[];
  const claims = loadMarkdown("claims", claimSchema) as Claim[];
  const metrics = loadMarkdown("metrics", metricSchema) as Metric[];
  const problems = loadMarkdown("problems", problemSchema) as Problem[];
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
  unique(problems, "problem");
  unique(bets, "bet");

  const stageIds = new Set(stages.map((x) => x.id));
  const stepIds = new Set(steps.map((x) => x.id));
  const targetIds = new Set([...stageIds, ...stepIds]);
  const entityIds = new Set(entities.map((x) => x.id));
  const claimIds = new Set(claims.map((x) => x.id));
  const metricIds = new Set(metrics.map((x) => x.id));
  const problemIds = new Set(problems.map((x) => x.id));

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
  });

  stages.forEach((stage) => stage.metrics?.forEach((id) => requireRef(id, metricIds, stage.file, "metrics")));
  claims.forEach((claim) => claim.targets.forEach((id) => requireRef(id, targetIds, claim.file, "targets")));
  metrics.forEach((metric) => metric.targets?.forEach((id) => requireRef(id, targetIds, metric.file, "targets")));
  problems.forEach((problem) => {
    problem.targets.forEach((id) => requireRef(id, targetIds, problem.file, "targets"));
    problem.claims?.forEach((id) => requireRef(id, claimIds, problem.file, "claims"));
    problem.metrics?.forEach((id) => requireRef(id, metricIds, problem.file, "metrics"));
  });
  bets.forEach((bet) => {
    requireProblem(bet.problem, problemIds, bet.file);
    bet.claims?.forEach((id) => requireRef(id, claimIds, bet.file, "claims"));
    bet.metrics?.forEach((id) => requireRef(id, metricIds, bet.file, "metrics"));
    if (bet.prototype?.route) requirePrototypeRoute(bet.prototype.route, bet.file);
  });

  requireMapMembership(stages, map.stages);
  checkEntityStates(steps, entities);

  return { map, stages, steps, entities, claims, metrics, problems, bets };
}

export type Repository = ReturnType<typeof getRepository>;
