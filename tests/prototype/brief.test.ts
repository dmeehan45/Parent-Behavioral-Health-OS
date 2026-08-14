import assert from "node:assert/strict";
import test from "node:test";
import { getRepository } from "../../lib/content/repository";
import { readiness, renderPrototypeBrief, researchIdsFor } from "../../lib/prototype/brief";
import type { Bet } from "../../lib/schemas";
import type { Repository } from "../../lib/content/repository";

const repo = getRepository();

/**
 * A bet's *frontmatter* comes from the repository, so these tests exercise the
 * real problem, steps, claims and metrics. Its *sections* are always set here.
 *
 * Reading them from `content/` instead was a real defect: the tests passed only
 * while the one bet in the model happened to have no experiment written down,
 * and the first person to shape one broke the suite. Authoring content must
 * never require a code change, and that has to be true of the tests too.
 */
const bare: Bet = { ...repo.bets[0], sections: {} };

/** The same bet, with its experiment written down. */
function shaped(overrides: Record<string, string> = {}): Bet {
  return {
    ...bare,
    sections: {
      "Learning decision": "Whether a clinician wants a caseload assembled at all.",
      Scope: "A clinician who has just become match-ready.",
      Assumptions: "That enough families are waiting.",
      "Signals and safeguards": "Accept, edit, or decline. Watch for reluctant acceptance.",
      Fidelity: "Interaction high; match quality out of scope.",
      ...overrides,
    },
  };
}

test("a bet with no experiment shape is refused, and told what is missing", () => {
  const verdict = readiness(bare);
  assert.equal(verdict.ready, false);
  assert.deepEqual(verdict.missing, ["Learning decision", "Scope", "Assumptions", "Signals and safeguards", "Fidelity"]);

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

test("a bet pointing at a problem that does not exist stops the build", () => {
  const orphan = { ...bare, problem: "no-such-problem" } as Bet;
  const brief = renderPrototypeBrief(orphan, { ...repo } as Repository, []);
  assert.match(brief, /names a problem that does not exist/);
});
