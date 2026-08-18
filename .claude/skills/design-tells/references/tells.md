# The design tells, calibrated for this repository

The upstream catalog ranks tells by how often real people name them when
calling a site AI-made (~3.2M posts, 3,033 on-topic comments, 47 subreddits,
2020–2026). Each entry below keeps that evidence weight and adds the local
calibration: what the tell looks like here, which check owns it, and what the
fix is in this system's vocabulary. The scanner
(`scripts/scan-design-tells.ts`) owns the mechanical signatures; "eyes" means
the audit checklist in SKILL.md.

A note the upstream leads with, worth keeping whole: the strongest current
tell is the "tasteful default" — cream background, serif display font, sage
accent — precisely because the previous wave of anti-slop advice converged on
it. The lesson is not "avoid cream"; it is that **any** look reached for
because it is what "good" auto-completes to becomes the next tell. This
repository's defence is structural: the look is vendored, documented, and
enforced, so the deliberate-choice question is already answered — and drift
away from it toward any median, tasteful or not, is what gets flagged.

## 1. The unchosen default look — scanner + lint:design

Upstream's top two tells (the untouched shadcn/Tailwind theme; the
cream+serif+sage default) are both "nobody chose this" at the whole-theme
level. Here the theme is chosen, so the tell arrives as *values that bypass
it*: a literal colour (`lint:design` fails it), a font-family literal or a
starter face imported through `next/font` (`font-drift`), a radius literal
off the scale (`radius-drift`). The faces here are Manrope and Caveat, and
the script word is a documented signature device — a serif display face
appearing anywhere would be both drift and, per the upstream data, the
loudest current tell.

## 2. AI purple — scanner

The violet/indigo band (#6366f1, #7c3aed and neighbours) is the top colour
tell in the data and traces to framework defaults. No hue in this system is
purple; hue is category (blue machine, coral break, gold proposal, green
measure, neutral flow). Any purple is an import from the median.
`ai-purple` flags the band even where a colour literal would otherwise be
argued past the colour rule.

## 3. Gradients and gradient text — scanner

The purple-to-blue hero gradient is the single highest-scored complaint in
the dataset, and gradient-filled text is the strongest version of it. This
system paints in solid semantic colours; the only legitimate gradients are
mask fades (`mask-image`), which the scanner skips. `gradient-decor` flags
the rest, including `background-clip: text`.

## 4. Glow — scanner

Dark-plus-neon-glow, added unprompted, is a mid-weight tell ("AI loves this
glowing shit. for no reason."). Shadows here are tokens and surfaces lift one
step on hover; there is no glow in the system. `glow-shadow` flags
text-shadows and large zero-offset box-shadow blurs.

## 5. Emoji as icons — scanner

🚀✨⚡ standing in for feature icons signals a generated default (no asset
pipeline needed, so models reach for it). This repository's stance is
stricter than the upstream fix: meaning arrives in words, and hue carries
category, so the answer is text or the kind badge — not an icon set. The
scanner deliberately does not flag the interface's text dingbats (the ✓ in
"Added ✓", the ✕ close affordance): the tell is emoji-as-icon, not a glyph
doing honest work in a label.

## 6. Motion — scanner + eyes

Bolted-on fade-ins and hover-grows are a real but noisy signal in the data;
what makes motion read as generated is uniform, unmotivated animation.
Motion here is one duration on one curve (`--ds-duration`, `--ds-ease`, with
`-fast` and `-slow` ends), inside the standing reduced-motion guard.
`motion-drift` flags literal durations and non-token easing; the deliberate
exceptions carry `ds-allow:` reasons (the live-sync heartbeat, the skeleton
shimmer, the changed-node highlight, the phone-sheet spring). Whether motion
*communicates* anything is an eyes question.

## 7. Radius — scanner + eyes

"Rounded corners on everything" is a named tell, but this system's soft look
is its own voice — cards are generously rounded on purpose. The tell here is
not roundness; it is radius applied without its scale: literals off the
`--radius` steps (`radius-drift` flags ≥8px and literal pills; 50% circles
and hairline radii pass), and one radius stamped uniformly where roles
differ (eyes).

## 8. The generated skeleton — eyes, mostly prototypes

Centred hero, three icon feature cards, a CTA band: the most common
generated page structure, named in the data before any colour. This app's
surfaces (a map, record pages, a review queue) do not take that shape, so
the tell mainly matters for `app/prototypes/` and any landing-like page.
The fix is the upstream's: structure follows what the page is for; vary
sections; show the real thing rather than three icons with blurbs.

## 9. Layout-quality tells — eyes, and the existing specs

Text overflow, inconsistent spacing, misalignment, no hierarchy: the tells a
regex cannot see and a large share of why a page reads as generated.
`test:responsive` and the legibility spec catch the measurable slice (fit,
tap targets, characters per line); the rest is the audit checklist — checked
in the state that holds the most, because the empty state is the one that
cannot fail.

## 10. Cleared by the data — do not chase

Bento grids (0.1%, actively defended), glassmorphism (low, contested),
mesh/blob backgrounds (a keyword artifact), dark mode itself (only
unprompted glow is the tell). Flag what the data supports at the weight it
supports; over-flagging teaches people to ignore the audit.

## Attribution

Condensed from the `unslop-ui` tells catalog in
[JCarterJohnson/vibecoded-design-tells](https://github.com/JCarterJohnson/vibecoded-design-tells)
(MIT, license in [../LICENSE](../LICENSE)), keeping its evidence weights and
its "cleared by the data" list. The per-tell calibrations, the check
ownership, and the token-system framing are this repository's.
