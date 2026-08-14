import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import yaml from "js-yaml";
import { handoffSchema } from "../../lib/research/schema";
import { decisionId, handoffHash } from "../../lib/research/intake";
import { renderReview } from "../../lib/research/review";

const example = handoffSchema.parse(yaml.load(fs.readFileSync("research/contract/v1.example.yaml", "utf8")));

test("the versioned example satisfies the handoff contract", () => {
  assert.equal(example.contractVersion, 1);
  assert.match(handoffHash(example), /^[a-f0-9]{64}$/);
});

test("unsafe declarations and older versions are rejected", () => {
  assert.equal(handoffSchema.safeParse({ ...example, contractVersion: 0 }).success, false);
  assert.equal(handoffSchema.safeParse({ ...example, run: { ...example.run, safety: { ...example.run.safety, containsSensitiveData: true } } }).success, false);
});

test("source locators are structured and required", () => {
  assert.equal(handoffSchema.safeParse({ ...example, sources: [{ ...example.sources[0], locator: {} }] }).success, false);
});

test("review output and decision IDs are deterministic", () => {
  const loaded = { handoff: example, file: "example", hash: handoffHash(example) };
  assert.equal(renderReview(loaded), renderReview(loaded));
  assert.equal(decisionId(example.run.id, example.findings[0].id), "decide-example-public-research-finding-review-first");
});
