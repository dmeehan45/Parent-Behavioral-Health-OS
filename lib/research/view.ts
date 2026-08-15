import type { Tone } from "@/lib/model/types";

/**
 * Everything the review interface needs that is not read off the filesystem.
 *
 * `lib/research/projection.ts` reads `research/` and is server-only, the same
 * way `lib/model/graph.ts` is. The decision composer is a client component, so
 * the shapes and the vocabulary it renders live on this side of the boundary.
 */

export const DISPOSITIONS = ["accept", "accept-with-edits", "reject", "defer", "needs-research"] as const;
export type Disposition = (typeof DISPOSITIONS)[number];

/**
 * What each disposition commits the reviewer to.
 *
 * The review is where a person's own thinking gets sharpened, so the interface
 * says what the words mean rather than assuming the reviewer remembers. These
 * describe the contract, not any particular run, which is why they can live in
 * code.
 */
export const DISPOSITION_MEANING: Record<Disposition, string> = {
  accept: "This is right, and the model should change to reflect it. Authorizes a later canonical edit.",
  "accept-with-edits": "Right in substance, wrong as written. Say what the model should say instead.",
  reject: "Not true, not relevant, or not good enough evidence. Say why, so a later run does not repeat it.",
  defer: "Might be right; not worth acting on now. Say what would make it worth revisiting.",
  "needs-research": "Not answerable on this evidence. Say what would settle it.",
};

export const DISPOSITION_TONE: Record<Disposition, Tone> = {
  accept: "evidence",
  "accept-with-edits": "evidence",
  reject: "warn",
  defer: "quiet",
  "needs-research": "accent",
};

/** Dispositions that authorize a canonical change. */
export const AUTHORIZING: Disposition[] = ["accept", "accept-with-edits"];

export function requiresRationale(disposition: Disposition) {
  return ["reject", "defer", "needs-research"].includes(disposition);
}

export function requiresEditedRecommendation(disposition: Disposition) {
  return disposition === "accept-with-edits";
}

export const CLASSIFICATION_MEANING: Record<string, string> = {
  new: "The run believes nothing in the model says this yet.",
  duplicate: "The run believes an existing Claim already says this.",
  qualifying: "The run believes this narrows or conditions an existing Claim.",
  conflicting: "The run believes this contradicts something the model holds.",
  "out-of-scope": "Company-specific or otherwise outside this generalized model.",
};

export const QUALITY_MEANING: Record<string, string> = {
  primary: "The source is the evidence itself.",
  secondary: "The source reports on evidence gathered elsewhere.",
  "expert-opinion": "A qualified person's judgement, not a measurement.",
  unknown: "The run could not tell.",
};

export type ReviewSource = {
  id: string;
  identity: string;
  kind: string;
  title: string;
  access: string;
  locator: string;
  url?: string;
  /** Earlier runs that read the same source. */
  alsoReadBy: string[];
};

export type PriorArt = {
  run: string;
  finding: string;
  statement: string;
  state: string;
};

/**
 * Where a finding has got to, in one word.
 *
 * `accepted` and `applied` are deliberately different states. A reviewer
 * accepting a finding authorizes a change to the model; it does not make one.
 * Without somewhere to see the gap between the two, accepted research quietly
 * piles up having changed nothing, which is the failure this whole arrangement
 * is otherwise designed to prevent.
 */
export type FindingState = "awaiting" | "accepted" | "applied" | "rejected" | "deferred" | "needs-research" | "superseded";

export const FINDING_STATE_LABEL: Record<FindingState, string> = {
  awaiting: "awaiting review",
  accepted: "accepted, not yet in the model",
  applied: "in the model",
  rejected: "rejected",
  deferred: "deferred",
  "needs-research": "needs more research",
  superseded: "superseded",
};

export const FINDING_STATE_TONE: Record<FindingState, Tone> = {
  awaiting: "warn",
  accepted: "accent",
  applied: "evidence",
  rejected: "quiet",
  deferred: "quiet",
  "needs-research": "accent",
  superseded: "quiet",
};

export type ReviewFinding = {
  id: string;
  decisionId: string;
  statement: string;
  classification: string;
  evidenceStance: string;
  evidenceQuality: string;
  generalizedApplicability: boolean;
  sourceIds: string[];
  suggestedTargets: Array<{ id: string; title: string; href: string; kind: string }>;
  existingClaimCandidates: Array<{ id: string; statement: string; href: string }>;
  proposedClaim?: { id: string; statement: string };
  extract?: string;
  uncertainty?: string;
  priorArt: PriorArt[];
  decision?: { disposition: string; rationale?: string; editedRecommendation?: string; supersedes?: string };
  supersededBy?: string;
  /** Canonical records whose `researchTrace` cites this finding's decision. */
  appliedIn: Array<{ id: string; title: string; href: string; kind: string }>;
  state: FindingState;
};

/**
 * A disposition is what the reviewer chose; a state is where the finding got
 * to. They are close enough to be mistaken for each other and are not the same
 * list — mapping them by cast rendered an empty badge for every rejected and
 * deferred finding.
 */
const STATE_OF_DISPOSITION: Record<string, FindingState> = {
  reject: "rejected",
  defer: "deferred",
  "needs-research": "needs-research",
};

export function findingState(finding: {
  decision?: { disposition: string };
  supersededBy?: string;
  appliedIn: unknown[];
}): FindingState {
  if (finding.supersededBy) return "superseded";
  if (!finding.decision) return "awaiting";
  if (AUTHORIZING.includes(finding.decision.disposition as Disposition)) {
    return finding.appliedIn.length ? "applied" : "accepted";
  }
  return STATE_OF_DISPOSITION[finding.decision.disposition] ?? "awaiting";
}

export type ReviewRun = {
  id: string;
  question: string;
  synthesis: string;
  createdAt: string;
  preparedBy: string;
  provenance: string;
  hash: string;
  file: string;
  decisionFile: string;
  answers: Array<{ id: string; question: string }>;
  sources: ReviewSource[];
  findings: ReviewFinding[];
  notes: ReviewNote[];
  /** How the reviewer dispositioned this run's notes, as a set. */
  notesDecision?: { disposition: "noted" | "discard"; except: string[]; rationale?: string };
  openQuestions: Array<{ id: string; question: string }>;
  reviewer?: string;
  decided: number;
  total: number;
};

/** Context that changes no claim, anchored to what it is context for. */
export type ReviewNote = {
  id: string;
  statement: string;
  sourceIds: string[];
  anchors: Array<{ id: string; title: string; href: string; kind: string }>;
  note?: string;
  /** `kept` once a reviewer has said so; `discarded` if they said the opposite. */
  state: "awaiting" | "kept" | "discarded";
};

/** A question waiting to be researched, or a gap the model has in itself. */
export type QueueEntry = {
  kind: "question" | "gap";
  id: string;
  question: string;
  detail: string;
  /** For a gap, the record it is about. */
  subject?: { id: string; title: string; href: string; kind: string };
  /** Titles of bets that named this question as something they are waiting on. */
  blocking?: string[];
};

export type ReviewIndex = {
  runs: ReviewRun[];
  /** Accepted decisions from earlier runs, offered as supersede targets. */
  supersedable: Array<{ id: string; run: string; statement: string }>;
  /** What a run should pick up next: asked questions first, then model gaps. */
  queue: QueueEntry[];
  sourceUrl?: string;
};

export function runStatus(run: ReviewRun): { label: string; tone: Tone } {
  if (run.total === 0) return { label: "nothing to review", tone: "quiet" };
  if (run.decided === 0) return { label: "awaiting review", tone: "warn" };
  if (run.decided < run.total) return { label: `${run.decided} of ${run.total} reviewed`, tone: "accent" };
  return { label: "reviewed", tone: "evidence" };
}

/** Every finding across every run, flattened, with its run for context. */
export function allFindings(runs: ReviewRun[]) {
  return runs.flatMap((run) => run.findings.map((finding) => ({ run, finding })));
}

/** Research that names this record as somewhere it would land, or already has. */
export function researchAbout(runs: ReviewRun[], nodeId: string) {
  return allFindings(runs).filter(
    ({ finding }) =>
      finding.suggestedTargets.some((target) => target.id === nodeId) ||
      finding.appliedIn.some((record) => record.id === nodeId),
  );
}

/**
 * Context anchored to this record.
 *
 * Discarded notes are excluded and notes still awaiting a reviewer are not —
 * an undecided note is ordinary staging, the same as an undecided finding, and
 * the record page labels it as such. A note a reviewer threw out should stop
 * appearing, which is what makes `discard` worth having.
 */
export function notesAbout(runs: ReviewRun[], nodeId: string) {
  return runs.flatMap((run) =>
    run.notes
      .filter((note) => note.state !== "discarded" && note.anchors.some((anchor) => anchor.id === nodeId))
      .map((note) => ({ run, note })),
  );
}
