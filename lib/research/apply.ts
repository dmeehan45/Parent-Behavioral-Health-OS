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

/**
 * A YAML scalar that survives whatever somebody typed.
 *
 * Quoted only when it has to be, because every content file in the repository
 * writes plain titles unquoted and a composer that fought that would read as
 * foreign. Two characters force the issue: a colon turns the line into a nested
 * mapping and the file stops parsing, and a leading `#` turns it into a comment
 * — which is the dangerous one, because the file still parses and the value
 * silently becomes null.
 */
function scalar(value: string) {
  return /^[A-Za-z0-9][^:#\n"']*$/.test(value) ? value : JSON.stringify(value);
}

/**
 * A folded block, with *every* line indented.
 *
 * Indenting only the first line works until a reviewer's edited recommendation
 * runs to a second one — and the review page collects it in a textarea, so that
 * is a normal thing to type rather than an edge case. The result was a file
 * that would not parse at all.
 */
function folded(label: string, value: string, indent = "  ") {
  const lines = value.trim().split(/\r?\n/).map((line) => `${indent}${line.trim()}`);
  return [`${label}: >`, ...lines].join("\n");
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
        folded("statement", statement),
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

/* -------------------------------------------------------------------------- */
/* Naming a problem from research                                              */
/* -------------------------------------------------------------------------- */

/**
 * The one thing that makes a Problem a Problem, said where it is written.
 *
 * A reviewer who has just accepted three findings about the same failure is
 * holding everything a Problem needs except its name, and the references are
 * fiddly enough to put anyone off — which is how a problem ends up unnamed, or
 * named as the fix somebody already had in mind.
 */
export const PROBLEM_TITLE_RULE =
  "Write the title as the trouble, not the fix. “A clinician can finish onboarding and still have no work” is a problem; “Add caseload automation” is a bet wearing a problem's clothes.";

/** Mechanical, not editorial: the same slug rule the question queue uses. */
export function problemIdFrom(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .split("-")
    .filter(Boolean)
    .slice(0, 8)
    .join("-");
}

export type ProblemSource = { run: ReviewRun; finding: ReviewFinding };

/** What a composed Problem would carry, before anyone has named it. */
export function problemMaterial(sources: ProblemSource[]) {
  const targets = [...new Set(sources.flatMap(({ finding }) => finding.suggestedTargets.map((target) => target.id)))];
  const claims = [
    ...new Set(
      sources.flatMap(({ finding }) => [
        ...(finding.proposedClaim ? [finding.proposedClaim.id] : []),
        ...finding.existingClaimCandidates.map((claim) => claim.id),
      ]),
    ),
  ];
  return { targets, claims };
}

/**
 * The Problem an accepted body of research would let somebody name.
 *
 * This composes references and nothing else. The targets are the stages and
 * steps the findings already named, the claims are the ones this same review
 * session creates or cites, and the trace is what proves a person authorized
 * any of it. The title, the summary, and every word of the body stay empty,
 * because a Problem generated from a finding would be invented content wearing
 * the clothes of evidence — the one thing this repository asks nobody to do.
 *
 * Returns nothing when the research named nowhere the trouble bites: `targets`
 * is required, and a problem that bites nowhere is not a problem with this
 * system.
 */
export function composeProblem(sources: ProblemSource[], title: string): ApplyStep | undefined {
  const { targets, claims } = problemMaterial(sources);
  if (sources.length === 0 || targets.length === 0) return undefined;

  const id = problemIdFrom(title) || "the-problem-id";
  const named = title.trim();

  const trace = sources.flatMap(({ run, finding }) => [
    `  - run: ${run.id}`,
    `    decision: ${finding.decisionId}`,
    `    finding: ${finding.id}`,
    `    stance: ${finding.evidenceStance}`,
    `    sources: [${finding.sourceIds.join(", ")}]`,
  ]);

  return {
    action: "create",
    path: `content/problems/${id}.md`,
    explanation:
      "A Problem, carrying the research that says it is real. Everything below the frontmatter is yours to write — and the claims it cites have to land in the same change, or validation will not find them.",
    body: [
      "---",
      `id: ${id}`,
      // An unnamed draft leaves `title` empty on purpose. It fails validation
      // by name, which is the right outcome: a plausible placeholder would pass
      // and put filler in the model, and that is the one thing nothing here is
      // allowed to do.
      named ? `title: ${scalar(named)}` : "title: # write the trouble here, in one sentence",
      `targets: [${targets.join(", ")}]`,
      "status: open",
      ...(claims.length ? [`claims: [${claims.join(", ")}]`] : []),
      "authority: proposed",
      "provenance: { source: public-research, references: [] }",
      "researchTrace:",
      ...trace,
      "---",
      "",
      "# What happens today",
      "",
      "<!-- How the machine runs here now, and where it stops working. -->",
      "",
      "# Why it matters",
      "",
      "<!-- What it costs, and to whom. -->",
      "",
      "# Open questions",
      "",
      "<!-- What you would need to know to be sure. Delete this section if you have none. -->",
      "",
    ].join("\n"),
  };
}

/**
 * An accepted candidate, composed into the thing it proposed.
 *
 * The same discipline as `composeProblem`, arriving from the other direction. A
 * candidate is somebody's structured analysis saying *this should be a Problem*
 * — targets, what it rests on, why it ranks where it does, what would weaken
 * it. All of that is carried. The title is not, because it does not exist: a
 * candidate has a `description`, and turning a description into a name is the
 * judgement that decides whether the model records a trouble or a fix.
 *
 * So the composed file arrives with everything except its first line, and the
 * description sits in a comment beside the empty title, where the person naming
 * it can read what they are naming.
 */
export function composeCandidate(
  run: { id: string },
  candidate: {
    id: string;
    kind: "problem" | "question";
    description: string;
    targets: string[];
    restsOn: string[];
    rationale?: string;
    wouldWeakenIf?: string;
  },
  decision: { id: string },
  title = "",
): ApplyStep {
  const named = title.trim();
  const commented = (value: string) =>
    value
      .trim()
      .split("\n")
      .map((line) => `# ${line}`.trimEnd());

  if (candidate.kind === "question") {
    const id = problemIdFrom(named) || candidate.id;
    return {
      action: "create",
      path: `research/questions/${id}.yaml`,
      explanation:
        "A queued question, composed from an accepted candidate. Write the question itself — the rest is carried from the analysis that proposed it.",
      body: [
        `id: ${id}`,
        named ? `question: ${scalar(named)}` : "question: # the question, as a question, in one sentence",
        `askedBy: ${scalar(`accepted from ${run.id}`)}`,
        "createdAt: # today, as YYYY-MM-DD",
        "status: open",
        "priority: # high | medium | low",
        ...(candidate.targets.length ? [`targets: [${candidate.targets.join(", ")}]`] : []),
        "why: >",
        ...candidate.description
          .trim()
          .split("\n")
          .map((line) => `  ${line.trim()}`),
        "",
      ].join("\n"),
    };
  }

  const id = problemIdFrom(named) || candidate.id;
  return {
    action: "create",
    path: `content/problems/${id}.md`,
    explanation:
      "A Problem, composed from an accepted candidate. What it bites and what it rests on are carried; the name and the body are yours. " +
      PROBLEM_TITLE_RULE,
    body: [
      "---",
      `id: ${id}`,
      named ? `title: ${scalar(named)}` : "title: # write the trouble here, in one sentence",
      `targets: [${candidate.targets.join(", ")}]`,
      "status: open",
      ...(candidate.restsOn.length ? [`claims: [${candidate.restsOn.join(", ")}]`] : []),
      "authority: proposed",
      "provenance: { source: public-research, references: [] }",
      "researchTrace:",
      `  - run: ${run.id}`,
      `    decision: ${decision.id}`,
      `    finding: ${candidate.id}`,
      "    stance: supports",
      "    sources: []",
      "---",
      "",
      "# What happens today",
      "",
      // The proposer's own words, as a comment. Not prose in the file: a
      // description written to be judged is not a description written to be
      // read as the model's account of itself.
      ...commented(candidate.description),
      "",
      ...(candidate.rationale ? ["# Why it matters", "", ...commented(candidate.rationale), ""] : ["# Why it matters", "", "<!-- What it costs, and to whom. -->", ""]),
      "# Open questions",
      "",
      ...(candidate.wouldWeakenIf ? commented(`This would weaken if: ${candidate.wouldWeakenIf}`) : ["<!-- What you would need to know to be sure. -->"]),
      "",
    ].join("\n"),
  };
}
