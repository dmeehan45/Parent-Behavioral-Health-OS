import { loadHandoffs } from "../lib/research/intake";
import { writeReviews } from "../lib/research/review";
import { run } from "./report";

run(() => {
  const handoffs = loadHandoffs();
  const { written, removed } = writeReviews(handoffs);
  console.log(`Generated ${written.length} research review packet(s).`);
  written.forEach((name) => console.log(`  research/reviews/${name}`));
  removed.forEach((name) => console.log(`  removed research/reviews/${name} (its handoff is gone)`));
});
