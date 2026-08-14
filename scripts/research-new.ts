import fs from "node:fs";
import path from "node:path";
import { HANDOFF_DIRECTORY, loadHandoffs } from "../lib/research/intake";
import { buildQueue, loadQuestions } from "../lib/research/questions";
import { run } from "./report";

/**
 * Scaffold a handoff with a run ID nothing else will take.
 *
 * Two agents researching the same morning on separate branches would otherwise
 * both reach for the obvious ID, and the collision would only surface at merge.
 * Dating the ID and slugging the question makes that near-impossible without
 * coordination, and the local uniqueness check catches the rest.
 */
run(() => {
  const argument = process.argv.slice(2).filter((value) => !value.startsWith("--")).join(" ").trim();
  if (!argument) {
    throw new Error(
      'Name what this run is about.\n\n  npm run research:new -- <question-id>\n  npm run research:new -- "the question, in quotes"',
    );
  }

  const questions = loadQuestions();
  const handoffs = loadHandoffs();
  const item = buildQueue(questions, handoffs).find((candidate) => candidate.id === argument);
  const question = item?.question ?? argument;
  if (question.length < 10) throw new Error("The question has to be at least 10 characters. Write it out.");

  const stem = question.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").split("-").filter(Boolean).slice(0, 6).join("-");
  const today = new Date().toISOString().slice(0, 10);
  const taken = new Set(handoffs.map(({ handoff }) => handoff.run.id));
  let id = `${today}-${stem}`;
  for (let suffix = 2; taken.has(id); suffix += 1) id = `${today}-${stem}-${suffix}`;

  const file = path.join(HANDOFF_DIRECTORY, `${id}.yaml`);
  fs.mkdirSync(HANDOFF_DIRECTORY, { recursive: true });
  fs.writeFileSync(
    file,
    [
      "contractVersion: 1",
      "run:",
      `  id: ${id}`,
      `  question: ${JSON.stringify(question)}`,
      '  synthesis: "TODO what this run concluded, in a few sentences. No transcript."',
      `  createdAt: ${today}`,
      "  preparedBy:",
      "    kind: conversational-agent",
      '    provider: "TODO which tool did the research"',
      '    # model: "TODO the model, if you know it"',
      "  provenance:",
      "    method: public-research",
      '    context: "TODO how this was researched. Raw transcript excluded."',
      "  safety:",
      "    containsSensitiveData: false",
      "    containsPrivateCompanyMaterial: false",
      "    rawTranscriptIncluded: false",
      ...(item ? [`  answers: [${item.id}]`] : []),
      "sources:",
      "  - id: source-todo",
      "    identity: todo-stable-identity-for-deduplication",
      "    kind: web",
      '    title: "TODO the source title"',
      "    locator:",
      "      url: https://example.com/TODO",
      "    access: available",
      "findings:",
      "  - id: finding-todo",
      '    statement: "TODO one atomic thing this run established."',
      "    sourceIds: [source-todo]",
      "    suggestedTargets: []",
      "    classification: new",
      "    evidenceStance: contextualizes",
      "    evidenceQuality: secondary",
      "    generalizedApplicability: true",
      "    # existingClaimCandidates: [required for duplicate and qualifying]",
      "    # proposedClaim: { id: claim-todo, statement: TODO }",
      "    # extract: at most 25 words quoted from the source",
      "    # uncertainty: what would change this",
      "    # Keep the challenge proportionate: name the material counterexample or evidence gap, not every imaginable caveat.",
      "questions: []",
      "",
    ].join("\n"),
  );

  console.log(`Scaffolded ${file}`);
  console.log(`\nRead the prior art first:\n  npm run research:brief -- ${item?.id ?? `"${question}"`}`);
  console.log(`\nThen fill in the TODOs and run:\n  npm run validate:research\n  npm run scan:safety\n`);
  console.log(`Commit that one file. The review packet is derived — CI renders it onto the pull request,`);
  console.log(`and npm run generate:research-review writes it locally if you want to read it first.\n`);
});
