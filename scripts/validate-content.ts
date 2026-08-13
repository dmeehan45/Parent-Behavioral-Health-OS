import { getRepository } from "../lib/content/repository";
const repo = getRepository();
console.log(`Validated ${repo.stages.length} stages, ${repo.steps.length} steps, ${repo.entities.length} entities, ${repo.claims.length} claims, ${repo.metrics.length} metrics, and ${repo.bets.length} bets.`);
