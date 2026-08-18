import assert from "node:assert/strict";
import test from "node:test";
import { getRepository } from "../../lib/content/repository";
import { readiness, renderPrototypeBrief, researchIdsFor } from "../../lib/prototype/brief";
import { EXPERIMENT_SECTIONS } from "../../lib/content/body";
import type { Bet } from "../../lib/schemas";
import type { Repository } from "../../lib/content/repository";

const repo = getRepository();

/**
 * A fixture that opts *in* to what it borrows.
 *
 * These tests want the real guided-first-caseload problem, steps, claims and
 * metrics, so the packet is exercised against a model that actually exists.
 * They do not want whichever Bet happens to sort first: adding an unrelated Bet
 * must not silently change the fixture these assertions are describing.
 *
 * They also do not want any of the bet's editorial state. Listing what is taken
 * fixes both classes of accidental inheritance. A field added to `Bet` tomorrow
 * is absent here by default, which is the safe direction: a test that misses new
 * state is inconvenient, one that silently inherits it is wrong.
 */
const source = repo.bets.find((candidate) => candidate.id === "guided-first-caseload");
assert.ok(source, "prototype brief tests require the guided-first-caseload fixture");

const bare: Bet = {
  id: source.id,
  title: source.title,
  file: source.file,
  problem: source.problem,
  claims: source.claims,
  metrics: source.metrics,
  confidence: source.confidence,
  authority: source.authority,
  body: "",
  sections: {},
} as Bet;

/**
 * The same bet, with its experiment written down.
 *
 * Every section is filled from `EXPERIMENT_SECTIONS` rather than listed here, so
 * splitting or adding one does not quietly turn every "ready to build" case into
 * an unshaped one. Only the sections a test actually reads back are given
 * particular wording.
 */
function shaped(overrides: Record<string, string> = {}): Bet {
  return {
    ...bare,
    sections: {
      ...Object.fromEntries(EXPERIMENT_SECTIONS.map((name) => [name, `Approved text for ${name.toLowerCase()}.`])),
      "Learning decision": "Whether a clinician wants a caseload assembled at all.",
      Assumptions: "That enough families are waiting.",
      ...overrides,
    },
  };
}

test("a bet with no experiment shape is refused, and told what is missing", () => {
  const verdict = readiness(bare);
  assert.equal(verdict.ready, false);
  assert.deepEqual(verdict.missing, [...EXPERIMENT_SECTIONS]);

  const brief = renderPrototypeBrief(bare, repo, []);
  assert.match(brief, /\*\*Not yet — do not start building\.\*\*/);
  // The refusal has to explain each gap, or it is just a closed door.
  for (const name of verdict.missing) assert.match(brief, new RegExp(`\\*\\*${name}\\*\\* —`));
  // And it must name the file to write them into.
  assert.match(brief, /content\/bets\/guided-first-caseload\.md/);
});

test("a bet whose experiment is approved is cleared to build, and carries it verbatim", () => {
  const ready = shaped();
  assert.equal(readiness(ready).ready, true);

  const brief = renderPrototypeBrief(ready, repo, []);
  assert.match(brief, /\*\*Yes\.\*\* The experiment has been shaped/);
  assert.match(brief, /## The experiment, as approved/);
  assert.match(brief, /Whether a clinician wants a caseload assembled at all\./);
  // The bet's own assumptions become the assumed list, never the known one.
  const assumed = brief.slice(brief.indexOf("### Assumed"), brief.indexOf("### Unknown"));
  assert.match(assumed, /That enough families are waiting\./);
});

test("one missing section is enough to refuse", () => {
  const nearly = shaped();
  delete (nearly.sections as Record<string, string>).Fidelity;
  assert.deepEqual(readiness(nearly).missing, ["Fidelity"]);
  assert.match(renderPrototypeBrief(nearly, repo, []), /do not start building/);
});

// A blank model field must never quietly become plausible product behaviour, so
// every one of them is listed by name rather than silently skipped.
test("unfilled model fields are listed as unknown, attributed to the record they are on", () => {
  const brief = renderPrototypeBrief(bare, repo, []);
  const unknown = brief.slice(brief.indexOf("### Unknown"));
  assert.match(unknown, /Do not invent these/);
  assert.match(unknown, /— on the bet/);
  assert.match(unknown, /— on Become Match-Ready/);
});

test("the packet carries the build contract, so an agent needs nothing else", () => {
  const brief = renderPrototypeBrief(shaped(), repo, []);
  assert.match(brief, /Synthetic data only/);
  assert.match(brief, /PrototypeShell/);
  assert.match(brief, /lint:design/);
  assert.match(brief, /npm run test:responsive/);
  // The loop closes through a person, and the packet says so at the end.
  assert.match(brief, /cannot change what the model claims/);
});

test("weakly held evidence is flagged rather than passed on as settled", () => {
  const brief = renderPrototypeBrief(shaped(), repo, []);
  assert.match(brief, /\*\*Handle with care\.\*\*/);
  assert.match(brief, /must not present it to a participant as settled/);
});

// Research is staging and is allowed to be broken. Saying nothing would read as
// "nothing has been researched", which is a different and misleading claim.
test("unreadable research is reported, not silently treated as none", () => {
  const broken = renderPrototypeBrief(bare, repo, [], false);
  assert.match(broken, /could not be read/);
  assert.match(broken, /npm run validate:research/);
  assert.match(renderPrototypeBrief(bare, repo, []), /No research names these records/);
});

/*
 * Research names its targets by content id — `matching`, never `stage:matching`.
 * The first version of this lookup prefixed them with a node kind, so it matched
 * nothing except the problem's targets, which happened to be passed bare. That
 * made the section look populated while silently dropping the research about the
 * bet itself and the claims it rests on — the most relevant kind there is.
 */
test("the research lookup uses the ids research actually writes", () => {
  const ids = researchIdsFor(bare, repo);
  for (const id of ids) {
    assert.doesNotMatch(id, /^(stage|step|bet|problem|claim|metric):/, `'${id}' is a node id, not a content id`);
  }
  assert.ok(ids.includes(bare.id), "research about the bet itself would be missed");
  assert.ok(ids.includes(bare.problem), "research about the problem would be missed");
  for (const claim of bare.claims ?? []) assert.ok(ids.includes(claim), `research about ${claim} would be missed`);
  for (const metric of bare.metrics ?? []) assert.ok(ids.includes(metric), `research about ${metric} would be missed`);
  const problem = repo.problems.find((candidate) => candidate.id === bare.problem);
  for (const target of problem?.targets ?? []) assert.ok(ids.includes(target), `research about ${target} would be missed`);
  assert.equal(new Set(ids).size, ids.length, "an id repeats, so a finding would be listed twice");
});

/*
 * An exclusion that says "we have not decided this" and a queued research
 * question saying the same thing were two pieces of prose that could drift. The
 * bet now names the question, and the packet says so where the exclusion is
 * read — so a builder learns the boundary is waiting on an answer rather than
 * arbitrary, and knows not to resolve it themselves.
 */
test("an exclusion waiting on research says which question, beside the exclusion", () => {
  const waiting = { ...shaped(), awaiting: ["define-matching-quality"] } as Bet;
  const brief = renderPrototypeBrief(waiting, repo, []);

  const section = brief.slice(brief.indexOf("### Out of scope"), brief.indexOf("### Assumptions"));
  assert.match(section, /define-matching-quality/, "the awaited question is not beside the exclusion");
  assert.match(section, /Do not resolve any of it in the prototype/);

  // A bet waiting on nothing says nothing, rather than an empty heading.
  assert.doesNotMatch(renderPrototypeBrief(shaped(), repo, []), /Open research:/);
});

test("a bet pointing at a problem that does not exist stops the build", () => {
  const orphan = { ...bare, problem: "no-such-problem" } as Bet;
  const brief = renderPrototypeBrief(orphan, { ...repo } as Repository, []);
  assert.match(brief, /names a problem that does not exist/);
});
