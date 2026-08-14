import { getRepository } from "../lib/content/repository";
import { conformanceProblem } from "../lib/prototype/conformance";
import { run } from "./report";

run(() => {
  const repo = getRepository();

  /*
   * Does the software still test the experiment somebody approved?
   *
   * Checked here rather than in the loader on purpose. Refining a bet is the
   * normal thing to do to one, and a loader that threw would make the
   * repository unloadable the moment somebody did — taking down the map, every
   * record page, and the prototype packet whose entire job is to say what
   * changed and what to build to. A gate that breaks the tool for fixing it is
   * not a gate.
   */
  const drifted = repo.bets.map(conformanceProblem).filter((problem): problem is string => Boolean(problem));
  if (drifted.length) throw new Error(`\n${drifted.join("\n\n")}`);

  console.log(
    `Validated ${repo.stages.length} stages, ${repo.steps.length} steps, ${repo.entities.length} entities, ` +
      `${repo.claims.length} claims, ${repo.metrics.length} metrics, ${repo.problems.length} problems, and ${repo.bets.length} bets.`,
  );
});
