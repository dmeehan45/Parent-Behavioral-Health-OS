import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import yaml from "js-yaml";
import { handoffHash, handoffSchema } from "../../lib/research/schema";
import { checkHandoffTargets, loadDecisions, loadHandoffs, reviewCoverage, validateDecisions } from "../../lib/research/intake";
import { renderReview } from "../../lib/research/review";

/**
 * The contract for context that changes no claim.
 *
 * Notes exist so volume can arrive at the cost of reading rather than the cost
 * of judging. Two properties make that safe, and they are what this file pins:
 * a note must be anchored to something that will retrieve it later, and a note
 * can never become evidence for what the model claims.
 */

const CONTRACT = "research/contract/v1.example.yaml";
const handoffText = fs.readFileSync(CONTRACT, "utf8");
const example = handoffSchema.parse(yaml.load(handoffText));

function scratch(files: Record<string, string>) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "research-notes-"));
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

/** The shipped example, with its notes list replaced. */
function withNotes(notes: string) {
  return handoffText.replace(/^notes:\n(?:[ ].*\n|#.*\n)*/m, notes ? `notes:\n${notes}` : "");
}

test("the shipped example carries a note, so the contract is demonstrated and not just described", () => {
  assert.equal(example.notes.length, 1);
  assert.ok(example.notes[0].anchors.length >= 1);
});

test("notes are optional — a handoff with none is the normal case", () => {
  const root = scratch({ "research/handoffs/example-public-research.yaml": withNotes("") });
  const [loaded] = loadHandoffs(root);
  assert.deepEqual(loaded.handoff.notes, []);
});

// The bloat defence. Context with nowhere to belong accumulates, nothing
// retrieves it, and nobody can later say what it was for.
test("a note with no anchor cannot be written down at all", () => {
  const root = scratch({
    "research/handoffs/example-public-research.yaml": withNotes(
      "  - id: note-unanchored\n    statement: Something true about nothing in particular.\n    anchors: []\n",
    ),
  });
  assert.match(message(() => loadHandoffs(root)), /anchors/);
});

test("an anchor must resolve to a record or a queued question", () => {
  const anchored = (id: string) =>
    scratch({
      "research/handoffs/example-public-research.yaml": withNotes(
        `  - id: note-anchored\n    statement: Background worth keeping.\n    anchors: [${id}]\n`,
      ),
    });

  // A real stage resolves. So does a queued question, because context gathered
  // for something nobody has answered yet is exactly what notes are for.
  assert.doesNotThrow(() => checkHandoffTargets(loadHandoffs(anchored("clinician-onboarding"))));
  assert.doesNotThrow(() =>
    checkHandoffTargets(loadHandoffs(anchored("define-matching-quality")), new Set(["define-matching-quality"])),
  );

  const reported = message(() => checkHandoffTargets(loadHandoffs(anchored("no-such-thing")), new Set()));
  assert.match(reported, /notes\.note-anchored\.anchors/);
  assert.match(reported, /context for something/);
});

// The evidence boundary. A note carries no decision, so it cannot authorize a
// canonical change — and the error has to say why, because citing one is the
// mistake most likely to look reasonable.
test("researchTrace cannot cite a note, and the refusal explains itself", async () => {
  const { getRepository } = await import("../../lib/content/repository");
  const repo = getRepository();
  const traced = [...repo.stages, ...repo.steps, ...repo.metrics].filter((record) => record.researchTrace?.length);
  assert.ok(traced.length > 0, "the repository should have at least one traced record to reason about");

  // Every citation in the repository resolves to a finding, never to a note.
  const handoffs = loadHandoffs();
  for (const record of traced) {
    for (const trace of record.researchTrace ?? []) {
      const handoff = handoffs.find(({ handoff: file }) => file.run.id === trace.run);
      assert.ok(handoff, `${record.id} cites run ${trace.run}`);
      assert.ok(
        handoff.handoff.findings.some((finding) => finding.id === trace.finding),
        `${record.id} cites ${trace.finding}, which must be a finding`,
      );
      assert.ok(
        !handoff.handoff.notes.some((note) => note.id === trace.finding),
        `${record.id} cites ${trace.finding}, which must not be a note`,
      );
    }
  }
});

test("notes are dispositioned as a set, and except flips individuals either way", () => {
  const twoNotes = withNotes(
    "  - id: note-one\n    statement: First piece of background.\n    anchors: [clinician-onboarding]\n" +
      "  - id: note-two\n    statement: Second piece of background.\n    anchors: [clinician-onboarding]\n",
  );
  const hash = handoffHash(handoffSchema.parse(yaml.load(twoNotes)));
  const decision = (notes: string) =>
    scratch({
      "research/handoffs/example-public-research.yaml": twoNotes,
      "research/decisions/example-public-research.yaml":
        `contractVersion: 1\nrunId: example-public-research\nreviewedHandoffHash: ${hash}\n` +
        `reviewer: A Named Person\ndecisions: []\n${notes}`,
    });

  const kept = decision("notes:\n  disposition: noted\n");
  assert.doesNotThrow(() => validateDecisions(loadHandoffs(kept), loadDecisions(kept)));

  const mostly = decision("notes:\n  disposition: noted\n  except: [note-two]\n");
  assert.doesNotThrow(() => validateDecisions(loadHandoffs(mostly), loadDecisions(mostly)));

  // Naming a finding under `notes.except` would quietly do nothing, so it is an
  // error that says where a finding's disposition actually goes.
  const confused = decision("notes:\n  disposition: noted\n  except: [finding-review-first]\n");
  const reported = message(() => validateDecisions(loadHandoffs(confused), loadDecisions(confused)));
  assert.match(reported, /is a finding/);
});

// Review debt is counted per run for notes and per finding for findings. One
// line disposes of a hundred notes, so counting them individually would report
// one decision as a hundred pieces of work.
test("notes are counted as runs of context, not as individual debt", () => {
  const many = withNotes(
    "  - id: note-a\n    statement: A.\n    anchors: [clinician-onboarding]\n" +
      "  - id: note-b\n    statement: B.\n    anchors: [clinician-onboarding]\n" +
      "  - id: note-c\n    statement: C.\n    anchors: [clinician-onboarding]\n",
  );
  const root = scratch({ "research/handoffs/example-public-research.yaml": many });
  const coverage = reviewCoverage(loadHandoffs(root), loadDecisions(root));
  assert.equal(coverage.notes, 3);
  assert.equal(coverage.runsWithNotes, 1);
  assert.deepEqual(coverage.unnotedRuns, ["example-public-research"]);
});

/**
 * The regression that adding notes exposed, and the one most likely to recur.
 *
 * The handoff hash is a reviewer's guarantee that nothing moved after they
 * looked. Hashing the parsed object made it a guarantee about the *schema* too:
 * one new optional field re-hashed every handoff ever written, and a decision a
 * person had made weeks earlier stopped authorizing anything. The next optional
 * field would have done it again.
 */
test("a new optional field does not invalidate a review that already happened", () => {
  const withoutNotes = handoffSchema.parse(yaml.load(withNotes("")));
  const asItWasBeforeNotesExisted = handoffSchema.parse(yaml.load(withNotes("")));
  delete (asItWasBeforeNotesExisted as { notes?: unknown }).notes;

  assert.equal(
    handoffHash(withoutNotes),
    handoffHash(asItWasBeforeNotesExisted as typeof withoutNotes),
    "a field nobody used must hash exactly as it did before it existed",
  );

  // And the real one: the decision recorded against the first real run still
  // matches its handoff. If this fails, someone changed the hash recipe and
  // silently asked a person to re-assert a review they already gave.
  const runId = "2026-08-14-what-makes-clinician-onboarding-high-quality";
  const handoff = loadHandoffs().find(({ handoff: file }) => file.run.id === runId);
  const decision = loadDecisions().find(({ decisions }) => decisions.runId === runId);
  assert.ok(handoff && decision, "the first real run and its decision should both be in the repository");
  assert.equal(decision.decisions.reviewedHandoffHash, handoff.hash);
});

test("the packet reads notes as a set and asks for one line back", () => {
  const packet = renderReview({ handoff: example, file: CONTRACT, hash: handoffHash(example) });
  assert.match(packet, /## Context notes/);
  assert.match(packet, /cannot be cited by `researchTrace`/);
  assert.match(packet, /disposition: TODO noted \| discard/);
});
