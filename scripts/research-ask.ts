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

/**
 * `--targets a,b` and `--why "..."`, so a question raised by a gap in the model
 * arrives knowing what it bites and why anybody cared. Typing those back in by
 * hand is the step that gets skipped, and a question with no targets is the one
 * a later run cannot tell was ever about anything.
 */
function flag(name: string): string | undefined {
  const argv = process.argv.slice(2);
  const inline = argv.find((value) => value.startsWith(`--${name}=`));
  if (inline) return inline.slice(name.length + 3).trim() || undefined;
  const index = argv.indexOf(`--${name}`);
  if (index < 0) return undefined;
  const next = argv[index + 1];
  return next && !next.startsWith("--") ? next.trim() || undefined : undefined;
}

run(() => {
  const flagged = new Set<string>();
  const argv = process.argv.slice(2);
  for (const [index, value] of argv.entries()) {
    if (!value.startsWith("--")) continue;
    flagged.add(value);
    // The value of `--why "..."` is not part of the question.
    if (!value.includes("=") && argv[index + 1] && !argv[index + 1].startsWith("--")) flagged.add(argv[index + 1]);
  }
  const question = argv.filter((value) => !flagged.has(value)).join(" ").trim();
  if (question.length < 10) {
    throw new Error('Write the question out.\n\n  npm run research:ask -- "How do parents choose a first clinician?"');
  }

  const targets = (flag("targets") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const why = flag("why");

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
      targets.length ? `targets: [${targets.join(", ")}]` : "# targets: [stage-or-step-ids this question bites]",
      why ? `why: ${JSON.stringify(why)}` : "# why: what changes about the model if we learn the answer",
      "",
    ].join("\n"),
  );

  console.log(`Queued ${file}`);
  if (!asked) console.log("Replace the TODO in `askedBy`, or set RESEARCH_ASKED_BY to fill it in next time.");
  console.log(`\nBrief a run on it with:\n  npm run research:brief -- ${id}\n`);
});
