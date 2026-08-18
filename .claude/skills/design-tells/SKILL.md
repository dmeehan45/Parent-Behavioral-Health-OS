---
name: design-tells
description: >-
  Strip the cues that make an interface read as AI-generated and hold every
  visual choice to the design system this repository already chose. Use
  whenever building, styling, reviewing, or auditing anything visual: a new
  page or component, a styling change in app/ or components/, a CSS edit, or a
  request like "does this look AI-made", "de-slop the UI", "make it look less
  generic", "vibe-coded", or "design review". Also run its scanner,
  npm run scan:design-tells, before finishing any change that touches styles —
  it is the check CI runs. Companion to the humanizer skill, which owns the
  words; this owns how the interface looks and moves.
---

# Design tells

The design counterpart to the humanizer. One idea carried over from its
source, because it decides every judgement this skill makes: **a tell is an
unspecified default, not a banned style.** Generated UI reads as generated
because nobody chose it — the model reached for the median. The fix is never
a different nice-looking default; it is the choice this project actually
made.

This repository has already made that choice. The Family Health Provider
system, its tokens, and its rules live in `app/design-system.css` and
`docs/design-system.md`, and they answer the question upstream versions of
this skill have to ask the user: what is the reference, the colour decision,
the type decision, the layout intent. Here, an unspecified default is
anything that bypasses that system — and drift toward the generated median
is what this skill exists to catch.

The tells themselves, with the evidence for each and how it lands in this
repository, are in [references/tells.md](references/tells.md). Read it before
an audit; skim its headings before a build.

## Where this sits among the checks

Each surface has one owner. This skill adds the drift check nothing else
sees, and defers the rest:

- **Colours** belong to `lint:design` — a literal hex outside the token file
  fails there, including the checked copy in `canvas-theme.ts`.
- **Fit and tap targets** belong to `test:responsive`; **line measure**
  belongs to the legibility spec.
- **The design rules themselves** — hue as category, the focus ring, the 44px
  floor, motion, the script word — belong to `docs/design-system.md`. This
  skill enforces drift from them; it does not restate them.
- **Words** belong to the humanizer skill, including hype copy ("Transform
  your X", "Effortlessly") — a copy tell found during a design pass routes
  there.
- **This skill owns**: decorative gradients and gradient text, the AI-purple
  band, glow shadows, emoji standing in for icons, motion that bypasses the
  duration and easing tokens, radius literals off the scale, fonts nobody
  chose — mechanically, via the scanner — and the judgement tells below, via
  eyes.

## The scanner

```bash
npm run scan:design-tells          # findings with file:line and the fix
npm run scan:design-tells -- --json
```

It scans `app/`, `components/`, and `lib/`, skips the token file (values are
allowed to live there), and exits non-zero on any finding, so CI gates on it.
A line that is a deliberate decision opts out with a `ds-allow:` comment on
the line or the one above, **with a reason** — the same escape hatch as
`lint:design`. The reason is the point: "ds-allow: sheet spring on the
platform's own curve" turns an anomaly into a decision a reader can audit.

Do not fix a finding by picking a different literal, and do not ds-allow a
finding to make the scan pass — the first launders one default into another,
the second is the design version of restamping a stale prototype. Fix it
with the token or role the system already has, add the role if none fits
(`docs/design-system.md` says how), or write the reason that makes it a
choice.

## Build mode

Before adding or restyling anything visual:

1. Read `docs/design-system.md` — the rules section, not just the tokens.
2. Name what you will use: which semantic roles, which radius step, which
   duration. If nothing fits, add a role to the semantic layer rather than
   reaching past it. A value invented inline is the tell being born.
3. Build, then run the scanner and `lint:design` before calling it done.
4. Serve it and look at it, at both widths, in the state that holds the most.
   `AGENTS.md` owns that rule and what it means; a clean scan is a clean
   surface, not a coherent one.

## Audit mode

When reviewing existing UI, or asked "does this look AI-made":

1. Run the scanner first. Mechanical tells go by file and line.
2. Then the judgement tells, by eye, against the catalog:
   - **Hue as decoration.** A kind colour used because it looked nice there,
     not because the element is that kind. The rule most likely broken by a
     visually pleasing change.
   - **Uniform monotony.** Identical card grids stacked, every section the
     same weight, one radius everywhere. Real design varies with intent.
   - **Unmotivated motion.** Animation that communicates nothing. If every
     element moves the same way, none of the movement means anything.
   - **Spacing off the scale.** Arbitrary paddings mixing freely read as
     machine-assembled even when every colour is right.
   - **The emptiest state was checked; audit the fullest.** Every disclosure
     open, the longest record, the sheet docked.
3. Report like the humanizer does: a verdict — **ship**, **revise**, or
   **not ready** — then findings by severity, each with location, the rule it
   breaks, and the concrete fix. Blocking: a finding that ships a new
   unchosen default or breaks a stated system rule. Should fix: scanner
   findings and catalog tells. Polish: coherence observations.

## What this deliberately does not flag

Kept from the upstream data so the audit stays trustworthy: bento grids,
glassmorphism, and mesh/blob backgrounds are not real complaints; dark mode
is fine (this repository's dark block is declared new design work); rounded
corners and a soft look are this system's own voice, not a tell. The
generated-median *skeleton* (centred hero, three feature cards, a CTA band)
matters for marketing pages and barely applies to this app's surfaces — if
one appears in a prototype, weigh it there.

## Attribution

Adapted from [JCarterJohnson/vibecoded-design-tells](https://github.com/JCarterJohnson/vibecoded-design-tells)
(the `unslop-ui` skill, MIT, license preserved in [LICENSE](LICENSE)), whose
catalog is grounded in a ~3.2M-post Reddit analysis of what people actually
flag as AI-made design. Its scanner is reimplemented as
`scripts/scan-design-tells.ts` against this repository's token system, and
its "establish the brief" build mode collapses here into "read the system",
because the brief already exists. Its core rule — a tell is an unspecified
default — survives unchanged.
