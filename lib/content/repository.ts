import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import yaml from "js-yaml";
import crypto from "node:crypto";
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
import { decisionFileSchema, handoffSchema } from "@/lib/research/schema";
import { checkContentQuality } from "./quality";
import { checkFlowContinuity } from "./flow";

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

/**
 * One reference, as authored: a record naming another record's ID.
 *
 * Collected while validating, because this is the only place that already
 * visits every reference in the model. `lib/model/conformance.ts` reads them
 * back to check the projection did something with each one.
 */
export type AuthoredReference = { from: string; fromKind: string; field: string; to: string; file: string };

function requireRef(
  value: string,
  allowed: Set<string>,
  file: string,
  field: string,
  collected?: { list: AuthoredReference[]; from: string; fromKind: string },
) {
  if (!allowed.has(value)) throw new Error(`Invalid reference in ${file}: ${field} '${value}' does not exist`);
  // `edges.2.from` and `edges.7.from` are the same relationship, so the index
  // is dropped: the registry keys on what kind of link this is, not on which
  // one it happened to be.
  const canonical = `${collected?.fromKind}.${field}`.replace(/\.\d+(?=\.)/g, "");
  collected?.list.push({ from: collected.from, fromKind: collected.fromKind, field: canonical, to: value, file });
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
  requirePrototypeShell(base, route, file);
}

/**
 * Check that a prototype route actually goes through `PrototypeShell`.
 *
 * The shell is what connects a prototype back to its Bet: the problem, the
 * targets, the claims, the metrics, the synthetic-data badge, and the way back
 * to the model. A page that renders its interaction without it is a page that
 * silently drops all of that, and the existing route check passes happily —
 * it only ever asked whether a file was there.
 *
 * It reads the source rather than the render, so it proves the contract was
 * invoked and nothing more. That is the honest limit of a static check, and it
 * still catches the failure that actually happens: nobody wired the shell at
 * all. The whole directory is searched so a page may compose the shell through
 * a local component instead of naming it directly.
 */
function requirePrototypeShell(directory: string, route: string, file: string) {
  const mentions = (dir: string): boolean =>
    fs.readdirSync(dir, { withFileTypes: true }).some((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return mentions(full);
      if (!/\.[jt]sx?$/.test(entry.name)) return false;
      return fs.readFileSync(full, "utf8").includes("PrototypeShell");
    });

  if (mentions(directory)) return;
  throw new Error(
    `Unwrapped prototype in ${file}: route '${route}' renders without PrototypeShell, so it would show the ` +
      `interaction with none of the bet, problem, or provenance around it. Wrap the page:\n\n` +
      `  <PrototypeShell route="${route}">…</PrototypeShell>\n`,
  );
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

/**
 * Read one of the research staging directories.
 *
 * A missing directory is not an error. `research/` is staging material that a
 * checkout is allowed not to have, and this function runs inside
 * `projectModel()`, so an unguarded read here does not merely fail a script:
 * it makes `/api/model` return 500 and takes the live map down for every
 * reader the moment a canonical record cites its first research run.
 */
function readResearchRecords<T>(
  folder: string,
  parse: (value: unknown) => T,
  key: (record: T) => string,
): Map<string, T> {
  const directory = path.join(ROOT, "research", folder);
  const records = new Map<string, T>();
  if (!fs.existsSync(directory)) return records;
  for (const name of fs.readdirSync(directory).filter((entry) => /\.ya?ml$/.test(entry))) {
    const file = path.join("research", folder, name);
    try {
      const parsed = parse(yaml.load(fs.readFileSync(path.join(ROOT, file), "utf8")));
      records.set(key(parsed), parsed);
    } catch (error) {
      const detail = error instanceof ZodError
        ? error.issues.map((issue) => `${issue.path.join(".") || "document"}: ${issue.message}`).join("; ")
        : (error as Error).message;
      throw new Error(`Invalid research file ${file}: ${detail}. Run npm run validate:research for the full report.`);
    }
  }
  return records;
}

/**
 * Question IDs, read from filenames rather than parsed.
 *
 * `awaiting` needs to catch a typo, not to validate staging. Parsing every
 * question file here would let one malformed one — a normal thing to find in
 * `research/`, and what `validate:research` exists to report — break content
 * validation and the live map along with it. The ID is the filename stem, and
 * `loadQuestions` already enforces that where it belongs.
 */
function questionIds(): Set<string> {
  const directory = path.join(ROOT, "research", "questions");
  if (!fs.existsSync(directory)) return new Set();
  return new Set(
    fs
      .readdirSync(directory)
      .filter((name) => /\.ya?ml$/.test(name))
      .map((name) => name.replace(/\.ya?ml$/, "")),
  );
}

/**
 * A `researchTrace` is the claim that a canonical change was authorized by a
 * reviewed research run, so every part of it has to still be true: the run
 * exists, the finding is in it, the cited sources are that finding's evidence,
 * the reviewer accepted it, and the handoff has not changed since.
 */
function checkResearchTrace(items: Array<Stage | Step | Entity | Claim | Metric | Problem | Bet>) {
  const traced = items.filter((item) => item.researchTrace?.length);
  if (!traced.length) return;
  const handoffs = readResearchRecords("handoffs", (value) => handoffSchema.parse(value), (record) => record.run.id);
  const decisions = readResearchRecords("decisions", (value) => decisionFileSchema.parse(value), (record) => record.runId);
  const superseded = new Map<string, string>();
  for (const record of decisions.values()) {
    for (const decision of record.decisions) {
      if (decision.supersedes) superseded.set(decision.supersedes, decision.id);
    }
  }
  for (const item of traced) for (const trace of item.researchTrace ?? []) {
    const handoff = handoffs.get(trace.run);
    if (!handoff) {
      throw new Error(
        `Invalid researchTrace in ${item.file}: run '${trace.run}' does not exist. ` +
          `Commit research/handoffs/${trace.run}.yaml before a canonical record cites it.`,
      );
    }
    const finding = handoff.findings.find((candidate) => candidate.id === trace.finding);
    if (!finding) throw new Error(`Invalid researchTrace in ${item.file}: finding '${trace.finding}' is not in research/handoffs/${trace.run}.yaml`);
    trace.sources.forEach((source) => { if (!finding.sourceIds.includes(source)) throw new Error(`Invalid researchTrace in ${item.file}: source '${source}' is not evidence for '${trace.finding}'`); });

    const decisionFile = decisions.get(trace.run);
    if (!decisionFile) {
      throw new Error(
        `Invalid researchTrace in ${item.file}: no reviewer decisions exist for run '${trace.run}'. ` +
          `The accountable reviewer records them in research/decisions/${trace.run}.yaml — /review/${trace.run} ` +
          `carries a skeleton to fill in — and only then can a canonical record cite the run.`,
      );
    }
    const decision = decisionFile.decisions.find((candidate) => candidate.id === trace.decision);
    if (!decision) throw new Error(`Invalid researchTrace in ${item.file}: decision '${trace.decision}' is not in research/decisions/${trace.run}.yaml`);
    if (!["accept", "accept-with-edits"].includes(decision.disposition)) {
      throw new Error(
        `Invalid researchTrace in ${item.file}: decision '${trace.decision}' is '${decision.disposition}'. ` +
          `Only 'accept' and 'accept-with-edits' authorize a canonical change.`,
      );
    }
    // A later run is allowed to retire an earlier run's conclusion. When it
    // does, the authorization goes with it: the model cannot keep citing a
    // decision that has since been replaced.
    const replacedBy = superseded.get(trace.decision);
    if (replacedBy) {
      throw new Error(
        `Invalid researchTrace in ${item.file}: decision '${trace.decision}' has been superseded by '${replacedBy}'. ` +
          `Cite the superseding decision, or revisit whether this record still holds.`,
      );
    }
    const hash = crypto.createHash("sha256").update(JSON.stringify(handoff)).digest("hex");
    if (decisionFile.reviewedHandoffHash !== hash) {
      throw new Error(
        `Invalid researchTrace in ${item.file}: research/decisions/${trace.run}.yaml reviewed an older version of ` +
          `research/handoffs/${trace.run}.yaml. Regenerate the packet, re-review it, and update reviewedHandoffHash to ${hash}.`,
      );
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
  const openQuestions = questionIds();
  const claimIds = new Set(claims.map((x) => x.id));
  const metricIds = new Set(metrics.map((x) => x.id));
  const problemIds = new Set(problems.map((x) => x.id));

  const references: AuthoredReference[] = [];
  const at = (from: string, fromKind: string) => ({ list: references, from, fromKind });

  map.stages.forEach((id, i) => requireRef(id, stageIds, MAP_FILE, `stages.${i}`));
  map.edges.forEach((edge, i) => {
    requireRef(edge.from, stageIds, MAP_FILE, `edges.${i}.from`, at(edge.from, "map"));
    requireRef(edge.to, stageIds, MAP_FILE, `edges.${i}.to`);
  });

  steps.forEach((step) => {
    requireRef(step.stage, stageIds, step.file, "stage", at(step.id, "step"));
    step.next?.forEach((id) => requireRef(id, stepIds, step.file, "next", at(step.id, "step")));
    [...(step.inputs ?? []), ...(step.outputs ?? [])].forEach((ref) =>
      requireRef(ref.entity, entityIds, step.file, "entity", at(step.id, "step")),
    );
    step.claims?.forEach((id) => requireRef(id, claimIds, step.file, "claims", at(step.id, "step")));
    step.metrics?.forEach((id) => requireRef(id, metricIds, step.file, "metrics", at(step.id, "step")));
  });

  stages.forEach((stage) => stage.metrics?.forEach((id) => requireRef(id, metricIds, stage.file, "metrics", at(stage.id, "stage"))));
  claims.forEach((claim) => claim.targets.forEach((id) => requireRef(id, targetIds, claim.file, "targets", at(claim.id, "claim"))));
  metrics.forEach((metric) => metric.targets?.forEach((id) => requireRef(id, targetIds, metric.file, "targets", at(metric.id, "metric"))));
  metrics.forEach((metric) => {
    metric.perspectives?.forEach(({ actor }) => requireRef(actor, entityIds, metric.file, "perspectives.actor", at(metric.id, "metric")));
    if (metric.decisionOwner) requireRef(metric.decisionOwner, entityIds, metric.file, "decisionOwner", at(metric.id, "metric"));
  });
  problems.forEach((problem) => {
    problem.targets.forEach((id) => requireRef(id, targetIds, problem.file, "targets", at(problem.id, "problem")));
    problem.claims?.forEach((id) => requireRef(id, claimIds, problem.file, "claims", at(problem.id, "problem")));
    problem.metrics?.forEach((id) => requireRef(id, metricIds, problem.file, "metrics", at(problem.id, "problem")));
  });
  bets.forEach((bet) => {
    requireProblem(bet.problem, problemIds, bet.file);
    references.push({ from: bet.id, fromKind: "bet", field: "bet.problem", to: bet.problem, file: bet.file });
    bet.claims?.forEach((id) => requireRef(id, claimIds, bet.file, "claims", at(bet.id, "bet")));
    bet.metrics?.forEach((id) => requireRef(id, metricIds, bet.file, "metrics", at(bet.id, "bet")));
    if (bet.participant) requireRef(bet.participant, entityIds, bet.file, "participant", at(bet.id, "bet"));
    bet.awaiting?.forEach((id) => requireRef(id, openQuestions, bet.file, "awaiting", at(bet.id, "bet")));
    if (bet.prototype?.route) requirePrototypeRoute(bet.prototype.route, bet.file);
    // Whether the software still tests the approved experiment is checked in
    // `npm run validate:content`, not here. Refining a bet is the normal thing
    // to do to one, and it must not make the repository unloadable: that would
    // take down the map, every record page, and — worst of all — the packet
    // whose whole job is to tell you what changed and what to build to.
  });

  requireMapMembership(stages, map.stages);
  checkEntityStates(steps, entities);
  checkFlowContinuity(steps);
  const records = [...stages, ...steps, ...entities, ...claims, ...metrics, ...problems, ...bets];
  checkContentQuality(records);
  checkResearchTrace(records);

  return { map, stages, steps, entities, claims, metrics, problems, bets, references };
}

export type Repository = ReturnType<typeof getRepository>;
