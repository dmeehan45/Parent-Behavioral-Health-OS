import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { ZodError } from "zod";
import { getRepository } from "@/lib/content/repository";
import { decisionFileSchema, handoffSchema, type DecisionFile, type ResearchHandoff } from "./schema";

export type LoadedHandoff = { handoff: ResearchHandoff; file: string; hash: string };
export type LoadedDecisions = { decisions: DecisionFile; file: string };

export const HANDOFF_DIRECTORY = path.join("research", "handoffs");
export const DECISION_DIRECTORY = path.join("research", "decisions");

function explain(file: string, error: ZodError) {
  return new Error(error.issues.map((issue) => `${file}: ${issue.path.join(".") || "document"}: ${issue.message}`).join("\n"));
}

/**
 * A handoff is usually written by a conversational agent, so a YAML syntax
 * error is a likely first failure. `js-yaml` reports the reason and the line
 * but not the file, which is useless when the reader is pasting CI output back
 * into a chat window to get the file corrected.
 */
function readYaml(absolute: string, file: string): unknown {
  const text = fs.readFileSync(absolute, "utf8");
  try {
    return yaml.load(text);
  } catch (error) {
    const problem = error as { reason?: string; mark?: { line?: number } };
    const where = typeof problem.mark?.line === "number" ? ` at line ${problem.mark.line + 1}` : "";
    throw new Error(`${file}: not valid YAML${where}: ${problem.reason ?? (error as Error).message}`);
  }
}

function parseFile<T>(absolute: string, file: string, parser: { parse(value: unknown): T }): T {
  try {
    return parser.parse(readYaml(absolute, file));
  } catch (error) {
    if (error instanceof ZodError) throw explain(file, error);
    throw error;
  }
}

function unique(values: string[], file: string, field: string) {
  const duplicate = values.find((value, index) => values.indexOf(value) !== index);
  if (duplicate) throw new Error(`${file}: ${field}: duplicate ID '${duplicate}'`);
}

/**
 * The run ID is the only thing tying a handoff, its generated review packet,
 * its decision file, and a canonical `researchTrace` together. When the file
 * name drifts from the ID, the packet lands under a name unrelated to the
 * handoff and the documented "reuse the run ID" retry stops being detectable.
 */
function requireFileName(directory: string, name: string, id: string, field: string) {
  const stem = name.replace(/\.ya?ml$/, "");
  if (stem === id) return;
  throw new Error(
    `${path.join(directory, name)}: ${field} '${id}' does not match the file name. ` +
      `Rename the file to ${path.join(directory, `${id}.yaml`)} — the run ID is what ties a handoff to its review packet, ` +
      `its decisions, and any canonical record that later cites it.`,
  );
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function handoffHash(handoff: ResearchHandoff) {
  return crypto.createHash("sha256").update(JSON.stringify(handoff)).digest("hex");
}

/**
 * Parse every handoff and check it against itself.
 *
 * This deliberately does not touch `content/`. Cross-referencing suggested
 * targets is a separate pass — see `checkHandoffTargets` — so that a reviewer
 * working on a decision file gets told about the decision file rather than
 * about whatever content error a full repository read surfaces first.
 */
export function loadHandoffs(root = process.cwd()): LoadedHandoff[] {
  const directory = path.join(root, HANDOFF_DIRECTORY);
  if (!fs.existsSync(directory)) return [];
  const loaded = fs.readdirSync(directory).filter((name) => /\.ya?ml$/.test(name)).sort().map((name) => {
    const absolute = path.join(directory, name);
    const file = path.relative(root, absolute);
    const handoff = parseFile(absolute, file, handoffSchema);
    requireFileName(HANDOFF_DIRECTORY, name, handoff.run.id, "run.id");
    unique(handoff.sources.map((source) => source.id), file, "sources.id");
    unique(handoff.findings.map((finding) => finding.id), file, "findings.id");
    unique(handoff.questions.map((question) => question.id), file, "questions.id");

    const identities = new Map<string, string>();
    for (const source of handoff.sources) {
      const prior = identities.get(source.identity);
      if (prior && prior !== JSON.stringify(source.locator)) {
        throw new Error(`${file}: sources.identity: '${source.identity}' has conflicting locators`);
      }
      identities.set(source.identity, JSON.stringify(source.locator));
    }

    const sourceIds = new Set(handoff.sources.map((source) => source.id));
    for (const finding of handoff.findings) {
      finding.sourceIds.forEach((id) => { if (!sourceIds.has(id)) throw new Error(`${file}: findings.${finding.id}.sourceIds: '${id}' does not exist`); });
      if (finding.extract && wordCount(finding.extract) > 25) throw new Error(`${file}: findings.${finding.id}.extract: exceeds the 25-word quotation limit`);
      if (["duplicate", "qualifying"].includes(finding.classification) && !finding.existingClaimCandidates?.length) throw new Error(`${file}: findings.${finding.id}.existingClaimCandidates: required for ${finding.classification} findings`);
      if (!finding.generalizedApplicability && finding.proposedClaim) throw new Error(`${file}: findings.${finding.id}.proposedClaim: out-of-scope findings cannot propose canonical Claims`);
    }
    return { handoff, file, hash: handoffHash(handoff) };
  });
  unique(loaded.map(({ handoff }) => handoff.run.id), HANDOFF_DIRECTORY, "run.id");
  return loaded;
}

/**
 * Check the IDs a handoff points at against the canonical model.
 *
 * Separate from parsing, and reading `content/` exactly once however many
 * handoffs there are: the previous shape re-read and re-validated the whole
 * repository per handoff file, which is quadratic once research accumulates.
 */
export function checkHandoffTargets(handoffs: LoadedHandoff[]) {
  if (!handoffs.length) return;
  const repo = getRepository();
  const targets = new Set([...repo.stages, ...repo.steps, ...repo.entities, ...repo.claims, ...repo.metrics, ...repo.problems, ...repo.bets].map((item) => item.id));
  const claims = new Set(repo.claims.map((claim) => claim.id));
  for (const { handoff, file } of handoffs) {
    for (const finding of handoff.findings) {
      finding.suggestedTargets.forEach((id) => { if (!targets.has(id)) throw new Error(`${file}: findings.${finding.id}.suggestedTargets: '${id}' does not exist in content/`); });
      finding.existingClaimCandidates?.forEach((id) => { if (!claims.has(id)) throw new Error(`${file}: findings.${finding.id}.existingClaimCandidates: '${id}' does not exist in content/claims/`); });
    }
  }
}

export function decisionId(runId: string, findingId: string) {
  return `decide-${runId}-${findingId}`;
}

export function loadDecisions(root = process.cwd()): LoadedDecisions[] {
  const directory = path.join(root, DECISION_DIRECTORY);
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((name) => /\.ya?ml$/.test(name)).sort().map((name) => {
    const absolute = path.join(directory, name);
    const file = path.relative(root, absolute);
    const decisions = parseFile(absolute, file, decisionFileSchema);
    requireFileName(DECISION_DIRECTORY, name, decisions.runId, "runId");
    return { decisions, file };
  });
}

export function validateDecisions(handoffs: LoadedHandoff[], loaded: LoadedDecisions[]) {
  const byRun = new Map(handoffs.map((handoff) => [handoff.handoff.run.id, handoff]));
  for (const { decisions: record, file } of loaded) {
    const handoff = byRun.get(record.runId);
    if (!handoff) throw new Error(`${file}: runId '${record.runId}' has no handoff in ${HANDOFF_DIRECTORY}/`);
    if (record.reviewedHandoffHash !== handoff.hash) {
      throw new Error(
        `${file}: reviewedHandoffHash is stale. The handoff has changed since it was reviewed. ` +
          `Run npm run generate:research-review, re-read ${path.join("research", "reviews", `${record.runId}.md`)}, ` +
          `and copy the new hash (${handoff.hash}) once the decisions below still hold.`,
      );
    }
    const expected = new Set(handoff.handoff.findings.map((finding) => decisionId(record.runId, finding.id)));
    unique(record.decisions.map((decision) => decision.id), file, "decisions.id");
    record.decisions.forEach((decision) => {
      if (!expected.has(decision.id)) throw new Error(`${file}: decisions.id '${decision.id}' is not a decision in ${handoff.file}`);
      if (["reject", "defer", "needs-research"].includes(decision.disposition) && !decision.rationale?.trim()) throw new Error(`${file}: decisions.${decision.id}.rationale is required for '${decision.disposition}'`);
      if (decision.disposition === "accept-with-edits" && !decision.editedRecommendation?.trim()) throw new Error(`${file}: decisions.${decision.id}.editedRecommendation is required for 'accept-with-edits'`);
    });
  }
}

/**
 * How much of the research already in the repository has actually been reviewed.
 *
 * Undecided findings are not an error — a review can be partial, and a run can
 * sit waiting for a reviewer. They are review debt, so the validator reports
 * them rather than either failing or hiding them.
 */
export function reviewCoverage(handoffs: LoadedHandoff[], loaded: LoadedDecisions[]) {
  const decided = new Map(loaded.map((record) => [record.decisions.runId, new Set(record.decisions.decisions.map((decision) => decision.id))]));
  const undecided: string[] = [];
  let findings = 0;
  for (const { handoff } of handoffs) {
    const answered = decided.get(handoff.run.id) ?? new Set<string>();
    for (const finding of handoff.findings) {
      findings += 1;
      const id = decisionId(handoff.run.id, finding.id);
      if (!answered.has(id)) undecided.push(id);
    }
  }
  return { findings, decided: findings - undecided.length, undecided };
}
