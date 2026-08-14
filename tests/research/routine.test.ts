import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  checkForRepeatedFindings,
  checkSupersedes,
  loadDecisions,
  loadHandoffs,
  sourceOverlap,
  supersededDecisions,
} from "../../lib/research/intake";
import { findGaps } from "../../lib/research/gaps";
import { buildQueue, checkAnsweredQuestions, loadQuestions, nextUp } from "../../lib/research/questions";
import { loadAllowlist, matchHash, scan, staleApprovals, unapproved } from "../../lib/research/safety";
import { findingState, researchAbout } from "../../lib/research/view";

const CONTRACT = fs.readFileSync("research/contract/v1.example.yaml", "utf8");

function scratch(files: Record<string, string>) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "research-routine-"));
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

/** A handoff differing from the contract example only where asked. */
function handoff(id: string, options: { statement?: string; identity?: string; date?: string; answers?: string } = {}) {
  return CONTRACT.replace("id: example-public-research", `id: ${id}`)
    .replace("createdAt: 2026-08-14", `createdAt: ${options.date ?? "2026-08-14"}`)
    .replace("identity: github-parent-health-os-readme", `identity: ${options.identity ?? "github-parent-health-os-readme"}`)
    .replace(
      "statement: Unreviewed research should not change the canonical system map.",
      `statement: ${options.statement ?? "Unreviewed research should not change the canonical system map."}`,
    )
    .replace("    rawTranscriptIncluded: false", `    rawTranscriptIncluded: false${options.answers ? `\n  answers: [${options.answers}]` : ""}`);
}

function decisionFile(runId: string, hash: string, extra = "") {
  return [
    "contractVersion: 1",
    `runId: ${runId}`,
    `reviewedHandoffHash: ${hash}`,
    "reviewer: a reviewer",
    "decisions:",
    `  - id: decide-${runId}-finding-review-first`,
    "    disposition: accept",
    extra,
    "",
  ].filter(Boolean).join("\n");
}

// Two runs a day against the same public sources will reach the same sentence
// forever unless something says so. Only an exact restatement is rejected;
// judging whether two wordings mean the same thing is the reviewer's job.
test("a later run may not restate an earlier run's finding", () => {
  const root = scratch({
    "research/handoffs/run-one.yaml": handoff("run-one", { date: "2026-08-01" }),
    "research/handoffs/run-two.yaml": handoff("run-two", { date: "2026-08-02", identity: "another-source" }),
  });
  const reported = message(() => checkForRepeatedFindings(loadHandoffs(root)));
  assert.match(reported, /run 'run-one' already recorded this statement/);
  assert.match(reported, /research:brief/);
});

test("a differently worded finding is left to the reviewer", () => {
  const root = scratch({
    "research/handoffs/run-one.yaml": handoff("run-one", { date: "2026-08-01" }),
    "research/handoffs/run-two.yaml": handoff("run-two", {
      date: "2026-08-02",
      identity: "another-source",
      statement: "Review before canonical change is what keeps the map trustworthy.",
    }),
  });
  assert.doesNotThrow(() => checkForRepeatedFindings(loadHandoffs(root)));
});

test("re-reading a source is reported, not blocked", () => {
  const root = scratch({
    "research/handoffs/run-one.yaml": handoff("run-one", { date: "2026-08-01" }),
    "research/handoffs/run-two.yaml": handoff("run-two", { date: "2026-08-02", statement: "A second, different statement entirely." }),
  });
  const handoffs = loadHandoffs(root);
  assert.doesNotThrow(() => checkForRepeatedFindings(handoffs));
  assert.deepEqual(sourceOverlap(handoffs), [
    { run: "run-two", identity: "github-parent-health-os-readme", earlier: "run-one" },
  ]);
});

test("a decision cannot supersede one from the same run or a later one", () => {
  const one = handoff("run-one", { date: "2026-08-01" });
  const two = handoff("run-two", { date: "2026-08-02", identity: "another-source", statement: "Something else." });
  const root = scratch({ "research/handoffs/run-one.yaml": one, "research/handoffs/run-two.yaml": two });
  const handoffs = loadHandoffs(root);
  const hash = Object.fromEntries(handoffs.map((entry) => [entry.handoff.run.id, entry.hash]));

  const sameRun = scratch({
    "research/handoffs/run-one.yaml": one,
    "research/decisions/run-one.yaml": decisionFile("run-one", hash["run-one"], "    supersedes: decide-run-one-finding-review-first"),
  });
  assert.match(
    message(() => checkSupersedes(loadHandoffs(sameRun), loadDecisions(sameRun))),
    /is a decision in this same run/,
  );

  const backwards = scratch({
    "research/handoffs/run-one.yaml": one,
    "research/handoffs/run-two.yaml": two,
    "research/decisions/run-one.yaml": decisionFile("run-one", hash["run-one"], "    supersedes: decide-run-two-finding-review-first"),
    "research/decisions/run-two.yaml": decisionFile("run-two", hash["run-two"]),
  });
  assert.match(
    message(() => checkSupersedes(loadHandoffs(backwards), loadDecisions(backwards))),
    /is newer than run 'run-one'/,
  );
});

test("superseding an unrecorded decision is rejected", () => {
  const root = scratch({
    "research/handoffs/run-one.yaml": handoff("run-one"),
    "research/decisions/run-one.yaml": decisionFile("run-one", loadHandoffs(scratch({ "research/handoffs/run-one.yaml": handoff("run-one") }))[0].hash, "    supersedes: decide-nobody-ever"),
  });
  assert.match(message(() => checkSupersedes(loadHandoffs(root), loadDecisions(root))), /is not a decision anyone has recorded/);
});

test("a superseded decision is reported so the model stops citing it", () => {
  const one = handoff("run-one", { date: "2026-08-01" });
  const two = handoff("run-two", { date: "2026-08-02", identity: "another-source", statement: "A later, better statement." });
  const base = scratch({ "research/handoffs/run-one.yaml": one, "research/handoffs/run-two.yaml": two });
  const hash = Object.fromEntries(loadHandoffs(base).map((entry) => [entry.handoff.run.id, entry.hash]));
  const root = scratch({
    "research/handoffs/run-one.yaml": one,
    "research/handoffs/run-two.yaml": two,
    "research/decisions/run-one.yaml": decisionFile("run-one", hash["run-one"]),
    "research/decisions/run-two.yaml": decisionFile("run-two", hash["run-two"], "    supersedes: decide-run-one-finding-review-first"),
  });
  assert.doesNotThrow(() => checkSupersedes(loadHandoffs(root), loadDecisions(root)));
  assert.equal(
    supersededDecisions(loadDecisions(root)).get("decide-run-one-finding-review-first"),
    "decide-run-two-finding-review-first",
  );
});

const question = (id: string, extra = "") =>
  [`id: ${id}`, `question: "A question long enough to satisfy the contract, about ${id}."`, "askedBy: a person", "createdAt: 2026-08-14", extra, ""].filter(Boolean).join("\n");

test("being answered is derived from runs, never stored on the question", () => {
  const root = scratch({
    "research/questions/first-question.yaml": question("first-question"),
    "research/questions/second-question.yaml": question("second-question", "priority: high"),
    "research/handoffs/run-one.yaml": handoff("run-one", { answers: "first-question" }),
  });
  const queue = buildQueue(loadQuestions(root), loadHandoffs(root));
  assert.deepEqual(queue.map((item) => item.id), ["second-question", "first-question"]);
  assert.deepEqual(queue.find((item) => item.id === "first-question")?.answeredBy, ["run-one"]);
  assert.deepEqual(nextUp(queue).map((item) => item.id), ["second-question"]);
});

test("a parked question is not picked up", () => {
  const root = scratch({ "research/questions/parked-question.yaml": question("parked-question", "status: parked") });
  assert.deepEqual(nextUp(buildQueue(loadQuestions(root), [])), []);
});

test("answering a question nobody asked is a typo, and is rejected", () => {
  const root = scratch({ "research/handoffs/run-one.yaml": handoff("run-one", { answers: "never-asked" }) });
  assert.match(
    message(() => checkAnsweredQuestions(loadHandoffs(root), loadQuestions(root))),
    /'never-asked' is not a question/,
  );
});

test("a question file name has to match its ID", () => {
  const root = scratch({ "research/questions/wrong-name.yaml": question("right-name") });
  assert.match(message(() => loadQuestions(root)), /does not match the file name/);
});

test("the scanner catches credentials, contact details and inherited markers", () => {
  const root = scratch({
    "content/planted.md": [
      "api_key: sk-abcdefghijklmnopqrstuvwx",
      "Reach the lead at jane.doe@somewhere.example.net or (415) 555-0142.",
      "COMPANY CONFIDENTIAL — do not distribute",
      "Runbook: https://wiki.acme.internal/oncall",
      "MRN: 44821-QQ",
    ].join("\n"),
  });
  const rules = new Set(scan(root).map((finding) => finding.rule));
  for (const rule of ["api-key", "email-address", "phone-number", "confidential-marker", "internal-host", "patient-identifier"]) {
    assert.ok(rules.has(rule), `expected the scanner to flag ${rule}`);
  }
});

// Printing a leaked credential into a public CI log to announce that it leaked
// would publish it a second time, more durably.
test("a secret is masked everywhere it is reported", () => {
  const root = scratch({ "content/planted.md": "token: ghp_abcdefghijklmnopqrstuvwxyz0123\n" });
  const findings = scan(root);
  const secret = findings.find((finding) => finding.rule === "api-key");
  assert.ok(secret);
  assert.ok(!secret.preview.includes("ghp_abcdefghijklmnopqrstuvwxyz0123"));
  assert.match(secret.preview, /•/);
  assert.match(secret.hash, /^[a-f0-9]{16}$/);
});

test("an example address is not a leak", () => {
  const root = scratch({ "content/fine.md": "Write to someone@example.com about it.\n" });
  assert.deepEqual(scan(root).filter((finding) => finding.rule === "email-address"), []);
});

test("approving a finding records a hash, never the text", () => {
  const planted = "content/planted.md";
  const text = "Reach us at jane.doe@somewhere.example.net.\n";
  const root = scratch({ "content/planted.md": text });
  const finding = scan(root).find((entry) => entry.rule === "email-address");
  assert.ok(finding);

  fs.mkdirSync(path.join(root, "research"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "research/safety-allowlist.yaml"),
    `approved:\n  - file: ${planted}\n    rule: email-address\n    match: ${finding.hash}\n    approvedBy: a reviewer\n    reason: a worked example\n`,
  );
  const allowlist = loadAllowlist(root);
  assert.equal(allowlist.approved[0].match, matchHash(planted, "email-address", "jane.doe@somewhere.example.net"));
  assert.deepEqual(unapproved(scan(root), allowlist), []);
});

// An approval outliving the line it approved is how a blanket exemption gets
// built by accident.
test("an approval that no longer matches anything is reported as stale", () => {
  const root = scratch({
    "content/fine.md": "nothing to see\n",
    "research/safety-allowlist.yaml": `approved:\n  - file: content/gone.md\n    rule: email-address\n    match: ${"a".repeat(16)}\n    approvedBy: a reviewer\n    reason: it moved\n`,
  });
  assert.equal(staleApprovals(scan(root), loadAllowlist(root)).length, 1);
});

test("the allowlist itself is never scanned", () => {
  const root = scratch({
    "research/safety-allowlist.yaml": "approved: []\n# jane.doe@somewhere.example.net\n",
  });
  assert.deepEqual(scan(root), []);
});

// A reviewer accepting a finding authorizes a change; it does not make one.
// Collapsing the two would hide accepted research that changed nothing, which
// is the failure the whole arrangement is otherwise built to prevent.
test("accepted and applied are different states", () => {
  const base = { appliedIn: [] as unknown[] };
  assert.equal(findingState({ ...base }), "awaiting");
  assert.equal(findingState({ ...base, decision: { disposition: "accept" } }), "accepted");
  assert.equal(
    findingState({ decision: { disposition: "accept" }, appliedIn: [{ id: "clinician-onboarding" }] }),
    "applied",
  );
  assert.equal(findingState({ ...base, decision: { disposition: "accept-with-edits" } }), "accepted");
});

test("a rejected or deferred finding keeps its own state", () => {
  assert.equal(findingState({ decision: { disposition: "reject" }, appliedIn: [] }), "rejected");
  assert.equal(findingState({ decision: { disposition: "defer" }, appliedIn: [] }), "deferred");
  assert.equal(findingState({ decision: { disposition: "needs-research" }, appliedIn: [] }), "needs-research");
});

// Superseding beats everything else: the model must stop presenting a retired
// conclusion as current, even where a record still cites it.
test("superseded outranks whatever the decision said", () => {
  assert.equal(
    findingState({ decision: { disposition: "accept" }, appliedIn: [{ id: "x" }], supersededBy: "decide-later-x" }),
    "superseded",
  );
});

test("a record finds the research that names it, whether proposed or already applied", () => {
  const finding = (id: string, targets: string[], applied: string[] = []) => ({
    id,
    decisionId: `decide-run-${id}`,
    statement: id,
    classification: "new",
    evidenceStance: "supports",
    evidenceQuality: "primary",
    generalizedApplicability: true,
    sourceIds: [],
    suggestedTargets: targets.map((target) => ({ id: target, title: target, href: "#", kind: "stage" })),
    existingClaimCandidates: [],
    priorArt: [],
    appliedIn: applied.map((record) => ({ id: record, title: record, href: "#", kind: "stage" })),
    state: "awaiting" as const,
  });
  const runs = [
    {
      id: "run-one",
      findings: [finding("proposes", ["matching"]), finding("applied", [], ["matching"]), finding("elsewhere", ["care-initiation"])],
    },
  ] as unknown as Parameters<typeof researchAbout>[0];

  assert.deepEqual(
    researchAbout(runs, "matching").map(({ finding: found }) => found.id),
    ["proposes", "applied"],
  );
  assert.deepEqual(researchAbout(runs, "nothing-here"), []);
});

// Validation lets an unproduced state through on purpose: it is a part of the
// system nobody has modelled, and the answer is a person describing what really
// happens. That is only true if somebody is asked — a gap visible on one record
// page nobody opened is not an invitation, it is a secret.
test("a state no step produces reaches the queue, not just the record page", () => {
  const repo = {
    stages: [],
    steps: [
      { id: "propose-match", title: "Propose a Match", inputs: [{ entity: "family", state: "match-ready" }] },
      { id: "become-match-ready", title: "Become Match-Ready", outputs: [{ entity: "clinician", state: "match-ready" }] },
    ],
    entities: [{ id: "family", title: "Family" }],
    claims: [],
    metrics: [],
    problems: [],
    bets: [],
  } as unknown as Parameters<typeof findGaps>[0];

  const unsupplied = findGaps(repo, [], []).filter((gap) => gap.kind === "unsupplied");

  assert.equal(unsupplied.length, 1, "the clinician state one step does produce is not a gap");
  assert.equal(unsupplied[0].subject, "propose-match");
  assert.match(unsupplied[0].why, /Family in state 'match-ready'/);
  assert.match(unsupplied[0].suggestedQuestion, /What work actually brings a family to 'match-ready'/);
});
