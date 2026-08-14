import { getRepository } from "../lib/content/repository";
import { projectModel } from "../lib/model/graph";
import { RELATIONSHIPS, checkProjection } from "../lib/model/conformance";
import { run } from "./report";

/**
 * Content can be valid and still be invisible.
 *
 * `npm run validate:content` proves every reference points at something real.
 * This proves the projection then does something with it — the gap that let
 * `step.claims` render in a block while the evidence lens drew no line.
 */
run(() => {
  const repo = getRepository();
  const graph = projectModel();
  const problems = checkProjection(repo, graph);

  if (problems.length) {
    const lines = ["", `${problems.length} reference(s) the projection does not represent:`, ""];
    for (const problem of problems) {
      lines.push(`  ${problem.file}`, `    ${problem.field} → '${problem.to}' ${problem.reason}`, "");
    }
    throw new Error(lines.join("\n"));
  }

  const declared = Object.entries(RELATIONSHIPS);
  const edged = declared.filter(([, resolution]) => "edge" in resolution).length;
  console.log(
    `Checked ${repo.references.length} authored reference(s) against the projection. ` +
      `${declared.length} relationship kinds declared: ${edged} derive an edge, ${declared.length - edged} are deliberate block-only.`,
  );
});
