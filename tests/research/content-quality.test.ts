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
      record({ file: "content/metrics/example.md", dataStatus: "partially-available", researchTrace: [{}] }),
    ]),
  );
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
