/**
 * Model completeness, made visible.
 *
 * `AGENTS.md` treats incompleteness as valid: an empty field is honest and
 * invented content is not. That principle only works if you can *see* where the
 * thinking is thin, otherwise a sparse file looks the same as a rich one on the
 * map. Coverage counts which of a primitive's modelable fields are populated
 * and names the ones that are not, so the gaps become navigable rather than
 * invisible.
 *
 * The field lists below name schema fields, never content. Adding a stage or a
 * bet never touches this file.
 */

import { SECTION } from "@/lib/content/body";
import type { Bet, Claim, Entity, Metric, Problem, Stage, Step } from "@/lib/schemas";
import type { Coverage } from "@/lib/model/types";

type Described = { body?: string; sections?: Record<string, string> };

function isPresent(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (value instanceof Date) return true;
  if (typeof value === "object") return Object.keys(value as object).length > 0;
  return true;
}

type Field = readonly [label: string, value: unknown];

function score(fields: readonly Field[]): Coverage {
  const missing = fields.filter(([, value]) => !isPresent(value)).map(([label]) => label);
  return { filled: fields.length - missing.length, total: fields.length, missing };
}

/** Fields every primitive shares: why we believe it, and when it was last looked at. */
function provenanceFields(record: { provenance?: { source?: string }; lastReviewed?: Date } & Described) {
  return [
    ["Provenance", record.provenance?.source] as const,
    ["Last reviewed", record.lastReviewed] as const,
    ["Narrative", record.body] as const,
  ];
}

export function stageCoverage(stage: Stage): Coverage {
  return score([
    ["Summary", stage.summary],
    ["Entry conditions", stage.entryConditions],
    ["Exit conditions", stage.exitConditions],
    ["Metrics", stage.metrics],
    ["Status", stage.status],
    ["Authority", stage.authority],
    ...provenanceFields(stage),
  ]);
}

export function stepCoverage(step: Step): Coverage {
  return score([
    ["Purpose", step.purpose],
    ["Entry conditions", step.entryConditions],
    ["Inputs", step.inputs],
    ["Roles", step.roles],
    ["Activity", step.activity],
    ["Rules", step.rules],
    ["Outputs", step.outputs],
    ["Exit conditions", step.exitConditions],
    ["Exceptions", step.exceptions],
    ["Metrics", step.metrics],
    ["Claims", step.claims],
    ["Sequence", step.next],
    ["Authority", step.authority],
    ...provenanceFields(step),
  ]);
}

export function problemCoverage(problem: Problem): Coverage {
  return score([
    ["Summary", problem.summary],
    ["What happens today", problem.sections[SECTION.whatHappensToday]],
    ["Why it matters", problem.sections[SECTION.whyItMatters]],
    ["Open questions", problem.sections[SECTION.openQuestions]],
    ["Where it bites", problem.targets],
    ["Supporting claims", problem.claims],
    ["Metrics", problem.metrics],
    ["Authority", problem.authority],
    ["Provenance", problem.provenance?.source],
    ["Last reviewed", problem.lastReviewed],
  ]);
}

export function betCoverage(bet: Bet): Coverage {
  return score([
    ["Intervention", bet.sections[SECTION.bet]],
    ["Open questions", bet.sections[SECTION.questions]],
    ["Confidence", bet.confidence],
    ["Supporting claims", bet.claims],
    ["Metrics", bet.metrics],
    ["Prototype", bet.prototype],
    ["Status", bet.status],
    ["Authority", bet.authority],
    ["Provenance", bet.provenance?.source],
    ["Last reviewed", bet.lastReviewed],
  ]);
}

export function claimCoverage(claim: Claim): Coverage {
  return score([
    ["Kind", claim.kind],
    ["Confidence", claim.confidence],
    ["Status", claim.status],
    ["Targets", claim.targets],
    ["Authority", claim.authority],
    ["References", claim.provenance?.references],
    ...provenanceFields(claim),
  ]);
}

export function metricCoverage(metric: Metric): Coverage {
  return score([
    ["Unit", metric.unit],
    ["Direction", metric.direction],
    ["Targets", metric.targets],
    ["Data status", metric.dataStatus],
    ["Provenance", metric.provenance?.source],
    ["Definition", metric.body],
  ]);
}

export function entityCoverage(entity: Entity): Coverage {
  return score([
    ["Definition", entity.body],
    ["Declared states", entity.states],
    ["Provenance", entity.provenance?.source],
    ["Last reviewed", entity.lastReviewed],
  ]);
}
