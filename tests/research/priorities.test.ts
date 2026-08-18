import assert from "node:assert/strict";
import test from "node:test";
import { blocksNewResearch, prioritizeQuestions, researchFamilies } from "../../lib/research/priorities";
import type { QueueItem } from "../../lib/research/questions";

function question(id: string, priority: QueueItem["priority"] = "high"): QueueItem {
  return {
    id,
    question: `A sufficiently long research question about ${id}.`,
    askedBy: "a reviewer",
    priority,
    status: "open",
    targets: [],
    answeredBy: [],
    file: `research/questions/${id}.yaml`,
  };
}

test("a question blocking a working prototype outranks an otherwise equal queue item", () => {
  const open = [question("alphabetically-first"), question("product-blocker")];
  const bets = [
    {
      id: "active-bet",
      title: "Active Bet",
      awaiting: ["product-blocker"],
      prototype: { status: "working", route: "/prototypes/active-bet" },
    },
  ];

  assert.deepEqual(prioritizeQuestions(open, bets).map((item) => item.id), ["product-blocker", "alphabetically-first"]);
});

test("working prototypes sort ahead of implemented but unchecked prototype families", () => {
  const open = [question("concept-question"), question("working-question")];
  const families = researchFamilies(open, [
    {
      id: "concept-bet",
      title: "Concept Bet",
      awaiting: ["concept-question"],
      prototype: { status: "concept", route: "/prototypes/concept-bet" },
    },
    {
      id: "working-bet",
      title: "Working Bet",
      awaiting: ["working-question"],
      prototype: { status: "working", route: "/prototypes/working-bet" },
    },
  ]);

  assert.deepEqual(families.map((family) => family.betId), ["working-bet", "concept-bet"]);
});

test("review, apply, conversion, or saturation debt blocks another automatic research run", () => {
  for (const kind of ["undecided", "unapplied", "unconverted", "saturated"]) {
    assert.equal(blocksNewResearch([{ kind, subject: "real-run" }]), true, kind);
  }
  assert.equal(blocksNewResearch([{ kind: "raised", subject: "some-gap" }]), false);
});

test("the checked-in example handoff is documentation rather than live WIP", () => {
  assert.equal(blocksNewResearch([{ kind: "undecided", subject: "example-public-research" }]), false);
});
