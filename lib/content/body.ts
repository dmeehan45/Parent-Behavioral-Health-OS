/**
 * Markdown body parsing for content primitives.
 *
 * Frontmatter carries the structured model. The Markdown body carries the prose
 * a human reads, split into named sections by top-level (`#`) headings.
 *
 * The projection renders a *fixed* set of section names per primitive — see
 * `RENDERED_SECTIONS`. That makes section names a content contract rather than a
 * convention: a heading the application does not render is prose that would
 * silently never appear, so the loader rejects it instead of dropping it.
 */

/** Prose appearing before the first `#` heading. */
export const OVERVIEW = "Overview";

/** Section names the application renders, keyed by primitive. */
export const SECTION = {
  currentModel: "Current model",
  openQuestions: "Open questions",
  whatHappensToday: "What happens today",
  whyItMatters: "Why it matters",
  bet: "Bet",
  questions: "Questions",
  learningDecision: "Learning decision",
  scope: "Scope",
  outOfScope: "Out of scope",
  assumptions: "Assumptions",
  signals: "Signals and safeguards",
  fidelity: "Fidelity",
  reviewPrompts: "Review prompts",
} as const;

/**
 * The shape of the experiment a Bet proposes, in the Bet itself.
 *
 * `docs/prototype-workflow.md` already required a person to approve these five
 * things before anything is built. They had nowhere to live but a chat, so the
 * approval left no record, and every build re-derived them.
 *
 * Named sections rather than one free-form block, because the names are what
 * make readiness *derivable*: coverage counts them, open ends can say which is
 * missing, and the build packet can refuse to say "build" without them. All of
 * them stay optional — a Bet is allowed to exist long before an experiment does.
 *
 * `# Out of scope` is separate from `# Scope`, and it is the one split worth
 * making. Scope held four things — participant, moment, in-scope path, and
 * exclusions — so a scope that named what it deliberately left out counted the
 * same as one that did not, and a builder handed the second invents the
 * difference. Exclusions are the half that stops a prototype quietly growing,
 * which makes them worth gating on their own. The other three stay together:
 * `participant` already has a structured field, and the moment and the path are
 * one thought.
 */
export const EXPERIMENT_SECTIONS = [
  SECTION.learningDecision,
  SECTION.scope,
  SECTION.outOfScope,
  SECTION.assumptions,
  SECTION.signals,
  SECTION.fidelity,
] as const;

/** What each one is for, said where somebody is deciding whether to write it. */
export const EXPERIMENT_SECTION_MEANING: Record<string, string> = {
  [SECTION.learningDecision]: "What somebody should be better able to decide after trying this. If no decision changes, there is no reason to build it yet.",
  [SECTION.scope]: "Who encounters it, at what moment in the flow, and the thinnest path that tests the decision.",
  [SECTION.outOfScope]: "What is deliberately not represented, and why. A builder who is not told this invents it, and the prototype grows until it is testing something else.",
  [SECTION.assumptions]: "What the prototype assumes in order to run, kept separate from what the model claims. A blank model field is not a licence to invent behaviour.",
  [SECTION.signals]: "The observable signal that would support or weaken the bet, and the harm or trade-off to watch while looking for it.",
  [SECTION.fidelity]: "How real this needs to be, dimension by dimension, so polish has a stated reason and low fidelity is a choice rather than an apology.",
};

export const RENDERED_SECTIONS: Record<string, readonly string[]> = {
  stages: [SECTION.currentModel, SECTION.openQuestions],
  steps: [SECTION.currentModel, SECTION.openQuestions],
  problems: [SECTION.whatHappensToday, SECTION.whyItMatters, SECTION.openQuestions],
  // A Bet no longer states its own problem: it names one, and the Problem file
  // is where that is written. Two statements of the same trouble would drift.
  // The experiment sections describe the test, which is the one thing no other
  // primitive holds — they never restate the problem or the intervention.
  // Review prompts are separate from the experiment fingerprint. They shape how
  // learning is elicited after somebody tries the software; refining a prompt
  // should not falsely claim that the software itself became stale.
  bets: [SECTION.bet, SECTION.questions, ...EXPERIMENT_SECTIONS, SECTION.reviewPrompts],
  // Entities, claims, and metrics render their body as a single block of prose.
  // Any heading in them would be invisible, so none are permitted.
  entities: [],
  claims: [],
  metrics: [],
};

export type ParsedBody = {
  /** Section name -> prose. Leading prose is stored under `Overview`. */
  sections: Record<string, string>;
  /** Top-level headings in document order, for validation and error messages. */
  headings: string[];
};

const HEADING = /^#\s+(.*)$/;

/**
 * Split a Markdown body into named sections on top-level headings.
 *
 * `## Subheadings` are left inside their parent section. A heading with no prose
 * beneath it yields an empty section rather than borrowing a neighbour's text.
 */
export function parseBody(body: string): ParsedBody {
  const sections: Record<string, string> = {};
  const headings: string[] = [];

  let current = OVERVIEW;
  let buffer: string[] = [];

  const flush = () => {
    const prose = buffer.join("\n").trim();
    // Leading prose is only recorded when it exists; named sections are always
    // recorded, so an author can see that a section was found but left empty.
    if (current !== OVERVIEW || prose) sections[current] = prose;
    buffer = [];
  };

  for (const line of body.split("\n")) {
    const match = HEADING.exec(line);
    if (match) {
      flush();
      current = match[1].trim();
      headings.push(current);
    } else {
      buffer.push(line);
    }
  }
  flush();

  return { sections, headings };
}

/**
 * Count Markdown list items in a section.
 *
 * Used for surfacing "N open questions" on the map. Counts `-`, `*`, `+`, and
 * numbered items so the count does not depend on which bullet style an author
 * happens to use.
 */
export function countListItems(section: string | undefined): number {
  if (!section) return 0;
  return (section.match(/^\s*(?:[-*+]|\d+\.)\s+\S/gm) ?? []).length;
}
