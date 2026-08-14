import { getRepository } from "../lib/content/repository";
import { findGaps } from "../lib/research/gaps";
import { loadDecisions, loadHandoffs, reviewCoverage } from "../lib/research/intake";
import { buildQueue, checkAnsweredQuestions, loadQuestions, nextUp } from "../lib/research/questions";
import { run } from "./report";

/**
 * What a run should pick up next.
 *
 * Two sources, in priority order: questions a person queued, then gaps the
 * model has in itself. A scheduled run reads this, takes the top item, and asks
 * for a brief on it.
 */
run(() => {
  const handoffs = loadHandoffs();
  const decisions = loadDecisions();
  const questions = loadQuestions();
  checkAnsweredQuestions(handoffs, questions);

  const queue = buildQueue(questions, handoffs);
  const open = nextUp(queue);

  console.log("\n# Queued questions\n");
  if (!open.length) {
    console.log("  None open. Add one with `npm run research:ask -- \"your question\"`.\n");
  }
  for (const item of open) {
    console.log(`  ${item.id}  [${item.priority}]  asked by ${item.askedBy}`);
    console.log(`      ${item.question}`);
    if (item.targets.length) console.log(`      bites: ${item.targets.join(", ")}`);
    console.log("");
  }

  const answered = queue.filter((item) => item.answeredBy.length);
  if (answered.length) {
    console.log("# Answered\n");
    answered.forEach((item) => console.log(`  ${item.id} — by ${item.answeredBy.join(", ")}`));
    console.log("");
  }

  const gaps = findGaps(getRepository(), handoffs, questions);
  console.log("# Gaps in the model itself\n");
  if (!gaps.length) console.log("  None found.\n");
  for (const gap of gaps.slice(0, 12)) {
    console.log(`  ${gap.kind}  ${gap.subjectKind} ${gap.subject}`);
    console.log(`      ${gap.why}`);
    console.log(`      ask: ${gap.suggestedQuestion}`);
    console.log("");
  }
  if (gaps.length > 12) console.log(`  ...and ${gaps.length - 12} more.\n`);

  const coverage = reviewCoverage(handoffs, decisions);
  console.log("# Review debt\n");
  console.log(`  ${coverage.decided} of ${coverage.findings} finding(s) reviewed.`);
  if (coverage.undecided.length) {
    console.log(`  Waiting on a reviewer at /review: ${coverage.undecided.length} finding(s).`);
  }
  console.log("");
  console.log("Next: npm run research:brief -- <question-id>\n");
});
