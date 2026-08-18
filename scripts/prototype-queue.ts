import { getRepository } from "../lib/content/repository";
import { prototypeQueue } from "../lib/prototype/queue";
import { sessionsByBet } from "../lib/research/glance";
import { run } from "./report";

/**
 * Every bet, and the one next action.
 *
 * The research half of the loop has `research:queue`; this is the build half.
 * It composes each bet's derivable state — shaped or not, built or not,
 * checked or gone stale, reviewed or still waiting for participants — and says
 * whose the next move is. It decides nothing and is printed, never committed.
 */
run(() => {
  // Through glance, so a malformed staging file costs the session note and
  // never the queue — the same reason prototype:brief degrades instead of
  // refusing to print.
  const queue = prototypeQueue(getRepository().bets, sessionsByBet());

  console.log("\n# Every bet, and the one next action\n");
  if (!queue.length) {
    console.log("  No bets yet. A bet answers a Problem — docs/authoring.md.\n");
  }
  for (const item of queue) {
    console.log(`  ${item.state}  bet ${item.bet} — ${item.title}`);
    console.log(`      ${item.why}`);
    console.log(`      next: ${item.next}`);
    if (item.awaiting.length) {
      console.log(`      scoped around open question(s): ${item.awaiting.join(", ")}`);
    }
    console.log("");
  }
  console.log("Next: npm run prototype:brief -- <bet-id>\n");
});
