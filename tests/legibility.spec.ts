import { expect, test } from "@playwright/test";
import { allRoutes } from "./routes";

/**
 * The legibility floor.
 *
 * `responsive.spec.ts` asks whether the interface *fits*. This asks whether
 * what fits can be *read*, which is a different question and the one that got
 * past every check in the suite.
 *
 * The bug it was written for: a five-column rail on the front page, each column
 * about 110px of a 1000px measure, each carrying a twelve-word sentence and a
 * shell command. It wrapped to six ragged lines of roughly fifteen characters —
 * unreadable — and every automated check passed, because the only typography
 * assertion in the repository was `width <= 760px`. A measure bounded above and
 * never below cannot tell readable from unreadable-but-narrow.
 *
 * So this measures the other end. Characters per line is the standard unit for
 * it: 45–75 is the comfortable band for continuous reading, and the floor here
 * is deliberately well below that. This is not a house style being enforced —
 * it is the line past which text has stopped being prose and become a column of
 * word fragments.
 */

/**
 * Characters per line below which continuous reading breaks down.
 *
 * Set as a floor rather than a target on purpose: narrow columns are a
 * legitimate design choice, and a check that argued for 45 would be arguing
 * about taste. 30 is not taste — the front-page rail measured 15.
 */
const MIN_CHARS_PER_LINE = 30;

/**
 * How much text has to be present before a block counts as prose.
 *
 * Labels, badges, counts and single words wrap for reasons that have nothing to
 * do with readability, and holding them to a measure would only teach whoever
 * runs this to ignore it.
 */
const MIN_PROSE_LENGTH = 40;

type Finding = {
  route: string;
  selector: string;
  charsPerLine: number;
  lines: number;
  width: number;
  text: string;
};

/**
 * Everything a reader reads *as prose*. Deliberately not `*`: measuring every
 * element measures every wrapper twice and reports the same sentence from four
 * ancestors at once.
 *
 * Headings are not in the list. Display type is set short-line on purpose — an
 * `h1` at 40px wraps to three lines on a phone and is doing its job — and the
 * measure that governs it is the ceiling, not this floor. Holding headings to a
 * body-copy metric would produce failures nobody should act on, which is how a
 * check stops being read.
 */
const PROSE = "p, li, dd, blockquote, figcaption, code, td, th";

async function measure(page: import("@playwright/test").Page, route: string): Promise<Finding[]> {
  return page.evaluate(
    ({ PROSE, MIN_CHARS_PER_LINE, MIN_PROSE_LENGTH, route }) => {
      /*
       * Open every disclosure first.
       *
       * This is the whole reason the original bug survived review: the band was
       * looked at with all five of its `<details>` shut, which is the state that
       * cannot fail. The repository already says this about the map — check the
       * state that holds the most content, not the empty one — and this encodes
       * it so the rule does not have to be remembered.
       */
      for (const disclosure of Array.from(document.querySelectorAll("details"))) {
        disclosure.open = true;
      }

      /** A readable label for whatever failed, so the report names a thing. */
      const describe = (element: Element): string => {
        const tag = element.tagName.toLowerCase();
        const classes = (element.getAttribute("class") ?? "")
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((name) => `.${name}`)
          .join("");
        return `${tag}${classes}`;
      };

      const findings: Array<{
        route: string;
        selector: string;
        charsPerLine: number;
        lines: number;
        width: number;
        text: string;
      }> = [];

      for (const element of Array.from(document.querySelectorAll(PROSE))) {
        /*
         * The canvas is exempt, and this is a decision rather than an oversight.
         * React Flow draws nodes inside a CSS transform, so a rect measured here
         * is not the size text is painted at — and the canvas already governs
         * its own legibility by zoom tier, in painted pixels, which is the
         * stricter and more correct treatment.
         */
        if (element.closest(".react-flow")) continue;
        // Hidden from sight, or hidden from everyone.
        if (element.closest("[hidden], .visually-hidden, [aria-hidden='true']")) continue;

        // Leaf blocks only. A `dd` wrapping three paragraphs is not itself a
        // measure; its paragraphs are, and they are measured on their own.
        if (element.querySelector(PROSE)) continue;

        /*
         * Composed rows are not prose.
         *
         * A link row is a badge, a title and a meta span sitting side by side;
         * `textContent` glues them into "StepBecome Match-ReadyClinician
         * Onboarding & Readiness", which reads like a badly-set sentence and is
         * nothing of the kind. Two or more element children carrying text means
         * the thing is a structure, and its layout is not a measure question.
         */
        const speakingChildren = Array.from(element.children).filter((child) =>
          (child.textContent ?? "").trim(),
        ).length;
        if (speakingChildren >= 2) continue;

        /*
         * Only what is actually set on screen.
         *
         * `textContent` includes screen-reader-only labels, which are never
         * painted — counting them inflates the character count of a card whose
         * visible text is three short labels and reports it as unreadable
         * prose. Measure what a reader sees.
         */
        const visibleText = (node: Element): string => {
          let out = "";
          for (const child of Array.from(node.childNodes)) {
            if (child.nodeType === Node.TEXT_NODE) out += child.textContent ?? "";
            else if (child instanceof Element && !child.matches(".visually-hidden, [aria-hidden='true']")) {
              out += visibleText(child);
            }
          }
          return out;
        };

        const text = visibleText(element).replace(/\s+/g, " ").trim();
        if (text.length < MIN_PROSE_LENGTH) continue;

        /*
         * A wrapper around a control is a control.
         *
         * A caseload slot is an `li` holding one button with a name, a need and
         * an action stacked inside it. That is a card, and cards are laid out
         * to a different standard than paragraphs — the measure question does
         * not apply. An ordinary paragraph with an inline link is untouched by
         * this, because the link is a small share of its text.
         */
        const control = element.querySelector("a, button");
        if (control && visibleText(control).replace(/\s+/g, " ").trim().length >= text.length * 0.6) continue;

        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        const style = getComputedStyle(element);
        if (style.visibility === "hidden" || style.display === "none") continue;

        const lineHeight =
          parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.4 || 16;
        const inner =
          element.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
        const lines = Math.max(1, Math.round(inner / lineHeight));

        // Text that does not wrap has no measure to be wrong about.
        if (lines < 2) continue;

        /*
         * How many characters actually fit on a line — measured from the glyphs,
         * not inferred from how the last line happened to fall.
         *
         * The obvious metric, `length / lines`, is wrong in the common case: a
         * 48-character sentence wrapping once has a nearly full first line and
         * three words on the second, and averaging them reports 24 for text
         * that is set at 45. That noise is what makes a check get ignored. So
         * measure the font and divide the content box by the average glyph.
         */
        const context = document.createElement("canvas").getContext("2d");
        if (!context) continue;
        context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const glyph = context.measureText(text).width / text.length;
        if (!glyph) continue;

        const contentWidth =
          element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        const charsPerLine = contentWidth / glyph;
        if (charsPerLine >= MIN_CHARS_PER_LINE) continue;

        findings.push({
          route,
          selector: describe(element),
          charsPerLine: Math.round(charsPerLine),
          lines,
          width: Math.round(rect.width),
          text: text.slice(0, 60),
        });
      }

      return findings;
    },
    { PROSE, MIN_CHARS_PER_LINE, MIN_PROSE_LENGTH, route },
  );
}

test.describe("legibility", () => {
  test("prose is never set narrower than it can be read", async ({ page }) => {
    await page.goto("/");
    const routes = await allRoutes(page);

    const findings: Finding[] = [];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("header.app-header")).toBeVisible();
      findings.push(...(await measure(page, route)));
    }

    const report = findings
      .map(
        (finding) =>
          `  ${finding.route} — ${finding.selector} at ${finding.width}px: ` +
          `${finding.charsPerLine} chars/line over ${finding.lines} lines — "${finding.text}…"`,
      )
      .join("\n");

    expect(
      findings,
      `Text set below ${MIN_CHARS_PER_LINE} characters per line, where reading breaks down.\n` +
        `Widen the container, shorten the text, or move it somewhere with room:\n${report}`,
    ).toEqual([]);
  });
});
