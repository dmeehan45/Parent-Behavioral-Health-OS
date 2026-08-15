import {
  checkForRepeatedFindings,
  checkHandoffTargets,
  checkSupersedes,
  loadDecisions,
  loadHandoffs,
  reviewCoverage,
  sourceOverlap,
  supersededDecisions,
  validateDecisions,
} from "../lib/research/intake";
import { checkAnsweredQuestions, loadQuestions } from "../lib/research/questions";
import { checkCommittedPackets } from "../lib/research/review";
import { run } from "./report";

// Order matters. Handoffs are parsed and checked against themselves first, then
// against each other, then the reviewer's decisions, and only then the canonical
// model. Reading `content/` earlier meant a stale decision hash surfaced as an
// error in a content file, sending the reviewer to fix the wrong thing.
run(() => {
  const handoffs = loadHandoffs();
  const decisions = loadDecisions();
  const questions = loadQuestions();

  checkForRepeatedFindings(handoffs);
  checkAnsweredQuestions(handoffs, questions);
  validateDecisions(handoffs, decisions);
  checkSupersedes(handoffs, decisions);

  // A committed packet must match its handoff; a missing one is fine, because
  // the packet is derived and CI renders it onto the pull request.
  if (process.argv.includes("--check-reviews")) checkCommittedPackets(handoffs);

  checkHandoffTargets(handoffs, new Set(questions.map(({ question }) => question.id)));

  const coverage = reviewCoverage(handoffs, decisions);
  console.log(`Validated ${handoffs.length} research handoff(s), ${decisions.length} decision file(s), and ${questions.length} queued question(s).`);
  console.log(`Reviewed ${coverage.decided} of ${coverage.findings} finding(s).`);
  if (coverage.undecided.length) {
    console.log(`Awaiting a reviewer at /review: ${coverage.undecided.join(", ")}`);
  }
  // Notes are reported as a batch, because that is how they are decided. A run
  // whose context is waiting is different from one whose findings are waiting,
  // and collapsing them would hide the cheap work behind the expensive work.
  if (coverage.notes) {
    console.log(`Noted ${coverage.notedRuns} of ${coverage.runsWithNotes} run(s) carrying ${coverage.notes} context note(s).`);
    if (coverage.unnotedRuns.length) console.log(`Context awaiting a reviewer: ${coverage.unnotedRuns.join(", ")}`);
  }

  // Reported, never fatal. A later run re-reading a source to qualify what it
  // was taken to say is the point of running again, not a mistake.
  const overlaps = sourceOverlap(handoffs);
  overlaps.forEach((overlap) => console.log(`Run '${overlap.run}' re-read source '${overlap.identity}', first read by '${overlap.earlier}'.`));

  const superseded = supersededDecisions(decisions);
  superseded.forEach((by, decision) => console.log(`Decision '${decision}' has been superseded by '${by}'.`));
});
