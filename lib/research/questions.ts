import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { ZodError } from "zod";
import { questionSchema, type ResearchQuestion } from "./schema";
import type { LoadedHandoff } from "./intake";

export const QUESTION_DIRECTORY = path.join("research", "questions");

export type LoadedQuestion = { question: ResearchQuestion; file: string };

/** A queued question, with whatever the repository already knows about it. */
export type QueueItem = {
  id: string;
  question: string;
  askedBy: string;
  priority: ResearchQuestion["priority"];
  status: ResearchQuestion["status"];
  targets: string[];
  why?: string;
  /** Runs that declared they set out to answer this. */
  answeredBy: string[];
  file: string;
};

export function loadQuestions(root = process.cwd()): LoadedQuestion[] {
  const directory = path.join(root, QUESTION_DIRECTORY);
  if (!fs.existsSync(directory)) return [];
  const seen = new Set<string>();
  return fs.readdirSync(directory).filter((name) => /\.ya?ml$/.test(name)).sort().map((name) => {
    const file = path.join(QUESTION_DIRECTORY, name);
    let question: ResearchQuestion;
    try {
      question = questionSchema.parse(yaml.load(fs.readFileSync(path.join(root, file), "utf8")));
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(error.issues.map((issue) => `${file}: ${issue.path.join(".") || "document"}: ${issue.message}`).join("\n"));
      }
      throw new Error(`${file}: not valid YAML: ${(error as Error).message}`);
    }
    const stem = name.replace(/\.ya?ml$/, "");
    if (stem !== question.id) {
      throw new Error(`${file}: id '${question.id}' does not match the file name. Rename it to ${QUESTION_DIRECTORY}/${question.id}.yaml.`);
    }
    if (seen.has(question.id)) throw new Error(`${file}: duplicate question ID '${question.id}'`);
    seen.add(question.id);
    return { question, file };
  });
}

/**
 * Check that every question a run claims to answer exists.
 *
 * A run naming a question that was never asked is usually a typo in an ID, and
 * left unchecked it silently detaches the run from the queue it was supposed
 * to be working through.
 */
export function checkAnsweredQuestions(handoffs: LoadedHandoff[], questions: LoadedQuestion[]) {
  const known = new Set(questions.map(({ question }) => question.id));
  for (const { handoff, file } of handoffs) {
    for (const id of handoff.run.answers ?? []) {
      if (!known.has(id)) {
        throw new Error(`${file}: run.answers: '${id}' is not a question in ${QUESTION_DIRECTORY}/`);
      }
    }
  }
}

export function buildQueue(questions: LoadedQuestion[], handoffs: LoadedHandoff[]): QueueItem[] {
  const answers = new Map<string, string[]>();
  for (const { handoff } of handoffs) {
    for (const id of handoff.run.answers ?? []) {
      answers.set(id, [...(answers.get(id) ?? []), handoff.run.id]);
    }
  }
  const rank = { high: 0, normal: 1, low: 2 };
  return questions
    .map(({ question, file }) => ({
      id: question.id,
      question: question.question,
      askedBy: question.askedBy,
      priority: question.priority,
      status: question.status,
      targets: question.targets,
      why: question.why,
      answeredBy: answers.get(question.id) ?? [],
      file,
    }))
    .sort((a, b) => rank[a.priority] - rank[b.priority] || a.id.localeCompare(b.id));
}

/**
 * What a scheduled run should pick up: asked, still open, nobody has answered.
 *
 * Deliberately simple. A run that wants to revisit an answered question can be
 * pointed at it by name; the automatic choice stays boring so that two runs a
 * day do not need supervision to avoid tripping over each other.
 */
export function nextUp(queue: QueueItem[]) {
  return queue.filter((item) => item.status === "open" && item.answeredBy.length === 0);
}
