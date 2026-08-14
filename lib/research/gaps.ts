import {
  betCoverage,
  claimCoverage,
  entityCoverage,
  metricCoverage,
  problemCoverage,
  stageCoverage,
  stepCoverage,
} from "@/lib/model/coverage";
import type { Repository } from "@/lib/content/repository";
import type { LoadedHandoff } from "./intake";
import type { LoadedQuestion } from "./questions";

export type GapKind = "unmeasured" | "unevidenced" | "unproven" | "unsupplied" | "thin" | "raised";

export type Gap = {
  kind: GapKind;
  /** The ID of the thing that is thin, or of the run that raised the question. */
  subject: string;
  subjectKind: string;
  /** Why this is a gap, in words a reader can judge. */
  why: string;
  /** A question a run could be pointed at. Never written to `content/`. */
  suggestedQuestion: string;
};

const GAP_ORDER: Record<GapKind, number> = { raised: 0, unevidenced: 1, unsupplied: 2, unproven: 3, unmeasured: 4, thin: 5 };

/**
 * Where the model is thin enough to be worth researching.
 *
 * This is the half of the queue nobody has to write down. A scheduled run with
 * no queued question reads the model's own gaps and picks one, so the routine
 * has something to do on a morning when nobody asked it anything.
 *
 * Every rule here reads a schema field, never a particular stage or claim, so
 * adding content never touches this file. And a suggested question is only ever
 * a prompt for research: nothing here is written into `content/`, because
 * plausible-sounding filler is exactly what the model is not for.
 */
export function findGaps(repo: Repository, handoffs: LoadedHandoff[], questions: LoadedQuestion[]): Gap[] {
  const gaps: Gap[] = [];

  for (const metric of repo.metrics) {
    if (metric.dataStatus === "unknown" || metric.dataStatus === "not-measured") {
      gaps.push({
        kind: "unmeasured",
        subject: metric.id,
        subjectKind: "metric",
        why: `Data status is '${metric.dataStatus}', so nothing tells us whether this part of the machine is working.`,
        suggestedQuestion: `How do comparable practices measure ${metric.title.toLowerCase()}, and what is a realistic range?`,
      });
    }
  }

  for (const problem of repo.problems) {
    if (!problem.claims?.length && !problem.metrics?.length) {
      gaps.push({
        kind: "unevidenced",
        subject: problem.id,
        subjectKind: "problem",
        why: "Named as a place the machine breaks, with no claim or metric behind it.",
        suggestedQuestion: `What public evidence is there that ${problem.title.toLowerCase()} is real, and how large is it?`,
      });
    }
  }

  for (const claim of repo.claims) {
    if (["assumption", "hypothesis"].includes(claim.kind) && claim.confidence === "low") {
      gaps.push({
        kind: "unproven",
        subject: claim.id,
        subjectKind: "claim",
        why: `A low-confidence ${claim.kind} the model is currently reasoning from.`,
        suggestedQuestion: `What published evidence supports or contradicts: ${claim.statement}`,
      });
    }
  }

  // A Step that needs a state no Step produces. Validation deliberately allows
  // this — it is a part of the system nobody has modelled, not a defect, and
  // the answer is somebody describing what really happens rather than a
  // plausible Step invented to satisfy a checker. Which is exactly why the
  // queue has to carry it: an unmodelled dependency that only ever appears on
  // its own record page is one nobody is looking at. `propose-match` needs a
  // Family in `match-ready`, and `family-demand` has no Steps at all.
  const entityTitle = new Map(repo.entities.map((entity) => [entity.id, entity.title]));
  const producedBy = new Map<string, string[]>();
  for (const step of repo.steps) {
    for (const io of step.outputs ?? []) {
      const state = `${io.entity}:${io.state}`;
      producedBy.set(state, [...(producedBy.get(state) ?? []), step.id]);
    }
  }
  for (const step of repo.steps) {
    for (const input of step.inputs ?? []) {
      // Its own output does not count: an input has to exist before the step runs.
      if ((producedBy.get(`${input.entity}:${input.state}`) ?? []).some((id) => id !== step.id)) continue;
      const entity = entityTitle.get(input.entity) ?? input.entity;
      gaps.push({
        kind: "unsupplied",
        subject: step.id,
        subjectKind: "step",
        why: `Needs ${entity} in state '${input.state}', and no step in the model produces it.`,
        suggestedQuestion: `What work actually brings a ${entity.toLowerCase()} to '${input.state}', and who does it?`,
      });
    }
  }

  const described = [
    ...repo.stages.map((item) => [item, stageCoverage(item), "stage", item.title] as const),
    ...repo.steps.map((item) => [item, stepCoverage(item), "step", item.title] as const),
    ...repo.problems.map((item) => [item, problemCoverage(item), "problem", item.title] as const),
    ...repo.bets.map((item) => [item, betCoverage(item), "bet", item.title] as const),
    ...repo.claims.map((item) => [item, claimCoverage(item), "claim", item.statement] as const),
    ...repo.metrics.map((item) => [item, metricCoverage(item), "metric", item.title] as const),
    ...repo.entities.map((item) => [item, entityCoverage(item), "entity", item.title] as const),
  ];
  for (const [item, coverage, kind, title] of described) {
    if (coverage.total === 0 || coverage.filled / coverage.total >= 1 / 3) continue;
    gaps.push({
      kind: "thin",
      subject: item.id,
      subjectKind: kind,
      why: `Only ${coverage.filled} of ${coverage.total} modelable fields are described. Missing: ${coverage.missing.join(", ")}.`,
      suggestedQuestion: `How does a parent-focused behavioral health practice actually handle ${title.toLowerCase()}?`,
    });
  }

  // Questions a run raised and nobody queued. Without this they are recorded in
  // a packet, read once, and never looked at again.
  const queued = new Set(questions.map(({ question }) => question.question.trim().toLowerCase()));
  for (const { handoff } of handoffs) {
    for (const question of handoff.questions) {
      if (queued.has(question.question.trim().toLowerCase())) continue;
      gaps.push({
        kind: "raised",
        subject: handoff.run.id,
        subjectKind: "run",
        why: `Raised as an open question by run '${handoff.run.id}' and never queued.`,
        suggestedQuestion: question.question,
      });
    }
  }

  return gaps.sort((a, b) => GAP_ORDER[a.kind] - GAP_ORDER[b.kind] || a.subject.localeCompare(b.subject));
}
