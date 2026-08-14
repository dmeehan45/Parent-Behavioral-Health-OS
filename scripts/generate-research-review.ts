import { loadHandoffs } from "../lib/research/intake";
import { writeReviews } from "../lib/research/review";

const handoffs = loadHandoffs();
writeReviews(handoffs);
console.log(`Generated ${handoffs.length} research review packet(s).`);
