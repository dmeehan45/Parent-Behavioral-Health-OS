# UX Quality Review: Parent Behavioral Health OS

**Reviewed by**: Claude Code (ux-quality-review)
**Date**: 2026-08-14
**Scope**: The whole interface — home, `/map` (all four lenses), `/prototypes`, the guided-first-caseload prototype, and one record page of every kind (stage, step, problem, bet, claim, metric, entity)
**Input type**: Running application (production build, `next start`), driven with Playwright
**Platform context**: Both — measured at 320px, 768px, 1024px and 1440px, plus 200% zoom and `prefers-reduced-motion`

---

> **Status**: every finding below — Critical, High, Medium and Low — has been
> fixed and re-measured against the running application. Rows are marked
> **Fixed**; [What changed](#what-changed) at the end carries the
> after-measurement for each, and the two residual caveats worth knowing about.

---

## 1. Scope & Context

This is a reference model of a parent-focused behavioral-health practice, rendered as a projection of Markdown in `content/`. The primary surface is `/map`: a React Flow canvas with four lenses, a detail sheet, and a command palette. Record pages and one prototype hang off it. The intended reader is a contributor reasoning about the model, not a clinician doing work — so reading and orientation matter more than task throughput.

Findings below come from a live audit rather than a code read: every route was loaded at four widths, computed contrast was measured against the real composited background, every interactive element was measured for rendered size, tab order was walked, and the canvas transform was read to work out the size text is actually painted at.

**Review limitations**: No screen-reader pass (NVDA/VoiceOver announcement quality is inferred from markup, not heard). No real-device touch testing — `hasTouch`/`isMobile` emulation only, so drag physics on the bottom sheet are unverified. The live-update path (`/api/model/revision` polling) was observed only in its idle state; the `Offline` and `Model updated` states were not triggered.

---

## 2. Findings by Category

### 2.1 Accessibility UX Standards

**Category score**: 2.0 / 5
**Confidence**: High

| ID | Category | Severity | Evidence | User Impact | Recommendation | Implementation Hint |
|----|----------|----------|----------|-------------|----------------|---------------------|
| A-001 | Accessibility | Critical — **Fixed** | `.node-main` receives the system focus ring (`box-shadow: 0 0 0 2px white, 0 0 0 4px blue`) but sits inside `.node`, which sets `overflow: hidden`, with only 0.6–1.9px of inset on each edge. The ring is painted entirely outside the button's box and is therefore clipped away. Screenshot after 12 Tab presses shows no visible focus anywhere on the canvas. | Keyboard users tabbing the map — 8 to 17 visually near-identical node cards, the product's primary surface — get no indication of where they are. WCAG 2.4.7 Focus Visible (AA) failure on the main view. | Draw focus on the clipping element instead of the clipped child, or stop clipping. Simplest: move the focus treatment to `.node:has(.node-main:focus-visible)` and let the ring render on the outer card. | `app/globals.css`: add `.node:has(> .node-main:focus-visible) { box-shadow: var(--ds-focus-ring), var(--shadow-md); }` and suppress the inner one. Verify against `.node-expand`, which is absolutely positioned and clips the same way. |
| A-002 | Accessibility | High — **Fixed** | `--ds-text-muted` (`#707879`) is calibrated to 4.51:1 **on white**, but no page in the app has a white ground. Measured against the real composited background: **4.23:1** on `--paper` (`#e8fcf6`, the body wash) and **3.96:1** on `--surface-2` (`#f0f0f0`). This is the colour of `.lede`, `.muted`, `.small`, `.field-label`, `.coverage-text`, `.link-meta`, `.page-subtitle`, `.badge.tone-neutral`, `.chip.quiet` and `.source-path` — including the 17px home-page lede. | Most secondary body copy in the product fails WCAG 1.4.3 (AA) on every page. Low-vision readers lose the explanatory layer, which on this artifact is where most of the meaning lives. | Re-derive the muted neutral against the two grounds it actually sits on, not white. Moving OKLCH lightness only (the method the file already documents) to roughly `#5F6768` clears 4.5:1 on both `#e8fcf6` and `#f0f0f0`. | `app/design-system.css`: darken `--ds-gray-aa`, or add `--ds-gray-aa-on-wash` alongside the existing `--ds-blue-on-tint` family and point `--ds-text-muted` at it. The on-tint pattern for hues is already there — the neutral just never got one. |
| A-003 | Accessibility | High — **Fixed** | `.palette` declares `role="dialog" aria-modal="true"`, but nothing traps focus. Tabbing past the last result (4 results for "Matching") moves focus to `BODY`, then to the page's skip link — behind the still-open backdrop. Escape then leaves focus on whatever is behind rather than returning it to `.search-trigger`. | Keyboard and screen-reader users fall out of the modal into content that is visually obscured and semantically still "behind" a modal, with no cue that they have left it. On close they lose their place entirely. | Trap Tab/Shift+Tab within `.palette` while open, and restore focus to the invoking element on close. | `components/map/command-palette.tsx`: capture `document.activeElement` on mount, cycle focus on `Tab` at the list boundaries, and restore in the cleanup. The same treatment applies to the legend (A-006). |
| A-004 | Accessibility | Medium — **Fixed** | Every record page skips a heading level: `h1` → `h3`, because `DetailBlocks` renders each block label as `h3.field-label`. Measured on all 8 record kinds (stage, step, problem, bet, claim, metric, entity, prototype). `/map` has **no `h1` at all** — its only headings are the `h2` inside the legend dialog and the detail sheet. The prototype page is additionally out of order: `h1 → h3 → h2 → h2 → h3…`. | Screen-reader users navigating by heading get a broken outline on every content page, and no document title landmark on the primary view. | Render block labels as `h2` on full pages (they are the page's top-level sections) and keep `h3` inside the sheet, where the record title is already an `h2`. Give `/map` a visually-hidden `h1`. | `components/model/detail-blocks.tsx`: accept a `headingLevel` prop defaulting to `2`; `DetailSheet` passes `3`. In `map-workspace.tsx` add `<h1 className="sr-only">System map</h1>`, and drop the clinician card's `h3` to a non-heading or raise the surrounding structure. |
| A-005 | Accessibility | Medium — **Fixed** | Interactive elements below the 44×44 floor the design system sets for itself: `.icon-button` (sheet close, sheet back, legend close) measures **34×34**; `.search-trigger` **40×42** and `.live-pill` **40×36** on mobile; `.node-expand` renders **22×16** at 320px and **17×13** at 1440px default zoom; breadcrumb links are 19px tall; `.link-list` rows are 42px. | Mis-taps on the controls that dismiss the mobile sheet and expand a stage — the two most-used touch interactions on the map. | Bring `.icon-button` to 44×44 and the bar controls to the `--ds-touch-target` floor. `.node-expand` needs the canvas-scale fix in V-001 as well as a CSS size bump; at 0.5 zoom no CSS size alone reaches 44 painted pixels. | `app/globals.css`: `.icon-button { width: 44px; height: 44px }`; raise `.search-trigger`/`.live-pill`/`.legend-toggle` `min-height` from 36px to `var(--ds-touch-target)`. |
| A-006 | Accessibility | Medium — **Fixed** | The legend opens as `role="dialog"` but focus stays on the toggle button — measured `document.activeElement.closest('.legend') === null` immediately after opening. Its content is announced only if the user happens to tab into it. | Screen-reader users are told a dialog opened but are not taken to it; the vocabulary key is effectively hidden from them. | Move focus to the dialog heading on open and restore it to the toggle on close. | `components/map/map-workspace.tsx`: `ref` + `useEffect` focus on the legend `h2` with `tabIndex={-1}`. |
| A-007 | Accessibility | Medium — **Fixed** | Real information is carried only in `title` attributes: the fields a primitive has not described (`CoverageMeter`), what each authority level means (`AuthorityBadge`), and what each lens shows (`.lens-tab`). `title` is unreachable on touch, unreliable with keyboard focus, and inconsistently announced. | Touch users — the whole mobile audience — cannot reach the explanation of the model's core vocabulary. The `CoverageGaps` chips duplicate the coverage tooltip on full pages, but the sheet and the canvas have only the tooltip. | Promote these to visible text or a real popover. `CoverageGaps` already exists and renders well; use it in the sheet too. Lens descriptions can sit under the tab strip as a single line for the active lens. | `components/model/badges.tsx` / `detail-sheet.tsx`: render `CoverageGaps` in the sheet's provenance block; add a one-line active-lens description in `.workspace-bar`. |
| A-008 | Accessibility | Low — **Fixed** | Below 560px, `.brand-text` is `display: none`, leaving the home link as the 7px dot grid — a **16×16** tap target. | The way back to the front door is a target a third of the recommended size, on the width where precision is worst. | Keep the mark but give the anchor a 44×44 hit area. | `app/globals.css`: `@media (max-width: 560px) { .brand { min-width: 44px; min-height: 44px; justify-content: center; } }` |

Checks that passed and are worth not regressing: no interactive element anywhere in the app is missing an accessible name (measured across all 11 routes × 4 widths); `prefers-reduced-motion` genuinely disables the live-dot pulse and the `changed` highlight (`animation-name: none`); 200% zoom produces **no** horizontal overflow on any route; the skip link works; map nodes and their expand buttons are all keyboard-reachable in reading order.

### 2.2 User Flow Simplicity & Continuity

**Category score**: 3.0 / 5
**Confidence**: High

| ID | Category | Severity | Evidence | User Impact | Recommendation | Implementation Hint |
|----|----------|----------|----------|-------------|----------------|---------------------|
| F-001 | Flow | High — **Fixed** | `.legend-toggle` is `display: none` below 860px and there is no alternative entry point — searching the rendered DOM at 375px for "How to read this map" returns 0 matches. | The legend is where a reader learns what Stage, Problem, Bet, Claim, Metric and Entity mean, what the edge styles mean, and what `proposed` vs `validated` mean. On a phone that vocabulary is unreachable, and the map is close to unreadable without it. | Keep the legend on mobile. It already has a mobile layout (`bottom: 12px; left: 12px; right: 12px; max-height: 60dvh`) — only the button that opens it is hidden. Collapse it to an icon rather than removing it. | `app/globals.css`: drop `.legend-toggle` from the `display: none` group in the `max-width: 860px` block and give it the same 40px-square icon treatment `.search-trigger` gets. |
| F-002 | Flow | High — **Fixed** | At 320px the map opens showing **2 of 12** nodes in the bets lens, **2 of 13** in evidence, **3 of 17** in entities, and 3 of 8 in the operating flow. This is deliberate (`READABLE_ZOOM` pins to the start of the flow rather than fitting), but nothing on screen says more exists — no scroll hint, no count, no "3 of 8". | A first-time phone reader lands on a mostly-empty mint canvas with two cards and no evidence that the other 80% of the model is one pan away. The minimap is intended to carry this, but it is 104×68 in the bottom corner and reads as decoration. | Add a lightweight orientation cue on narrow screens: the node count for the current lens plus a "swipe to explore" affordance on first view, or an initial nudge animation on the minimap. | `components/map/graph-canvas.tsx`: the `fitEverything` path already knows `fitsAcross` is false — use that to render a one-time hint. |
| F-003 | Flow | Medium — **Fixed** | The guided-caseload prototype offers 3 family cards against a stated `WEEKLY_CAPACITY` of 6. Selecting all three yields "**3 of 6** weekly slots proposed" and stops. There are no other actions in `.prototype-stage` — no confirm, no next step, no completion state. | The counter frames a goal the interaction cannot reach, so the reader's takeaway is "I did it wrong" rather than "I see what the bet feels like". Then the flow terminates with no closure. | Either supply enough candidates to fill capacity, or reframe the counter so it does not imply a target (e.g. "3 families selected · 6 weekly slots available"). Add a terminal action that names what would happen next without pretending to do it. | `components/guided-caseload.tsx`: extend `SUGGESTED_FAMILIES`, and add a disabled-with-explanation "Propose this caseload" button plus a short "in the real system this would…" line. |
| F-004 | Flow | Medium — **Fixed** | Opening a node on a 375px phone puts the sheet at `top: 389` of a 720px viewport, which covers both the canvas controls (measured at y 492–628) and the minimap (y 640–708). Overlap confirmed programmatically for both. | Once a reader opens anything, they lose zoom, fit-to-view and the overview — the only orientation aids on mobile — until they close it again. Given F-002, that is the moment they most need them. | Reposition the controls above the peek line when the sheet is open. The canvas already computes `obscuredBottom` for the fit calculation; reuse it for the control panels. | `components/map/graph-canvas.tsx` / `globals.css`: bind a `--controls-bottom` custom property to the sheet's peek height under the 860px breakpoint. |
| F-005 | Flow | Medium — **Fixed** | The command palette's no-results state reads "Nothing in the model matches that yet…" and offers **0** actionable elements — no clear-search, no browse-all, no way to reach the content it suggests writing. | A search-no-results dead end: the copy is good but the reader has to work out for themselves that backspacing is the only way forward. | Add a "Clear search" button and a "Browse everything" action that empties the query (which already lists all primitives). | `components/map/command-palette.tsx`: two buttons inside `.palette-empty`, both calling `setQuery("")`. |
| F-006 | Flow | Low — **Fixed** | `/map?open=stage:does-not-exist` renders the default view with no sheet and no message — the unknown id is filtered out in `readView` and silently dropped. | A shared link to a primitive that has since been renamed or removed lands the recipient on the map with no explanation of why they are not looking at what they were sent. | Reuse the "No longer in the model" sheet state that already exists for the live-update case. | `app/map/page.tsx`: pass the unmatched id through as `missing` instead of discarding it — `DetailSheet` already renders that state. |

Strong here and worth keeping: breadcrumbs on every record page; every record has a "Show on the map" route back to context; the detail sheet keeps a back-trail so a problem → bet → prototype chain never loses the graph; all primary actions are real buttons at the 44px floor, not text links; the prototypes index has a genuine empty state naming the file to edit; view state lives in the URL so every view is shareable; and the missing-node case is handled gracefully when it happens live.

### 2.3 Visual Cleanliness & Cognitive Load

**Category score**: 3.0 / 5
**Confidence**: High

| ID | Category | Severity | Evidence | User Impact | Recommendation | Implementation Hint |
|----|----------|----------|----------|-------------|----------------|---------------------|
| V-001 | Visual | Critical — **Fixed** | The map opens at a viewport scale that paints its text far below legibility. Measured `.react-flow__viewport` transform × CSS font size at default load: **operating flow @1440 — scale 0.622, title 8.7px, summary 7.2px, kind label 5.6px**; **entities @1440 — scale 0.571, title 8.0px, summary 6.6px, kind 5.1px**; **operating flow @320 — scale 0.5, title 7.0px, summary 5.8px**. In every case `data-tier` is `"standard"`, so the app believes it is drawing full detail. | The centrepiece of the product is unreadable on arrival, at every width. The reader's first action must be to zoom before anything means anything — and on the entities lens even the kind labels that carry the colour-coding are sub-6px. | The mechanism is right and the constant is wrong. `READABLE_ZOOM = 0.5` is described in the source as the point "below it, nothing is readable", but 0.5 already renders 7px titles. Raise the floor to roughly 0.85–0.9 (title ≈ 12px), and gate the `standard`/`detailed` tiers on *painted* size rather than raw zoom, so a tier never promises text it will not draw legibly. | `components/map/graph-canvas.tsx`: raise `READABLE_ZOOM`; redefine `tierForZoom` in terms of `fontSize × zoom` thresholds. Accept that fewer nodes fit on first paint — that is what F-002's orientation cue is for. |
| V-002 | Visual | Medium — **Fixed** | Body copy on record pages renders **883px wide, ~101–112 characters per line** at 1440px. `.detail-blocks` computes `max-width: none`. The 720px article measure the design system calls "the single most important number in the system's layout" is scoped to `.shell.page > .prose` (a *direct child*) and `.shell.page .detail-prose` — but block content renders as `.detail-list` and, for markdown blocks, `.prose` nested inside `.detail-blocks`, so neither selector matches. `.detail-prose` does not appear on the stage page at all. | Line lengths roughly 1.6× the comfortable maximum on exactly the pages built for long-form reading. Return sweeps get harder as the page goes on. | Apply the measure to the block container rather than to two specific descendants. | `app/globals.css`: `.shell.page .detail-blocks { max-width: var(--ds-container-text); }` and drop the two narrower selectors it subsumes. |
| V-003 | Visual | Medium — **Fixed** | On `/prototypes`, `.card-problem` renders the problem title in coral (`rgb(207, 32, 56)`) with no accompanying word. Measured: the card contains no text matching "problem"; its only badges are "working" and "medium confidence". Everywhere else in the app a cross-reference carries a `KindBadge`. | Hue alone marks the category, which `AGENTS.md` explicitly forbids ("Colour is never the only signal — every node and badge names its kind in words too"). To a first-time reader, bold red text above a card title reads as an error, not as a link to a problem. | Add the `KindBadge` the rest of the app uses, or prefix the kicker with a small "Problem" label. | `app/prototypes/page.tsx`: wrap the `card-problem` link content with `<KindBadge kind="problem" subtle />`. |
| V-004 | Visual | Low — **Fixed** | Metric rows on record pages render `unknown` as right-aligned meta on every row — three consecutive "unknown"s on the stage page. | The repeated word reads as noise before it reads as honest incompleteness, and it competes with the row titles for the eye. | Suppress the meta when the value is `unknown`, or say it once per block rather than per row. | `lib/model/graph.ts`: omit `meta` when `dataStatus === "unknown"`. |

The visual system is the strongest part of this interface and most of it should be left alone: the type scale is genuinely restricted, the hue-means-category rule holds across nodes, badges, brand mark and legend, cards share one radius/shadow/padding, decoration is close to absent, and the whitespace rhythm on the home page and record pages is excellent. The `.script` device is used exactly once per page as documented.

### 2.4 Mobile Responsiveness & Interaction Ergonomics

**Category score**: 2.5 / 5
**Confidence**: High

| ID | Category | Severity | Evidence | User Impact | Recommendation | Implementation Hint |
|----|----------|----------|----------|-------------|----------------|---------------------|
| M-001 | Mobile | High — **Fixed** | `/prototypes` overflows horizontally at 320px: `document.documentElement.scrollWidth` is **332** against a `clientWidth` of **320**, and the overflowing element is `main.shell.page` at 332px. Cause is `.card-grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) }` — the 300px track floor plus the shell's 2×16px padding forces 332px. This is the only route in the app that scrolls sideways. | The page rocks horizontally on every scroll on a small phone, and the card's right edge is clipped. | Let the track floor collapse below 300px. | `app/globals.css`: `grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));` |
| M-002 | Mobile | High — **Fixed** | The stage-expand affordance — the `+N` control that reveals a stage's steps, and the map's core progressive-disclosure interaction — renders **22×16** at 320px. The `@media (pointer: coarse)` rule that raises it to 44×32 CSS pixels is applied *before* the canvas's 0.5 scale transform. | The single most important touch interaction on the map is a target roughly a quarter of the recommended area, sitting 8px from the node's own tap area. | Fixed with V-001's zoom floor (at 0.9 scale the coarse-pointer size paints ~40×29), plus raising the coarse-pointer height from 32px to 44px. | `app/globals.css`: `@media (pointer: coarse) { .node-expand { min-width: 44px; height: 44px; } }` — and re-measure after the zoom change rather than before. |
| M-003 | Mobile | High — **Fixed** | See F-001 and F-002: the legend has no mobile entry point, and 2–3 of 12–17 nodes are visible with no cue that more exists. | Together these mean the mobile map shows a fraction of the model in a vocabulary the reader cannot look up. Workflow parity with desktop is not met. | As per F-001/F-002. | — |
| M-004 | Mobile | Medium — **Fixed** | Sheet dismiss/back buttons are 34×34; the search and live controls are 40×42 and 40×36. Confirmed at 375px with touch emulation. | Mis-taps on dismissal, the action a reader performs most often on a small screen. | Per A-005. | — |
| M-005 | Mobile | Medium — **Fixed** | Node text paints at 5.8–7.0px at 320px (V-001). | Body text on the primary surface is roughly a third of the 16px mobile floor; unreadable without pinch-zoom. | Per V-001. | — |

What works well on mobile and should survive the fixes: a real bottom sheet with peek/full snapping, drag-to-dismiss and pointer capture; canvas controls that restack vertically above the minimap rather than colliding with it; the minimap SVG pulled back under CSS control so the media query can shrink it; the lens strip scrolling with a fade mask; the 44px floor genuinely held on every `.button`; and clean layouts with no overflow at 768px, 1024px and 1440px on all 11 routes.

### 2.5 UX / Visual Best-Practice Compliance

**Category score**: 3.5 / 5
**Confidence**: Medium — some heuristics (feedback latency under load, offline behaviour) could not be exercised

| ID | Category | Severity | Evidence | User Impact | Recommendation | Implementation Hint |
|----|----------|----------|----------|-------------|----------------|---------------------|
| B-001 | Best Practices | Medium — **Fixed** | Neither overlay restores focus on close. Measured: opening the palette from `.search-trigger` and pressing Escape leaves `document.activeElement` on `BODY`. | Keyboard users are returned to the top of the document after every search, losing their position in the tab order. | Restore focus to the trigger. Pairs with A-003/A-006. | Store the trigger element before opening; `.focus()` it in cleanup. |
| B-002 | Best Practices | Medium — **Fixed** | The prototype's capacity readout ("3 of 6 weekly slots proposed") sets an expectation the interaction cannot satisfy (F-003). | Error-prevention failure of the framing kind: the UI states a goal, then makes it unreachable, and the reader assumes the mistake is theirs. | Per F-003. | — |
| B-003 | Best Practices | Medium — **Fixed** | Vocabulary explanations exist only as `title` tooltips (A-007), so the complex parts of the interface — the lens strip, authority levels, coverage bars — have no reachable orienting text on touch. | The reader is asked to interpret a bespoke vocabulary with the glossary out of reach. | Per A-007 and F-001. | — |
| B-004 | Best Practices | Low — **Fixed** | All model-driven routes are `force-dynamic` and there is no `loading.tsx` or `error.tsx` anywhere in `app/`. Navigation between record pages is a server round trip with no route-level pending state. | On a slow connection, tapping a link in the detail sheet produces no visible response until the new page paints. | Add a minimal `loading.tsx` for the record routes. | `app/loading.tsx` with a skeleton matching `.page-head`. |

Genuinely strong and worth naming: system status visibility is exemplary — the Live/Syncing/Offline pill is always present, explains itself, is clickable to retry, and pairs with a `role="status"` toast naming what changed. Terminology never drifts because every label comes from `KIND_LABELS`. Interaction patterns are consistent across surfaces because the sheet and the record page render from the same projection. `aria-pressed` and `aria-expanded` are used correctly on the toggles that have state. Information scent is high — no "click here", every link names its destination and carries its kind. Motion is one duration and one easing throughout, and it is honestly disabled under `prefers-reduced-motion`.

---

## 3. Severity Summary

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High     | 6 |
| Medium   | 12 |
| Low      | 4 |
| **Total** | **24** |

**Overall score**: 2.8 / 5 — **Needs major improvement**

| Category | Score |
|----------|-------|
| Accessibility UX Standards | 2.0 / 5 |
| User Flow Simplicity & Continuity | 3.0 / 5 |
| Visual Cleanliness & Cognitive Load | 3.0 / 5 |
| Mobile Responsiveness & Interaction Ergonomics | 2.5 / 5 |
| UX / Visual Best-Practice Compliance | 3.5 / 5 |

A note on that label, because the number reads harsher than the artifact deserves: the underlying design system is disciplined and the component work is careful. The score is dragged down by a small number of concentrated defects — one clipped focus ring, one mis-set zoom constant, one grid track floor, one hidden button, and one colour token calibrated against a background the app never uses. Six of the eight Critical and High findings are a few lines of CSS or one constant each. This is not a rebuild; it is an afternoon.

---

## 4. Priority Fix Plan (Now / Next / Later)

### Now (Critical + High severity)

| ID | Finding summary | Severity | Effort estimate |
|----|----------------|----------|-----------------|
| A-001 | Focus ring on map nodes is clipped by `overflow: hidden` — no visible focus on the primary surface | Critical | Small |
| V-001 | Map opens at a zoom that paints node text at 5.1–8.7px; `READABLE_ZOOM` floor is ~2× too low | Critical | Medium |
| A-002 | `--ds-text-muted` fails AA on both grounds the app actually uses (4.23:1 and 3.96:1) | High | Small |
| A-003 | Command palette declares `aria-modal` but does not trap or restore focus | High | Small |
| M-001 | `/prototypes` scrolls horizontally at 320px (332px in a 320px viewport) | High | Small |
| F-001 | Legend has no entry point below 860px — model vocabulary unreachable on mobile | High | Small |
| F-002 | Mobile map shows 2–3 of 12–17 nodes with no cue that more exists | High | Medium |
| M-002 | Stage-expand control renders 22×16 on a phone | High | Small (after V-001) |

### Next (Medium severity)

| ID | Finding summary | Severity | Effort estimate |
|----|----------------|----------|-----------------|
| A-004 | `h1 → h3` skip on all 8 record kinds; no `h1` on `/map` | Medium | Small |
| A-005 | Icon buttons at 34×34, bar controls at 36–42px | Medium | Small |
| A-006 | Legend dialog does not receive focus on open | Medium | Small |
| A-007 | Coverage gaps, authority meanings and lens descriptions live only in `title` | Medium | Medium |
| F-003 | Prototype ends at an unreachable "3 of 6" with no terminal action | Medium | Medium |
| F-004 | Mobile sheet covers the zoom controls and minimap | Medium | Medium |
| F-005 | Search no-results state offers no action | Medium | Small |
| V-002 | 101–112 characters per line on record pages; article measure never applies | Medium | Small |
| V-003 | Problem kicker on prototype cards is marked by colour alone | Medium | Small |
| M-004 | Mobile dismiss targets below 44px | Medium | Small |
| B-001 | Focus not restored after either overlay closes | Medium | Small |
| B-003 | Complex sections have no reachable orienting text on touch | Medium | Medium |

### Later (Low severity)

| ID | Finding summary | Severity | Effort estimate |
|----|----------------|----------|-----------------|
| A-008 | Home link is a 16×16 target below 560px | Low | Small |
| F-006 | Stale deep link to a removed primitive is silently ignored | Low | Small |
| V-004 | Repeated `unknown` meta on metric rows | Low | Small |
| B-004 | No route-level loading state on `force-dynamic` pages | Low | Small |

---

## 5. Acceptance Checks

- [ ] All Critical findings resolved and retested (A-001, V-001)
- [ ] All High findings resolved or risk-accepted with documented rationale
- [ ] Category scores re-evaluated — target: all categories ≥ 3.0
- [ ] No new dead-end states introduced by fixes
- [ ] Mobile workflow parity confirmed — legend, full model, and zoom controls all reachable at 320px
- [ ] Layout tested at 320px, 768px, 1024px and 1440px — `document.documentElement.scrollWidth === clientWidth` on every route
- [ ] All primary workflow actions use styled buttons, not text links
- [ ] Complex sections include contextual descriptions reachable without hover
- [ ] Focus is visible on every interactive element on `/map`, and returns to its trigger after each overlay closes
- [ ] Every text/background pair measured against its **composited** background clears 4.5:1 (3:1 for large text) — not against white
- [ ] Node text paints at ≥12px at the map's default zoom on every lens at every breakpoint
- [ ] Overall status is "Acceptable with gaps" (3.0+) or "Strong" (4.0+)

---

## What changed

The scores and findings above record the interface **as reviewed**. They are
deliberately not rewritten — the point of the review is what it found. This
section records what has since moved, and what each fix now measures.

| ID | Fix | Measured after |
|----|-----|----------------|
| A-001 | The focus ring moves from `.node-main` to `.node`. An element's own box-shadow is not clipped by its own `overflow`, so one level out is the whole fix. | Blue halo painted on the focused card at 1440px and 375px. Two traps worth knowing about: the ring reads as absent if you sample during `.node`'s 0.18s box-shadow transition, and a comma-separated list of `:has()` selectors is emitted with an unbalanced paren by the CSS pipeline and silently dropped — hence the single `:has(:focus-visible)`. |
| V-001 | Level-of-detail thresholds are restated as floors in *painted* pixels (`MIN_TITLE_PX` 12, `MIN_BODY_PX` 11) divided by the CSS size of the smallest text each tier draws, instead of raw zoom guesses. | Node titles paint at **12px** on all four lenses at 320/768/1440px, up from 5.6–8.7px. The canvas now opens in `compact` tier and stops claiming to draw detail it will not render legibly. |
| A-002 | The on-tint family is re-derived against the grounds the app actually has (`#e8fcf6`, `#f0f0f0`) rather than white, by lowering OKLCH lightness only. Green, gold and the neutral moved; blue and coral already cleared. `canvas-theme.ts` mirrors the ramp for React Flow's SVG and was moved in step. | **Zero** contrast failures across 11 routes × 2 widths, by the same measurement that found 24. Every value clears 4.5:1 on all three grounds. |
| A-003 | Tab is trapped inside `.palette` while open, and focus is restored to whatever opened it. | 9 consecutive Tabs stay inside the dialog; Escape returns focus to `.search-trigger`. |
| M-001 | `minmax(min(300px, 100%), 1fr)` on `.card-grid`, so the track floor can collapse below the viewport. | **0** routes scroll sideways across 11 routes × 4 widths, down from 1. |
| F-001 | The legend keeps its trigger on narrow screens as a `?` icon. Separately, the labels that narrow screens drop now hide with `.visually-hidden` rather than `display: none` — which had been removing them from the accessible name, leaving the search control named by nothing but an `aria-hidden` glyph. | Legend button visible and the panel opens at 375px. `.search-trigger`, `.live-pill` and `.legend-toggle` all keep a non-empty accessible name. |
| F-002 | Holding a legible zoom means the view often cannot hold the whole lens, so it says so: a pill naming the lens's own node count, dismissed by the first real gesture. React Flow reports its own animated `setViewport` through `onMoveStart` with a null event, which cleared the hint the moment it was set — hence the guard. | "Showing part of 8 / 12 / 13 / 17 — drag to see the rest" appears on every clipped lens at every width. The count is derived from the layout, not written down. |
| M-002 | `.node-expand` raised to 40×32 for fine pointers and 44×40 for coarse, which only means anything alongside V-001's zoom floor. | Paints **35×32** at 320px, up from 22×16 — a 3.2× area increase. Honest caveat: this clears WCAG 2.5.8 Target Size (Minimum, 24×24 AA) but is still under the 44px floor the design system sets for itself, because canvas scale caps what CSS can reach. |

### Medium and Low

| ID | Fix | Measured after |
|----|-----|----------------|
| A-004 | `DetailBlocks` takes a `headingLevel`, defaulting to `2` for a full page and passed `3` by the sheet and the prototype's context section. The clinician card's name became an `h2` to stop preceding a sibling `h2` as an `h3`. `/map` gets a visually-hidden `h1`. | **0** of 11 routes have a broken outline. Every record page now reads `1,2,2,2…` and `/map` has a name. |
| A-005 / M-004 | `.icon-button`, the bar controls, the list rows, the canvas zoom buttons, the sheet grip, the brand link and the problem kicker all raised to `--ds-touch-target`. The kicker takes padding with matching negative margin, so its hit area grows and nothing moves. | **0** discrete controls under 44×44 across 11 routes × 2 widths, including the open detail sheet. Two deliberate exclusions: breadcrumb links (inline text, WCAG 2.5.8 exception) and the canvas-scaled `.node-expand` (see the caveat below). |
| A-006 / B-001 | The legend moves focus to its heading on open and returns it to the toggle on close, the same contract the palette now has. | Focus lands inside `.legend` on open and back on `.legend-toggle` after Escape. |
| A-007 / B-003 | Lens descriptions get a section in the legend — which is where vocabulary lives and is now reachable on a phone. Authority gets a visible one-line gloss on record pages, which have no legend to point at. | The legend documents all four lenses; every record page states what its authority level means in words rather than in a `title`. |
| F-003 / B-002 | Seven candidates against six slots, so capacity is reachable and choosing is a real choice; cards past capacity disable rather than letting the counter run over; and the flow ends somewhere — what would happen next, that nothing happened, and a way back. | 7 candidates, "6 of 6 weekly slots proposed", surplus cards disabled, terminal state and "Start over" both present. |
| F-004 | The canvas controls and minimap take a bottom inset from the sheet's peek height when one is open. | At 375px with a sheet open: sheet top 389, minimap bottom 377, controls bottom 297 — both fully clear. |
| F-005 | A "Clear search" action in the no-results state, which also returns focus to the input. | The empty state offers an action and clearing restores the full list. |
| V-002 | The article measure moves to `.detail-blocks`, which is the container the blocks actually render into. | Worst line length across the record pages drops from ~112 to **84** characters. |
| V-003 | The problem kicker on a prototype card carries its `KindBadge`, like every other cross-reference in the app. | The card names the kind in words; hue is no longer the only signal. |
| V-004 | `link()` drops `meta` when the value is `unknown` — the same information coverage already reports, minus the repetition. | **0** rows reading "unknown" across all 11 routes. |
| A-008 | The brand link keeps a full-size hit area below 560px around a mark that stays small. | Covered by the 0-under-44 sweep above. |
| F-006 | An `open` id shaped like a node id is passed through even when nothing answers to it, so the sheet's existing "No longer in the model" state explains a stale shared link. | `/map?open=stage:gone-away` renders that state instead of silently showing the default view. |
| B-004 | An `app/loading.tsx` skeleton shaped like a record header, for routes that are all `force-dynamic`. | Renders during navigation; its shimmer stops under `prefers-reduced-motion` while the layout stays. |

### Two caveats worth keeping

- **`.node-expand` is 35×32 painted, not 44×44.** It is drawn inside the canvas
  transform, so CSS pixels are multiplied by zoom and no CSS size alone reaches
  the house floor at the framing zoom. It clears WCAG 2.5.8 (24×24, AA) with
  room to spare and is 3.2× its previous area, but it is the one control that
  does not meet the system's own 44px rule.
- **The map opens on fewer nodes than it used to**, because it will not zoom out
  past the point where its own text is readable. That is the trade V-001 makes,
  and F-002's cue exists to make it legible rather than invisible.

All six repository checks pass: `validate:content`, `lint`, `lint:design`,
`typecheck`, `build`, and `test:responsive` (8/8 at phone and desktop).

---

## Method

Reproducing this review: build and serve the app, then drive it with the pre-installed Chromium.

- Contrast was computed by walking every element with a direct text child, compositing the background stack until an opaque layer was reached, and comparing against WCAG 1.4.3 thresholds using the element's own font size and weight. Measuring against the composited ground rather than the declared token is what surfaced A-002 — the token is correct on white and the app has no white ground.
- Canvas text size was derived by reading the `.react-flow__viewport` transform matrix and multiplying by the computed `font-size` of `.node-title`, `.node-summary` and `.node-kind`, which is what the reader actually sees.
- Focus-ring clipping was established by comparing the focused element's box against its clipping parent's box (0.6–1.9px of inset against a ring drawn 4px outside) rather than by eyeballing a screenshot.
