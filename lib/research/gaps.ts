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
import type { LoadedDecisions, LoadedHandoff } from "./intake";
import type { LoadedQuestion } from "./questions";

export type GapKind =
  | "unmeasured"
  | "unevidenced"
  | "unproven"
  | "unsupplied"
  | "thin"
  | "raised"
  // The intake side of the ledger. Everything above measures where the model is
  // thin; these measure where the intake has run ahead of it, which is the
  // failure that arrives with volume. Bloat is exactly saturation nobody can
  // see: context piling up in staging, correctly gated, changing nothing.
  | "undecided"
  | "unapplied"
  | "unconverted"
  | "saturated";

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

/**
 * What to look at first.
 *
 * Work already owed outranks work merely available: a decision waiting, an
 * acceptance that never landed, and a candidate nobody converted are all
 * somebody's unfinished sentence, and they come before any invitation to go and
 * research something new. `saturated` sits with them because it is the same
 * shape — evidence gathered and not yet turned into anything the model says.
 */
const GAP_ORDER: Record<GapKind, number> = {
  undecided: 0,
  unapplied: 1,
  unconverted: 2,
  saturated: 3,
  raised: 4,
  unevidenced: 5,
  unsupplied: 6,
  unproven: 7,
  unmeasured: 8,
  thin: 9,
};

/**
 * How much anchored context may accumulate on one record before it reads as a
 * signal rather than as background.
 *
 * Deliberately low, and deliberately not tuned. The point is not a threshold
 * that is correct — it is that a person notices when a record has attracted
 * enough attention to be worth writing down properly, while the material is
 * still small enough to read in one sitting.
 */
const SATURATION = 4;

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
export function findGaps(
  repo: Repository,
  handoffs: LoadedHandoff[],
  questions: LoadedQuestion[],
  decisions: LoadedDecisions[] = [],
): Gap[] {
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

  gaps.push(...intakeGaps(repo, handoffs, decisions));

  return gaps.sort((a, b) => GAP_ORDER[a.kind] - GAP_ORDER[b.kind] || a.subject.localeCompare(b.subject));
}

/**
 * Where the intake has run ahead of the model.
 *
 * The rest of this file reads `content/` and asks where the thinking is thin.
 * That was the whole queue, and it could only ever say *go and find out more* —
 * which is the wrong instruction for a repository taking in a lot of context.
 * The opposite failure has no voice: findings nobody decided, acceptances that
 * never became a change, candidates nobody converted, and records that have
 * quietly attracted a pile of background while still claiming nothing.
 *
 * All four are answered by writing rather than by researching, which is why
 * they sort above every invitation to research.
 */
function intakeGaps(repo: Repository, handoffs: LoadedHandoff[], decisions: LoadedDecisions[]): Gap[] {
  const gaps: Gap[] = [];
  const AUTHORIZING = ["accept", "accept-with-edits"];

  const byRun = new Map(decisions.map((record) => [record.decisions.runId, record.decisions]));
  const applied = new Set(
    [...repo.stages, ...repo.steps, ...repo.entities, ...repo.claims, ...repo.metrics, ...repo.problems, ...repo.bets].flatMap(
      (record) => (record.researchTrace ?? []).map((trace) => trace.decision),
    ),
  );

  for (const { handoff } of handoffs) {
    const record = byRun.get(handoff.run.id);
    const dispositions = new Map((record?.decisions ?? []).map((decision) => [decision.id, decision.disposition]));

    const undecided = [...handoff.findings, ...handoff.candidates].filter(
      (item) => !dispositions.has(`decide-${handoff.run.id}-${item.id}`),
    );
    if (undecided.length) {
      gaps.push({
        kind: "undecided",
        subject: handoff.run.id,
        subjectKind: "run",
        why: `${undecided.length} of ${handoff.findings.length + handoff.candidates.length} waiting on a person. Research nobody decides is research that changed nothing.`,
        suggestedQuestion: `Decide the outstanding findings in '${handoff.run.id}'.`,
      });
    }

    // Accepted and applied are different states, and the gap between them is
    // the one this whole arrangement exists to prevent piling up.
    const unapplied = handoff.findings.filter((finding) => {
      const id = `decide-${handoff.run.id}-${finding.id}`;
      return AUTHORIZING.includes(dispositions.get(id) ?? "") && !applied.has(id);
    });
    if (unapplied.length) {
      gaps.push({
        kind: "unapplied",
        subject: handoff.run.id,
        subjectKind: "run",
        why: `${unapplied.length} accepted finding(s) no canonical record cites. Somebody authorized a change that was never made.`,
        suggestedQuestion: `Apply the accepted findings from '${handoff.run.id}' at /review/apply.`,
      });
    }

    const unconverted = handoff.candidates.filter((candidate) => {
      const id = `decide-${handoff.run.id}-${candidate.id}`;
      return AUTHORIZING.includes(dispositions.get(id) ?? "") && !applied.has(id);
    });
    if (unconverted.length) {
      gaps.push({
        kind: "unconverted",
        subject: handoff.run.id,
        subjectKind: "run",
        why: `${unconverted.length} accepted proposal(s) nothing in the model answers to yet. Each needs a name and ten minutes.`,
        suggestedQuestion: `Compose the accepted candidates from '${handoff.run.id}' at /review/apply.`,
      });
    }
  }

  // Context accumulating where a Claim or a Step should be written. Counted
  // per record rather than per run, because saturation is a property of the
  // thing being written about, not of who wrote about it.
  const anchored = new Map<string, number>();
  for (const { handoff } of handoffs) {
    for (const note of handoff.notes) {
      for (const anchor of note.anchors) anchored.set(anchor, (anchored.get(anchor) ?? 0) + 1);
    }
    for (const finding of handoff.findings) {
      for (const target of finding.suggestedTargets) anchored.set(target, (anchored.get(target) ?? 0) + 1);
    }
  }
  const records = new Map(
    [...repo.stages, ...repo.steps, ...repo.entities, ...repo.claims, ...repo.metrics, ...repo.problems, ...repo.bets].map(
      (record) => [record.id, record],
    ),
  );
  for (const [id, count] of anchored) {
    const record = records.get(id);
    if (!record || count < SATURATION) continue;
    // A record that has already been changed by research is not saturated: the
    // context arrived and became something. This is about the pile that did not.
    if (record.researchTrace?.length) continue;
    const title = "title" in record ? record.title : "statement" in record ? record.statement : id;
    gaps.push({
      kind: "saturated",
      subject: id,
      subjectKind: "record",
      why: `${count} pieces of research context anchor here and nothing has changed what it says. Enough has been gathered to write something down.`,
      suggestedQuestion: `What does the accumulated context about ${String(title).toLowerCase()} let us now claim, and what is still missing?`,
    });
  }

  return gaps;
}
