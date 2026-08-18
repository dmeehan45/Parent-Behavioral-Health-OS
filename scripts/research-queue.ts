import { getRepository } from "../lib/content/repository";
import { findGaps, type GapKind } from "../lib/research/gaps";
import { loadDecisions, loadHandoffs, reviewCoverage } from "../lib/research/intake";
import { blocksNewResearch, prioritizeQuestions, researchFamilies } from "../lib/research/priorities";
import { buildQueue, checkAnsweredQuestions, loadQuestions, nextUp } from "../lib/research/questions";
import { run } from "./report";

/**
 * What the knowledge loop should pick up next.
 *
 * Questions are inventory until a person has admitted them to the open queue.
 * Among open questions, those blocking a live Bet come first. New research is
 * paused while the repository already owes human decisions, application, or a
 * sentence from accumulated context; otherwise the intake can outrun the
 * accountable reviewer indefinitely.
 */
run(() => {
  const handoffs = loadHandoffs();
  const decisions = loadDecisions();
  const questions = loadQuestions();
  checkAnsweredQuestions(handoffs, questions);

  const repository = getRepository();
  const queue = buildQueue(questions, handoffs);
  const open = prioritizeQuestions(nextUp(queue), repository.bets);
  const gaps = findGaps(repository, handoffs, questions, decisions);

  // Two lists, not one, because they ask for different work. Owed work is
  // answered by writing or deciding; a thin part of the model is an invitation
  // to consider research, not an automatically admitted research job.
  const OWED: GapKind[] = ["undecided", "unapplied", "unconverted", "saturated"];
  const owed = gaps.filter((gap) => OWED.includes(gap.kind));
  const thin = gaps.filter((gap) => !OWED.includes(gap.kind));
  const researchBlocked = blocksNewResearch(gaps);
  const families = researchFamilies(open, repository.bets);

  // `--top` prints an identifier only when starting another run is actually the
  // next useful action. The scheduled routine therefore stops creating research
  // momentum while review/application debt exists, and it never silently turns
  // an unqueued model gap into a research run.
  if (process.argv.includes("--top")) {
    if (!researchBlocked && open[0]) console.log(open[0].id);
    return;
  }

  console.log("\n# Next knowledge action\n");
  if (researchBlocked) {
    console.log("  REVIEW / WRITE — new research is paused while previously gathered knowledge still needs a human decision, application, or synthesis.\n");
  } else if (open[0]) {
    const family = families.find((candidate) => candidate.questions.some((question) => question.id === open[0].id));
    console.log(`  RESEARCH — ${open[0].id}`);
    if (family) console.log(`      unblocks: ${family.betId}${family.prototypeStatus ? ` [prototype: ${family.prototypeStatus}]` : ""}`);
    console.log("");
  } else if (thin.length) {
    console.log("  TRIAGE — the model has open gaps, but none is admitted to research. Promote a gap only if resolving it would change a decision or unblock a Bet.\n");
  } else {
    console.log("  NONE — no research or knowledge debt is currently derived.\n");
  }

  if (families.length) {
    console.log("# Product-linked research families\n");
    for (const family of families) {
      console.log(`  ${family.betId}${family.prototypeStatus ? ` [prototype: ${family.prototypeStatus}]` : ""}`);
      console.log(`      ${family.title}`);
      for (const item of family.questions) {
        console.log(`      -> ${item.id} [${item.priority}]`);
        console.log(`         ${item.question}`);
      }
      console.log("");
    }
  }

  const linked = new Set(families.flatMap((family) => family.questions.map((item) => item.id)));
  const unlinked = open.filter((item) => !linked.has(item.id));
  console.log("# Other queued questions\n");
  if (!unlinked.length) console.log("  None.\n");
  for (const item of unlinked) {
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
    console.log("# Already owed — clear this before starting another research run\n");
    print(owed, 12);
  }

  console.log("# Gaps in the model — inventory, not an automatic queue\n");
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
  console.log(
    researchBlocked
      ? "Next: decide or write what is already owed; do not start another research run.\n"
      : open[0]
        ? `Next: npm run research:brief -- ${open[0].id}\n`
        : "Next: promote a product-relevant gap to research only when it would change a decision.\n",
  );
});
