import assert from "node:assert/strict";
import test from "node:test";
import { findGaps, type Gap } from "../../lib/research/gaps";
import type { Repository } from "../../lib/content/repository";
import type { LoadedDecisions, LoadedHandoff } from "../../lib/research/intake";

/**
 * The other half of the queue.
 *
 * Every original gap kind reads `content/` and says *go and find out more*.
 * That is the only instruction a thinness-measuring queue can give, and it is
 * the wrong one for a repository whose intake can outrun it: findings nobody
 * decided, acceptances that never became a change, candidates nobody converted,
 * and records that have quietly attracted a pile of background while still
 * claiming nothing. Bloat is exactly saturation nobody can see.
 */

const EMPTY_REPO = {
  stages: [],
  steps: [],
  entities: [],
  claims: [],
  metrics: [],
  problems: [],
  bets: [],
} as unknown as Repository;

function repoWith(stage: { id: string; title: string; researchTrace?: unknown[] }): Repository {
  return { ...EMPTY_REPO, stages: [stage] } as unknown as Repository;
}

/** A handoff carrying whatever a test needs it to carry. */
function handoff(run: string, parts: Partial<{ findings: unknown[]; candidates: unknown[]; notes: unknown[] }>): LoadedHandoff {
  return {
    file: `research/handoffs/${run}.yaml`,
    hash: "0".repeat(64),
    handoff: {
      run: { id: run },
      sources: [],
      findings: parts.findings ?? [],
      candidates: parts.candidates ?? [],
      notes: parts.notes ?? [],
      questions: [],
    },
  } as unknown as LoadedHandoff;
}

function decided(run: string, dispositions: Record<string, string>): LoadedDecisions {
  return {
    file: `research/decisions/${run}.yaml`,
    decisions: {
      runId: run,
      decisions: Object.entries(dispositions).map(([id, disposition]) => ({ id, disposition })),
    },
  } as unknown as LoadedDecisions;
}

const kinds = (gaps: Gap[]) => gaps.map((gap) => gap.kind);

test("a finding nobody decided is owed work, not an invitation to research", () => {
  const gaps = findGaps(EMPTY_REPO, [handoff("run-a", { findings: [{ id: "finding-one", suggestedTargets: [] }] })], []);
  assert.ok(kinds(gaps).includes("undecided"));
  assert.match(gaps.find((gap) => gap.kind === "undecided")!.why, /waiting on a person/);
});

// Accepted and applied are different states. This is the gap the whole
// arrangement exists to stop piling up, and until now nothing counted it.
test("an accepted finding no record cites is unapplied", () => {
  const runs = [handoff("run-a", { findings: [{ id: "finding-one", suggestedTargets: [] }] })];
  const accepted = [decided("run-a", { "decide-run-a-finding-one": "accept" })];

  const before = findGaps(EMPTY_REPO, runs, [], accepted);
  assert.ok(kinds(before).includes("unapplied"));
  assert.ok(!kinds(before).includes("undecided"), "a decided finding is no longer undecided");

  // Once a record cites the decision, the debt is gone.
  const applied = repoWith({
    id: "clinician-onboarding",
    title: "Clinician Onboarding",
    researchTrace: [{ decision: "decide-run-a-finding-one" }],
  });
  assert.ok(!kinds(findGaps(applied, runs, [], accepted)).includes("unapplied"));
});

test("an accepted candidate nothing answers to is unconverted", () => {
  const runs = [handoff("run-a", { candidates: [{ id: "candidate-one", targets: [] }] })];
  const gaps = findGaps(EMPTY_REPO, runs, [], [decided("run-a", { "decide-run-a-candidate-one": "accept-with-edits" })]);
  assert.ok(kinds(gaps).includes("unconverted"));
  assert.match(gaps.find((gap) => gap.kind === "unconverted")!.why, /name and ten minutes/);
});

test("a rejected finding is not debt", () => {
  const runs = [handoff("run-a", { findings: [{ id: "finding-one", suggestedTargets: [] }] })];
  const gaps = findGaps(EMPTY_REPO, runs, [], [decided("run-a", { "decide-run-a-finding-one": "reject" })]);
  assert.ok(!kinds(gaps).some((kind) => ["undecided", "unapplied"].includes(kind)));
});

test("context piling up on a record that still claims nothing is saturation", () => {
  const note = (id: string) => ({ id, anchors: ["clinician-onboarding"], sourceIds: [] });
  const repo = repoWith({ id: "clinician-onboarding", title: "Clinician Onboarding" });

  const three = [handoff("run-a", { notes: [note("a"), note("b"), note("c")] })];
  assert.ok(!kinds(findGaps(repo, three, [])).includes("saturated"), "a few notes is background, not a signal");

  const four = [handoff("run-a", { notes: [note("a"), note("b"), note("c"), note("d")] })];
  const gaps = findGaps(repo, four, []);
  assert.ok(kinds(gaps).includes("saturated"));
  assert.match(gaps.find((gap) => gap.kind === "saturated")!.why, /4 pieces of research context/);
});

// The context arrived and became something. That is the success case, and it
// must stop nagging — otherwise the signal is noise within a month.
test("a record research has already changed is not saturated", () => {
  const note = (id: string) => ({ id, anchors: ["clinician-onboarding"], sourceIds: [] });
  const repo = repoWith({
    id: "clinician-onboarding",
    title: "Clinician Onboarding",
    researchTrace: [{ decision: "decide-run-a-finding-one" }],
  });
  const runs = [handoff("run-a", { notes: [note("a"), note("b"), note("c"), note("d"), note("e")] })];
  assert.ok(!kinds(findGaps(repo, runs, [])).includes("saturated"));
});

// Owed work sorts above every invitation to research, because the queue's job
// is to say what to do next and finishing something beats starting something.
test("owed work outranks thin parts of the model", () => {
  const repo = {
    ...EMPTY_REPO,
    metrics: [{ id: "a-metric", title: "A Metric", dataStatus: "unknown" }],
  } as unknown as Repository;
  const gaps = findGaps(repo, [handoff("run-a", { findings: [{ id: "finding-one", suggestedTargets: [] }] })], []);

  assert.equal(gaps[0].kind, "undecided");
  assert.ok(kinds(gaps).indexOf("undecided") < kinds(gaps).indexOf("unmeasured"));
});

// Nothing here writes to content/, ever. The queue invites; a person answers.
test("every intake gap is an invitation, never a change", () => {
  const runs = [handoff("run-a", { findings: [{ id: "finding-one", suggestedTargets: [] }] })];
  for (const gap of findGaps(EMPTY_REPO, runs, [])) {
    assert.ok(gap.suggestedQuestion.length > 0, `${gap.kind} should suggest what a person could do`);
    assert.ok(gap.why.length > 0, `${gap.kind} should say why it is a gap`);
  }
});
