import { getRepository } from "../lib/content/repository";
import { renderBrief } from "../lib/research/brief";
import { loadDecisions, loadHandoffs } from "../lib/research/intake";
import { buildQueue, loadQuestions } from "../lib/research/questions";
import { run } from "./report";

run(() => {
  const argument = process.argv.slice(2).filter((value) => !value.startsWith("-")).join(" ").trim();
  if (!argument) {
    throw new Error(
      'Name the question to brief.\n\n  npm run research:brief -- <question-id>\n  npm run research:brief -- "an unqueued question, in quotes"\n\nRun npm run research:queue to see what is waiting.',
    );
  }

  const questions = loadQuestions();
  const handoffs = loadHandoffs();
  const item = buildQueue(questions, handoffs).find((candidate) => candidate.id === argument);
  if (!item && !argument.includes(" ")) {
    throw new Error(
      `No queued question with ID '${argument}'. Run npm run research:queue to see what is waiting, ` +
        `or pass the question itself in quotes to brief an unqueued one.`,
    );
  }

  process.stdout.write(renderBrief(item, item?.question ?? argument, getRepository(), handoffs, loadDecisions()));
});
