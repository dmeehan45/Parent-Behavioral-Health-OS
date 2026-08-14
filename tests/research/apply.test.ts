import assert from "node:assert/strict";
import test from "node:test";
import yaml from "js-yaml";
import { claimSchema, problemSchema } from "../../lib/schemas";
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

/*
 * The composed file is pasted straight into `content/`, so anything somebody
 * can type has to survive the trip. A colon stops the file parsing; a leading
 * '#' is worse, because it parses and the value silently becomes null.
 */
test("a title survives whatever somebody types, and an unnamed one is rejected by name", () => {
  const source = {
    run,
    finding: finding({ suggestedTargets: [{ id: "matching", title: "Matching", href: "/stages/matching", kind: "stage" }] }),
  };
  const frontmatter = (title: string) => yaml.load(composeProblem([source], title)!.body.split("---")[1]) as Record<string, unknown>;

  for (const title of ["Matching: nobody owns the wait", "#1 problem", 'It costs us "a lot"', "Nobody owns the wait"]) {
    assert.equal(problemSchema.parse(frontmatter(title)).title, title);
  }

  // An empty draft must fail loudly. A plausible placeholder would pass, and
  // filler in the model is the one thing nothing here may produce.
  const unnamed = problemSchema.safeParse(frontmatter(""));
  assert.equal(unnamed.success, false);
  assert.deepEqual(unnamed.error?.issues[0].path, ["title"]);
});

// The review page collects an edited recommendation in a textarea, so a second
// line is a normal thing to type. Indenting only the first broke the file.
test("a claim statement survives a line break and a colon", () => {
  const compose = (statement: string) =>
    yaml.load(
      applySteps(
        run,
        finding({
          statement,
          proposedClaim: { id: "claim-x", statement },
          suggestedTargets: [{ id: "matching", title: "Matching", href: "/stages/matching", kind: "stage" }],
        }),
        choice,
      )[0].body.split("---")[1],
    ) as Record<string, unknown>;

  assert.match(String(compose("Line one\nline two").statement), /Line one line two/);
  assert.match(String(compose("Two things matter: speed and fit.").statement), /^Two things matter: speed and fit\./);
  assert.ok(claimSchema.safeParse(compose("Line one\nline two")).success);
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

// docs/prototype-workflow.md: "If no decision changes, there is no reason to
// build it yet." Asked once something is being built, and never before.
test("a bet being built without an experiment shape is asked what it would settle", () => {
  const gaps = ["Learning decision", "Scope", "Assumptions"];
  const built = graphOf(
    [node("bet:a-bet", "bet", { experimentGaps: gaps }), node("prototype:a-bet", "prototype")],
    [["bet:a-bet", "prototype:a-bet", "prototype"]],
  );
  const [end] = openEnds(built, built.nodes[0]).filter((e) => e.kind === "unshaped");
  assert.match(end.invitation, /learning decision, scope and 1 other have not been written down/);

  // One missing section reads as itself, not as a list of one.
  const nearly = graphOf(
    [node("bet:b-bet", "bet", { experimentGaps: ["Fidelity"] }), node("prototype:b-bet", "prototype")],
    [["bet:b-bet", "prototype:b-bet", "prototype"]],
  );
  assert.match(openEnds(nearly, nearly.nodes[0])[0].invitation, /its fidelity has not been written down/);

  // A bet nobody is prototyping is allowed to be an idea.
  const unbuilt = graphOf([node("bet:c-bet", "bet", { experimentGaps: gaps })], []);
  assert.equal(openEnds(unbuilt, unbuilt.nodes[0]).filter((e) => e.kind === "unshaped").length, 0);

  // And one that has written it down is not nagged.
  const shaped = graphOf(
    [node("bet:d-bet", "bet", { experimentGaps: [] }), node("prototype:d-bet", "prototype")],
    [["bet:d-bet", "prototype:d-bet", "prototype"]],
  );
  assert.equal(openEnds(shaped, shaped.nodes[0]).filter((e) => e.kind === "unshaped").length, 0);
});

test("a well-described record with nothing loose says nothing", () => {
  const stage = node("stage:tidy", "stage");
  assert.deepEqual(openEnds(graphOf([stage], []), stage), []);
});

// `claim.targets` and `step.claims` are the same link from two sides. The
// projection resolved only one of them, so a step that named a claim showed it
// in a block while the evidence lens drew no line — and the step's open ends
// could not see it was resting on a low-confidence hypothesis.
test("a step that names a claim is connected to it, not just told about it", async () => {
  const { projectModel } = await import("../../lib/model/graph");
  const graph = projectModel();

  const named = graph.nodes.filter((node) => node.kind === "step" && node.contentId === "become-match-ready");
  assert.equal(named.length, 1);

  const evidence = graph.edges.filter((edge) => edge.kind === "evidence" && edge.source === named[0].id);
  assert.ok(
    evidence.some((edge) => edge.target.includes("claim-first-caseload-retention")),
    "the step declares this claim in its frontmatter, so the projection must resolve the edge",
  );
});
