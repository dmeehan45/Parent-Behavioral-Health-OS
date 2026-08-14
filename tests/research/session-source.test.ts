import assert from "node:assert/strict";
import test from "node:test";
import { handoffSchema } from "../../lib/research/schema";

/**
 * A prototype review is how what the software taught gets back into the model.
 *
 * It enters as a handoff like anything else, so it goes through the packet,
 * `/review`, and a named person's decision. What these tests pin down is the
 * shape: a session is findable by what it observed and when, never by a URL it
 * does not have, and never by naming who took part.
 */
function handoff(source: Record<string, unknown>) {
  return {
    contractVersion: 1,
    run: {
      id: "review-guided-first-caseload",
      question: "What did clinicians do when offered an assembled first caseload?",
      synthesis: "Two of three edited the proposal before accepting it.",
      createdAt: "2026-08-14",
      preparedBy: { kind: "human", provider: "in-person" },
      provenance: { method: "prototype-review", context: "Observations from a moderated session; no transcript." },
      safety: { containsSensitiveData: false, containsPrivateCompanyMaterial: false, rawTranscriptIncluded: false },
    },
    sources: [source],
    findings: [
      {
        id: "finding-clinicians-edit",
        statement: "Clinicians edited the proposed caseload rather than accepting it whole.",
        sourceIds: ["source-session"],
        suggestedTargets: ["become-match-ready"],
        classification: "new",
        evidenceStance: "qualifies",
        evidenceQuality: "primary",
        generalizedApplicability: true,
      },
    ],
  };
}

const session = {
  id: "source-session",
  identity: "session-guided-first-caseload-2026-08-14",
  kind: "session",
  title: "Guided First Caseload review session",
  locator: {
    bet: "guided-first-caseload",
    observedAt: "2026-08-14",
    participants: "Three clinicians new to the platform",
  },
  access: "available",
};

test("a prototype review session is a source the contract accepts", () => {
  const parsed = handoffSchema.parse(handoff(session));
  assert.equal(parsed.sources[0].kind, "session");
  assert.equal(parsed.sources[0].locator.bet, "guided-first-caseload");
  assert.equal(parsed.run.provenance.method, "prototype-review");
});

test("a session must say what it observed, when, and who took part", () => {
  for (const missing of ["bet", "observedAt", "participants"] as const) {
    const locator = { ...session.locator };
    delete locator[missing];
    assert.throws(
      () => handoffSchema.parse(handoff({ ...session, locator })),
      /a 'session' source needs the bet observed, the date, and a non-identifying description/,
      `a session with no ${missing} was accepted`,
    );
  }
});

test("a session cannot claim a URL it does not have", () => {
  assert.throws(
    () => handoffSchema.parse(handoff({ ...session, locator: { ...session.locator, url: "https://example.com/x" } })),
    /a session happened here, not at a URL/,
  );
});

// Otherwise the session fields become a way for any source to skip having a
// real locator, which is the opposite of what adding the kind was for.
test("session fields do not become an escape hatch for other kinds", () => {
  assert.throws(
    () =>
      handoffSchema.parse(
        handoff({
          ...session,
          kind: "web",
          locator: { bet: "guided-first-caseload", observedAt: "2026-08-14", participants: "Three clinicians" },
        }),
      ),
    /set kind to 'session'/,
  );
});

// The per-kind rules were documented long before anything checked them.
test("each source kind needs the locator its documentation promised", () => {
  const web = { ...session, kind: "web", locator: { doi: "10.1000/x" } };
  assert.throws(() => handoffSchema.parse(handoff(web)), /a 'web' source needs an HTTPS URL/);

  const repo = { ...session, kind: "repository", locator: { repository: "owner/name" } };
  assert.throws(() => handoffSchema.parse(handoff(repo)), /a 'repository' source needs a repository and path/);

  // A publication may be cited by DOI or, when it has none, by URL.
  assert.ok(handoffSchema.parse(handoff({ ...session, kind: "publication", locator: { doi: "10.1000/x" } })));
  assert.ok(
    handoffSchema.parse(handoff({ ...session, kind: "publication", locator: { url: "https://example.org/p" } })),
  );
});
