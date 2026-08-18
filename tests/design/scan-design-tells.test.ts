import test from "node:test";
import assert from "node:assert/strict";
import { scanText } from "../../scripts/scan-design-tells";

const rules = (css: string, file = "app/globals.css") =>
  scanText(file, css).map((f) => f.rule);

test("flags a decorative gradient but not a mask fade", () => {
  assert.deepEqual(rules(".hero { background: linear-gradient(#6366f1, #3b82f6); }"), [
    "gradient-decor",
  ]);
  assert.deepEqual(
    rules(".fade { mask-image: linear-gradient(to right, #000 0, transparent 100%); }"),
    [],
  );
});

test("flags gradient-filled text", () => {
  assert.deepEqual(rules("h1 { -webkit-background-clip: text; }"), ["gradient-decor"]);
});

test("flags motion literals and non-system easing, not token motion", () => {
  assert.deepEqual(rules(".card { transition: box-shadow 0.18s ease; }"), ["motion-drift"]);
  assert.deepEqual(
    rules(".sheet { transition: transform 0.26s cubic-bezier(0.32, 0.72, 0, 1); }"),
    ["motion-drift"],
  );
  assert.deepEqual(
    rules(".row { transition: background var(--ds-duration) var(--ds-ease); }"),
    [],
  );
});

test("ignores the reduced-motion kill-switch", () => {
  assert.deepEqual(rules("* { transition-duration: 0.001ms !important; }"), []);
});

test("flags radius literals at 8px and above, not circles or hairlines", () => {
  assert.deepEqual(rules(".toast { border-radius: 20px; }"), ["radius-drift"]);
  assert.deepEqual(rules(".pill { border-radius: 999px; }"), ["radius-drift"]);
  assert.deepEqual(rules(".dot { border-radius: 50%; }"), []);
  assert.deepEqual(rules(".kbd { border-radius: 3px; }"), []);
  assert.deepEqual(rules(".card { border-radius: var(--radius); }"), []);
});

test("flags emoji-as-ui but not the interface's text dingbats", () => {
  assert.deepEqual(
    rules('<h3>🚀 Launch</h3>', "components/x.tsx"),
    ["emoji-as-ui"],
  );
  assert.deepEqual(rules('label="Added ✓ — remove"', "components/x.tsx"), []);
  assert.deepEqual(rules("<button>✕</button>", "components/x.tsx"), []);
});

test("flags glow shadows and the AI purple band", () => {
  assert.deepEqual(rules(".neon { text-shadow: 0 0 12px #00ffcc; }"), ["glow-shadow"]);
  assert.deepEqual(rules(".cta { color: #7c3aed; }"), ["ai-purple"]);
});

test("flags a font-family literal, not one that reads a token", () => {
  assert.deepEqual(rules("body { font-family: Inter, sans-serif; }"), ["font-drift"]);
  assert.deepEqual(rules("body { font-family: var(--font); }"), []);
});

test("a tokenized duration still needs the easing token", () => {
  assert.deepEqual(rules(".fade { transition: opacity var(--ds-duration); }"), [
    "motion-drift",
  ]);
  assert.deepEqual(
    rules(".fade { transition: opacity var(--ds-duration) var(--ds-ease); }"),
    [],
  );
});

test("radius shorthands are inspected corner by corner", () => {
  assert.deepEqual(
    rules(".card { border-radius: var(--radius) var(--radius) 20px 20px; }"),
    ["radius-drift"],
  );
  assert.deepEqual(rules(".card { border-radius: 4px 4px 20px 20px; }"), [
    "radius-drift",
  ]);
  assert.deepEqual(
    rules(".card { border-radius: var(--radius) var(--radius-lg); }"),
    [],
  );
});

test("comments are not scanned, in css or in tsx", () => {
  assert.deepEqual(rules("/* example of the tell: linear-gradient(#fff, #000) */"), []);
  assert.deepEqual(
    rules("// never use 🚀 as a feature icon", "components/x.tsx"),
    [],
  );
  assert.deepEqual(
    rules("/* spans\nlinear-gradient(#fff, #000)\nlines */\n.ok { color: var(--ink); }"),
    [],
  );
  assert.deepEqual(
    rules('const url = "https://example.com"; const bad = <b>🚀</b>;', "components/x.tsx"),
    ["emoji-as-ui"],
  );
});

test("ds-allow needs a real comment and a reason", () => {
  assert.deepEqual(
    rules("/* ds-allow: */\n.pill { border-radius: 999px; }"),
    ["radius-drift"],
  );
  assert.deepEqual(
    rules('const s = "ds-allow: not a comment";\n<b>🚀</b>', "components/x.tsx"),
    ["emoji-as-ui"],
  );
});

test("a ds-allow comment on the line or the one above opts out", () => {
  assert.deepEqual(
    rules(".pulse { animation: pulse 1s ease-in-out infinite; /* ds-allow: skeleton pulse */ }"),
    [],
  );
  assert.deepEqual(
    rules("/* ds-allow: sheet spring matches the platform sheet */\n.sheet { transition: transform 0.26s cubic-bezier(0.32, 0.72, 0, 1); }"),
    [],
  );
});
