import type { ReviewFinding, ReviewRun } from "./view";

/**
 * Composing the canonical change an accepted decision authorizes.
 *
 * Pure string work, no filesystem: this runs in the browser next to the person
 * making the judgement calls it needs.
 *
 * The line this file walks is the important part. It composes what is
 * *derivable* — the record's identity, where it lands, the `researchTrace` that
 * proves it was reviewed — and refuses to compose what requires judgement. A
 * Problem generated from a finding would be invented content wearing the
 * clothes of evidence, which is the one thing `AGENTS.md` asks nobody to do.
 * So the person chooses what kind of belief this is and how confident they are,
 * and naming a Problem stays an invitation rather than an output.
 */

export const CLAIM_KINDS = ["reported", "observed", "inference", "assumption", "hypothesis"] as const;
export type ClaimKind = (typeof CLAIM_KINDS)[number];

/**
 * What each kind of claim commits you to.
 *
 * Choosing between these is the moment someone actually learns what the model
 * means by a claim, so the interface says it rather than assuming it is known.
 */
export const CLAIM_KIND_MEANING: Record<ClaimKind, string> = {
  reported: "Somebody told us. True to the source; not independently checked.",
  observed: "We watched it happen, or the data shows it.",
  inference: "It follows from other things we believe, rather than being seen directly.",
  assumption: "We are proceeding as if it is true because we have to start somewhere.",
  hypothesis: "We think it might be true, and it is the kind of thing an experiment could settle.",
};

export const CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const CONFIDENCE_MEANING: Record<ConfidenceLevel, string> = {
  low: "Plausible, thinly evidenced. Do not build on it without checking.",
  medium: "Reasonable evidence, or consistent with several things we already hold.",
  high: "Well evidenced. Something else being wrong would be more surprising than this.",
};

/**
 * Evidence quality is what the run reported; claim kind is what we now hold.
 * They are related but not the same judgement, so this only suggests a default.
 */
export function suggestedKind(evidenceQuality: string): ClaimKind {
  if (evidenceQuality === "primary") return "observed";
  if (evidenceQuality === "secondary") return "reported";
  if (evidenceQuality === "expert-opinion") return "inference";
  return "hypothesis";
}

export function suggestedConfidence(evidenceQuality: string): ConfidenceLevel {
  if (evidenceQuality === "primary") return "medium";
  return "low";
}

function traceBlock(run: ReviewRun, finding: ReviewFinding, indent = "") {
  return [
    `${indent}researchTrace:`,
    `${indent}  - run: ${run.id}`,
    `${indent}    decision: ${finding.decisionId}`,
    `${indent}    finding: ${finding.id}`,
    `${indent}    stance: ${finding.evidenceStance}`,
    `${indent}    sources: [${finding.sourceIds.join(", ")}]`,
  ].join("\n");
}

export type ApplyChoice = { kind: ClaimKind; confidence: ConfidenceLevel };

export type ApplyStep = {
  /** What the person does with this: create a file, or edit one. */
  action: "create" | "edit";
  path: string;
  /** The complete file, or the frontmatter to merge into an existing one. */
  body: string;
  explanation: string;
};

/**
 * The canonical change one accepted finding authorizes.
 *
 * Three shapes, in the order the model prefers them: a finding that proposed a
 * Claim becomes that Claim; one that named existing Claims cites them; one that
 * did neither leaves its trace on whatever it lands on. A finding that named
 * nowhere at all produces nothing to do, and says so.
 */
export function applySteps(run: ReviewRun, finding: ReviewFinding, choice: ApplyChoice): ApplyStep[] {
  const steps: ApplyStep[] = [];
  const statement = finding.decision?.editedRecommendation?.trim() || finding.statement;

  if (finding.proposedClaim) {
    const targets = finding.suggestedTargets.map((target) => target.id);
    steps.push({
      action: "create",
      path: `content/claims/${finding.proposedClaim.id}.md`,
      explanation: "A new Claim. This is what the model will say, and what everything else can reason from.",
      body: [
        "---",
        `id: ${finding.proposedClaim.id}`,
        "statement: >",
        `  ${statement}`,
        `kind: ${choice.kind}`,
        `confidence: ${choice.confidence}`,
        `targets: [${targets.join(", ")}]`,
        "status: active",
        "authority: proposed",
        "provenance: { source: public-research, references: [] }",
        traceBlock(run, finding),
        "---",
        "",
        "<!-- Why this is worth holding, and what would change it. Delete this line and write it. -->",
        "",
      ].join("\n"),
    });
  }

  for (const claim of finding.existingClaimCandidates) {
    steps.push({
      action: "edit",
      path: `content/claims/${claim.id}.md`,
      explanation:
        finding.classification === "qualifying"
          ? "This narrows an existing Claim. Add the trace, and consider whether the statement or the confidence should move."
          : "The run believes this Claim already says it. Add the trace so the evidence is recorded against it.",
      body: traceBlock(run, finding),
    });
  }

  if (!finding.proposedClaim && !finding.existingClaimCandidates.length) {
    for (const target of finding.suggestedTargets) {
      steps.push({
        action: "edit",
        path: `content/${target.kind}s/${target.id}.md`,
        explanation: `Records against ${target.title} that this was reviewed and accepted.`,
        body: traceBlock(run, finding),
      });
    }
  }

  return steps;
}

/** Whether an accepted finding has anywhere at all to land. */
export function hasNowhereToLand(finding: ReviewFinding) {
  return !finding.proposedClaim && !finding.existingClaimCandidates.length && !finding.suggestedTargets.length;
}
