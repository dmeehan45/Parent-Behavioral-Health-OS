/**
 * Design-system lint.
 *
 * The Family Health Provider system only survives contact with future work if
 * brand values stay in one file. This checks the two ways that quietly stops
 * being true:
 *
 *   1. A literal colour appears in application CSS or a component, instead of
 *      an alias onto the semantic layer.
 *   2. `canvas-theme.ts` — the one legitimate exception, because SVG markers
 *      cannot read a custom property — drifts away from the ramp.
 *
 * It is deliberately crude. It reads files as text and looks for colours. That
 * catches the mistake that actually happens without slowing anything down.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

/** Where brand values are allowed to be written as literals. */
const TOKEN_SOURCE = "app/design-system.css";
const CANVAS_THEME = "components/map/canvas-theme.ts";

const SEARCH_DIRS = ["app", "components"];
const EXTENSIONS = new Set([".css", ".ts", ".tsx"]);

/** Hex colours, and rgb()/hsl() with literal channel values. */
const COLOUR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(\s*[\d.]+/g;

type Finding = { file: string; line: number; text: string; value: string };

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (EXTENSIONS.has(path.extname(entry))) out.push(full);
  }
  return out;
}

function relative(file: string): string {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

/** Replace comment bodies with spaces, keeping every newline so line numbers hold. */
function stripComments(source: string): string {
  const blank = (match: string) => match.replace(/[^\n]/g, " ");
  return source.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/\/\/[^\n]*/g, blank);
}

const findings: Finding[] = [];

for (const dir of SEARCH_DIRS) {
  for (const file of walk(path.join(ROOT, dir))) {
    const rel = relative(file);
    if (rel === TOKEN_SOURCE || rel === CANVAS_THEME) continue;

    const source = readFileSync(file, "utf8");
    const lines = source.split("\n");

    // Comments are exempt: this codebase cites measured brand values in prose
    // throughout, and that is the point. Blank them out in place so reported
    // line numbers still match the file.
    const scannable = stripComments(source).split("\n");

    scannable.forEach((text, index) => {
      // A line can opt out with a reason, on itself or the line above. Used for
      // the handful of colours that are not brand decisions at all — a mask, a
      // scrim — where there is no semantic role to alias.
      if (/ds-allow:/.test(lines[index]) || /ds-allow:/.test(lines[index - 1] ?? "")) return;

      for (const match of text.matchAll(COLOUR)) {
        findings.push({ file: rel, line: index + 1, text: lines[index].trim(), value: match[0] });
      }
    });
  }
}

/* The canvas exception has to stay honest: every colour it paints must be a
   value that appears in the token source. */
const tokenSource = readFileSync(path.join(ROOT, TOKEN_SOURCE), "utf8").toLowerCase();
const drifted: Finding[] = [];

readFileSync(path.join(ROOT, CANVAS_THEME), "utf8")
  .split("\n")
  .forEach((text, index) => {
    for (const match of text.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
      if (!tokenSource.includes(match[0].toLowerCase())) {
        drifted.push({ file: CANVAS_THEME, line: index + 1, text: text.trim(), value: match[0] });
      }
    }
  });

if (findings.length === 0 && drifted.length === 0) {
  console.log("Design system: no literal colours outside the token layer.");
  process.exit(0);
}

if (findings.length > 0) {
  console.error(
    `\nLiteral colours outside ${TOKEN_SOURCE}. Alias the semantic layer instead ` +
      `(--ds-text-*, --ds-surface-*, --ds-action, --ds-status-*), or add the role ` +
      `to ${TOKEN_SOURCE} if none of them fit:\n`,
  );
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line}  ${f.value}\n      ${f.text}`);
  }
}

if (drifted.length > 0) {
  console.error(
    `\n${CANVAS_THEME} paints colours that are not in the ramp. Every value there ` +
      `must also appear in ${TOKEN_SOURCE}:\n`,
  );
  for (const f of drifted) {
    console.error(`  ${f.file}:${f.line}  ${f.value}\n      ${f.text}`);
  }
}

console.error("");
process.exit(1);
