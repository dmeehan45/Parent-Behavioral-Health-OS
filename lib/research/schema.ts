import { createHash } from "node:crypto";
import { z } from "zod";
const idSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected a lowercase kebab-case ID");

const sourceLocatorSchema = z.object({
  url: z.string().url().startsWith("https://").optional(),
  doi: z.string().min(3).optional(),
  repository: z.string().min(3).optional(),
  path: z.string().min(1).optional(),
  /* A prototype review session. Nothing here points outside the repository. */
  bet: idSchema.optional(),
  observedAt: z.coerce.date().optional(),
  /**
   * Who was in the room, described by their relationship to the system and
   * never by who they are. "Two clinicians new to the platform" is a locator;
   * a name, an employer, or a contact detail is a leak, and this is a public
   * repository.
   */
  participants: z.string().min(1).max(200).optional(),
});

/**
 * A source has to be findable again by whoever reads the finding later.
 *
 * What "findable" means depends on the kind, and until now the check was a
 * single "one of url, doi, or repository+path" that the documented per-kind
 * rules only described. Stating them here makes the documentation true and
 * keeps the session kind from quietly becoming an escape hatch: a web source
 * cannot satisfy its locator with session fields, and a session cannot claim a
 * URL it does not have.
 */
const SOURCE_LOCATOR_RULE: Record<string, { ok: (l: Locator) => boolean; expected: string }> = {
  web: { ok: (l) => Boolean(l.url), expected: "an HTTPS URL" },
  publication: { ok: (l) => Boolean(l.doi || l.url), expected: "a DOI, or an HTTPS URL" },
  repository: { ok: (l) => Boolean(l.repository && l.path), expected: "a repository and path" },
  session: {
    ok: (l) => Boolean(l.bet && l.observedAt && l.participants),
    expected: "the bet observed, the date, and a non-identifying description of who took part",
  },
  other: {
    ok: (l) => Boolean(l.url || l.doi || (l.repository && l.path)),
    expected: "an HTTPS URL, DOI, or repository and path",
  },
};

type Locator = z.infer<typeof sourceLocatorSchema>;

export const handoffSchema = z.object({
  contractVersion: z.literal(1),
  run: z.object({
    id: idSchema,
    question: z.string().min(10).max(500),
    synthesis: z.string().min(1).max(4000),
    createdAt: z.coerce.date(),
    preparedBy: z.object({
      kind: z.enum(["conversational-agent", "coding-agent", "human"]),
      provider: z.string().min(1),
      model: z.string().min(1).optional(),
    }),
    provenance: z.object({ method: z.string().min(1), context: z.string().min(1).max(1000) }),
    safety: z.object({
      containsSensitiveData: z.literal(false),
      containsPrivateCompanyMaterial: z.literal(false),
      rawTranscriptIncluded: z.literal(false),
    }),
    // Which queued questions this run set out to answer. Optional, so it does
    // not change the hash of any handoff written before it existed, and so a
    // run that followed its own nose is still a valid run.
    answers: z.array(idSchema).optional(),
    /**
     * What kind of run this is. Absent means `research`.
     *
     * A **research** run goes and reads things. A **reflection** is the
     * conversational agent's structured thinking *about* the model or about
     * earlier runs — the learning checkpoint's durable form, when a session
     * produced something worth keeping, and the door for a large piece of
     * structured analysis that would otherwise sit in a Markdown file no
     * surface can read.
     *
     * Optional rather than defaulted, deliberately: a default writes a value
     * into every handoff, which would move the hash of every review already
     * given. See `handoffHash`.
     */
    kind: z.enum(["research", "reflection"]).optional(),
    /** Earlier runs a reflection is thinking about. */
    reflectsOn: z.array(idSchema).optional(),
  }),
  sources: z
    .array(
      z
        .object({
          id: idSchema,
          identity: idSchema,
          // `session` is a prototype review: somebody used the software and
          // something was observed. It is the way what a prototype taught gets
          // back into the model, and it goes through the same gate as anything
          // else — packet, /review, decision — because one participant's
          // reaction is not a validated claim, and nothing here may decide that
          // it is.
          kind: z.enum(["web", "publication", "repository", "session", "other"]),
          title: z.string().min(1),
          locator: sourceLocatorSchema,
          access: z.enum(["available", "paywalled", "unreachable"]),
          publishedAt: z.coerce.date().optional(),
        })
        .superRefine((source, context) => {
          const rule = SOURCE_LOCATOR_RULE[source.kind];
          if (rule && !rule.ok(source.locator)) {
            context.addIssue({
              code: "custom",
              path: ["locator"],
              message: `a '${source.kind}' source needs ${rule.expected}`,
            });
          }
          if (source.kind !== "session" && (source.locator.bet || source.locator.participants)) {
            context.addIssue({
              code: "custom",
              path: ["locator"],
              message: "bet and participants describe a review session; set kind to 'session'",
            });
          }
          if (source.kind === "session" && (source.locator.url || source.locator.doi)) {
            context.addIssue({
              code: "custom",
              path: ["locator"],
              message: "a session happened here, not at a URL — remove url and doi",
            });
          }
        }),
    )
    .min(1),
  findings: z
    .array(
      z.object({
        id: idSchema,
        statement: z.string().min(1).max(1000),
        sourceIds: z.array(idSchema).min(1),
        suggestedTargets: z.array(idSchema).default([]),
        classification: z.enum(["new", "duplicate", "qualifying", "conflicting", "out-of-scope"]),
        evidenceStance: z.enum(["supports", "contradicts", "qualifies", "contextualizes"]),
        evidenceQuality: z.enum(["primary", "secondary", "expert-opinion", "unknown"]),
        generalizedApplicability: z.boolean(),
        existingClaimCandidates: z.array(idSchema).optional(),
        proposedClaim: z.object({ id: idSchema, statement: z.string().min(1) }).optional(),
        extract: z.string().optional(),
        uncertainty: z.string().optional(),
      }),
    )
    .min(1),
  /**
   * Context that changes no claim.
   *
   * A finding proposes something the model might come to believe, so it costs a
   * reviewer's judgement one at a time. Most of what a research conversation
   * produces is not that: a source that exists, a standard definition, a
   * competitor's behaviour, the shape of a regulation. Charging the expensive
   * lane for those is why the expensive lane was the only lane, and why volume
   * had nowhere to go.
   *
   * Two rules make notes safe to accept in bulk:
   *
   * - **A note must be anchored.** At least one canonical record or queued
   *   question it is context *for*. Unanchored context is how a context base
   *   turns into a landfill: it accumulates, nothing retrieves it, and nobody
   *   can say what it was for. Anchoring means a note is found later by the
   *   person reading the thing it bears on.
   * - **A note cannot become belief.** Nothing here may raise a claim's
   *   confidence, and `researchTrace` cannot cite a note — it resolves finding
   *   IDs, and a note is not one. Context that turns out to bear on what the
   *   model claims re-enters as a finding in a later run, through the full gate.
   */
  notes: z
    .array(
      z.object({
        id: idSchema,
        statement: z.string().min(1).max(1000),
        sourceIds: z.array(idSchema).default([]),
        // The anchor is the whole bloat defence, so it is required in the
        // schema rather than checked later: a note with nowhere to belong
        // cannot be written down at all.
        anchors: z.array(idSchema).min(1),
        note: z.string().optional(),
      }),
    )
    .default([]),
  /**
   * Proposals for what should exist in the model.
   *
   * A finding says *this appears to be true*. A candidate says *this should be
   * a Problem*, or *this should be a queued question* — which is a different
   * kind of claim, and the one a big piece of structured analysis is mostly
   * made of. The readiness/matching deep dive ranks eight candidate Problems
   * across five dimensions; as prose it is invisible to the queue, to `/review`
   * and to the map, and converting it by hand is why it has sat unconverted.
   *
   * A candidate carries everything except the name. `description` says what the
   * trouble is; `title` does not exist here, and cannot. Accepting one hands a
   * person the same skeleton `/review/apply` already composes for a Problem,
   * with targets, claims and trace carried and every word of the body theirs to
   * write. A Problem generated from research would be invented content wearing
   * the clothes of evidence, and that stays true however well-structured the
   * research was.
   *
   * Each is dispositioned individually, like a finding: proposing that
   * something belongs in the model is a judgement, not context.
   */
  candidates: z
    .array(
      // Strict, and this is the enforcement rather than a nicety: Zod strips
      // unknown keys by default, so a candidate that wrote `title:` would parse
      // cleanly with the title silently discarded. The author would believe
      // they had named it, the reviewer would never see the name, and the rule
      // that a candidate carries no title would be true by accident. Here an
      // unrecognized key is an error that says so.
      z.strictObject({
        id: idSchema,
        kind: z.enum(["problem", "question"]),
        /**
         * What the trouble is, in the proposer's words — never a finished
         * title. Long enough that a person can judge it; the naming is theirs.
         */
        description: z.string().min(20).max(2000),
        /** Where it bites. Required for a problem, since a Problem's own targets are. */
        targets: z.array(idSchema).default([]),
        /** Findings in this run, or claims in the model, that it rests on. */
        restsOn: z.array(idSchema).default([]),
        /** Why it ranks where it does, if the analysis said. */
        rationale: z.string().max(2000).optional(),
        /** What would weaken it. A candidate nobody can disprove is not a proposal. */
        wouldWeakenIf: z.string().max(2000).optional(),
      }),
    )
    .default([]),
  questions: z.array(z.object({ id: idSchema, question: z.string().min(1) })).default([]),
});

export const dispositionSchema = z.enum(["accept", "reject", "defer", "needs-research", "accept-with-edits"]);

export const decisionFileSchema = z.object({
  contractVersion: z.literal(1),
  runId: idSchema,
  reviewedHandoffHash: z.string().regex(/^[a-f0-9]{64}$/),
  // The point of the decision file is that a named person is accountable for
  // what enters the model. The review packet ships a `TODO` placeholder here so
  // the skeleton is copy-paste; leaving it in place is not a review.
  reviewer: z
    .string()
    .min(1)
    .refine((value) => !/^todo\b/i.test(value.trim()), "name the accountable reviewer; the packet's placeholder is not one"),
  // When the reviewer decided. Optional, so decisions written before this
  // existed stay valid — but the composer fills it in, because "what has
  // happened since I last looked" is unanswerable without it.
  decidedAt: z.coerce.date().optional(),
  // Which surface the reviewer decided on. `review` is the /review page;
  // `conversation` is a person deciding in the chat the research happened in,
  // with the agent recording what they said.
  //
  // This is provenance, never a gate. Everything the repository actually
  // enforces — hash currency, a named reviewer, supersession — is checked in
  // this file, so both surfaces carry identical guarantees and neither is
  // privileged here. It is recorded because the two lanes trade differently
  // (the conversational one is cheaper and hears the researcher's framing;
  // /review is slower and does not), and a later audit of that trade needs to
  // know which was used.
  decidedVia: z.enum(["review", "conversation"]).optional(),
  /**
   * Notes are dispositioned as a set, in one line.
   *
   * That is the point of them. A reviewer reads the note list, decides whether
   * this run's context is worth keeping, and says so once. `except` names the
   * few going the other way, so a mostly-good batch does not force a per-item
   * pass and one bad note does not sink a good batch.
   *
   * A note needing individual judgement is a finding wearing a note's clothes;
   * the agent should have proposed it as one, and the reviewer should say so
   * rather than reaching for a disposition that is not here.
   */
  notes: z
    .object({
      disposition: z.enum(["noted", "discard"]),
      except: z.array(idSchema).default([]),
      rationale: z.string().optional(),
    })
    .optional(),
  decisions: z.array(
    z.object({
      id: idSchema,
      disposition: dispositionSchema,
      rationale: z.string().optional(),
      editedRecommendation: z.string().optional(),
      supersedes: idSchema.optional(),
    }),
  ),
});

/**
 * A question waiting to be researched.
 *
 * One file per question, because two people or two agents adding a question on
 * the same day should not conflict in Git. A question is a complete
 * contribution: naming what we do not know is worth recording whether or not
 * anyone answers it.
 */
export const questionSchema = z.object({
  id: idSchema,
  question: z.string().min(10).max(500),
  askedBy: z.string().min(1),
  createdAt: z.coerce.date(),
  // `closed` is a human retiring a question. Being answered is not a status —
  // it is derived from the runs that declare they answered it, so the two can
  // never disagree.
  status: z.enum(["open", "parked", "closed"]).default("open"),
  priority: z.enum(["high", "normal", "low"]).default("normal"),
  targets: z.array(idSchema).default([]),
  why: z.string().max(1000).optional(),
});

export const researchTraceSchema = z.object({
  run: idSchema,
  decision: idSchema,
  finding: idSchema,
  stance: z.enum(["supports", "contradicts", "qualifies", "contextualizes"]),
  sources: z.array(idSchema).min(1),
});

export const safetyAllowlistSchema = z.object({
  approved: z
    .array(
      z.object({
        file: z.string().min(1),
        rule: z.string().min(1),
        // The match is recorded as a hash, never as text. Approving a flagged
        // credential by pasting it into an allowlist would commit the
        // credential a second time, in the file that says it is fine.
        match: z.string().regex(/^[a-f0-9]{16}$/, "expected the 16-character hash printed by npm run scan:safety"),
        approvedBy: z.string().min(1),
        reason: z.string().min(1).max(500),
      }),
    )
    .default([]),
});

export type ResearchHandoff = z.infer<typeof handoffSchema>;
export type DecisionFile = z.infer<typeof decisionFileSchema>;
export type ResearchQuestion = z.infer<typeof questionSchema>;
export type SafetyAllowlist = z.infer<typeof safetyAllowlistSchema>;

/**
 * What the handoff says, with what it does not say removed.
 *
 * Absent and empty optional values are dropped before hashing. That is not
 * tidiness — it is what lets the contract grow.
 *
 * The hash is the reviewer's guarantee: a decision cites it, and if the handoff
 * moves afterwards the decision stops authorizing anything. So it has to be
 * sensitive to what a run *claims* and insensitive to the schema's own growth.
 * Hashing the parsed object directly is not: adding `notes` with a `[]` default
 * re-hashed every handoff ever written — including one a person had reviewed
 * weeks earlier — and would have demanded a fresh review to re-assert something
 * nobody had changed. Every future optional field would have done it again.
 *
 * With empties normalized away, a field nobody used hashes exactly as it did
 * before it existed. Verified: the stored hash of the first real run is
 * unchanged by the addition of notes.
 *
 * The invariant this leaves: **add fields, never reorder or rename them.** Key
 * order still reaches the digest, so moving an existing field would invalidate
 * history for nothing. No schema needs reordering.
 */
function saidOutLoud(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(saidOutLoud);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const spoken: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (entry === undefined) continue;
      if (Array.isArray(entry) && entry.length === 0) continue;
      spoken[key] = saidOutLoud(entry);
    }
    return spoken;
  }
  return value;
}

/**
 * Lives beside the contract, not beside the loader.
 *
 * `lib/content/repository.ts` checks this hash inside the live projection and
 * `lib/research/intake.ts` checks it at validation. They had a copy each, which
 * agreed until the recipe changed — and then disagreed in the worst direction:
 * the map refused a trace the validator had passed. One definition, imported by
 * both, and the loader cannot import the intake because the intake reads the
 * loader.
 */
export function handoffHash(handoff: ResearchHandoff) {
  return createHash("sha256").update(JSON.stringify(saidOutLoud(handoff))).digest("hex");
}
