/**
 * scan-design-tells — AI-default design drift the token layer cannot express.
 *
 * `lint:design` owns colours: a literal hex outside the token file fails there.
 * This scan owns the mechanical tells that arrive with generated UI and that a
 * colour rule never sees: decorative gradients, gradient-filled text, glow
 * shadows, emoji standing in for icons, motion that bypasses the system's
 * duration and easing tokens, radius literals off the system's scale, and
 * font faces nobody chose. The catalog behind the rules, with the evidence
 * for each, is `.claude/skills/design-tells/references/tells.md`.
 *
 * A line that is a deliberate decision opts out with a `ds-allow:` comment on
 * the line or the one above it, plus a reason — the same escape hatch, same
 * spelling, as lint:design. The scan stays narrow on purpose: over-flagging
 * trains people to ignore the tool, and layout coherence, hue-as-category,
 * and spacing rhythm need eyes, not regex.
 *
 * Exit code is the finding count, so CI gates on zero.
 */

import fs from "node:fs";
import path from "node:path";

export interface Finding {
  rule: string;
  label: string;
  fix: string;
  file: string;
  line: number;
  snippet: string;
}

const SCAN_DIRS = ["app", "components", "lib"];
const EXTS = new Set([".css", ".ts", ".tsx"]);
const SKIP_FILES = new Set(["app/design-system.css"]); // the token source itself
const SKIP_DIRS = new Set(["node_modules", ".next"]);

// The violet/indigo band models reach for when nobody chose a colour.
const AI_PURPLE =
  /#(6366f1|4f46e5|818cf8|7c3aed|6d28d9|8b5cf6|a855f7|9333ea|7e22ce|c026d3|d946ef)\b/i;

// Emoji presentation ranges plus the usual icon suspects. Deliberately NOT
// the text dingbats (U+2713 ✓, U+2715 ✕ …) the interface uses as affordance
// glyphs — the tell is 🚀-as-feature-icon, not a checkmark.
const EMOJI = /[\u{1F000}-\u{1FAFF}]|✨|⚡|✅|⭐|❌|❗/u;

// A literal duration in a transition/animation shorthand. Durations at or
// under 10ms are kill-switches (the reduced-motion guard), not motion.
const DURATION = /(\d*\.?\d+)(m?s)\b/g;

const NAMED_EASING = /\b(ease(-in|-out|-in-out)?|linear)\b/;
const LITERAL_BEZIER = /cubic-bezier\(/;

function durationSeconds(value: string, unit: string): number {
  return unit === "ms" ? Number(value) / 1000 : Number(value);
}

interface Rule {
  rule: string;
  label: string;
  fix: string;
  match: (line: string, file: string) => boolean;
}

const RULES: Rule[] = [
  {
    rule: "gradient-decor",
    label: "Decorative gradient or gradient-filled text",
    fix: "The system paints in solid semantic colours; gradient text especially reads as generated. A mask fade is fine — this rule skips mask-image lines. If a gradient is a real decision, say why with ds-allow.",
    match: (line) => {
      if (/mask-image|-webkit-mask/.test(line)) return false;
      if (/(linear|radial|conic)-gradient\(/.test(line)) return true;
      return /background-clip:\s*text|-webkit-background-clip:\s*text/.test(line);
    },
  },
  {
    rule: "ai-purple",
    label: "The violet/indigo band models default to",
    fix: "No hue in the system is purple, and purple-as-primary is the strongest 'nobody chose this' signal. Use the semantic role for what the element means.",
    match: (line) => AI_PURPLE.test(line),
  },
  {
    rule: "glow-shadow",
    label: "Glow shadow (text-shadow, or box-shadow with 0 0 spread)",
    fix: "Shadows are tokens (--ds-shadow-*, --shadow-*), and the system lifts surfaces one step rather than glowing them. Remove glow nobody designed.",
    match: (line) => {
      if (/text-shadow\s*:/.test(line) && !/text-shadow\s*:\s*none/.test(line)) return true;
      return /box-shadow\s*:[^;]*\b0\s+0\s+\d{2,}px/.test(line);
    },
  },
  {
    rule: "emoji-as-ui",
    label: "Emoji standing in for an icon or label",
    fix: "Meaning arrives in words here, and hue is category. Use text, or the kind badge the system already has. (Text dingbats like the close ✕ are not flagged.)",
    match: (line) => EMOJI.test(line),
  },
  {
    rule: "motion-drift",
    label: "Motion bypassing the duration and easing tokens",
    fix: "Motion is var(--ds-duration) on var(--ds-ease) — with --ds-duration-fast and --ds-duration-slow for the ends. A deliberate exception (a skeleton pulse, a sheet spring) states its reason with ds-allow.",
    match: (line) => {
      if (!/\b(transition|animation|transition-duration|animation-duration)\s*:/.test(line)) {
        return false;
      }
      const declaration = line
        .slice(line.indexOf(":"))
        .replace(/var\([^)]*\)/g, "");
      for (const m of declaration.matchAll(DURATION)) {
        if (durationSeconds(m[1], m[2]) > 0.01) return true;
      }
      if (LITERAL_BEZIER.test(declaration)) return true;
      return NAMED_EASING.test(declaration);
    },
  },
  {
    rule: "radius-drift",
    label: "Radius literal off the system's scale",
    fix: "The system has a radius scale (--radius, --radius-lg, --radius-card, --radius-pill, and the --ds-radius-* steps). Literals at 8px and above, and literal pills, drift from it; 50% circles and hairline radii under 8px are not flagged.",
    match: (line) => {
      const m = line.match(/border-radius\s*:\s*([^;]+)/);
      if (!m || m[1].includes("var(")) return false;
      if (/9{3,}px/.test(m[1])) return true;
      const px = m[1].match(/(\d+(\.\d+)?)px/);
      return px !== null && Number(px[1]) >= 8;
    },
  },
  {
    rule: "font-drift",
    label: "Font face outside the chosen pair",
    fix: "The faces are Manrope and Caveat, loaded in app/layout.tsx and read through tokens. A font-family literal, or an import of a starter face (Inter, Geist, Roboto) or the current 'tasteful default' serifs, is a face nobody here chose.",
    match: (line) => {
      if (/font-family\s*:/.test(line) && !/var\(/.test(line)) return true;
      return /\b(Inter|Geist|Roboto|Instrument[_ ]Serif|Fraunces|Playfair)\b/.test(line) && /next\/font/.test(line);
    },
  },
];

export function scanText(file: string, content: string): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prev = i > 0 ? lines[i - 1] : "";
    if (line.includes("ds-allow:") || prev.includes("ds-allow:")) continue;
    for (const rule of RULES) {
      if (rule.match(line, file)) {
        findings.push({
          rule: rule.rule,
          label: rule.label,
          fix: rule.fix,
          file,
          line: i + 1,
          snippet: line.trim().slice(0, 140),
        });
        break;
      }
    }
  }
  return findings;
}

function* files(root: string, dir: string): Generator<string> {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* files(root, rel);
    } else if (EXTS.has(path.extname(entry.name)) && !SKIP_FILES.has(rel)) {
      yield rel;
    }
  }
}

export function scanRepo(root: string): Finding[] {
  const findings: Finding[] = [];
  for (const dir of SCAN_DIRS) {
    if (!fs.existsSync(path.join(root, dir))) continue;
    for (const rel of files(root, dir)) {
      findings.push(...scanText(rel, fs.readFileSync(path.join(root, rel), "utf8")));
    }
  }
  return findings;
}

function main() {
  const root = process.cwd();
  const asJson = process.argv.includes("--json");
  const findings = scanRepo(root);

  if (asJson) {
    console.log(JSON.stringify({ findings, count: findings.length }, null, 2));
    process.exit(findings.length === 0 ? 0 : 1);
  }

  if (findings.length === 0) {
    console.log("scan:design-tells — clean. What regex cannot see (hue-as-category, layout, spacing) still needs eyes; the skill's audit checklist says where to look.");
    process.exit(0);
  }

  const byRule = new Map<string, Finding[]>();
  for (const f of findings) {
    const list = byRule.get(f.rule) ?? [];
    list.push(f);
    byRule.set(f.rule, list);
  }
  console.log(`scan:design-tells — ${findings.length} finding${findings.length === 1 ? "" : "s"}\n`);
  for (const [, items] of byRule) {
    console.log(`  ${items[0].label} (${items.length})`);
    console.log(`    fix: ${items[0].fix}`);
    for (const f of items) console.log(`    ${f.file}:${f.line}  ${f.snippet}`);
    console.log("");
  }
  console.log("A deliberate exception opts out with a ds-allow: comment and a reason.");
  process.exit(findings.length);
}

if (process.argv[1] && process.argv[1].endsWith("scan-design-tells.ts")) {
  main();
}
