import fs from "node:fs";
import path from "node:path";
import { decisionId, DECISION_DIRECTORY, type LoadedHandoff } from "./intake";

const allowed = "accept | reject | defer | needs-research | accept-with-edits";

/**
 * Marks a file in `research/reviews/` as this generator's output.
 *
 * Regeneration removes packets for handoffs that no longer exist, and this is
 * what stops it removing anything else a person put in that directory.
 */
export const GENERATED_MARKER = "Generated from handoff hash";

/**
 * The copy-paste decision file.
 *
 * The reviewer's step is the one human step in the loop, and hand-assembling
 * YAML around a 64-character hash is the slowest part of it. The packet that
 * asks for the decisions also carries the skeleton that answers them, with the
 * hash already filled in and every disposition left as an unparseable `TODO`
 * so an uncorrected paste fails validation rather than rubber-stamping a run.
 */
function decisionSkeleton({ handoff, hash }: LoadedHandoff) {
  const lines = [
    "## Recording decisions",
    "",
    `Copy this into \`${path.join(DECISION_DIRECTORY, `${handoff.run.id}.yaml`)}\`, replace every \`TODO\`, and run \`npm run validate:research\`.`,
    "",
    "```yaml",
    "contractVersion: 1",
    `runId: ${handoff.run.id}`,
    `reviewedHandoffHash: ${hash}`,
    "reviewer: TODO who is accountable for this decision",
    "decidedAt: TODO today, as YYYY-MM-DD",
    "decidedVia: review   # or 'conversation', if the reviewer decided in the chat",
    "decisions:",
  ];
  for (const finding of handoff.findings) {
    lines.push(
      `  - id: ${decisionId(handoff.run.id, finding.id)}`,
      `    disposition: TODO ${allowed}`,
      "    # rationale: required for reject, defer, and needs-research",
      "    # editedRecommendation: required for accept-with-edits",
    );
  }
  for (const candidate of handoff.candidates) {
    lines.push(
      `  - id: ${decisionId(handoff.run.id, candidate.id)}`,
      `    disposition: TODO ${allowed}`,
      `    # proposes a ${candidate.kind}; accepting composes a skeleton for you to name`,
    );
  }
  if (handoff.notes.length) {
    lines.push(
      "notes:",
      `  disposition: TODO noted | discard   # all ${handoff.notes.length} of them, in one line`,
      "  # except: [note-id]   # the few going the other way",
    );
  }
  lines.push("```", "");
  return lines;
}

export function renderReview({ handoff, file, hash }: LoadedHandoff) {
  const lines = [
    `# Research review: ${handoff.run.id}`,
    "",
    // Renders into a file and into a pull request comment, so it must not
    // claim to be either one.
    `> ${GENERATED_MARKER} \`${hash}\`. Derived from the handoff; do not edit by hand.`,
    "",
    ...(handoff.run.kind === "reflection"
      ? [
          "> **A reflection**, not a research run: structured thinking about the model or about earlier runs" +
            (handoff.run.reflectsOn?.length ? `, reflecting on ${handoff.run.reflectsOn.map((id) => `\`${id}\``).join(", ")}` : "") +
            ". It is staging like any other handoff, and nothing in it is canonical until a person decides.",
          "",
        ]
      : []),
    "## Question",
    "",
    handoff.run.question,
    "",
    "## Synthesis",
    "",
    handoff.run.synthesis,
    "",
    // Only when there are findings. A reflection proposing eight candidates and
    // establishing nothing rendered this heading over empty space.
    ...(handoff.findings.length ? ["## Proposed changes and evidence", ""] : []),
  ];
  for (const finding of handoff.findings) {
    lines.push(
      `### ${finding.id}`,
      "",
      finding.statement,
      "",
      `- Classification: **${finding.classification}** (advisory; no automatic merge or promotion)`,
      `- Evidence: **${finding.evidenceStance}**; quality **${finding.evidenceQuality}**`,
      `- Generalized applicability: **${finding.generalizedApplicability ? "yes" : "no"}**`,
      `- Sources: ${finding.sourceIds.map((id) => `\`${id}\``).join(", ")}`,
      `- Suggested targets: ${finding.suggestedTargets.length ? finding.suggestedTargets.map((id) => `\`${id}\``).join(", ") : "none"}`,
      `- Existing Claim candidates: ${finding.existingClaimCandidates?.length ? finding.existingClaimCandidates.map((id) => `\`${id}\``).join(", ") : "none"}`,
      `- Proposed Claim: ${finding.proposedClaim ? `\`${finding.proposedClaim.id}\` — ${finding.proposedClaim.statement}` : "none"}`,
      `- Uncertainty: ${finding.uncertainty ?? "none recorded"}`,
      "",
      `**Decision \`${decisionId(handoff.run.id, finding.id)}\`**`,
      "",
      `Allowed response: ${allowed}.`,
      "",
    );
  }
  if (handoff.candidates.length) {
    lines.push(
      "## Proposed for the model",
      "",
      `${handoff.candidates.length} candidate(s). Each proposes that something should **exist** in the model, and each is ` +
        "decided on its own. None carries a title: accepting one composes a skeleton with the references filled in and " +
        "the naming left to you, because a name written by the analysis is how a fix gets recorded as a problem.",
      "",
    );
    for (const candidate of handoff.candidates) {
      lines.push(
        `### ${candidate.id}`,
        "",
        `Proposes a **${candidate.kind}**.`,
        "",
        candidate.description,
        "",
        `- Where it bites: ${candidate.targets.length ? candidate.targets.map((id) => `\`${id}\``).join(", ") : "not stated"}`,
        `- Rests on: ${candidate.restsOn.length ? candidate.restsOn.map((id) => `\`${id}\``).join(", ") : "nothing named"}`,
        `- Why it ranks here: ${candidate.rationale ?? "not stated"}`,
        `- Would weaken if: ${candidate.wouldWeakenIf ?? "not stated"}`,
        "",
        `**Decision \`${decisionId(handoff.run.id, candidate.id)}\`**`,
        "",
        `Allowed response: ${allowed}.`,
        "",
      );
    }
  }
  if (handoff.notes.length) {
    lines.push(
      "## Context notes",
      "",
      `${handoff.notes.length} note(s). These change no claim and cannot be cited by \`researchTrace\`. ` +
        "Read them as a set and disposition them in one line; anything here that needs its own judgement " +
        "should have been proposed as a finding.",
      "",
    );
    handoff.notes.forEach((note) => {
      const sources = note.sourceIds.length ? note.sourceIds.map((id) => `\`${id}\``).join(", ") : "none";
      lines.push(
        `- **${note.id}** — ${note.statement}`,
        `  Anchored to: ${note.anchors.map((id) => `\`${id}\``).join(", ")}. Sources: ${sources}.`,
      );
    });
    lines.push("");
  }
  lines.push("## Open questions", "");
  if (!handoff.questions.length) lines.push("None.", "");
  handoff.questions.forEach((question) => lines.push(`- **${question.id}:** ${question.question}`));
  lines.push("", "## Sources", "");
  handoff.sources.forEach((source) => {
    const publication = source.publishedAt ? `; published ${source.publishedAt.toISOString().slice(0, 10)}` : "; publication date not recorded";
    lines.push(`- **${source.id}** (${source.access}, ${source.kind}): ${source.title}${publication}; identity \`${source.identity}\`.`);
  });
  lines.push("", ...decisionSkeleton({ handoff, file, hash }));
  lines.push("## Canonical change gate", "", "No canonical change is authorized by this packet. Create a decision file, validate it, and apply accepted decisions in a separate model-change pull request referencing the run and decision IDs.", "");
  return `${lines.join("\n").trimEnd()}\n`;
}

/**
 * Compare a committed packet with what the generator would produce now.
 *
 * Byte equality is too strict for a file that lives in a repository: an editor
 * configured to insert a final newline, or a Windows checkout, would otherwise
 * turn "opened the packet to read it" into a CI failure. Everything that
 * carries meaning is compared exactly; only line endings and trailing
 * whitespace are normalised away.
 */
export function packetIsCurrent(committed: string, expected: string) {
  const normalise = (value: string) => `${value.replace(/\r\n/g, "\n").split("\n").map((line) => line.trimEnd()).join("\n").trimEnd()}\n`;
  return normalise(committed) === normalise(expected);
}

/**
 * Check any packet that is in the repository against its handoff.
 *
 * A packet is derived, so its absence is not an error. Requiring one to be
 * committed made a build artifact an input to intake, and the actor intake is
 * written for — a conversational agent on a GitHub connector — writes files
 * through the contents API and cannot run a build. That made the one step it
 * could not perform the one step it could not skip. ADR 0001 records the
 * correction; `.github/workflows/research-packet.yml` renders the packet now.
 *
 * What is still worth catching is a packet that *is* committed and no longer
 * matches. The file's own banner forbids hand-editing, and the skeleton inside
 * carries the hash a reviewer copies into a decision — so a drifted packet
 * hands somebody the wrong hash for the right run.
 */
export function checkCommittedPackets(handoffs: LoadedHandoff[], root = process.cwd()) {
  for (const loaded of handoffs) {
    const relative = path.join("research", "reviews", `${loaded.handoff.run.id}.md`);
    const absolute = path.join(root, relative);
    if (!fs.existsSync(absolute)) continue;
    if (packetIsCurrent(fs.readFileSync(absolute, "utf8"), renderReview(loaded))) continue;
    throw new Error(
      `${relative}: stale. It does not match ${loaded.file}. ` +
        `Run npm run generate:research-review and commit the result, or delete the packet — ` +
        `it is generated, never hand-edited, and it does not have to be in the repository at all.`,
    );
  }
}

export function writeReviews(handoffs: LoadedHandoff[], root = process.cwd()) {
  const directory = path.join(root, "research", "reviews");
  fs.mkdirSync(directory, { recursive: true });
  const expected = new Set<string>();
  handoffs.forEach((loaded) => {
    const file = path.join(directory, `${loaded.handoff.run.id}.md`);
    fs.writeFileSync(file, renderReview(loaded));
    expected.add(path.basename(file));
  });

  // Only ever remove this generator's own output. A README or a hand-written
  // note in the same directory is somebody's work, not a stale artefact.
  const removed = fs
    .readdirSync(directory)
    .filter((name) => name.endsWith(".md") && !expected.has(name))
    .filter((name) => fs.readFileSync(path.join(directory, name), "utf8").includes(GENERATED_MARKER));
  removed.forEach((name) => fs.rmSync(path.join(directory, name)));
  return { written: [...expected].sort(), removed };
}
