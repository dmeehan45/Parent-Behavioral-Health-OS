import { getRepository } from "../lib/content/repository";
import { renderPrototypeBrief, type ResearchNote } from "../lib/prototype/brief";
import { projectReview } from "../lib/research/projection";
import { researchAbout } from "../lib/research/view";
import { run } from "./report";

run(() => {
  const id = process.argv.slice(2).filter((value) => !value.startsWith("-")).join(" ").trim();
  const repo = getRepository();

  if (!id) {
    throw new Error(
      `Name the bet to brief.\n\n  npm run prototype:brief -- <bet-id>\n\nBets in the model:\n${repo.bets
        .map((bet) => `  ${bet.id}`)
        .join("\n")}`,
    );
  }

  const bet = repo.bets.find((candidate) => candidate.id === id);
  if (!bet) {
    throw new Error(
      `No bet with ID '${id}'.\n\nBets in the model:\n${repo.bets.map((candidate) => `  ${candidate.id}`).join("\n")}`,
    );
  }

  // Research is staging and is allowed to be broken; a malformed handoff must
  // not stop somebody building. The packet says so rather than pretending there
  // was none — silence here would read as "nothing has been researched".
  let research: ResearchNote[] = [];
  let readable = true;
  try {
    const { runs } = projectReview();
    const ids = [
      `bet:${bet.id}`,
      `problem:${bet.problem}`,
      ...(repo.problems.find((problem) => problem.id === bet.problem)?.targets ?? []).flatMap((target) => [
        `stage:${target}`,
        `step:${target}`,
        target,
      ]),
      ...(bet.claims ?? []).map((claim) => `claim:${claim}`),
      ...(bet.metrics ?? []).map((metric) => `metric:${metric}`),
    ];
    const seen = new Set<string>();
    research = ids
      .flatMap((nodeId) => researchAbout(runs, nodeId))
      .filter(({ finding }) => (seen.has(finding.decisionId) ? false : seen.add(finding.decisionId)));
  } catch {
    readable = false;
  }

  process.stdout.write(renderPrototypeBrief(bet, repo, research, readable));
});
