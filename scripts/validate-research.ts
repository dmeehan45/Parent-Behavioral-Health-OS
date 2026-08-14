import fs from "node:fs";
import path from "node:path";
import { loadDecisions, loadHandoffs, validateDecisions } from "../lib/research/intake";
import { renderReview } from "../lib/research/review";

const handoffs = loadHandoffs();
const decisions = loadDecisions();
validateDecisions(handoffs, decisions);

if (process.argv.includes("--check-reviews")) {
  for (const loaded of handoffs) {
    const file = path.join("research", "reviews", `${loaded.handoff.run.id}.md`);
    if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== renderReview(loaded)) {
      throw new Error(`${file}: missing or stale; run npm run generate:research-review`);
    }
  }
}

console.log(`Validated ${handoffs.length} research handoff(s) and ${decisions.length} decision file(s).`);
