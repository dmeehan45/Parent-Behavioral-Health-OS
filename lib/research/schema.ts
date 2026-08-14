import { z } from "zod";
const idSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected a lowercase kebab-case ID");

const sourceLocatorSchema = z
  .object({
    url: z.string().url().startsWith("https://").optional(),
    doi: z.string().min(3).optional(),
    repository: z.string().min(3).optional(),
    path: z.string().min(1).optional(),
  })
  .superRefine((locator, context) => {
    if (!locator.url && !locator.doi && !(locator.repository && locator.path)) {
      context.addIssue({ code: "custom", message: "expected an HTTPS URL, DOI, or repository and path" });
    }
  });

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
  }),
  sources: z
    .array(
      z.object({
        id: idSchema,
        identity: idSchema,
        kind: z.enum(["web", "publication", "repository", "other"]),
        title: z.string().min(1),
        locator: sourceLocatorSchema,
        access: z.enum(["available", "paywalled", "unreachable"]),
        publishedAt: z.coerce.date().optional(),
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

export const researchTraceSchema = z.object({
  run: idSchema,
  decision: idSchema,
  finding: idSchema,
  stance: z.enum(["supports", "contradicts", "qualifies", "contextualizes"]),
  sources: z.array(idSchema).min(1),
});

export type ResearchHandoff = z.infer<typeof handoffSchema>;
export type DecisionFile = z.infer<typeof decisionFileSchema>;
