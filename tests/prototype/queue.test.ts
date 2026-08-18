import assert from "node:assert/strict";
import test from "node:test";
import { getRepository } from "../../lib/content/repository";
import { EXPERIMENT_SECTIONS, SECTION } from "../../lib/content/body";
import { experimentFingerprint } from "../../lib/prototype/conformance";
import { prototypeQueue } from "../../lib/prototype/queue";
import type { Bet } from "../../lib/schemas";

/**
 * Fixtures are built here rather than read from `content/`, so that shaping a
 * bet or stamping a prototype never turns a content edit into a red build.
 */
const base = getRepository().bets[0];

/** Built from `EXPERIMENT_SECTIONS` so adding or splitting a section does not
 * silently unshape every fixture here. */
const EXPERIMENT: Record<string, string> = Object.fromEntries(
  EXPERIMENT_SECTIONS.map((name) => [name, `Approved text for ${name.toLowerCase()}.`]),
);

const [, MOVED] = EXPERIMENT_SECTIONS;

function bet(id: string, sections: Record<string, string>, extra: Partial<Bet> = {}): Bet {
  return { ...base, id, title: id, sections, prototype: undefined, awaiting: undefined, ...extra } as Bet;
}

const FINGERPRINT = experimentFingerprint(bet("shaped", EXPERIMENT));

test("each bet reports its state and the one next action", () => {
  const queue = prototypeQueue([
    bet("unshaped-bet", { [SECTION.learningDecision]: "Only this." }),
    bet("buildable-bet", EXPERIMENT),
    bet("unclaimed-bet", EXPERIMENT, {
      prototype: { status: "concept", route: "/prototypes/unclaimed-bet", builtAgainst: FINGERPRINT },
    }),
    bet("unstamped-bet", EXPERIMENT, { prototype: { status: "working", route: "/prototypes/unstamped-bet" } }),
    bet("stale-bet", { ...EXPERIMENT, [MOVED]: "Refined since the stamp." }, {
      prototype: { status: "working", route: "/prototypes/stale-bet", builtAgainst: FINGERPRINT },
    }),
    bet("reviewable-bet", { ...EXPERIMENT, [SECTION.reviewPrompts]: "What surprised you?" }, {
      prototype: { status: "working", route: "/prototypes/reviewable-bet", builtAgainst: FINGERPRINT },
    }),
    bet("reviewed-bet", { ...EXPERIMENT, [SECTION.reviewPrompts]: "What surprised you?" }, {
      prototype: { status: "tested", route: "/prototypes/reviewed-bet", builtAgainst: FINGERPRINT },
    }),
  ]);

  const states = Object.fromEntries(queue.map((item) => [item.bet, item.state]));
  assert.deepEqual(states, {
    "unshaped-bet": "unshaped",
    "buildable-bet": "buildable",
    "unclaimed-bet": "unclaimed",
    "unstamped-bet": "unstamped",
    "stale-bet": "stale",
    "reviewable-bet": "reviewable",
    "reviewed-bet": "reviewed",
  });

  // Claims currently wrong outrank work a person can finish, which outranks
  // work an agent can pick up, which outranks shaping the person still owes.
  assert.deepEqual(
    queue.map((item) => item.state),
    ["stale", "unstamped", "unclaimed", "reviewable", "reviewed", "buildable", "unshaped"],
  );
});

test("an unshaped bet is told what is missing, never given the text", () => {
  const [item] = prototypeQueue([bet("thin-bet", { [SECTION.learningDecision]: "Named." })]);
  assert.equal(item.state, "unshaped");
  assert.match(item.why, new RegExp(SECTION.scope));
  assert.doesNotMatch(item.why, new RegExp(SECTION.learningDecision));
  assert.match(item.next, /Do not fill them in/);
});

test("a stale bet names the section that moved", () => {
  const [item] = prototypeQueue([
    bet("stale-bet", { ...EXPERIMENT, [MOVED]: "Refined." }, {
      prototype: { status: "working", route: "/prototypes/stale-bet", builtAgainst: FINGERPRINT },
    }),
  ]);
  assert.equal(item.state, "stale");
  assert.match(item.why, new RegExp(MOVED));
});

test("building and stamping are asked of different actors", () => {
  const [buildable] = prototypeQueue([bet("buildable-bet", EXPERIMENT)]);
  assert.match(buildable.next, /coding agent/);

  const [unclaimed] = prototypeQueue([
    bet("unclaimed-bet", EXPERIMENT, { prototype: { status: "concept", route: "/prototypes/unclaimed-bet" } }),
  ]);
  assert.match(unclaimed.next, /A person looks/);
});

test("a retired prototype makes its bet buildable again, not unclaimed", () => {
  const [item] = prototypeQueue([
    bet("retired-bet", EXPERIMENT, { prototype: { status: "retired", route: "/prototypes/retired-bet" } }),
  ]);
  assert.equal(item.state, "buildable");
  assert.match(item.why, /retired/);
});

test("the open questions a bet is scoped around ride along", () => {
  const [item] = prototypeQueue([bet("waiting-bet", EXPERIMENT, { awaiting: ["define-matching-quality"] })]);
  assert.deepEqual(item.awaiting, ["define-matching-quality"]);
});

test("a recorded session changes the ask from reviewing to deciding", () => {
  const built = bet("session-bet", { ...EXPERIMENT, [SECTION.reviewPrompts]: "What surprised you?" }, {
    prototype: { status: "working", route: "/prototypes/session-bet", builtAgainst: FINGERPRINT },
  });

  const [undecided] = prototypeQueue([built], new Map([["session-bet", { runs: 1, undecided: 5 }]]));
  assert.equal(undecided.state, "reviewable");
  assert.match(undecided.why, /1 session recorded in staging, 5 finding\(s\) undecided/);
  assert.match(undecided.next, /Decide the session's findings/);
  assert.doesNotMatch(undecided.next, /Put it in front of participants/);

  const [decided] = prototypeQueue([built], new Map([["session-bet", { runs: 1, undecided: 0 }]]));
  assert.match(decided.why, /findings decided/);
  assert.match(decided.next, /next iteration builds from what was accepted/);

  const [none] = prototypeQueue([built]);
  assert.match(none.next, /Put it in front of participants/);
});

test("a reviewable bet without review prompts is sent back for them", () => {
  const [item] = prototypeQueue([
    bet("promptless-bet", EXPERIMENT, {
      prototype: { status: "working", route: "/prototypes/promptless-bet", builtAgainst: FINGERPRINT },
    }),
  ]);
  assert.equal(item.state, "reviewable");
  assert.match(item.next, /Review prompts/);
  assert.doesNotMatch(item.next, /participants/);
});
