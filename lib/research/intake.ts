import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { ZodError } from "zod";
import { getRepository } from "@/lib/content/repository";
import { decisionFileSchema, handoffSchema, type DecisionFile, type ResearchHandoff } from "./schema";

export type LoadedHandoff = { handoff: ResearchHandoff; file: string; hash: string };

function explain(file: string, error: ZodError) {
  return new Error(error.issues.map((issue) => `${file}: ${issue.path.join(".") || "document"}: ${issue.message}`).join("\n"));
}

function parseFile<T>(file: string, parser: { parse(value: unknown): T }): T {
  try {
    return parser.parse(yaml.load(fs.readFileSync(file, "utf8")));
  } catch (error) {
    if (error instanceof ZodError) throw explain(path.relative(process.cwd(), file), error);
    throw error;
  }
}

function unique(values: string[], file: string, field: string) {
  const duplicate = values.find((value, index) => values.indexOf(value) !== index);
  if (duplicate) throw new Error(`${file}: ${field}: duplicate ID '${duplicate}'`);
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function handoffHash(handoff: ResearchHandoff) {
  return crypto.createHash("sha256").update(JSON.stringify(handoff)).digest("hex");
}

export function loadHandoffs(root = process.cwd()): LoadedHandoff[] {
  const directory = path.join(root, "research", "handoffs");
  if (!fs.existsSync(directory)) return [];
  const loaded = fs.readdirSync(directory).filter((name) => /\.ya?ml$/.test(name)).sort().map((name) => {
    const absolute = path.join(directory, name);
    const handoff = parseFile(absolute, handoffSchema);
    const file = path.relative(root, absolute);
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

    const repo = getRepository();
    const targets = new Set([...repo.stages, ...repo.steps, ...repo.entities, ...repo.claims, ...repo.metrics, ...repo.problems, ...repo.bets].map((item) => item.id));
    const claims = new Set(repo.claims.map((claim) => claim.id));
    const sourceIds = new Set(handoff.sources.map((source) => source.id));
    for (const finding of handoff.findings) {
      finding.sourceIds.forEach((id) => { if (!sourceIds.has(id)) throw new Error(`${file}: findings.${finding.id}.sourceIds: '${id}' does not exist`); });
      finding.suggestedTargets.forEach((id) => { if (!targets.has(id)) throw new Error(`${file}: findings.${finding.id}.suggestedTargets: '${id}' does not exist`); });
      finding.existingClaimCandidates?.forEach((id) => { if (!claims.has(id)) throw new Error(`${file}: findings.${finding.id}.existingClaimCandidates: '${id}' does not exist`); });
      if (finding.extract && wordCount(finding.extract) > 25) throw new Error(`${file}: findings.${finding.id}.extract: exceeds the 25-word quotation limit`);
      if (["duplicate", "qualifying"].includes(finding.classification) && !finding.existingClaimCandidates?.length) throw new Error(`${file}: findings.${finding.id}.existingClaimCandidates: required for ${finding.classification} findings`);
      if (!finding.generalizedApplicability && finding.proposedClaim) throw new Error(`${file}: findings.${finding.id}.proposedClaim: out-of-scope findings cannot propose canonical Claims`);
    }
    return { handoff, file, hash: handoffHash(handoff) };
  });
  unique(loaded.map(({ handoff }) => handoff.run.id), "research/handoffs", "run.id");
  return loaded;
}

export function decisionId(runId: string, findingId: string) {
  return `decide-${runId}-${findingId}`;
}

export function loadDecisions(root = process.cwd()): DecisionFile[] {
  const directory = path.join(root, "research", "decisions");
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((name) => /\.ya?ml$/.test(name)).sort().map((name) => parseFile(path.join(directory, name), decisionFileSchema));
}

export function validateDecisions(handoffs: LoadedHandoff[], decisions: DecisionFile[]) {
  const byRun = new Map(handoffs.map((loaded) => [loaded.handoff.run.id, loaded]));
  for (const file of decisions) {
    const loaded = byRun.get(file.runId);
    if (!loaded) throw new Error(`research/decisions/${file.runId}.yaml: runId '${file.runId}' does not exist`);
    if (file.reviewedHandoffHash !== loaded.hash) throw new Error(`research/decisions/${file.runId}.yaml: reviewedHandoffHash is stale; regenerate the review packet and review this revision`);
    const expected = new Set(loaded.handoff.findings.map((finding) => decisionId(file.runId, finding.id)));
    unique(file.decisions.map((decision) => decision.id), `research/decisions/${file.runId}.yaml`, "decisions.id");
    file.decisions.forEach((decision) => {
      if (!expected.has(decision.id)) throw new Error(`research/decisions/${file.runId}.yaml: decisions.id '${decision.id}' is not in the handoff`);
      if (["reject", "defer", "needs-research"].includes(decision.disposition) && !decision.rationale?.trim()) throw new Error(`research/decisions/${file.runId}.yaml: decisions.${decision.id}.rationale is required`);
      if (decision.disposition === "accept-with-edits" && !decision.editedRecommendation?.trim()) throw new Error(`research/decisions/${file.runId}.yaml: decisions.${decision.id}.editedRecommendation is required`);
    });
  }
}
