import { getRepository } from "../lib/content/repository";
import { findGaps, type GapKind } from "../lib/research/gaps";
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
  const gaps = findGaps(getRepository(), handoffs, questions, decisions);

  // `--top` prints the one identifier a run should brief on, and nothing else.
  //
  // The scheduled routine needs this because the agent it publishes to cannot
  // run these commands itself. Scraping the human-readable listing below for an
  // ID would break the first time a line is reworded, so the identifier is
  // asked for directly. A queued question answers with its ID; a gap has no ID,
  // so it answers with the question it suggests — which `research:brief` also
  // accepts, quoted.
  if (process.argv.includes("--top")) {
    const top = open[0]?.id ?? gaps[0]?.suggestedQuestion;
    if (top) console.log(top);
    return;
  }

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

  // Two lists, not one, because they ask for different work. Owed work is
  // answered by writing; a thin part of the model is answered by researching.
  // Printing them together made the queue read as one long invitation to go and
  // find out more, which is the wrong instruction for a repository whose intake
  // can outrun it.
  const OWED: GapKind[] = ["undecided", "unapplied", "unconverted", "saturated"];
  const owed = gaps.filter((gap) => OWED.includes(gap.kind));
  const thin = gaps.filter((gap) => !OWED.includes(gap.kind));

  const print = (list: typeof gaps, limit: number) => {
    for (const gap of list.slice(0, limit)) {
      console.log(`  ${gap.kind}  ${gap.subjectKind} ${gap.subject}`);
      console.log(`      ${gap.why}`);
      console.log(`      ask: ${gap.suggestedQuestion}`);
      console.log("");
    }
    if (list.length > limit) console.log(`  ...and ${list.length - limit} more.\n`);
  };

  if (owed.length) {
    console.log("# Already owed — these are answered by writing, not researching\n");
    print(owed, 12);
  }

  console.log("# Gaps in the model itself\n");
  if (!thin.length) console.log("  None found.\n");
  print(thin, 12);

  const coverage = reviewCoverage(handoffs, decisions);
  console.log("# Review debt\n");
  console.log(`  ${coverage.decided} of ${coverage.findings} finding(s) and candidate(s) reviewed.`);
  if (coverage.undecided.length) {
    console.log(`  Waiting on a reviewer at /review: ${coverage.undecided.length}.`);
  }
  if (coverage.notes) {
    console.log(`  ${coverage.notes} context note(s) across ${coverage.runsWithNotes} run(s); ${coverage.notedRuns} dispositioned.`);
  }
  console.log("");
  console.log("Next: npm run research:brief -- <question-id>\n");
});
