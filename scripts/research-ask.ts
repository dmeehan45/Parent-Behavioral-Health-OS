import fs from "node:fs";
import path from "node:path";
import { QUESTION_DIRECTORY, loadQuestions } from "../lib/research/questions";
import { run } from "./report";

/** A stable, readable ID that two people asking on the same day will not share. */
function slug(question: string) {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .split("-")
    .filter(Boolean)
    .slice(0, 8)
    .join("-");
}

run(() => {
  const question = process.argv.slice(2).filter((value) => !value.startsWith("--")).join(" ").trim();
  if (question.length < 10) {
    throw new Error('Write the question out.\n\n  npm run research:ask -- "How do parents choose a first clinician?"');
  }

  const stem = slug(question);
  if (!stem) throw new Error("That question has no words an ID can be made from. Write it in plain text.");

  const existing = new Set(loadQuestions().map(({ question: record }) => record.id));
  let id = stem;
  for (let suffix = 2; existing.has(id); suffix += 1) id = `${stem}-${suffix}`;

  const asked = process.env.RESEARCH_ASKED_BY?.trim();
  const file = path.join(QUESTION_DIRECTORY, `${id}.yaml`);
  fs.mkdirSync(QUESTION_DIRECTORY, { recursive: true });
  fs.writeFileSync(
    file,
    [
      `id: ${id}`,
      `question: ${JSON.stringify(question)}`,
      `askedBy: ${asked ? JSON.stringify(asked) : '"TODO your name or handle"'}`,
      `createdAt: ${new Date().toISOString().slice(0, 10)}`,
      "status: open",
      "priority: normal",
      "# targets: [stage-or-step-ids this question bites]",
      "# why: what changes about the model if we learn the answer",
      "",
    ].join("\n"),
  );

  console.log(`Queued ${file}`);
  if (!asked) console.log("Replace the TODO in `askedBy`, or set RESEARCH_ASKED_BY to fill it in next time.");
  console.log(`\nBrief a run on it with:\n  npm run research:brief -- ${id}\n`);
});
