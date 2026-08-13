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
  problem: "Problem",
  bet: "Bet",
  questions: "Questions",
} as const;

export const RENDERED_SECTIONS: Record<string, readonly string[]> = {
  stages: [SECTION.currentModel, SECTION.openQuestions],
  steps: [SECTION.currentModel, SECTION.openQuestions],
  bets: [SECTION.problem, SECTION.bet, SECTION.questions],
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
