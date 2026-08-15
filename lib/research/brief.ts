import type { Repository } from "@/lib/content/repository";
import { decisionId, sourceOverlap, supersededDecisions, type LoadedDecisions, type LoadedHandoff } from "./intake";
import type { QueueItem } from "./questions";

/**
 * What a run is told before it starts.
 *
 * This is the prevention half of keeping runs separate. Detection — an exact
 * restatement of an earlier finding is rejected, a reused source is reported —
 * catches a repeat after the work is done and a reviewer's attention has
 * already been spent. The brief stops the repeat being produced: it hands the
 * next run every statement previous runs established, every source they read,
 * and every conclusion the reviewer rejected, so "what is already known" is an
 * input to the research rather than something the reviewer has to notice.
 */
export function renderBrief(
  item: QueueItem | undefined,
  question: string,
  repo: Repository,
  handoffs: LoadedHandoff[],
  decisions: LoadedDecisions[],
) {
  const superseded = supersededDecisions(decisions);
  const dispositions = new Map<string, { disposition: string; rationale?: string }>();
  for (const { decisions: record } of decisions) {
    for (const decision of record.decisions) dispositions.set(decision.id, decision);
  }

  const lines = [
    `# Research brief: ${item?.id ?? "unqueued question"}`,
    "",
    "## Question",
    "",
    question,
    "",
  ];

  if (item?.why) lines.push("## Why it was asked", "", item.why, "");

  if (item?.targets.length) {
    lines.push("## What it bites", "");
    for (const id of item.targets) {
      const record = [...repo.stages, ...repo.steps, ...repo.problems, ...repo.bets, ...repo.claims, ...repo.metrics, ...repo.entities].find(
        (candidate) => candidate.id === id,
      );
      lines.push(`- \`${id}\`${record && "title" in record ? ` — ${record.title}` : ""}`);
    }
    lines.push("");
  }

  lines.push(
    "## Already established",
    "",
    "Do not restate any of this. A run that reaches the same statement as an earlier run is rejected by validation.",
    "If one of these is wrong, say so as a `conflicting` finding and have the reviewer supersede the decision behind it.",
    "",
  );

  const established: string[] = [];
  for (const { handoff } of handoffs) {
    for (const finding of handoff.findings) {
      const id = decisionId(handoff.run.id, finding.id);
      const decision = dispositions.get(id);
      const replaced = superseded.get(id);
      const state = replaced
        ? `superseded by ${replaced}`
        : decision
          ? decision.disposition
          : "not yet reviewed";
      established.push(
        `- **${finding.statement}**  \n  run \`${handoff.run.id}\`, finding \`${finding.id}\`, decision **${state}**` +
          (decision?.rationale ? `  \n  reviewer: ${decision.rationale}` : ""),
      );
    }
  }
  lines.push(established.length ? established.join("\n") : "Nothing yet — this is early research.", "");

  // Context earlier runs gathered about the same territory. This is the payoff
  // for anchoring: a note accepted cheaply months ago reaches the next run that
  // touches what it was anchored to, without anybody remembering it exists.
  // Scoped to the question's own targets when it has them, because every note
  // in the repository is not context for every question.
  const scope = new Set(item?.targets ?? []);
  const relevantNotes = handoffs.flatMap(({ handoff }) =>
    handoff.notes
      .filter((note) => !scope.size || note.anchors.some((anchor) => scope.has(anchor) || anchor === item?.id))
      .map((note) => ({ run: handoff.run.id, note })),
  );
  if (relevantNotes.length) {
    lines.push(
      "## Context already gathered",
      "",
      "Background from earlier runs, anchored to what this question bites. None of it is something the model claims,",
      "and none of it has been cited as evidence — but do not spend this run rediscovering it.",
      "",
      ...relevantNotes.map(({ run, note }) => `- ${note.statement}  \n  run \`${run}\`, note \`${note.id}\``),
      "",
    );
  }

  const identities = new Map<string, { title: string; runs: string[] }>();
  for (const { handoff } of handoffs) {
    for (const source of handoff.sources) {
      const entry = identities.get(source.identity) ?? { title: source.title, runs: [] };
      entry.runs.push(handoff.run.id);
      identities.set(source.identity, entry);
    }
  }
  lines.push(
    "## Sources already read",
    "",
    "Reusing one is allowed and reported, not blocked — re-reading a source to qualify what it was taken to say is what a later run is for.",
    "",
  );
  lines.push(
    identities.size
      ? [...identities.entries()].map(([identity, entry]) => `- \`${identity}\` — ${entry.title} (${entry.runs.join(", ")})`).join("\n")
      : "None yet.",
    "",
  );

  const overlaps = sourceOverlap(handoffs);
  if (overlaps.length) {
    lines.push(
      "## Existing overlap",
      "",
      ...overlaps.map((overlap) => `- run \`${overlap.run}\` re-read \`${overlap.identity}\`, first read by \`${overlap.earlier}\``),
      "",
    );
  }

  lines.push(
    "## What to produce",
    "",
    `Write one handoff at \`research/handoffs/<run-id>.yaml\` following \`research/contract/v1.example.yaml\`.`,
    item ? `Set \`run.answers: [${item.id}]\`.` : "Leave `run.answers` out; this question is not queued.",
    "Quote no more than 25 words from any one source. Commit no transcript, no private material, and nothing identifying a real person.",
    "",
    "Two kinds of output, and choosing correctly is most of what makes a run cheap to review:",
    "",
    "- a **finding** proposes something the model might come to believe. It costs the reviewer a judgement, one at a time.",
    "- a **note** is context that changes no claim — a source worth knowing, a definition, how something is usually done.",
    "  Notes are dispositioned as a set, so they are nearly free. Each must be anchored to a record or a queued question.",
    "",
    "When in doubt, propose a finding. A note that turns out to need its own judgement is a finding you filed wrong.",
    "",
    "Branch from `main`, commit that one file, and open a pull request. Nothing else belongs in an intake:",
    "the review packet is derived, and CI renders it onto the pull request for the reviewer to read.",
    "If you can run commands here, `npm run validate:research` and `npm run scan:safety` say the same thing sooner.",
    "",
  );

  return `${lines.join("\n").trimEnd()}\n`;
}
