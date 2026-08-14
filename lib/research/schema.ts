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
