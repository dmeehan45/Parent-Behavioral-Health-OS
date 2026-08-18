import assert from "node:assert/strict";
import test from "node:test";
import { projectModel } from "../../lib/model/graph";
import { hasActiveProjectedFlowLayer } from "../../lib/model/flow-layers";

function stageEdge(source: string, target: string) {
  const graph = projectModel();
  const edge = graph.edges.find(
    (candidate) => candidate.source === `stage:${source}` && candidate.target === `stage:${target}`,
  );
  assert.ok(edge, `expected ${source} -> ${target}`);
  return edge;
}

function connection(source: string, target: string) {
  const edge = stageEdge(source, target);
  assert.ok(edge.connection, `expected ${source} -> ${target} to carry projected connection depth`);
  return edge.connection;
}

test("onboarding to matching carries process, state, and canonical problems", () => {
  const depth = connection("clinician-onboarding", "matching");

  assert.ok(
    depth.processHandoffs.some(
      (handoff) => handoff.sourceId === "step:become-match-ready" && handoff.targetId === "step:propose-match",
    ),
  );
  assert.ok(depth.transfers.some((transfer) => transfer.label === "Clinician: match-ready"));
  assert.ok(depth.problems.some((problem) => problem.id === "problem:activation-without-productivity"));
  assert.ok(depth.problems.some((problem) => problem.id === "problem:clinician-performance-loses-context"));
  assert.ok(depth.gaps.includes("experience"), "the model should say the experience handoff is still unmodelled");
});

test("experience-only isolation keeps boundaries whose experience payload is a known gap", () => {
  const edge = stageEdge("clinician-onboarding", "matching");
  assert.ok(
    hasActiveProjectedFlowLayer(edge, new Set(["experience"])),
    "isolating Experience should reveal the unmodelled experience boundary instead of an empty map",
  );
});

test("a contextual data relationship says when its payload is still unknown", () => {
  const depth = connection("family-demand", "clinician-supply");
  assert.ok(depth.layers.includes("data"));
  assert.ok(depth.gaps.includes("data"));
  assert.equal(depth.transfers.length, 0);
});

test("an authored stage progression with no crossing Step handoff is visible as a gap", () => {
  const depth = connection("practice-operations", "quality-outcomes");
  assert.ok(depth.layers.includes("operating"));
  assert.ok(depth.gaps.includes("operating"));
  assert.equal(depth.processHandoffs.length, 0);
});

test("the direct practice to retention path already present in Steps is projected", () => {
  const depth = connection("practice-operations", "retention-growth");
  assert.ok(
    depth.processHandoffs.some(
      (handoff) =>
        handoff.sourceId === "step:reach-operating-rhythm" && handoff.targetId === "step:reach-sustainable-caseload",
    ),
  );
  assert.ok(depth.transfers.some((transfer) => transfer.label === "Clinician: establishing"));
});

test("an operating return is not misclassified as a learning loop", () => {
  const depth = connection("care-initiation", "matching");
  assert.deepEqual(depth.layers, ["operating"]);
  assert.ok(depth.gaps.includes("operating"));
  assert.ok(depth.gaps.includes("experience"));
  assert.ok(!depth.gaps.includes("learning"));
});

test("quality feedback remains learning and exposes its unspecified payload", () => {
  const depth = connection("quality-outcomes", "matching");
  assert.deepEqual(depth.layers, ["learning"]);
  assert.ok(depth.gaps.includes("learning"));
});
