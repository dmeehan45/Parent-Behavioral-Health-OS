import assert from "node:assert/strict";
import test from "node:test";
import { projectModel } from "../../lib/model/graph";

/**
 * Exception routes are the model's rework loops, and for a while they were
 * invisible: authored in `exceptions.route`, checked by nothing, drawn
 * nowhere. These read the live model the way `connection-depth.test.ts` does,
 * against routes the matching flow has carried since it was written.
 */

test("an exception route becomes a return edge, apart from the sequence", () => {
  const graph = projectModel();
  const returned = graph.edges.filter((edge) => edge.kind === "return");

  // The declined/expired paths back into matching. Both authored long before
  // the edge existed, which is the point: content needed no change.
  assert.ok(returned.some((edge) => edge.source === "step:review-match" && edge.target === "step:propose-match"));
  assert.ok(
    returned.some((edge) => edge.source === "step:confirm-care-continuation" && edge.target === "step:propose-match"),
  );

  // Never the forward kind: interior ranking reads `process` edges only, and a
  // loop ranked forward would scramble the sequence it loops over.
  assert.ok(
    !graph.edges.some(
      (edge) => edge.kind === "process" && edge.source === "step:review-match" && edge.target === "step:propose-match",
    ),
  );

  for (const edge of returned) assert.deepEqual(edge.lenses, ["flow"]);
});

test("a step may route back to itself, and the edge says so", () => {
  // propose-match expires a proposal and proposes again. A self-loop is a real
  // statement — this step re-runs — and skipping it would leave the authored
  // reference with no edge, which validate:projection refuses.
  const graph = projectModel();
  assert.ok(
    graph.edges.some(
      (edge) => edge.kind === "return" && edge.source === "step:propose-match" && edge.target === "step:propose-match",
    ),
  );
});
