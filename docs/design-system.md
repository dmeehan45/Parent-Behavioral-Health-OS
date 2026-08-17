# Design system

The interface uses the **Family Health Provider** design system, extracted from a
public family behavioral-health website and kept at
[`dmeehan45/design_systems`](https://github.com/dmeehan45/design_systems/tree/main/family-health-provider).

That repository is the upstream. `app/design-system.css` is a vendored copy of
its token layer with the accessibility corrections from
`reports/visual-qa-polish.md` already applied. Everything else in this
repository consumes those tokens and adds nothing to them.

## The rule

**Brand values live in `app/design-system.css` and nowhere else.**

`app/globals.css` opens with a block that aliases the application's own
vocabulary — `--paper`, `--ink`, `--accent`, `--kind-*` — onto the design
system's semantic layer. Every rule in the rest of that file, and every
component, reads those aliases. A literal colour anywhere else is a bug.

`npm run lint:design` enforces this and runs in CI. It fails on a hex value or
an `rgb()`/`hsl()` in `app/` or `components/`, outside the token file. A line
that genuinely is not a brand decision — a mask's black, a scrim — can opt out
with a `ds-allow:` comment on the line or the one above it, and a reason.

There is one standing exception, `components/map/canvas-theme.ts`, because SVG
markers and the minimap are painted from JavaScript and cannot read a custom
property. The lint checks every colour in that file also appears in the token
source, so the two cannot drift apart silently.

## The layers

The token file is the system's own three layers, in order. Consume the second
and third; never write against the first.

1. **Primitives** — the four-hue ramp (blue, green, gold, coral × five steps),
   neutrals, spacing, radii, shadows, motion, type. Measured values.
2. **Semantic roles** — `--ds-surface-*`, `--ds-text-*`, `--ds-action`,
   `--ds-status-*`, `--ds-border-*`. This is the retheming surface.
3. **Component tokens** — `--ds-card-*`, `--ds-button-*`, `--ds-focus-ring`.

If nothing in layer 2 fits what you are building, add a role to layer 2. Do not
reach past it into a primitive, and do not invent a colour.

## What the system actually asks for

These are the parts that a token swap alone does not give you, and the ones a
change is most likely to quietly break.

**Hue means category, never decoration.** The four hues carry meaning. This
repository maps them onto its own primitives:

| Hue | Meaning here | Kinds |
| --- | --- | --- |
| Blue | The machine as it is | `stage`, `step` |
| Coral | Where it breaks, and what we have not proven | `problem`, `claim` |
| Gold | What we propose to change | `bet`, `prototype` |
| Green | What we can measure | `metric` |
| Neutral | What moves through the machine | `entity` |

Each pair shares a hue and separates by ramp step, because the two members are
genuinely related — a step lives inside a stage, a prototype tests a bet, a
claim is the belief underneath a problem. Four hues over eight kinds is the
constraint the system imposes, and pairing is how it is met honestly rather
than by inventing a fifth hue.

**Colour is never the only signal.** Hue always arrives with an icon or a text
label. Every node and badge names its kind in words as well as colouring it.

**Focus is the reference ring, built from `:focus-visible`.** A spacer ring the
colour of the ground, then a blue halo — `--ds-focus-ring`. Never the browser
default, and never `:focus`.

**44px is the floor for anything you tap.** The system's own CTA measures 50px;
the failures it documents are all controls that fell under 44.

**Motion is 0.15s on `cubic-bezier(0.4, 0, 0.2, 1)`,** inside the existing
reduced-motion guard. Uniform and near-invisible, never a flourish.

**Soft frame, floating nav, no hard chrome.** The navigation is a white pill
over a pale wash. Cards are white, generously rounded, with a soft shadow that
lifts exactly one step on hover.

**One script word per page,** in the `h1`, in brand blue, via `.script`. It is
the signature device and a second one on the same page destroys it.

**Evidence over adjectives.** Numbers carry the argument. The claim rows and
stat bands are the pattern; an adjective without a number behind it is not.

**720px is the article measure.** Long-form reading is what the record pages
are for.

**30 characters per line is the floor.** The comfortable band for continuous
reading is 45–75; below about 30 the eye stops reading lines and starts
reassembling fragments. The ceiling had been enforced since the beginning and
the floor had not, which is how a front-page band shipped at fifteen. Narrow
columns are still a legitimate choice — this is the point where text is no
longer prose, not a house preference about column width.

## Typefaces

The system's two faces are licensed third-party typefaces, and the source
site's use of them is recorded rather than granted.

- **Caveat** is OFL and ships as itself. It is the script word, and no
  substitute reads the same.
- **Satoshi** is not redistributable. The primary face is **Manrope**, the
  nearest open geometric grotesque, matched on the same weights.

Both load through `next/font` in `app/layout.tsx`.

## Dark mode

The source site has none. The dark block in `app/design-system.css` is new
design work, declared as such. It overrides the semantic layer only, so the
four-hue category system still decides what anything means — only the ground it
sits on changes, with each hue moving to a lighter step of itself.

## Accessibility corrections already applied

These are baked into the vendored tokens; do not revert them to the measured
values.

| Role | As measured | Here | Ratio |
| --- | --- | --- | --- |
| Muted text | `#959e9f` | `#707879` | 4.51:1 |
| Action / link | `#0683bc` | `#007db6` / `#0074ac` | 4.56:1 |
| Green | `#06b279` | `#00834e` | 4.55:1 |
| Gold | `#d69a00` | `#9e6500` | 4.55:1 |
| Coral | `#f64c57` | `#cf2038` | 4.55:1 |

Each was generated by moving OKLCH lightness only, so hue and chroma are
untouched.

The system's second grey is not carried over. `#959e9f` measures 2.74:1, and
splitting the muted tier again would reintroduce that failure at a smaller
size. Hierarchy below the muted tier is carried by size, weight and tracking.

## Browser checks

`npm run test:responsive` builds and serves the app and runs everything under
`tests/*.spec.ts` at 390×844 and 1440×900, over every page template, with the
record routes derived from `/api/model` rather than hardcoded (`tests/routes.ts`,
shared by both specs). There are two, and they ask different questions.

**`responsive.spec.ts` — does it fit.** Nothing overflows its viewport, nav links
hit 44px, body copy keeps its 720px ceiling, the map canvas has a height, and its
floating controls stay on screen and off each other.

**`legibility.spec.ts` — can it be read.** Characters per line against the floor
above, on every wrapping block of prose. Three things about how it measures are
deliberate:

- It **opens every `<details>` first**. The bug it was written for was reviewed
  with all five of its disclosures shut, which is the state that cannot fail.
- It measures the **glyphs**, not the line count. `length / lines` reports 24 for
  a sentence set at 45 whenever the last line is short, and a check that cries
  wolf is a check nobody reads.
- It **skips headings, composed rows and the canvas**. Display type is set
  short-line on purpose, a badge-plus-title-plus-meta row is a structure rather
  than a sentence, and React Flow draws inside a transform where a measured rect
  is not the size text is painted at — the canvas governs its own legibility by
  zoom tier, in painted pixels, which is stricter.

Both are deliberately thin. This is a thinking tool and iteration speed matters
more than coverage — they exist to stop a push from silently breaking the phone
or shipping something nobody can read, not to pin the design down. Add a case
when a bug gets past them; do not grow them into a visual regression suite.

Neither replaces looking at the thing. `AGENTS.md` carries that rule, and what
it means by the state that holds the most content.

## Upstream

To pull a change from the design system, update `app/design-system.css` from
`design-system-output/tokens/tokens.css` plus the polish report, and re-run
`npm run lint:design`. Nothing else should need to move.
