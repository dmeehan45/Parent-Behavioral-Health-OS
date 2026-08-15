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
