import assert from "node:assert/strict";
import test from "node:test";
import {
  applySteps,
  composeProblem,
  hasNowhereToLand,
  problemIdFrom,
  suggestedConfidence,
  suggestedKind,
} from "../../lib/research/apply";
import { openEnds } from "../../lib/model/open-ends";
import type { ModelGraph, ModelNode } from "../../lib/model/types";
import type { ReviewFinding, ReviewRun } from "../../lib/research/view";

const run = { id: "run-one", createdAt: "2026-08-14" } as ReviewRun;

function finding(overrides: Partial<ReviewFinding> = {}): ReviewFinding {
  return {
    id: "finding-one",
    decisionId: "decide-run-one-finding-one",
    statement: "Parents choose on availability before fit.",
    classification: "new",
    evidenceStance: "supports",
    evidenceQuality: "primary",
    generalizedApplicability: true,
    sourceIds: ["source-a", "source-b"],
    suggestedTargets: [],
    existingClaimCandidates: [],
    priorArt: [],
    appliedIn: [],
    state: "accepted",
    ...overrides,
  } as ReviewFinding;
}

const choice = { kind: "observed" as const, confidence: "medium" as const };

test("a proposed Claim composes a complete file, carrying its authorization", () => {
  const [step] = applySteps(
    run,
    finding({
      proposedClaim: { id: "claim-availability-first", statement: "Parents choose on availability before fit." },
      suggestedTargets: [{ id: "matching", title: "Matching", href: "/stages/matching", kind: "stage" }],
    }),
    choice,
  );
  assert.equal(step.action, "create");
  assert.equal(step.path, "content/claims/claim-availability-first.md");
  assert.match(step.body, /^---\n/);
  assert.match(step.body, /kind: observed/);
  assert.match(step.body, /confidence: medium/);
  assert.match(step.body, /targets: \[matching\]/);
  // Without this the change cannot merge: content validation rejects a claim
  // that says it came from research and cannot prove a reviewer accepted it.
  assert.match(step.body, /decision: decide-run-one-finding-one/);
  assert.match(step.body, /sources: \[source-a, source-b\]/);
});

// Accepting with edits means the reviewer rewrote the statement. Composing the
// original would quietly discard the correction they just made.
test("an edited recommendation is what gets written down", () => {
  const [step] = applySteps(
    run,
    finding({
      proposedClaim: { id: "claim-x", statement: "The run's wording." },
      decision: { disposition: "accept-with-edits", editedRecommendation: "The reviewer's sharper wording." },
    }),
    choice,
  );
  assert.match(step.body, /The reviewer's sharper wording\./);
  assert.doesNotMatch(step.body, /The run's wording\./);
});

test("a finding naming existing Claims cites them instead of creating one", () => {
  const steps = applySteps(
    run,
    finding({
      classification: "qualifying",
      existingClaimCandidates: [{ id: "claim-existing", statement: "…", href: "/claims/claim-existing" }],
    }),
    choice,
  );
  assert.equal(steps.length, 1);
  assert.equal(steps[0].action, "edit");
  assert.equal(steps[0].path, "content/claims/claim-existing.md");
  assert.match(steps[0].explanation, /narrows an existing Claim/);
});

test("a finding with only targets leaves its trace on each of them", () => {
  const steps = applySteps(
    run,
    finding({
      suggestedTargets: [
        { id: "matching", title: "Matching", href: "/stages/matching", kind: "stage" },
        { id: "become-match-ready", title: "Become Match-Ready", href: "/steps/become-match-ready", kind: "step" },
      ],
    }),
    choice,
  );
  assert.deepEqual(
    steps.map((step) => step.path),
    ["content/stages/matching.md", "content/steps/become-match-ready.md"],
  );
});

test("a finding with nowhere to land says so rather than composing nothing", () => {
  assert.equal(hasNowhereToLand(finding()), true);
  assert.deepEqual(applySteps(run, finding(), choice), []);
});

test("a problem composed from research carries its references and names nothing", () => {
  const step = composeProblem(
    [
      {
        run,
        finding: finding({
          proposedClaim: { id: "claim-availability-first", statement: "Parents choose on availability." },
          suggestedTargets: [{ id: "matching", title: "Matching", href: "/stages/matching", kind: "stage" }],
        }),
      },
    ],
    "Families wait longer than the model can see",
  );

  assert.ok(step);
  assert.equal(step.path, "content/problems/families-wait-longer-than-the-model-can-see.md");
  assert.match(step.body, /^title: Families wait longer than the model can see$/m);
  assert.match(step.body, /^targets: \[matching\]$/m);
  assert.match(step.body, /^claims: \[claim-availability-first\]$/m);
  // The authorization travels with it; content validation refuses a trace
  // that no accepted decision backs.
  assert.match(step.body, /^ {4}decision: decide-run-one-finding-one$/m);
  // Every word of judgement stays the person's.
  assert.match(step.body, /# What happens today\n\n<!--/);
  assert.doesNotMatch(step.body, /Parents choose on availability/);
});

test("a problem draws on several findings at once, without repeating a target", () => {
  const step = composeProblem(
    [
      {
        run,
        finding: finding({
          suggestedTargets: [{ id: "matching", title: "Matching", href: "/stages/matching", kind: "stage" }],
        }),
      },
      {
        run,
        finding: finding({
          id: "finding-two",
          decisionId: "decide-run-one-finding-two",
          suggestedTargets: [
            { id: "matching", title: "Matching", href: "/stages/matching", kind: "stage" },
            { id: "propose-match", title: "Propose Match", href: "/steps/propose-match", kind: "step" },
          ],
        }),
      },
    ],
    "Nobody owns the wait",
  );

  assert.ok(step);
  assert.match(step.body, /^targets: \[matching, propose-match\]$/m);
  assert.equal(step.body.match(/^ {4}finding: /gm)?.length, 2);
});

test("research that names nowhere composes no problem, because one that bites nowhere is not a problem", () => {
  assert.equal(composeProblem([{ run, finding: finding() }], "Something is wrong"), undefined);
  assert.equal(composeProblem([], "Something is wrong"), undefined);
});

test("the problem id is derived from the title, and survives an unnamed draft", () => {
  assert.equal(problemIdFrom("A clinician can finish onboarding and still have no work"), "a-clinician-can-finish-onboarding-and-still-have");
  assert.equal(problemIdFrom("  "), "");
  const step = composeProblem(
    [{ run, finding: finding({ suggestedTargets: [{ id: "matching", title: "Matching", href: "/stages/matching", kind: "stage" }] }) }],
    "",
  );
  assert.equal(step?.path, "content/problems/the-problem-id.md");
});

test("evidence quality suggests a default without deciding it", () => {
  assert.equal(suggestedKind("primary"), "observed");
  assert.equal(suggestedKind("secondary"), "reported");
  assert.equal(suggestedKind("unknown"), "hypothesis");
  assert.equal(suggestedConfidence("primary"), "medium");
  assert.equal(suggestedConfidence("expert-opinion"), "low");
});

/** The smallest graph that exercises a rule. */
function node(id: string, kind: string, extra: Record<string, unknown> = {}): ModelNode {
  return {
    id,
    contentId: id.split(":")[1] ?? id,
    kind,
    title: id.split(":")[1] ?? id,
    href: `/${kind}s/${id.split(":")[1] ?? id}`,
    blocks: [],
    lenses: [],
    signals: [],
    coverage: { filled: 9, total: 9, missing: [] },
    searchText: "",
    hash: "",
    file: "",
    ...extra,
  } as unknown as ModelNode;
}

function graphOf(nodes: ModelNode[], edges: Array<[string, string, string]>): ModelGraph {
  return {
    nodes,
    edges: edges.map(([source, target, kind]) => ({ id: `${source}->${target}`, source, target, kind, lenses: [] })),
  } as unknown as ModelGraph;
}

test("a problem nobody has answered is the loose end worth naming", () => {
  const stage = node("stage:matching", "stage");
  const graph = graphOf(
    [stage, node("problem:answered", "problem"), node("problem:open", "problem"), node("bet:a-bet", "bet")],
    [
      ["stage:matching", "problem:answered", "problem"],
      ["stage:matching", "problem:open", "problem"],
      ["problem:answered", "bet:a-bet", "bet"],
    ],
  );
  const ends = openEnds(graph, stage).filter((end) => end.kind === "unanswered");
  assert.equal(ends.length, 1);
  assert.match(ends[0].invitation, /Nobody has proposed an answer to “open”/);
});

// Six near-identical sentences is another wall, which is the thing this section
// exists to be an alternative to.
test("many unmeasured metrics collapse to one line, one stays specific", () => {
  const stage = node("stage:matching", "stage");
  const metric = (id: string) => node(`metric:${id}`, "metric", { dataStatus: "unknown" });
  const many = graphOf(
    [stage, metric("a"), metric("b"), metric("c")],
    [
      ["stage:matching", "metric:a", "evidence"],
      ["stage:matching", "metric:b", "evidence"],
      ["stage:matching", "metric:c", "evidence"],
    ],
  );
  const collapsed = openEnds(many, stage).filter((end) => end.kind === "unmeasured");
  assert.equal(collapsed.length, 1);
  assert.match(collapsed[0].invitation, /Nothing here is measured yet — a, b and 1 other\./);

  const one = graphOf([stage, metric("a")], [["stage:matching", "metric:a", "evidence"]]);
  assert.match(openEnds(one, stage)[0].invitation, /^a would tell us whether this works/);
});

test("a well-described record with nothing loose says nothing", () => {
  const stage = node("stage:tidy", "stage");
  assert.deepEqual(openEnds(graphOf([stage], []), stage), []);
});
