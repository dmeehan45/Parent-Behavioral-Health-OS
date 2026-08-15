import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import yaml from "js-yaml";
import { handoffHash, handoffSchema } from "../../lib/research/schema";
import { checkHandoffTargets, checkReflections, decisionId, loadHandoffs, reviewCoverage, loadDecisions } from "../../lib/research/intake";
import { renderReview } from "../../lib/research/review";
import { composeCandidate } from "../../lib/research/apply";

/**
 * The door for large structured thinking.
 *
 * A reflection is the conversational agent's analysis of the model or of
 * earlier runs. What makes it safe is the same thing that makes every other
 * intake safe: it proposes, a person decides, and the one thing it may never do
 * is name what it proposes.
 */

const CONTRACT = "research/contract/v1.example.yaml";
const handoffText = fs.readFileSync(CONTRACT, "utf8");
const example = handoffSchema.parse(yaml.load(handoffText));

function scratch(files: Record<string, string>) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "research-reflection-"));
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

const CANDIDATE = {
  id: "candidate-readiness-is-presence",
  kind: "problem" as const,
  description:
    "A clinician can be declared match-ready because fields are present, while uncertainty, stale capacity, misunderstanding, or support needs remain invisible.",
  targets: ["clinician-onboarding", "become-match-ready"],
  restsOn: [],
  rationale: "Directly precedes the current prototype focus and can be tested without claiming clinical competence.",
  wouldWeakenIf: "Observed onboarding shows presence checks closely precede first use and readiness defects are rare.",
};

/** A handoff with a candidates block spliced in above `questions:`. */
function withCandidates(body: string) {
  return handoffText.replace(/^questions:/m, `${body}questions:`);
}

/** A handoff with extra fields spliced into its `run:` block. */
function withRunFields(fields: string) {
  return handoffText.replace(/^  safety:$/m, `${fields}  safety:`);
}

test("a run is research unless it says otherwise, and that costs no hash", () => {
  assert.equal(example.run.kind, undefined);
  const asReflection = handoffSchema.parse({ ...yaml.load(handoffText) as object, run: { ...example.run, kind: "reflection" } });
  assert.notEqual(handoffHash(asReflection), handoffHash(example), "declaring a kind is a real change to what the run says");
});

test("candidates carry everything except the name", () => {
  const parsed = handoffSchema.parse(
    yaml.load(
      withCandidates(
        "candidates:\n" +
          `  - id: ${CANDIDATE.id}\n` +
          `    kind: problem\n` +
          `    description: ${JSON.stringify(CANDIDATE.description)}\n` +
          `    targets: [clinician-onboarding, become-match-ready]\n`,
      ),
    ),
  );
  const [candidate] = parsed.candidates;
  assert.equal(candidate.kind, "problem");
  assert.deepEqual(candidate.targets, ["clinician-onboarding", "become-match-ready"]);
  assert.ok(!("title" in candidate));
});

// The rule a Problem file already lives under, applied one step earlier.
test("a candidate problem has to say where it bites", () => {
  const root = scratch({
    "research/handoffs/example-public-research.yaml": withCandidates(
      "candidates:\n  - id: candidate-nowhere\n    kind: problem\n    description: Something is wrong somewhere in the system, broadly speaking.\n",
    ),
  });
  assert.match(message(() => loadHandoffs(root)), /where it bites/);
});

// The naming rule, enforced rather than described. A proposal arriving
// pre-named is how a fix gets recorded as a problem.
test("a candidate that names itself is rejected", () => {
  const root = scratch({
    "research/handoffs/example-public-research.yaml": withCandidates(
      "candidates:\n  - id: candidate-named\n    kind: problem\n    description: A clinician can finish onboarding and still have no work assigned to them.\n    targets: [clinician-onboarding]\n    title: Activation without productivity\n",
    ),
  });
  assert.match(message(() => loadHandoffs(root)), /carries no title|Unrecognized|title/);
});

test("a reflection's prior runs have to exist, and it cannot reflect on itself", () => {
  const reflecting = (on: string) =>
    scratch({
      "research/handoffs/example-public-research.yaml": withRunFields(`  kind: reflection\n  reflectsOn: [${on}]\n`),
    });

  assert.match(message(() => checkReflections(loadHandoffs(reflecting("no-such-run")))), /is not a run/);
  assert.match(message(() => checkReflections(loadHandoffs(reflecting("example-public-research")))), /cannot reflect on itself/);
});

test("reflectsOn without declaring the kind is refused, so the two cannot disagree", () => {
  const root = scratch({
    "research/handoffs/example-public-research.yaml": withRunFields("  reflectsOn: [something]\n"),
  });
  assert.match(message(() => loadHandoffs(root)), /set run\.kind: reflection/);
});

test("candidates are decided one at a time, and count as review debt", () => {
  const two =
    "candidates:\n" +
    `  - id: candidate-one\n    kind: problem\n    description: ${JSON.stringify(CANDIDATE.description)}\n    targets: [clinician-onboarding]\n` +
    `  - id: candidate-two\n    kind: question\n    description: ${JSON.stringify(CANDIDATE.description)}\n`;
  const root = scratch({ "research/handoffs/example-public-research.yaml": withCandidates(two) });

  assert.doesNotThrow(() => checkHandoffTargets(loadHandoffs(root)));
  const coverage = reviewCoverage(loadHandoffs(root), loadDecisions(root));
  // One finding plus two candidates: a reflection carrying eight undecided
  // candidates is eight pieces of work, not "reviewed" because it had no
  // findings.
  assert.equal(coverage.findings, 3);
  assert.ok(coverage.undecided.includes(decisionId("example-public-research", "candidate-one")));
});

test("composing an accepted candidate carries the references and leaves the name empty", () => {
  const step = composeCandidate({ id: "run-id" }, CANDIDATE, { id: "decide-run-id-candidate-readiness-is-presence" });

  assert.equal(step.action, "create");
  assert.match(step.body, /targets: \[clinician-onboarding, become-match-ready\]/);
  assert.match(step.body, /researchTrace:/);
  // The whole discipline in one assertion: everything is carried, and the title
  // is a blank with an instruction rather than a plausible sentence.
  assert.match(step.body, /title: # write the trouble here/);
  // No actual title value — a comment after the key is the blank, and anything
  // that is not a comment would be a name the analysis wrote.
  assert.ok(!/^title: [^#\s]/m.test(step.body));
  // The proposer's words are present, as a comment — available to whoever names
  // it, but not written into the model as its own account of itself.
  assert.match(step.body, /# A clinician can be declared match-ready/);

  const named = composeCandidate({ id: "run-id" }, CANDIDATE, { id: "decide-x" }, "Readiness is a presence check");
  assert.match(named.body, /^title: "?Readiness is a presence check"?$/m);
  assert.equal(named.path, "content/problems/readiness-is-a-presence-check.md");
});

test("a candidate question composes a queued question, not a Problem", () => {
  const step = composeCandidate({ id: "run-id" }, { ...CANDIDATE, kind: "question" }, { id: "decide-x" });
  assert.match(step.path, /^research\/questions\//);
  assert.match(step.body, /^status: open$/m);
  assert.match(step.body, /question: # the question/);
});

/**
 * The bug the first real reflection found.
 *
 * `findings` was `.min(1)`, so a run that proposes rather than establishes
 * could not be written down at all — and the first reflection, eight candidate
 * Problems carried out of a review document, had no findings by its nature.
 * A run still has to produce something; candidates count.
 */
test("a reflection may carry candidates and no findings", () => {
  const parsed = handoffSchema.safeParse({
    ...(yaml.load(handoffText) as { findings: unknown[] }),
    findings: [],
    candidates: [CANDIDATE],
  });
  assert.equal(parsed.success, true, parsed.success ? "" : JSON.stringify(parsed.error.issues));
});

test("a run that establishes nothing and proposes nothing is refused", () => {
  const parsed = handoffSchema.safeParse({ ...(yaml.load(handoffText) as object), findings: [], candidates: [] });
  assert.equal(parsed.success, false);
  assert.match(JSON.stringify(parsed.success ? [] : parsed.error.issues), /at least one finding or candidate/);
});

// A candidate problem composes into a Problem, whose targets may only be
// Stages and Steps. Catching it at intake means a reviewer never accepts
// something that cannot then be written.
test("a candidate problem can only bite a Stage or a Step", () => {
  const targeting = (id: string) =>
    scratch({
      "research/handoffs/example-public-research.yaml": withCandidates(
        `candidates:\n  - id: candidate-mistargeted\n    kind: problem\n    description: ${JSON.stringify(CANDIDATE.description)}\n    targets: [${id}]\n`,
      ),
    });

  assert.doesNotThrow(() => checkHandoffTargets(loadHandoffs(targeting("become-match-ready"))));
  const reported = message(() => checkHandoffTargets(loadHandoffs(targeting("time-to-first-match"))));
  assert.match(reported, /not a Stage or Step/);
});

// `restsOn` composes into a Problem's `claims`, so anything else would produce
// a file that fails content validation after the reviewer had already accepted.
test("what a candidate rests on has to be a Claim", () => {
  const root = scratch({
    "research/handoffs/example-public-research.yaml": withCandidates(
      `candidates:\n  - id: candidate-rests\n    kind: problem\n    description: ${JSON.stringify(CANDIDATE.description)}\n    targets: [clinician-onboarding]\n    restsOn: [time-to-first-match]\n`,
    ),
  });
  assert.match(message(() => checkHandoffTargets(loadHandoffs(root))), /restsOn.*content\/claims/);
});

test("the packet reads a reflection as one, and asks for a decision per candidate", () => {
  const handoff = handoffSchema.parse({
    ...(yaml.load(handoffText) as object),
    run: { ...example.run, kind: "reflection", reflectsOn: ["example-public-research"] },
    candidates: [CANDIDATE],
  });
  const packet = renderReview({ handoff, file: CONTRACT, hash: handoffHash(handoff) });

  assert.match(packet, /\*\*A reflection\*\*/);
  assert.match(packet, /## Proposed for the model/);
  assert.match(packet, /Would weaken if/);
  assert.match(packet, new RegExp(`id: ${decisionId(handoff.run.id, CANDIDATE.id)}`));
});
