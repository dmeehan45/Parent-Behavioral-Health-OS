import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { ZodError } from "zod";
import { getRepository } from "@/lib/content/repository";
import { decisionFileSchema, handoffHash, handoffSchema, type DecisionFile, type ResearchHandoff } from "./schema";

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
    unique(handoff.notes.map((note) => note.id), file, "notes.id");
    unique(handoff.questions.map((question) => question.id), file, "questions.id");
    // One namespace, because a decision file names IDs and the reviewer should
    // never have to know which list an ID came from to know what it means.
    unique([...handoff.findings.map((finding) => finding.id), ...handoff.notes.map((note) => note.id)], file, "findings.id and notes.id");

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
    for (const note of handoff.notes) {
      note.sourceIds.forEach((id) => { if (!sourceIds.has(id)) throw new Error(`${file}: notes.${note.id}.sourceIds: '${id}' does not exist`); });
      if (note.note && wordCount(note.note) > 25) throw new Error(`${file}: notes.${note.id}.note: exceeds the 25-word quotation limit`);
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
export function checkHandoffTargets(handoffs: LoadedHandoff[], questionIds?: Set<string>) {
  if (!handoffs.length) return;
  const repo = getRepository();
  const targets = new Set([...repo.stages, ...repo.steps, ...repo.entities, ...repo.claims, ...repo.metrics, ...repo.problems, ...repo.bets].map((item) => item.id));
  const claims = new Set(repo.claims.map((claim) => claim.id));
  for (const { handoff, file } of handoffs) {
    for (const finding of handoff.findings) {
      finding.suggestedTargets.forEach((id) => { if (!targets.has(id)) throw new Error(`${file}: findings.${finding.id}.suggestedTargets: '${id}' does not exist in content/`); });
      finding.existingClaimCandidates?.forEach((id) => { if (!claims.has(id)) throw new Error(`${file}: findings.${finding.id}.existingClaimCandidates: '${id}' does not exist in content/claims/`); });
    }
    // A note's anchor may be a canonical record or a queued question — context
    // gathered for something nobody has answered yet is exactly as useful as
    // context about something already modelled, and refusing the second kind
    // would push a run to invent a record to hang it on.
    for (const note of handoff.notes) {
      note.anchors.forEach((id) => {
        if (targets.has(id) || questionIds?.has(id)) return;
        throw new Error(
          `${file}: notes.${note.id}.anchors: '${id}' is neither a record in content/ nor a question in research/questions/. ` +
            `A note has to be context for something, or nothing will ever find it again.`,
        );
      });
    }
  }
}

export function decisionId(runId: string, findingId: string) {
  return `decide-${runId}-${findingId}`;
}

/** Runs in the order they were created, so "earlier" is well defined. */
function chronological(handoffs: LoadedHandoff[]) {
  return [...handoffs].sort((a, b) => {
    const byDate = a.handoff.run.createdAt.getTime() - b.handoff.run.createdAt.getTime();
    return byDate !== 0 ? byDate : a.handoff.run.id.localeCompare(b.handoff.run.id);
  });
}

/** Loose enough to catch a restatement, strict enough to stay deterministic. */
function statementKey(statement: string) {
  return statement.toLowerCase().replace(/[\s]+/g, " ").replace(/[.;:,!?]+$/, "").trim();
}

/**
 * Stop a scheduled run from rediscovering what an earlier run already found.
 *
 * An agent researching twice a day against the same public sources will
 * resurface the same statement indefinitely, and every repeat costs a reviewer
 * the same attention as something new. Only an exact restatement is an error:
 * deciding whether two differently-worded findings are the same claim is
 * semantics, and deterministic tooling here never resolves semantics. Softer
 * overlap is reported instead — see `sourceOverlap`.
 */
export function checkForRepeatedFindings(handoffs: LoadedHandoff[]) {
  const seen = new Map<string, { run: string; finding: string }>();
  for (const { handoff, file } of chronological(handoffs)) {
    for (const finding of handoff.findings) {
      const key = statementKey(finding.statement);
      const prior = seen.get(key);
      if (prior && prior.run !== handoff.run.id) {
        throw new Error(
          `${file}: findings.${finding.id}: run '${prior.run}' already recorded this statement as '${prior.finding}'. ` +
            `A later run either supersedes that decision, cites the earlier finding and qualifies it, or drops it. ` +
            `Run npm run research:brief -- ${handoff.run.id} before researching to see what previous runs established.`,
        );
      }
      if (!prior) seen.set(key, { run: handoff.run.id, finding: finding.id });
    }
  }
}

/**
 * Where a run went over ground an earlier run already covered.
 *
 * Reported rather than rejected: re-reading a source to qualify or contradict
 * what it was previously taken to say is exactly what a second run is for. The
 * reviewer wants to know it happened, not to be stopped.
 */
export function sourceOverlap(handoffs: LoadedHandoff[]) {
  const firstSeen = new Map<string, string>();
  const overlaps: Array<{ run: string; identity: string; earlier: string }> = [];
  for (const { handoff } of chronological(handoffs)) {
    for (const source of handoff.sources) {
      const earlier = firstSeen.get(source.identity);
      if (earlier && earlier !== handoff.run.id) overlaps.push({ run: handoff.run.id, identity: source.identity, earlier });
      else if (!earlier) firstSeen.set(source.identity, handoff.run.id);
    }
  }
  return overlaps;
}

/**
 * Every decision that a later decision has replaced.
 *
 * This is what makes a run genuinely separate from the last one: run two can
 * retire run one's conclusion, and a canonical record that still cites the
 * retired decision stops validating. Without it, superseding would be a note
 * in a file rather than a change to what the model is allowed to claim.
 */
export function supersededDecisions(loaded: LoadedDecisions[]) {
  const superseded = new Map<string, string>();
  for (const { decisions: record } of loaded) {
    for (const decision of record.decisions) {
      if (decision.supersedes) superseded.set(decision.supersedes, decision.id);
    }
  }
  return superseded;
}

export function checkSupersedes(handoffs: LoadedHandoff[], loaded: LoadedDecisions[]) {
  const order = new Map(chronological(handoffs).map((entry, index) => [entry.handoff.run.id, index]));
  const everyDecision = new Map<string, string>();
  for (const { decisions: record } of loaded) {
    for (const decision of record.decisions) everyDecision.set(decision.id, record.runId);
  }

  for (const { decisions: record, file } of loaded) {
    for (const decision of record.decisions) {
      if (!decision.supersedes) continue;
      const supersededRun = everyDecision.get(decision.supersedes);
      if (!supersededRun) {
        throw new Error(`${file}: decisions.${decision.id}.supersedes: '${decision.supersedes}' is not a decision anyone has recorded`);
      }
      if (supersededRun === record.runId) {
        throw new Error(
          `${file}: decisions.${decision.id}.supersedes: '${decision.supersedes}' is a decision in this same run. ` +
            `Superseding replaces an earlier run's conclusion; within one run, decide once.`,
        );
      }
      if ((order.get(supersededRun) ?? 0) > (order.get(record.runId) ?? 0)) {
        throw new Error(
          `${file}: decisions.${decision.id}.supersedes: run '${supersededRun}' is newer than run '${record.runId}'. ` +
            `A run cannot supersede a conclusion reached after it.`,
        );
      }
    }
  }
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
          `Re-read the run at /review/${record.runId} and copy the new hash (${handoff.hash}) ` +
          `once the decisions below still hold.`,
      );
    }
    const expected = new Set(handoff.handoff.findings.map((finding) => decisionId(record.runId, finding.id)));
    unique(record.decisions.map((decision) => decision.id), file, "decisions.id");
    record.decisions.forEach((decision) => {
      if (!expected.has(decision.id)) throw new Error(`${file}: decisions.id '${decision.id}' is not a decision in ${handoff.file}`);
      if (["reject", "defer", "needs-research"].includes(decision.disposition) && !decision.rationale?.trim()) throw new Error(`${file}: decisions.${decision.id}.rationale is required for '${decision.disposition}'`);
      if (decision.disposition === "accept-with-edits" && !decision.editedRecommendation?.trim()) throw new Error(`${file}: decisions.${decision.id}.editedRecommendation is required for 'accept-with-edits'`);
    });

    if (record.notes) {
      const noteIds = new Set(handoff.handoff.notes.map((note) => note.id));
      if (!noteIds.size) throw new Error(`${file}: notes: ${handoff.file} carries no notes to disposition`);
      unique(record.notes.except, file, "notes.except");
      record.notes.except.forEach((id) => {
        if (noteIds.has(id)) return;
        // The likeliest mistake is naming a finding here, which would quietly
        // do nothing — a finding's disposition lives in `decisions`.
        const isFinding = handoff.handoff.findings.some((finding) => finding.id === id);
        throw new Error(
          `${file}: notes.except: '${id}' is not a note in ${handoff.file}` +
            (isFinding ? ` — it is a finding, and findings are dispositioned one at a time under 'decisions'` : ""),
        );
      });
    }
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
  const notedRun = new Set(loaded.filter((record) => record.decisions.notes).map((record) => record.decisions.runId));
  const undecided: string[] = [];
  const unnotedRuns: string[] = [];
  let findings = 0;
  let notes = 0;
  let runsWithNotes = 0;
  for (const { handoff } of handoffs) {
    const answered = decided.get(handoff.run.id) ?? new Set<string>();
    for (const finding of handoff.findings) {
      findings += 1;
      const id = decisionId(handoff.run.id, finding.id);
      if (!answered.has(id)) undecided.push(id);
    }
    // Notes are counted per run, not per note, because one line disposes of the
    // whole set. Counting them individually would report a hundred notes as a
    // hundred pieces of debt when they are one decision.
    if (handoff.notes.length) {
      notes += handoff.notes.length;
      runsWithNotes += 1;
      if (!notedRun.has(handoff.run.id)) unnotedRuns.push(handoff.run.id);
    }
  }
  return {
    findings,
    decided: findings - undecided.length,
    undecided,
    notes,
    runsWithNotes,
    notedRuns: runsWithNotes - unnotedRuns.length,
    unnotedRuns,
  };
}
