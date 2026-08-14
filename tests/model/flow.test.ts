import assert from "node:assert/strict";
import test from "node:test";
import { checkFlowContinuity } from "../../lib/content/flow";
import { getRepository } from "../../lib/content/repository";
import { projectModel } from "../../lib/model/graph";
import { openEnds } from "../../lib/model/open-ends";

function step(id: string, overrides: Record<string, unknown> = {}) {
  return { id, file: `content/steps/${id}.md`, ...overrides };
}

// The failure this check exists for. Splitting a step into finer ones is a
// normal improvement; dropping the `next` that carried the flow past it is the
// silent half, and the entity states go on describing a handoff nothing walks.
test("a handoff the states assert and no `next` carries is refused", () => {
  assert.throws(
    () =>
      checkFlowContinuity([
        step("become-match-ready", { outputs: [{ entity: "clinician", state: "match-ready" }] }),
        step("propose-match", { inputs: [{ entity: "clinician", state: "match-ready" }] }),
      ]),
    /Broken flow: 1 input[\s\S]*propose-match\.md[\s\S]*become-match-ready\.md/,
  );
});

// A missing link normally strands several handoffs at once. Reporting only the
// first would name whichever sorted highest, and an author who added that link
// would have built a shortcut past the steps in between.
test("every stranded handoff is reported, not just the first", () => {
  assert.throws(
    () =>
      checkFlowContinuity([
        step("become-match-ready", {
          outputs: [
            { entity: "clinician", state: "match-ready" },
            { entity: "caseload", state: "open" },
          ],
        }),
        step("propose-match", { inputs: [{ entity: "clinician", state: "match-ready" }] }),
        step("reach-sustainable-caseload", { inputs: [{ entity: "caseload", state: "open" }] }),
      ]),
    (error: Error) =>
      /Broken flow: 2 inputs/.test(error.message) &&
      error.message.includes("propose-match.md") &&
      error.message.includes("reach-sustainable-caseload.md"),
  );
});

test("the link may be indirect — continuity is a path, not an adjacency", () => {
  assert.doesNotThrow(() =>
    checkFlowContinuity([
      step("select-clinician", { next: ["selection-complete"], outputs: [{ entity: "clinician", state: "selected" }] }),
      step("selection-complete", { next: ["credential-verify"] }),
      step("credential-verify", { inputs: [{ entity: "clinician", state: "selected" }] }),
    ]),
  );
});

// The rule must never become a completeness rule. Both of these are the model
// being honestly unfinished, and inventing content to satisfy a checker is the
// one thing this repository asks nobody to do.
test("incompleteness stays valid", () => {
  assert.doesNotThrow(
    () => checkFlowContinuity([step("reach-sustainable-caseload", { outputs: [{ entity: "clinician", state: "sustaining" }] })]),
    "a terminal step produces something nothing consumes",
  );
  assert.doesNotThrow(
    () => checkFlowContinuity([step("propose-match", { inputs: [{ entity: "family", state: "match-ready" }] })]),
    "a step needs a state no step produces yet",
  );
});

// The flow will not stay linear. Once two paths both carry an accepted Match to
// their own next Step, asking every producer to reach every consumer refuses a
// correct model for handoffs nobody wrote down — and because this runs inside
// `getRepository()`, that refusal would take the live map down rather than fail
// a script. One supplier is enough.
test("branches that share a state are not treated as all-to-all handoffs", () => {
  assert.doesNotThrow(() =>
    checkFlowContinuity([
      step("first-match", { next: ["plan-first-encounter"], outputs: [{ entity: "match", state: "accepted" }] }),
      step("rematch", { next: ["plan-rematched-encounter"], outputs: [{ entity: "match", state: "accepted" }] }),
      step("plan-first-encounter", { inputs: [{ entity: "match", state: "accepted" }] }),
      step("plan-rematched-encounter", { inputs: [{ entity: "match", state: "accepted" }] }),
    ]),
  );
});

test("a consumer no producer of its input reaches is still refused", () => {
  assert.throws(
    () =>
      checkFlowContinuity([
        step("first-match", { next: ["plan-first-encounter"], outputs: [{ entity: "match", state: "accepted" }] }),
        step("rematch", { outputs: [{ entity: "match", state: "accepted" }] }),
        step("plan-first-encounter", { inputs: [{ entity: "match", state: "accepted" }] }),
        step("stranded", { inputs: [{ entity: "match", state: "accepted" }] }),
      ]),
    /Broken flow: 1 input[\s\S]*stranded\.md/,
  );
});

// A step that confirms a state rather than changing it carries the same state
// in and out. Letting its own output answer its own input would hide the gap on
// exactly the steps whose input is most obviously somebody else's work.
test("a step's own output does not supply its own input", () => {
  assert.doesNotThrow(
    () =>
      checkFlowContinuity([
        step("selection-complete", {
          inputs: [{ entity: "clinician", state: "selected" }],
          outputs: [{ entity: "clinician", state: "selected" }],
        }),
      ]),
    "nobody else produces it, so this is unmodelled work rather than a break",
  );

  assert.throws(
    () =>
      checkFlowContinuity([
        step("select-clinician", { outputs: [{ entity: "clinician", state: "selected" }] }),
        step("selection-complete", {
          inputs: [{ entity: "clinician", state: "selected" }],
          outputs: [{ entity: "clinician", state: "selected" }],
        }),
      ]),
    /selection-complete\.md/,
  );
});

test("a cycle does not hang the reachability walk", () => {
  assert.doesNotThrow(() =>
    checkFlowContinuity([
      step("a", { next: ["b"], outputs: [{ entity: "match", state: "proposed" }] }),
      step("b", { next: ["a"], inputs: [{ entity: "match", state: "proposed" }] }),
    ]),
  );
});

test("the model's own flow carries every handoff it claims", () => {
  const { steps } = getRepository();
  assert.doesNotThrow(() => checkFlowContinuity(steps));
  assert.ok(steps.length > 10, `only ${steps.length} steps, so the check is close to vacuous`);
});

// The other half of the same idea: what validation deliberately allows, the
// interface has to say out loud, or an unmodelled part of the system is
// indistinguishable from a finished one.
test("a state nothing produces is offered to the reader as an open end", () => {
  const graph = projectModel();
  const proposeMatch = graph.nodes.find((node) => node.id === "step:propose-match");
  assert.ok(proposeMatch, "expected the matching step to be projected");

  const unsupplied = openEnds(graph, proposeMatch).filter((end) => end.kind === "unsupplied");
  assert.equal(unsupplied.length, 1);
  assert.match(unsupplied[0].invitation, /Family in match-ready/);
});
