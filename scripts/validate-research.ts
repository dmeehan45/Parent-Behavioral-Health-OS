import fs from "node:fs";
import path from "node:path";
import { checkHandoffTargets, loadDecisions, loadHandoffs, reviewCoverage, validateDecisions } from "../lib/research/intake";
import { packetIsCurrent, renderReview } from "../lib/research/review";
import { run } from "./report";

// Order matters. Handoffs are parsed and checked against themselves first, then
// the reviewer's decisions, and only then the canonical model. Reading
// `content/` earlier meant a stale decision hash surfaced as an error in a
// content file, sending the reviewer to fix the wrong thing.
run(() => {
  const handoffs = loadHandoffs();
  const decisions = loadDecisions();
  validateDecisions(handoffs, decisions);

  if (process.argv.includes("--check-reviews")) {
    for (const loaded of handoffs) {
      const file = path.join("research", "reviews", `${loaded.handoff.run.id}.md`);
      if (!fs.existsSync(file)) {
        throw new Error(`${file}: missing. Run npm run generate:research-review and commit the packet.`);
      }
      if (!packetIsCurrent(fs.readFileSync(file, "utf8"), renderReview(loaded))) {
        throw new Error(
          `${file}: stale. It does not match ${loaded.file}. ` +
            `Run npm run generate:research-review and commit the result; the packet is generated, never hand-edited.`,
        );
      }
    }
  }

  checkHandoffTargets(handoffs);

  const coverage = reviewCoverage(handoffs, decisions);
  console.log(`Validated ${handoffs.length} research handoff(s) and ${decisions.length} decision file(s).`);
  console.log(`Reviewed ${coverage.decided} of ${coverage.findings} finding(s).`);
  if (coverage.undecided.length) {
    console.log(`Awaiting a reviewer: ${coverage.undecided.join(", ")}`);
  }
});
