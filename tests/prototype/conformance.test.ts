import assert from "node:assert/strict";
import test from "node:test";
import { getRepository } from "../../lib/content/repository";
import { conformance, conformanceProblem, experimentFingerprint } from "../../lib/prototype/conformance";
import { EXPERIMENT_SECTIONS } from "../../lib/content/body";
import type { Bet } from "../../lib/schemas";

/**
 * Fixtures are built here rather than read from `content/`, so that shaping a
 * bet or stamping a prototype never turns a content edit into a red build.
 */
const base = getRepository().bets[0];

/**
 * Built from `EXPERIMENT_SECTIONS` rather than listed, so splitting or adding a
 * section does not silently turn every shaped fixture here into an unshaped one
 * and take the whole suite red for a reason that has nothing to do with
 * conformance.
 */
const EXPERIMENT: Record<string, string> = Object.fromEntries(
  EXPERIMENT_SECTIONS.map((name) => [name, `Approved text for ${name.toLowerCase()}.`]),
);

/** The section a drift test moves. Any one would do; this names it once. */
const [, MOVED] = EXPERIMENT_SECTIONS;

function bet(sections: Record<string, string>, prototype?: Bet["prototype"]): Bet {
  return { ...base, sections, prototype } as Bet;
}

const built = (extra: Partial<NonNullable<Bet["prototype"]>> = {}) =>
  ({ status: "working", route: "/prototypes/guided-first-caseload", ...extra }) as NonNullable<Bet["prototype"]>;

test("an unshaped bet has nothing to conform to, and is not nagged about it", () => {
  const result = conformance(bet({}, built()));
  assert.equal(result.state, "unshaped");
  assert.equal(result.fingerprint, "");
  assert.equal(conformanceProblem(bet({}, built())), undefined);
});

// Partly shaped is still unshaped: the packet refuses at that stage, and
// stamping half an experiment would attest to something incomplete.
test("a partly shaped experiment does not produce a fingerprint", () => {
  const partial = { ...EXPERIMENT };
  delete partial[EXPERIMENT_SECTIONS[EXPERIMENT_SECTIONS.length - 1]];
  assert.equal(experimentFingerprint(bet(partial, built())), "");
  assert.equal(conformance(bet(partial, built())).state, "unshaped");
});

test("a shaped bet with nothing built is ready, not owed", () => {
  for (const prototype of [undefined, built({ status: "concept" }), built({ status: "not-started" }), { status: "working" } as never]) {
    assert.equal(conformance(bet(EXPERIMENT, prototype)).state, "unbuilt");
  }
  assert.equal(conformanceProblem(bet(EXPERIMENT, built({ status: "concept" }))), undefined);
});

test("claiming a prototype is working without saying what it was built against is refused", () => {
  const subject = bet(EXPERIMENT, built());
  assert.equal(conformance(subject).state, "unstamped");
  const problem = conformanceProblem(subject);
  assert.match(problem!, /Unattested prototype/);
  // The error has to carry the value to paste, or it is only a complaint.
  assert.match(problem!, new RegExp(`builtAgainst: ${experimentFingerprint(subject)}`));
  // And the honest way out, which is not "write something plausible".
  assert.match(problem!, /set prototype\.status to 'concept'/);
});

test("a current stamp is accepted and says so", () => {
  const subject = bet(EXPERIMENT, built({ builtAgainst: experimentFingerprint(bet(EXPERIMENT)) }));
  assert.equal(conformance(subject).state, "current");
  assert.equal(conformanceProblem(subject), undefined);
});

/*
 * The reason the whole mechanism exists. Refining a bet is the normal thing to
 * do to one, and before this the software went on claiming it tested the old
 * question with nothing anywhere disagreeing.
 */
test("refining a section retires the claim, and names the section that moved", () => {
  const stamp = experimentFingerprint(bet(EXPERIMENT));
  const refined = { ...EXPERIMENT, [MOVED]: "Both modes, side by side, switchable at any point." };
  const subject = bet(refined, built({ builtAgainst: stamp }));

  const result = conformance(subject);
  assert.equal(result.state, "stale");
  assert.deepEqual(result.drifted, [MOVED]);
  assert.match(conformanceProblem(subject)!, new RegExp(`# ${MOVED} changed after the prototype was last checked`));
  assert.match(conformanceProblem(subject)!, new RegExp(`builtAgainst: ${result.fingerprint}`));
});

test("several sections moving are all named", () => {
  const stamp = experimentFingerprint(bet(EXPERIMENT));
  const last = EXPERIMENT_SECTIONS[EXPERIMENT_SECTIONS.length - 1];
  const refined = { ...EXPERIMENT, [MOVED]: "changed", [last]: "also changed" };
  assert.deepEqual(conformance(bet(refined, built({ builtAgainst: stamp }))).drifted, [MOVED, last]);
});

// Re-wrapping a paragraph is not a change to the experiment; editing a word is.
test("whitespace does not count as drift, and a word does", () => {
  const stamp = experimentFingerprint(bet(EXPERIMENT));
  const rewrapped = { ...EXPERIMENT, [MOVED]: `  ${EXPERIMENT[MOVED].replace(" ", "\n  ")}  ` };
  assert.equal(conformance(bet(rewrapped, built({ builtAgainst: stamp }))).state, "current");

  const reworded = { ...EXPERIMENT, [MOVED]: `${EXPERIMENT[MOVED]} And one more sentence.` };
  assert.equal(conformance(bet(reworded, built({ builtAgainst: stamp }))).state, "stale");
});

// A stamp from a different number of sections cannot be compared position by
// position. Being vague beats being confidently wrong about what to re-read.
test("an uncomparable stamp reports the whole experiment rather than guessing", () => {
  const subject = bet(EXPERIMENT, built({ builtAgainst: "aaaaaa-bbbbbb" }));
  assert.deepEqual(conformance(subject).drifted, [...EXPERIMENT_SECTIONS]);
});

test("the fingerprint is stable, and carries one digest per section", () => {
  const first = experimentFingerprint(bet(EXPERIMENT));
  assert.equal(first, experimentFingerprint(bet({ ...EXPERIMENT })));
  assert.equal(first.split("-").length, EXPERIMENT_SECTIONS.length);
});
