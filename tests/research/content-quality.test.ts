import assert from "node:assert/strict";
import test from "node:test";
import { checkContentQuality } from "../../lib/content/quality";

function record(overrides: Record<string, unknown> = {}) {
  return {
    file: "content/claims/example.md",
    provenance: { source: "author", references: [] },
    ...overrides,
  };
}

test("author hypotheses and unknown data remain valid incomplete knowledge", () => {
  assert.doesNotThrow(() =>
    checkContentQuality([
      record({ kind: "hypothesis", confidence: "low", authority: "proposed" }),
      record({ file: "content/metrics/example.md", dataStatus: "unknown" }),
    ]),
  );
});

test("evidence-bearing labels require recorded evidence", () => {
  for (const candidate of [
    record({ authority: "validated" }),
    record({ kind: "observed", confidence: "low" }),
    record({ confidence: "high" }),
    record({ file: "content/metrics/example.md", dataStatus: "available" }),
  ]) {
    assert.throws(() => checkContentQuality([candidate]), /requires a provenance reference|requires a provenance reference or/);
  }
});

test("a reference or accepted research trace satisfies the objective evidence gate", () => {
  assert.doesNotThrow(() =>
    checkContentQuality([
      record({ authority: "validated", provenance: { source: "public-research", references: ["source-a"] } }),
      record({ kind: "observed", confidence: "high", researchTrace: [{ decision: "accepted" }] }),
      record({
        file: "content/metrics/example.md",
        dataStatus: "partially-available",
        researchTrace: [{}],
        startEvent: "the match is accepted",
        endEvent: "the first encounter completes",
      }),
    ]),
  );
});

/**
 * The contradiction this exists for: `time-to-first-session` said its decision
 * was about the accepted-match-to-encounter transition while its prose described
 * a clock starting at match readiness. Two different measurements, agreeing by
 * coincidence, in two places nothing could compare — because one of them was a
 * sentence.
 *
 * Only checked once a Metric claims data. A measure nobody collects is allowed
 * to be undefined, and most of them here are.
 */
test("a metric claiming data has to say what the number is measured between", () => {
  const claiming = (extra: object) =>
    record({ file: "content/metrics/example.md", dataStatus: "available", researchTrace: [{}], ...extra });

  assert.throws(() => checkContentQuality([claiming({})]), /Undefined measurement/);
  assert.throws(() => checkContentQuality([claiming({ startEvent: "the match is accepted" })]), /Undefined measurement/);
  assert.doesNotThrow(() =>
    checkContentQuality([claiming({ startEvent: "the match is accepted", endEvent: "the first encounter completes" })]),
  );

  // An unmeasured metric stays free to be undefined — that is honest, and it is
  // the state every metric in the repository is currently in.
  assert.doesNotThrow(() => checkContentQuality([record({ file: "content/metrics/example.md", dataStatus: "unknown" })]));
});

test("seed filler cannot masquerade as described step content", () => {
  assert.throws(
    () => checkContentQuality([record({ file: "content/steps/example.md", rules: [] })]),
    /Empty optional field/,
  );
  assert.throws(
    () => checkContentQuality([record({ file: "content/steps/example.md", purpose: "Do the work", activity: "Do the work" })]),
    /Duplicated Step meaning/,
  );
});
