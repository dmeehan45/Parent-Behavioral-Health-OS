import { loadDecisions, loadHandoffs, reviewCoverage } from "./intake";
import { projectReview } from "./projection";
import { notesAbout, researchAbout, type ReviewFinding, type ReviewNote, type ReviewRun } from "./view";

/**
 * Research, read from surfaces that are not the research page.
 *
 * Both functions here swallow their errors, which is deliberate and is the
 * whole reason this module exists separately from the projection.
 *
 * `research/` is staging: unreviewed, arriving from conversations held
 * elsewhere and from scheduled runs nobody watched. A malformed handoff is a
 * normal thing to encounter, and `npm run validate:research` catches it in CI
 * where it names the file and the field. What must not happen is that a broken
 * staging file takes the model's own pages down with it — the navigation on
 * every route, and every stage, step, claim and metric page. Staging breaking
 * the thing it is staged against is exactly backwards.
 *
 * The research page itself does *not* use these. There, a parse failure is the
 * most important thing on the screen, so it is left to surface.
 */

/** How many findings are waiting on a person, for the navigation badge. */
export function reviewDebt(): number {
  try {
    // Handoffs and decisions only, never `content/`. This runs on every page in
    // the application, including ones with nothing to do with research.
    return reviewCoverage(loadHandoffs(), loadDecisions()).undecided.length;
  } catch {
    return 0;
  }
}

/** Research that names this record as somewhere it would land, or already has. */
export function researchAboutRecord(nodeId: string): Array<{ run: ReviewRun; finding: ReviewFinding }> {
  try {
    return researchAbout(projectReview().runs, nodeId);
  } catch {
    return [];
  }
}

/**
 * Context anchored to this record.
 *
 * This is where a note is *for*. A note is cheap to accept precisely because it
 * is not going to change what the model claims — which would make it worthless
 * if it then sat in a staging file nobody opened. Anchoring puts it in front of
 * the person reading the record it bears on, which is the only reader who was
 * ever going to want it.
 */
export function notesAboutRecord(nodeId: string): Array<{ run: ReviewRun; note: ReviewNote }> {
  try {
    return notesAbout(projectReview().runs, nodeId);
  } catch {
    return [];
  }
}

/**
 * Prototype review sessions recorded in staging, keyed by the bet observed.
 *
 * The build queue asks this so it stops requesting a session that already
 * happened: a `session` source names its bet in the locator, and whether the
 * run's findings have been decided is the difference between "review this"
 * and "decide what the review taught".
 */
export function sessionsByBet(): Map<string, { runs: number; undecided: number }> {
  try {
    const decided = new Map(
      loadDecisions().map((record) => [
        record.decisions.runId,
        new Set(record.decisions.decisions.map((decision) => decision.id)),
      ]),
    );
    const byBet = new Map<string, { runs: number; undecided: number }>();
    for (const { handoff } of loadHandoffs()) {
      const bets = new Set(
        handoff.sources
          .filter((source) => source.kind === "session" && source.locator.bet)
          .map((source) => source.locator.bet as string),
      );
      if (bets.size === 0) continue;
      const dispositions = decided.get(handoff.run.id) ?? new Set<string>();
      const undecided = [...handoff.findings, ...handoff.candidates].filter(
        (item) => !dispositions.has(`decide-${handoff.run.id}-${item.id}`),
      ).length;
      for (const bet of bets) {
        const tally = byBet.get(bet) ?? { runs: 0, undecided: 0 };
        tally.runs += 1;
        tally.undecided += undecided;
        byBet.set(bet, tally);
      }
    }
    return byBet;
  } catch {
    return new Map();
  }
}
