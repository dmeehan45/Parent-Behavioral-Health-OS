/**
 * Projects `content/` into the single graph the interface renders.
 *
 * This is the only place that knows how canonical primitives relate to each
 * other. Components consume `ModelGraph` and never reach back into content, so
 * new stages, steps, claims, metrics, and bets appear on the map — with detail,
 * links, signals, and coverage — without any change under `app/` or
 * `components/`.
 */

import { getRepository } from "@/lib/content/repository";
import { OVERVIEW, SECTION, countListItems } from "@/lib/content/body";
import { ROUTES, nodeId } from "@/lib/model/kinds";
import type { Entity, Stage, Step } from "@/lib/schemas";
import {
  betCoverage,
  claimCoverage,
  entityCoverage,
  metricCoverage,
  problemCoverage,
  stageCoverage,
  stepCoverage,
} from "@/lib/model/coverage";
import { contentRevision, fingerprint } from "@/lib/model/revision";
import { AUTHORITY_TERMS, EDGE_LEGEND, isFeedbackRelationship } from "@/lib/model/vocabulary";
import type {
  DetailBlock,
  EntryPoint,
  LensId,
  ModelEdge,
  ModelGraph,
  ModelNode,
  NodeKind,
  Signal,
  Tone,
} from "@/lib/model/types";

/* -------------------------------------------------------------------------- */
/* Markdown section helpers                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Section names are a content contract enforced by the loader, so the counts and
 * blocks below name them directly rather than pattern-matching headings.
 */
function openQuestionCount(sections: Record<string, string>): number {
  return countListItems(sections[SECTION.openQuestions] ?? sections[SECTION.questions]);
}

function markdownBlocks(sections: Record<string, string>, skip: string[] = []): DetailBlock[] {
  const skipped = new Set([...skip, OVERVIEW].map((name) => name.toLowerCase()));
  return Object.entries(sections)
    .filter(([label, value]) => !skipped.has(label.toLowerCase()) && value.trim().length > 0)
    .map(([label, value]) => ({ type: "markdown", label, value }) as DetailBlock);
}

/**
 * Entities, claims, and metrics permit no headings, so their whole body arrives
 * as leading prose. Rendering it under an "Overview" label would invent a
 * section the author never wrote.
 */
function bodyBlock(sections: Record<string, string>, label: string): DetailBlock[] {
  const prose = sections[OVERVIEW];
  return prose && prose.trim().length > 0 ? [{ type: "markdown", label, value: prose }] : [];
}

function isoDate(value?: Date): string | undefined {
  return value ? value.toISOString().slice(0, 10) : undefined;
}

function firstSentence(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/\s+/g, " ");
  const stop = trimmed.indexOf(". ");
  return stop > 0 ? `${trimmed.slice(0, stop)}.` : trimmed;
}

/* -------------------------------------------------------------------------- */
/* Projection                                                                  */
/* -------------------------------------------------------------------------- */

type LinkItem = { id: string; title: string; href: string; kind: NodeKind; meta?: string };

/**
 * `unknown` is the schema's way of saying a field was never filled in, which is
 * the same thing as having no meta at all — and repeating the word down the
 * right edge of a list of metrics reads as noise before it reads as honesty. The
 * gap is still recorded; it is said once, in coverage, rather than per row.
 */
function link(kind: NodeKind, contentId: string, title: string, meta?: string): LinkItem {
  return {
    id: nodeId(kind, contentId),
    title,
    href: ROUTES[kind](contentId),
    kind,
    meta: meta === "unknown" ? undefined : meta,
  };
}

function linksBlock(label: string, items: LinkItem[]): DetailBlock[] {
  return items.length > 0 ? [{ type: "links", label, items }] : [];
}

function listBlock(label: string, items?: string[]): DetailBlock[] {
  return items && items.length > 0 ? [{ type: "list", label, items }] : [];
}

function proseBlock(label: string, value?: string): DetailBlock[] {
  return value && value.trim().length > 0 ? [{ type: "prose", label, value: value.trim() }] : [];
}

export function projectModel(): ModelGraph {
  const repository = getRepository();
  const { map, stages, steps, entities, claims, metrics, problems, bets } = repository;

  const stageById = new Map(stages.map((stage) => [stage.id, stage]));
  const stepById = new Map(steps.map((step) => [step.id, step]));
  const entityById = new Map(entities.map((entity) => [entity.id, entity]));

  const orderedStages = map.stages
    .map((id) => stageById.get(id))
    .filter((stage): stage is Stage => Boolean(stage));

  const stepsByStage = new Map<string, Step[]>();
  for (const step of steps) {
    const bucket = stepsByStage.get(step.stage) ?? [];
    bucket.push(step);
    stepsByStage.set(step.stage, bucket);
  }
  for (const bucket of stepsByStage.values()) {
    bucket.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title));
  }

  const problemById = new Map(problems.map((problem) => [problem.id, problem]));

  /** Everything that points at a given stage or step id. */
  const problemsFor = (targetId: string) => problems.filter((problem) => problem.targets.includes(targetId));
  const claimsFor = (targetId: string) => claims.filter((claim) => claim.targets.includes(targetId));
  const metricsFor = (targetId: string, declared?: string[]) =>
    metrics.filter((metric) => metric.targets?.includes(targetId) || declared?.includes(metric.id));
  /** Bets are attached through the problem they answer, never directly. */
  const betsForProblem = (problemId: string) => bets.filter((bet) => bet.problem === problemId);
  const betsFor = (targetId: string) => problemsFor(targetId).flatMap((problem) => betsForProblem(problem.id));

  /**
   * How far a problem has got. Shown wherever a problem is listed, because a
   * problem nobody has answered yet is the thing worth noticing.
   */
  const describeProblemStatus = (problemId: string) => {
    const proposed = betsForProblem(problemId);
    if (proposed.length === 0) return "no bet yet";
    const built = proposed.filter((bet) => bet.prototype?.route).length;
    const bets_ = `${proposed.length} bet${proposed.length === 1 ? "" : "s"}`;
    return built > 0 ? `${bets_} · ${built} built` : bets_;
  };

  const nodes: ModelNode[] = [];
  const edges: ModelEdge[] = [];

  /* ---- Stages ---------------------------------------------------------- */

  for (const stage of orderedStages) {
    const stageSteps = stepsByStage.get(stage.id) ?? [];
    const stageProblems = problemsFor(stage.id);
    const stageBets = betsFor(stage.id);
    const stageClaims = claimsFor(stage.id);
    const stageMetrics = metricsFor(stage.id, stage.metrics);
    const questions = openQuestionCount(stage.sections);
    const workingPrototypes = stageBets.filter((bet) => bet.prototype?.status === "working").length;

    const signals: Signal[] = [
      signal(stageSteps.length, "neutral", "step"),
      signal(stageProblems.length, "warn", "problem"),
      signal(stageBets.length, "accent", "bet"),
      signal(questions, "warn", "question"),
      signal(stageClaims.length + stageMetrics.length, "evidence", "evidence", "evidence"),
    ];
    if (workingPrototypes > 0) {
      signals.push(signal(workingPrototypes, "accent", "prototype"));
    }

    const blocks: DetailBlock[] = [
      ...listBlock("Entry conditions", stage.entryConditions),
      ...listBlock("Exit conditions", stage.exitConditions),
      ...markdownBlocks(stage.sections),
      ...linksBlock(
        "Process steps",
        stageSteps.map((step) => link("step", step.id, step.title, step.purpose ? undefined : "not described")),
      ),
      // Problems come before bets: what breaks here, then what anyone has
      // proposed about it. A problem with no bet under it is the useful signal.
      ...linksBlock(
        "Problems here",
        stageProblems.map((problem) => link("problem", problem.id, problem.title, describeProblemStatus(problem.id))),
      ),
      ...linksBlock("Claims", stageClaims.map((claim) => link("claim", claim.id, claim.statement, claim.kind))),
      ...linksBlock("Metrics", stageMetrics.map((metric) => link("metric", metric.id, metric.title, metric.dataStatus))),
    ];

    nodes.push(
      finalise({
        id: nodeId("stage", stage.id),
        kind: "stage",
        contentId: stage.id,
        title: stage.title,
        summary: stage.summary,
        order: stage.order,
        status: stage.status,
        authority: stage.authority,
        lastReviewed: isoDate(stage.lastReviewed),
        provenance: stage.provenance?.source,
        href: ROUTES.stage(stage.id),
        file: stage.file,
        signals,
        coverage: stageCoverage(stage),
        blocks,
        lenses: ["flow", "bets", "evidence"],
        searchText: [stage.title, stage.summary, stage.id, stage.status].join(" "),
      }, researchReferences(stage)),
    );
  }

  /* ---- Steps ----------------------------------------------------------- */

  for (const step of steps) {
    const stepProblems = problemsFor(step.id);
    const stepBets = betsFor(step.id);
    const stepClaims = claims.filter((claim) => claim.targets.includes(step.id) || step.claims?.includes(claim.id));
    const stepMetrics = metricsFor(step.id, step.metrics);
    const stage = stageById.get(step.stage);

    const states = [
      ...(step.inputs ?? []).map((io) => ({ ...io, direction: "in" as const })),
      ...(step.outputs ?? []).map((io) => ({ ...io, direction: "out" as const })),
    ];

    const lenses: LensId[] = ["flow"];
    // A step earns a place in the problem lens by having a problem pinned to it
    // specifically, which is what its band on that canvas exists to anchor.
    if (stepProblems.length > 0) lenses.push("bets");
    if (stepClaims.length > 0 || stepMetrics.length > 0) lenses.push("evidence");
    if (states.length > 0) lenses.push("entities");

    const blocks: DetailBlock[] = [
      ...proseBlock("Activity", step.activity === step.purpose ? undefined : step.activity),
      ...listBlock("Entry conditions", step.entryConditions),
      ...stateBlock("Inputs", step.inputs, entityById),
      ...stateBlock("Outputs", step.outputs, entityById),
      ...listBlock("Exit conditions", step.exitConditions),
      ...(step.rules && step.rules.length > 0
        ? [{ type: "rules" as const, label: "Rules", items: step.rules }]
        : []),
      ...listBlock("Exceptions", step.exceptions?.map(describeException)),
      ...listBlock(
        "Roles",
        [
          ...(step.roles?.primary ?? []).map((role) => `${role} (primary)`),
          ...(step.roles?.supporting ?? []).map((role) => `${role} (supporting)`),
        ],
      ),
      ...markdownBlocks(step.sections, ["Overview"]),
      ...proseBlock("Notes", step.sections.Overview),
      ...linksBlock(
        "Next steps",
        (step.next ?? []).flatMap((id) => {
          const target = stepById.get(id);
          return target ? [link("step", target.id, target.title)] : [];
        }),
      ),
      ...linksBlock(
        "Problems here",
        stepProblems.map((problem) => link("problem", problem.id, problem.title, describeProblemStatus(problem.id))),
      ),
      ...linksBlock("Claims", stepClaims.map((claim) => link("claim", claim.id, claim.statement, claim.kind))),
      ...linksBlock("Metrics", stepMetrics.map((metric) => link("metric", metric.id, metric.title, metric.dataStatus))),
    ];

    nodes.push(
      finalise({
        id: nodeId("step", step.id),
        kind: "step",
        contentId: step.id,
        title: step.title,
        subtitle: stage?.title,
        summary: step.purpose,
        order: step.order,
        authority: step.authority,
        lastReviewed: isoDate(step.lastReviewed),
        provenance: step.provenance?.source,
        parentId: nodeId("stage", step.stage),
        href: ROUTES.step(step.id),
        file: step.file,
        signals: [
          signal(step.rules?.length ?? 0, "neutral", "rule"),
          signal(states.length, "quiet", "state"),
          signal(stepProblems.length, "warn", "problem"),
          signal(stepBets.length, "accent", "bet"),
          signal(stepClaims.length + stepMetrics.length, "evidence", "evidence", "evidence"),
        ],
        coverage: stepCoverage(step),
        blocks,
        lenses,
        searchText: [step.title, step.purpose, step.id, stage?.title].join(" "),
      }, researchReferences(step)),
    );

    for (const next of step.next ?? []) {
      edges.push({
        id: `process:${step.id}->${next}`,
        source: nodeId("step", step.id),
        target: nodeId("step", next),
        kind: "process",
        lenses: ["flow"],
      });
    }

    for (const io of step.inputs ?? []) {
      edges.push({
        id: `state:${io.entity}->${step.id}`,
        source: nodeId("entity", io.entity),
        target: nodeId("step", step.id),
        kind: "state",
        label: io.state,
        lenses: ["entities"],
      });
    }
    for (const io of step.outputs ?? []) {
      edges.push({
        id: `state:${step.id}->${io.entity}`,
        source: nodeId("step", step.id),
        target: nodeId("entity", io.entity),
        kind: "state",
        label: io.state,
        lenses: ["entities"],
      });
    }
  }

  /* ---- Problems --------------------------------------------------------- */

  for (const problem of problems) {
    const where = resolveTargets(problem.targets, stageById, stepById);
    const proposed = betsForProblem(problem.id);
    const problemClaims = claims.filter(
      (claim) => problem.claims?.includes(claim.id) || claim.targets.some((id) => problem.targets.includes(id)),
    );
    const problemMetrics = metrics.filter(
      (metric) => problem.metrics?.includes(metric.id) || metric.targets?.some((id) => problem.targets.includes(id)),
    );

    // Only what the problem file itself names becomes an edge. A claim that
    // merely targets the same stage is already joined to that stage; treating
    // it as something this problem rests on would put weight on a coincidence.
    const restsOn = [
      ...claims.filter((claim) => problem.claims?.includes(claim.id)),
      ...metrics.filter((metric) => problem.metrics?.includes(metric.id)),
    ];

    // A problem earns its place in the evidence lens the way a step does: by
    // having evidence of its own to show. One that names none stays out rather
    // than sitting on that canvas with nothing beneath it.
    const problemLenses: LensId[] = restsOn.length > 0 ? ["bets", "evidence"] : ["bets"];

    nodes.push(
      finalise({
        id: nodeId("problem", problem.id),
        kind: "problem",
        contentId: problem.id,
        title: problem.title,
        summary: problem.summary ?? firstSentence(problem.sections[SECTION.whatHappensToday]),
        status: problem.status,
        authority: problem.authority,
        lastReviewed: isoDate(problem.lastReviewed),
        provenance: problem.provenance?.source,
        href: ROUTES.problem(problem.id),
        file: problem.file,
        signals: [
          signal(proposed.length, "accent", "bet"),
          signal(proposed.filter((bet) => bet.prototype?.route).length, "accent", "built", "built"),
          signal(openQuestionCount(problem.sections), "warn", "question"),
          signal(problemClaims.length + problemMetrics.length, "evidence", "evidence", "evidence"),
        ],
        coverage: problemCoverage(problem),
        blocks: [
          ...proseBlock("What happens today", problem.sections[SECTION.whatHappensToday]),
          ...proseBlock("Why it matters", problem.sections[SECTION.whyItMatters]),
          ...markdownBlocks(problem.sections, [SECTION.whatHappensToday, SECTION.whyItMatters]),
          ...linksBlock("Where it bites", where),
          ...linksBlock(
            "Proposed solutions",
            proposed.map((bet) => link("bet", bet.id, bet.title, bet.prototype?.route ? "built" : bet.confidence)),
          ),
          ...linksBlock(
            "Related claims",
            problemClaims.map((claim) => link("claim", claim.id, claim.statement, claim.confidence)),
          ),
          ...linksBlock(
            "What would tell us",
            problemMetrics.map((metric) => link("metric", metric.id, metric.title, metric.dataStatus)),
          ),
        ],
        lenses: problemLenses,
        searchText: [problem.title, problem.summary, problem.sections[SECTION.whatHappensToday], problem.id].join(" "),
      }, researchReferences(problem)),
    );

    for (const target of problem.targets) {
      const targetKind: NodeKind | undefined = stageById.has(target)
        ? "stage"
        : stepById.has(target)
          ? "step"
          : undefined;
      if (!targetKind) continue;
      edges.push({
        id: `problem:${problem.id}->${target}`,
        source: nodeId(targetKind, target),
        target: nodeId("problem", problem.id),
        kind: "problem",
        // Carried into the evidence lens too, so a problem drawn there hangs
        // under the part of the machine it bites instead of floating loose.
        lenses: problemLenses,
      });
    }

    for (const record of restsOn) {
      const kind: NodeKind = "statement" in record ? "claim" : "metric";
      edges.push({
        id: `evidence:${problem.id}->${record.id}`,
        source: nodeId("problem", problem.id),
        target: nodeId(kind, record.id),
        kind: "evidence",
        lenses: ["evidence"],
      });
    }
  }

  /* ---- Bets and prototypes --------------------------------------------- */

  for (const bet of bets) {
    const betClaims = claims.filter((claim) => bet.claims?.includes(claim.id));
    const betMetrics = metrics.filter((metric) => bet.metrics?.includes(metric.id));
    const problem = problemById.get(bet.problem);
    // Where a bet lands in the machine follows from the problem it answers,
    // so a bet never restates it and the two can never disagree.
    const targets = problem ? resolveTargets(problem.targets, stageById, stepById) : [];

    nodes.push(
      finalise({
        id: nodeId("bet", bet.id),
        kind: "bet",
        contentId: bet.id,
        title: bet.title,
        subtitle: problem ? `Answers: ${problem.title}` : undefined,
        summary: firstSentence(bet.sections[SECTION.bet]),
        status: bet.status,
        confidence: bet.confidence,
        authority: bet.authority,
        lastReviewed: isoDate(bet.lastReviewed),
        provenance: bet.provenance?.source,
        href: ROUTES.bet(bet.id),
        file: bet.file,
        signals: [
          signal(betClaims.length, "evidence", "claim"),
          signal(betMetrics.length, "evidence", "metric"),
          signal(openQuestionCount(bet.sections), "warn", "question"),
        ],
        coverage: betCoverage(bet),
        blocks: [
          ...linksBlock(
            "The problem this answers",
            problem ? [link("problem", problem.id, problem.title, problem.status)] : [],
          ),
          ...proseBlock("Intervention", bet.sections[SECTION.bet]),
          ...markdownBlocks(bet.sections, [SECTION.bet]),
          ...linksBlock("Where it lands", targets),
          ...linksBlock("Supporting claims", betClaims.map((claim) => link("claim", claim.id, claim.statement, claim.confidence))),
          ...linksBlock("Success would affect", betMetrics.map((metric) => link("metric", metric.id, metric.title, metric.dataStatus))),
        ],
        lenses: ["bets"],
        searchText: [bet.title, problem?.title, bet.sections[SECTION.bet], bet.id].join(" "),
      }, researchReferences(bet)),
    );

    if (problem) {
      edges.push({
        id: `bet:${problem.id}->${bet.id}`,
        source: nodeId("problem", problem.id),
        target: nodeId("bet", bet.id),
        kind: "bet",
        lenses: ["bets"],
      });
    }

    // What the bet rests on. These are not drawn: the bets lens owns the
    // problem-to-bet spine and the evidence lens owns claims and metrics, so a
    // bet band on that canvas would be the same picture twice. They exist
    // because the projection is read for more than the canvas — open ends can
    // now tell a reader on a bet's page that its supporting claim is weakly
    // held or that nothing under it is measured, which is exactly the loose end
    // they are best placed to help with.
    for (const record of [...betClaims, ...betMetrics]) {
      const kind: NodeKind = "statement" in record ? "claim" : "metric";
      edges.push({
        id: `evidence:${bet.id}->${record.id}`,
        source: nodeId("bet", bet.id),
        target: nodeId(kind, record.id),
        kind: "evidence",
        lenses: ["evidence"],
      });
    }

    if (!bet.prototype) continue;

    const launchable = Boolean(bet.prototype.route);
    nodes.push(
      finalise({
        id: nodeId("prototype", bet.id),
        kind: "prototype",
        contentId: bet.id,
        title: bet.title,
        subtitle: "Prototype",
        summary: launchable
          ? "Working software that makes this bet concrete. Synthetic data only."
          : "No prototype has been built for this bet yet.",
        status: bet.prototype.status,
        href: bet.prototype.route ?? ROUTES.bet(bet.id),
        file: bet.file,
        // A prototype has nothing to count. Its status is already on its face.
        signals: [],
        coverage: { filled: launchable ? 2 : 1, total: 2, missing: launchable ? [] : ["Route"] },
        blocks: [
          ...linksBlock("Tests the bet", [link("bet", bet.id, bet.title, bet.confidence)]),
          ...linksBlock(
            "Against the problem",
            problem ? [link("problem", problem.id, problem.title, problem.status)] : [],
          ),
          ...linksBlock("Where it lands", targets),
          ...linksBlock("Success would affect", betMetrics.map((metric) => link("metric", metric.id, metric.title))),
        ],
        lenses: ["bets"],
        searchText: [bet.title, "prototype", bet.prototype.status, bet.id].join(" "),
      }),
    );

    edges.push({
      id: `prototype:${bet.id}`,
      source: nodeId("bet", bet.id),
      target: nodeId("prototype", bet.id),
      kind: "prototype",
      lenses: ["bets"],
    });
  }

  /* ---- Claims and metrics ---------------------------------------------- */

  for (const claim of claims) {
    const targets = resolveTargets(claim.targets, stageById, stepById);
    nodes.push(
      finalise({
        id: nodeId("claim", claim.id),
        kind: "claim",
        contentId: claim.id,
        title: claim.statement.trim(),
        subtitle: `${claim.kind} · ${claim.status}`,
        confidence: claim.confidence,
        status: claim.status,
        authority: claim.authority,
        lastReviewed: isoDate(claim.lastReviewed),
        provenance: claim.provenance?.source,
        href: ROUTES.claim(claim.id),
        file: claim.file,
        signals: [
          signal(claim.targets.length, "neutral", "target"),
          signal(claim.provenance?.references?.length ?? 0, "evidence", "reference"),
        ],
        coverage: claimCoverage(claim),
        blocks: [
          ...bodyBlock(claim.sections, "Reasoning"),
          ...linksBlock("Describes", targets),
          ...linksBlock(
            "Used by bets",
            bets.filter((bet) => bet.claims?.includes(claim.id)).map((bet) => link("bet", bet.id, bet.title)),
          ),
        ],
        lenses: ["evidence"],
        searchText: [claim.statement, claim.kind, claim.id].join(" "),
      }, researchReferences(claim)),
    );

    for (const target of targets) {
      edges.push({
        id: `evidence:${claim.id}->${target.id}`,
        source: target.id,
        target: nodeId("claim", claim.id),
        kind: "evidence",
        lenses: ["evidence"],
      });
    }
  }

  for (const metric of metrics) {
    const declaredBy = [
      ...stages.filter((stage) => stage.metrics?.includes(metric.id)).map((stage) => stage.id),
      ...steps.filter((step) => step.metrics?.includes(metric.id)).map((step) => step.id),
    ];
    const targets = resolveTargets([...(metric.targets ?? []), ...declaredBy], stageById, stepById);

    nodes.push(
      finalise({
        id: nodeId("metric", metric.id),
        kind: "metric",
        contentId: metric.id,
        title: metric.title,
        subtitle: [metric.unit, metric.direction && `${metric.direction} is better`].filter(Boolean).join(" · ") || undefined,
        dataStatus: metric.dataStatus,
        provenance: metric.provenance?.source,
        href: ROUTES.metric(metric.id),
        file: metric.file,
        signals: [signal(targets.length, "neutral", "measures", "measures")],
        coverage: metricCoverage(metric),
        blocks: [
          ...bodyBlock(metric.sections, "Definition"),
          ...listBlock("Who this serves", (metric.perspectives ?? []).map(({ actor, role }) => {
            const title = entityById.get(actor)?.title ?? actor;
            return `${title} — ${role}`;
          })),
          ...proseBlock("Decision informed", metric.decision),
          ...proseBlock("Decision owner", metric.decisionOwner && (entityById.get(metric.decisionOwner)?.title ?? metric.decisionOwner)),
          ...linksBlock("Measures", targets),
          ...linksBlock(
            "Bets aimed at this",
            bets.filter((bet) => bet.metrics?.includes(metric.id)).map((bet) => link("bet", bet.id, bet.title)),
          ),
        ],
        lenses: ["evidence"],
        searchText: [metric.title, metric.unit, metric.id, metric.decision, ...(metric.perspectives ?? []).map(({ actor }) => actor)].join(" "),
      }, researchReferences(metric)),
    );

    for (const target of targets) {
      edges.push({
        id: `evidence:${metric.id}->${target.id}`,
        source: target.id,
        target: nodeId("metric", metric.id),
        kind: "evidence",
        lenses: ["evidence"],
      });
    }
  }

  /* ---- Entities -------------------------------------------------------- */

  for (const entity of entities) {
    const producedBy = steps.filter((step) => step.outputs?.some((io) => io.entity === entity.id));
    const consumedBy = steps.filter((step) => step.inputs?.some((io) => io.entity === entity.id));
    const statesIn = (step: Step, field: "inputs" | "outputs") =>
      (step[field] ?? []).filter((io) => io.entity === entity.id).map((io) => io.state);

    const observed = new Set(steps.flatMap((step) => [...statesIn(step, "inputs"), ...statesIn(step, "outputs")]));
    const declared = entity.states ?? [];

    nodes.push(
      finalise({
        id: nodeId("entity", entity.id),
        kind: "entity",
        contentId: entity.id,
        title: entity.title,
        summary: firstSentence(entity.body),
        provenance: entity.provenance?.source,
        lastReviewed: isoDate(entity.lastReviewed),
        href: ROUTES.entity(entity.id),
        file: entity.file,
        signals: [
          signal(declared.length || observed.size, "quiet", "state"),
          signal(new Set([...producedBy, ...consumedBy].map((s) => s.id)).size, "neutral", "step touches", "steps touch"),
        ],
        coverage: entityCoverage(entity),
        blocks: [
          ...bodyBlock(entity.sections, "Definition"),
          ...listBlock("Declared states", declared),
          // Only worth showing separately when nothing is declared; otherwise the
          // loader has already guaranteed the two agree.
          ...(declared.length === 0 ? listBlock("States referenced by steps", [...observed].sort()) : []),
          ...linksBlock(
            "Produced by",
            producedBy.map((step) => link("step", step.id, step.title, statesIn(step, "outputs").join(", "))),
          ),
          ...linksBlock(
            "Read by",
            consumedBy.map((step) => link("step", step.id, step.title, statesIn(step, "inputs").join(", "))),
          ),
        ],
        lenses: ["entities"],
        searchText: [entity.title, entity.body, entity.id, ...declared].join(" "),
      }, researchReferences(entity)),
    );
  }

  /* ---- Stage topology --------------------------------------------------- */

  for (const [index, edge] of map.edges.entries()) {
    const feedback = isFeedbackRelationship(edge.relationship);
    edges.push({
      id: `flow:${index}:${edge.from}->${edge.to}`,
      source: nodeId("stage", edge.from),
      target: nodeId("stage", edge.to),
      kind: feedback ? "feedback" : "flow",
      label: edge.relationship.replaceAll("_", " "),
      lenses: ["flow", "bets", "evidence"],
    });
  }

  /* ---- Summary ---------------------------------------------------------- */

  const countByKind = (kind: NodeKind) => nodes.filter((node) => node.kind === kind).length;
  const lensCount = (lens: LensId) => nodes.filter((node) => node.lenses.includes(lens)).length;

  // A Bet with a route has software behind it; the loader has already checked
  // the route resolves, so anything listed here is genuinely runnable. The
  // problem comes from the Problem it answers, which is the only place that
  // trouble is written down.
  const entryPoints: EntryPoint[] = bets.flatMap((bet) => {
    if (!bet.prototype?.route) return [];
    const problem = problemById.get(bet.problem);
    return [
      {
        id: bet.id,
        title: bet.title,
        problemTitle: problem?.title,
        problemHref: problem ? ROUTES.problem(problem.id) : undefined,
        problem: problem?.sections[SECTION.whatHappensToday]?.trim() || problem?.summary?.trim() || undefined,
        intervention: bet.sections[SECTION.bet]?.trim() || undefined,
        href: bet.prototype.route,
        betHref: ROUTES.bet(bet.id),
        status: bet.prototype.status,
        confidence: bet.confidence,
      },
    ];
  });

  return {
    revision: contentRevision(),
    title: map.title,
    nodes,
    edges,
    lenses: [
      {
        id: "flow",
        label: "Operating flow",
        description: "How work moves through the system, stage by stage.",
        nodeCount: lensCount("flow"),
      },
      {
        id: "bets",
        label: "Problems & solutions",
        description: "Where the machine breaks, what we propose about it, and what has been built.",
        nodeCount: lensCount("bets"),
      },
      {
        id: "evidence",
        label: "Evidence",
        description: "What we believe and what we would measure.",
        nodeCount: lensCount("evidence"),
      },
      {
        id: "entities",
        label: "Entities",
        description: "The things the system transforms, and where.",
        nodeCount: lensCount("entities"),
      },
    ],
    // Four numbers that answer "how much of this is real yet?" without
    // requiring the reader to already know the vocabulary.
    stats: [
      stat(countByKind("stage"), "stage of the machine", "stages of the machine"),
      stat(countByKind("problem"), "problem named", "problems named"),
      stat(countByKind("bet"), "bet on the table", "bets on the table"),
      stat(entryPoints.length, "prototype you can try", "prototypes you can try"),
    ],
    entryPoints,
    vocab: { authority: AUTHORITY_TERMS, edges: EDGE_LEGEND },
    sourceUrl: process.env.NEXT_PUBLIC_CONTENT_SOURCE_URL,
    repoUrl: repositoryUrl(process.env.NEXT_PUBLIC_CONTENT_SOURCE_URL),
  };
}

/* -------------------------------------------------------------------------- */
/* Small helpers                                                               */
/* -------------------------------------------------------------------------- */

/** A count with its label already agreeing with it. */
function stat(value: number, singular: string, plural: string) {
  return { value, label: value === 1 ? singular : plural };
}

/**
 * A node signal whose label agrees with its own number.
 *
 * Every surface renders signals verbatim, so "1 questions" would have to be
 * fixed in three components or not at all. Mass nouns pass the same word twice.
 */
function signal(value: number, tone: Tone, singular: string, plural?: string): Signal {
  return { value, tone, label: value === 1 ? singular : (plural ?? `${singular}s`) };
}

/**
 * The repository root, from the blob root used for "view source" links.
 *
 * `NEXT_PUBLIC_CONTENT_SOURCE_URL` points at a branch — `.../blob/main` — so
 * the clone instructions on the home page derive from the same setting rather
 * than naming a repository in application code.
 */
function repositoryUrl(sourceUrl?: string): string | undefined {
  if (!sourceUrl) return undefined;
  const trimmed = sourceUrl.replace(/\/+$/, "");
  return /\/(?:blob|tree)\/[^/]+$/.exec(trimmed) ? trimmed.replace(/\/(?:blob|tree)\/[^/]+$/, "") : trimmed;
}

/**
 * The evidence behind a primitive, in a form a reader can follow.
 *
 * `provenance.references` is free text. A `researchTrace` is five IDs, and
 * printing them slash-separated reads as machine bookkeeping — the reader
 * cannot tell which ID is the run and has nowhere to go next. So the trace is
 * rendered as a sentence that says what the research did to this belief and
 * names the packet where the reasoning and the reviewer's decision are written
 * down.
 */
function researchReferences(record: { provenance?: { references?: string[] }; researchTrace?: Array<{ run: string; decision: string; finding: string; stance: string; sources: string[] }> }): string[] | undefined {
  const references = [...(record.provenance?.references ?? [])];
  for (const trace of record.researchTrace ?? []) {
    references.push(
      `Research run ${trace.run} ${trace.stance} this: finding ${trace.finding}, evidence ${trace.sources.join(", ")}, ` +
        `accepted in decision ${trace.decision}. Read research/reviews/${trace.run}.md.`,
    );
  }
  return references.length > 0 ? references : undefined;
}

/**
 * Appends the references that justify a primitive, then fingerprints it.
 *
 * References are shown on every primitive that has any rather than only on
 * claims, because a belief is a belief wherever it is recorded.
 */
function finalise(node: Omit<ModelNode, "hash">, references?: string[]): ModelNode {
  const blocks = references && references.length > 0
    ? [...node.blocks, { type: "list" as const, label: "References", items: references }]
    : node.blocks;
  const settled = { ...node, blocks };
  return { ...settled, hash: fingerprint(settled), searchText: node.searchText.toLowerCase() };
}

function describeException(exception: Step["exceptions"] extends Array<infer T> | undefined ? T : never): string {
  if (typeof exception === "string") return exception;
  return [exception.condition, exception.outcome].filter(Boolean).join(" → ");
}

function stateBlock(
  label: string,
  states: Step["inputs"],
  entityById: Map<string, Entity>,
): DetailBlock[] {
  if (!states || states.length === 0) return [];
  return [
    {
      type: "states",
      label,
      items: states.map((io) => ({
        entityId: io.entity,
        entityTitle: entityById.get(io.entity)?.title ?? io.entity,
        state: io.state,
        href: ROUTES.entity(io.entity),
      })),
    },
  ];
}

function resolveTargets(
  targetIds: string[],
  stageById: Map<string, Stage>,
  stepById: Map<string, Step>,
): LinkItem[] {
  const seen = new Set<string>();
  const resolved: LinkItem[] = [];
  for (const id of targetIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const stage = stageById.get(id);
    if (stage) {
      resolved.push(link("stage", stage.id, stage.title));
      continue;
    }
    const step = stepById.get(id);
    if (step) resolved.push(link("step", step.id, step.title, stageById.get(step.stage)?.title));
  }
  return resolved;
}
