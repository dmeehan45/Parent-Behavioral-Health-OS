import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import yaml from "js-yaml";
import { handoffHash, handoffSchema } from "../../lib/research/schema";
import { decisionId, loadDecisions, loadHandoffs, reviewCoverage, validateDecisions } from "../../lib/research/intake";
import { checkCommittedPackets, packetIsCurrent, renderReview, writeReviews } from "../../lib/research/review";

const CONTRACT = "research/contract/v1.example.yaml";
const SHIPPED = "research/handoffs/example-public-research.yaml";

const example = handoffSchema.parse(yaml.load(fs.readFileSync(CONTRACT, "utf8")));
const loaded = { handoff: example, file: CONTRACT, hash: handoffHash(example) };

/** A throwaway repository root, so a test can write handoffs and decisions. */
function scratch(files: Record<string, string>) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "research-intake-"));
  for (const [name, contents] of Object.entries(files)) {
    fs.mkdirSync(path.join(root, path.dirname(name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), contents);
  }
  return root;
}

function message(action: () => void) {
  try {
    action();
    return "";
  } catch (error) {
    return (error as Error).message;
  }
}

const handoffText = fs.readFileSync(CONTRACT, "utf8");

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
  assert.equal(renderReview(loaded), renderReview(loaded));
  assert.equal(decisionId(example.run.id, example.findings[0].id), "decide-example-public-research-finding-review-first");
});

// The contract example and the shipped example handoff are byte-identical
// copies of the same run. Nothing else would notice one of them being edited,
// and a drifted contract example is what an agent would then be asked to copy.
test("the contract example and the shipped handoff describe the same run", () => {
  const shipped = handoffSchema.parse(yaml.load(fs.readFileSync(SHIPPED, "utf8")));
  assert.equal(handoffHash(shipped), handoffHash(example));
});

// A reviewer records decisions in this directory. It has to exist in a fresh
// checkout: `getRepository()` reads it whenever a canonical record carries a
// `researchTrace`, and that read happens inside the live map's projection.
test("the decisions directory is present in a fresh checkout", () => {
  assert.equal(fs.existsSync("research/decisions"), true);
});

test("missing research directories are not an error", () => {
  const root = scratch({ "README.md": "empty repository\n" });
  assert.deepEqual(loadHandoffs(root), []);
  assert.deepEqual(loadDecisions(root), []);
});

test("a YAML syntax error names the file it is in", () => {
  const root = scratch({ "research/handoffs/broken.yaml": "contractVersion: 1\nrun: [unclosed\n" });
  assert.match(message(() => loadHandoffs(root)), /research\/handoffs\/broken\.yaml: not valid YAML/);
});

test("a handoff file name has to match its run ID", () => {
  const root = scratch({ "research/handoffs/2026-08-14-notes.yaml": handoffText });
  assert.match(message(() => loadHandoffs(root)), /does not match the file name/);
});

test("a decision error names the file on disk, not the file it should have been", () => {
  const root = scratch({
    "research/handoffs/example-public-research.yaml": handoffText,
    "research/decisions/review-notes.yaml": `contractVersion: 1\nrunId: example-public-research\nreviewedHandoffHash: ${"a".repeat(64)}\nreviewer: someone\ndecisions: []\n`,
  });
  assert.match(message(() => loadDecisions(root)), /research\/decisions\/review-notes\.yaml/);
});

test("a decision over an older handoff is reported against the decision file", () => {
  const root = scratch({
    "research/handoffs/example-public-research.yaml": handoffText,
    "research/decisions/example-public-research.yaml": `contractVersion: 1\nrunId: example-public-research\nreviewedHandoffHash: ${"a".repeat(64)}\nreviewer: someone\ndecisions: []\n`,
  });
  const reported = message(() => validateDecisions(loadHandoffs(root), loadDecisions(root)));
  assert.match(reported, /research\/decisions\/example-public-research\.yaml/);
  assert.match(reported, /reviewedHandoffHash is stale/);
});

test("undecided findings are reported rather than failing", () => {
  const root = scratch({ "research/handoffs/example-public-research.yaml": handoffText });
  const coverage = reviewCoverage(loadHandoffs(root), loadDecisions(root));
  assert.equal(coverage.findings, 1);
  assert.equal(coverage.decided, 0);
  assert.deepEqual(coverage.undecided, ["decide-example-public-research-finding-review-first"]);
});

// The packet is generated and compared against on every run. Byte equality
// would turn an editor configured to insert a final newline — or a Windows
// checkout — into a CI failure for a file nobody meant to change.
test("a packet survives an editor adding a trailing newline", () => {
  const packet = renderReview(loaded);
  assert.ok(packet.endsWith("\n"));
  assert.equal(packetIsCurrent(`${packet}\n`, packet), true);
  assert.equal(packetIsCurrent(packet.replace(/\n/g, "\r\n"), packet), true);
  assert.equal(packetIsCurrent(packet.replace("## Synthesis", "## Summary"), packet), false);
});

// The packet carries the decision skeleton so the reviewer never has to
// assemble YAML around a 64-character hash by hand.
test("a packet carries a decision skeleton that fails validation until it is answered", () => {
  const packet = renderReview(loaded);
  assert.match(packet, new RegExp(`reviewedHandoffHash: ${loaded.hash}`));
  assert.match(packet, /disposition: TODO accept \| reject \| defer \| needs-research \| accept-with-edits/);

  const root = scratch({
    "research/handoffs/example-public-research.yaml": handoffText,
    "research/decisions/example-public-research.yaml": packet.split("```yaml")[1].split("```")[0],
  });
  assert.match(message(() => loadDecisions(root)), /reviewer|disposition/);
});

// Two lanes produce a decision file: /review, and a person deciding in the
// conversation with the agent recording it. The guarantees live in the file, so
// both must validate identically — a lane that were privileged here would make
// the cheap one second-class, which is the whole thing this is not.
test("a decision validates from either lane, and neither is required", () => {
  const decision = (via: string) =>
    [
      "contractVersion: 1",
      "runId: example-public-research",
      `reviewedHandoffHash: ${loaded.hash}`,
      "reviewer: A Named Person",
      "decidedAt: 2026-08-14",
      via,
      "decisions:",
      `  - id: ${decisionId(example.run.id, example.findings[0].id)}`,
      "    disposition: accept",
      "",
    ].join("\n");

  for (const via of ["decidedVia: review", "decidedVia: conversation", "# lane not recorded"]) {
    const root = scratch({
      "research/handoffs/example-public-research.yaml": handoffText,
      "research/decisions/example-public-research.yaml": decision(via),
    });
    const [loadedDecision] = loadDecisions(root);
    assert.equal(loadedDecision.decisions.decisions[0].disposition, "accept", via);
    assert.doesNotThrow(() => validateDecisions(loadHandoffs(root), loadDecisions(root)), via);
  }

  // A lane nobody defined is a typo, not a third way of deciding.
  const bogus = scratch({
    "research/handoffs/example-public-research.yaml": handoffText,
    "research/decisions/example-public-research.yaml": decision("decidedVia: slack"),
  });
  assert.notEqual(message(() => loadDecisions(bogus)), "");
});

// The bug this pins: intake required the generated packet to be committed, and
// the actor intake is written for cannot run a generator. Every pull request a
// GitHub connector opened failed on a file it had no way to produce. A handoff
// arriving alone is the normal case, not an incomplete one.
test("a handoff with no committed packet validates", () => {
  const root = scratch({ "research/handoffs/example-public-research.yaml": handoffText });
  assert.equal(fs.existsSync(path.join(root, "research/reviews")), false);
  assert.doesNotThrow(() => checkCommittedPackets(loadHandoffs(root), root));
});

// The other half of the same rule: nothing requires a packet, but a packet that
// is there carries the hash a reviewer copies, so it must still be true.
test("a committed packet that no longer matches its handoff is an error", () => {
  const current = scratch({
    "research/handoffs/example-public-research.yaml": handoffText,
    "research/reviews/example-public-research.md": renderReview(loaded),
  });
  assert.doesNotThrow(() => checkCommittedPackets(loadHandoffs(current), current));

  const drifted = scratch({
    "research/handoffs/example-public-research.yaml": handoffText,
    "research/reviews/example-public-research.md": renderReview(loaded).replace("## Synthesis", "## Summary"),
  });
  const reported = message(() => checkCommittedPackets(loadHandoffs(drifted), drifted));
  assert.match(reported, /research\/reviews\/example-public-research\.md: stale/);
  assert.match(reported, /delete the packet/);
});

test("regenerating packets removes stale ones and keeps anything hand-written", () => {
  const root = scratch({
    "research/reviews/README.md": "# How to read a review packet\n",
    "research/reviews/retired-run.md": renderReview({ ...loaded, hash: "stale" }),
  });
  const result = writeReviews([loaded], root);
  assert.deepEqual(result.written, ["example-public-research.md"]);
  assert.deepEqual(result.removed, ["retired-run.md"]);
  assert.equal(fs.existsSync(path.join(root, "research/reviews/README.md")), true);
});
