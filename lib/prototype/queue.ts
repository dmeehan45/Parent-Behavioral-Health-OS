import { SECTION } from "@/lib/content/body";
import { experimentGaps } from "@/lib/model/coverage";
import { conformance } from "@/lib/prototype/conformance";
import type { Bet } from "@/lib/schemas";

/**
 * The build half of the loop, as a queue.
 *
 * `npm run research:queue` says what the intake side owes and invites; nothing
 * said the same for bets. The state was all derivable — readiness from the
 * experiment sections, staleness from the conformance stamp, an untested
 * prototype from its status — but it lived one bet at a time inside
 * `prototype:brief`, which nobody runs for a bet they have not already chosen.
 * So the join the loop was built around had no surface saying "this bet is
 * ready and nothing is built", and a build started when somebody remembered.
 *
 * Like the packet, this composes and never decides: every item names the one
 * next action and who it belongs to. Building is an agent's work; checking,
 * stamping, and deciding what a session taught remain a person's, for the same
 * reason they are a person's everywhere else here.
 */

export type BuildState =
  | "stale" // the experiment moved after the last check, so the status claims something unconfirmed
  | "unstamped" // claims built, and nothing records that anybody checked
  | "unclaimed" // software exists and claims nothing — waiting on a person's check
  | "reviewable" // built and current — ready to put in front of participants
  | "reviewed" // tested — what the sessions taught goes back through review
  | "buildable" // shaped and approved, nothing built
  | "unshaped"; // experiment sections missing — questions for the accountable person

export type BuildItem = {
  state: BuildState;
  bet: string;
  title: string;
  /** Why this is the item's state, in words a reader can judge. */
  why: string;
  /** The one next action, and whose it is. */
  next: string;
  /** Open research questions the bet's boundary is scoped around. */
  awaiting: string[];
};

/** What staging already holds about a bet's review sessions. */
export type SessionGlance = { runs: number; undecided: number };

/**
 * Claims that are currently wrong come first, then work only a person can
 * finish, then work an agent can pick up, then shaping the person still owes.
 */
const BUILD_ORDER: Record<BuildState, number> = {
  stale: 0,
  unstamped: 1,
  unclaimed: 2,
  reviewable: 3,
  reviewed: 4,
  buildable: 5,
  unshaped: 6,
};

export function prototypeQueue(bets: Bet[], sessions?: Map<string, SessionGlance>): BuildItem[] {
  return bets
    .map((bet) => itemFor(bet, sessions?.get(bet.id)))
    .sort((a, b) => BUILD_ORDER[a.state] - BUILD_ORDER[b.state] || a.bet.localeCompare(b.bet));
}

function itemFor(bet: Bet, sessions?: SessionGlance): BuildItem {
  const { state, drifted } = conformance(bet);
  const base = { bet: bet.id, title: bet.title, awaiting: bet.awaiting ?? [] };
  const brief = `npm run prototype:brief -- ${bet.id}`;

  if (state === "unshaped") {
    const missing = experimentGaps(bet);
    return {
      ...base,
      state: "unshaped",
      why: `The experiment is not shaped: ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} unwritten.`,
      next: `Put the missing sections to the person accountable for the bet — ${brief} prints the questions. Do not fill them in.`,
    };
  }

  if (state === "unbuilt") {
    // `concept` with a route is software that exists and deliberately claims
    // nothing — usually because the experiment was refined after a build. The
    // stamp is a person's assertion, so the queue asks for a person.
    if (bet.prototype?.route && bet.prototype.status === "concept") {
      return {
        ...base,
        state: "unclaimed",
        why: `Software exists at ${bet.prototype.route} and claims nothing: prototype.status is 'concept'.`,
        next: `A person looks at it against the experiment sections; if it tests them, set status 'working' with the builtAgainst value ${brief} prints. If not, it is buildable again.`,
      };
    }
    return {
      ...base,
      state: "buildable",
      why: bet.prototype?.status === "retired"
        ? "The experiment is shaped and approved, and its previous prototype is retired."
        : "The experiment is shaped and approved, and nothing is built against it.",
      next: `Hand the packet to a coding agent together with AGENTS.md: ${brief}.`,
    };
  }

  if (state === "unstamped") {
    return {
      ...base,
      state: "unstamped",
      why: `prototype.status '${bet.prototype?.status}' claims the software tests this experiment, and nothing records that anybody checked.`,
      next: `A person checks the software against the sections and records builtAgainst, or drops the status to 'concept' — ${brief} prints both.`,
    };
  }

  if (state === "stale") {
    return {
      ...base,
      state: "stale",
      why: `The experiment moved after the last check: ${drifted.join(", ")} changed, so the prototype's claim is unconfirmed.`,
      next: `Rebuild or re-check against what changed, then restamp or drop the status to 'concept' — ${brief} leads with the changed text.`,
    };
  }

  // A session already in staging changes the ask. Recorded but undecided, the
  // next move is a person's judgement over what it taught — another session,
  // or a build against undecided observations, would run ahead of the gate.
  const recorded = sessions?.runs ?? 0;
  const sessionNote = (glance: SessionGlance) =>
    `${glance.runs} session${glance.runs === 1 ? "" : "s"} recorded in staging` +
    (glance.undecided > 0 ? `, ${glance.undecided} finding(s) undecided` : ", findings decided");

  if (bet.prototype?.status === "tested") {
    return {
      ...base,
      state: "reviewed",
      why: `Built, current, and reviewed with participants${recorded ? ` — ${sessionNote(sessions as SessionGlance)}` : ""}.`,
      next:
        recorded && (sessions as SessionGlance).undecided > 0
          ? "Decide the session's findings at /review — what a review taught cannot change anything until a person says what it means."
          : "What the sessions taught enters as a handoff with a 'session' source and is decided at /review — docs/prototype-workflow.md, closing the loop.",
    };
  }

  const prompts = Boolean(bet.sections[SECTION.reviewPrompts]?.trim());
  if (recorded) {
    const glance = sessions as SessionGlance;
    return {
      ...base,
      state: "reviewable",
      why: `Built and current, and ${sessionNote(glance)}.`,
      next:
        glance.undecided > 0
          ? "Decide the session's findings at /review before the next session or build — undecided observations cannot authorize anything."
          : "The session's findings are decided. A person updates prototype.status if the review used the named script, and the next iteration builds from what was accepted.",
    };
  }
  return {
    ...base,
    state: "reviewable",
    why: "Built and current: the software was checked against the approved experiment and neither has moved since.",
    next: prompts
      ? "Put it in front of participants using its # Review prompts, then write the session up as a handoff with a 'session' source."
      : `Before a session it needs # ${SECTION.reviewPrompts} in the bet — validation is already asking for them.`,
  };
}
