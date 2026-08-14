# Working in this repository

This repository is an executable model of how a parent-focused behavioral-health
practice platform operates as a business and care system. It is not an EHR and
is not a description of any specific company.

Read `README.md` for the premise and `docs/system-model.md` for the primitives
before changing anything.

## The one rule that matters most

**`content/` is canonical. The application is a projection of it.**

Stages, steps, entities, claims, metrics, problems, and bets live in `content/`
as Markdown with YAML frontmatter. The React Flow graphs render that content;
they are not a second source of truth.

- Never hardcode a stage, step, claim, metric, problem, or bet into a React component.
- Never encode counts, positions, or relationships in application code that could
  be derived from `content/`.
- Adding new system thinking must not require editing `app/` or `components/`.

If you find yourself adding a literal ID or a literal count to a component, the
model is missing a field. Add the field instead.

## How the projection works

`lib/model/` is the single boundary between canonical content and the interface.
`projectModel()` in `lib/model/graph.ts` turns `content/` into one `ModelGraph`:
typed nodes for every primitive, typed edges for every relationship, plus derived
signals, detail blocks, coverage, and a per-node content hash. Components read
that shape and nothing else.

The practical consequence: **adding a stage, step, entity, claim, metric, problem,
or bet requires no code change at all.** It appears on the map, in search, in the
detail panel, on its own page, and in the relevant lens because the projection
already describes it.

Two rules keep this working:

- **Relationships belong in the projection, not the canvas.** If the map needs to
  know that two things are connected, derive the edge in `graph.ts`. Never infer
  a relationship inside a React component.
- **Respect the server boundary.** `lib/model/graph.ts` reads the filesystem and
  is server-only. Anything a client component needs — kind labels, routes, lens
  bands — lives in `lib/model/kinds.ts`. Importing `graph.ts` from a `"use client"`
  component fails the build with a `node:fs` chunking error.

Node positions are derived too. `lib/model/layout.ts` computes them from topology,
so the same revision always draws the same picture and a shared URL shows the same
view. A reader dragging a node is overriding a derived position locally; it is not
an edit to the model.

## The map follows the repository

`/map` is rendered on the server and then keeps itself current: the browser polls
`/api/model/revision` (a hash of everything under `content/`) and pulls
`/api/model` when it moves. A push, a merge, or a local edit made through any tool
wired to this repository shows up on every open map within seconds, and the nodes
that changed are highlighted.

Model-driven routes are therefore `dynamic = "force-dynamic"`. Do not prerender
them: a statically built page would show a stale model until the next deploy,
which defeats the point.

## Problems are named separately from their answers

The model does not let a Bet attach straight to a Stage. A Bet names the one
Problem it answers, and the Problem names the Stages and Steps it bites. Where
the Bet lands follows from the Problem.

This is deliberate, and it is the rule most likely to feel like an extra step:

- Naming a problem is a complete contribution. Do not invent a Bet to justify
  writing one down.
- Do not restate a problem inside a Bet. Bets render `# Bet` and `# Questions`;
  a `# Problem` heading in a Bet is rejected by validation, because two copies
  of the same trouble drift apart.
- Do not give a Bet its own targets. If a Bet seems to land somewhere its
  Problem does not, the Problem's `targets` are wrong, or it is a second problem.

## Research is staging, and only a person promotes it

Research from a chat — Claude, ChatGPT, anything — enters as a handoff under
`research/`, never as an edit to `content/`. `docs/research-workflow.md` covers
one run; `docs/research-routine.md` covers running it on a schedule.

The rule that matters here: **an agent cannot change what the model claims.**
A canonical record cites research through `researchTrace`, and that citation
only validates against an `accept` or `accept-with-edits` decision, written by a
named person, over the current handoff hash, not since superseded. This is
enforced in `checkResearchTrace` at content validation *and* inside
`projectModel()`, so it holds for the live map too. An agent with full write
access to this repository still cannot promote its own research.

Three consequences worth knowing before you touch any of it:

- **`research/` never moves the map's revision.** `contentRevision()` hashes
  `content/` only. Staging churn must not make every open map re-fetch.
- **Read the brief before researching.** `npm run research:brief -- <id>` prints
  what earlier runs established. Restating an earlier finding exactly is a
  validation error, because a routine running twice a day would otherwise
  resurface the same sentence forever.
- **`/review` is the one human step.** It is a reading surface, not a form: the
  evidence, the prior art, and what a finding would change all sit next to the
  decision. Do not add a way to skip it, and do not add server-side writes to
  make it "complete" — it hands back a decision file, and Git records it.

### Where research appears, and where it deliberately does not

`/review` is ordered by what is owed rather than by what exists: waiting on you,
accepted but not yet in the model, worth investigating, decided. A record page
carries a **Research about this** block, and the navigation carries a count of
findings waiting on a person.

**Accepted and applied are different states.** A reviewer accepting a finding
authorizes a change to `content/`; it does not make one. If those two collapse
into "done", accepted research piles up having changed nothing — which is the
failure this whole arrangement exists to prevent. `findingState()` in
`lib/research/view.ts` is where that distinction lives.

Research is **not** painted on the map, and that is a decision rather than an
omission. `projectModel()` reads `content/` and `contentRevision()` hashes
`content/` only, so a badge on a node would go stale the moment a handoff landed
and would not correct itself until something canonical changed. Record pages
render per request, so that is where the connection is safe to make.

Surfaces outside `/review` read research through `lib/research/glance.ts`, which
swallows its errors on purpose. A malformed staging file is a normal thing to
encounter; it must not take down the navigation on every route and every record
page along with it. The research page itself does not use those helpers — there,
a parse failure is the most important thing on the screen.

## The interface uses one design system

The UI follows the **Family Health Provider** design system, vendored into
`app/design-system.css` from
[`dmeehan45/design_systems`](https://github.com/dmeehan45/design_systems/tree/main/family-health-provider).
Read `docs/design-system.md` before changing anything visual.

The rule that matters: **brand values live in `app/design-system.css` and
nowhere else.** `app/globals.css` opens with a block aliasing this application's
vocabulary onto that file's semantic layer; everything else reads the aliases. A
literal colour in `app/` or `components/` is a bug, and `npm run lint:design`
fails on one.

If no semantic role fits what you are building, add a role to the semantic
layer. Do not reach past it into a primitive, and do not invent a colour.

Two things the tokens cannot enforce on their own, and that a change most often
breaks:

- **Hue means category, never decoration.** Blue is the machine as it is, coral
  is where it breaks and what we have not proven, gold is what we propose to
  change, green is what we can measure, neutral is what moves through it. Colour
  is never the only signal — every node and badge names its kind in words too.
- **44px is the floor for anything you tap**, focus is the reference ring built
  from `:focus-visible`, and motion is 0.15s on the system's one easing curve.

### A pane that scrolls must be bounded by a definite height

The map is one screen: a canvas and a detail pane that scroll *inside* the
viewport while the page itself does not move. Every layout bug this interface has
had in that view is the same bug, and it is worth naming because it is invisible
until the content gets long.

**`min-height` does not bound anything.** `body { min-height: 100dvh }` gives the
shell a floor, not a height, and a flex or grid container whose own height is
indefinite sizes itself to its content. So the constraint silently inverts: the
pane stops being bounded by the shell and the shell starts being sized by the
pane. `overflow-y: auto` on the pane then does nothing, because a box that is
always exactly as tall as its content never overflows.

The failure looks like this, and none of it reads as a layout bug:

- the pane renders correctly with short content and only breaks once a record is
  taller than the window, so it survives every casual check;
- the wheel scrolls the *document* by the overflow amount instead, dragging the
  canvas and the nav off-screen;
- the bottom of the pane sits below the fold and can look unreachable.

The tell is a single measurement: **a scrollport whose height does not change
when the window height changes is sized by its content, not by the screen.**
`.sheet-body` measured 708px at both a 900px and a 700px viewport. That is the
whole diagnosis.

So, when you add or move a scrolling region:

- Give it an ancestor chain with a **definite** height — `height`, `dvh`, a grid
  row, or a fixed-position box. The phone's sheet already gets this right with
  `position: fixed; height: 86dvh`; the desktop sheet had nothing equivalent.
- Keep `min-height: 0` on every flex and grid item between that ancestor and the
  scrollport, or the automatic minimum size re-introduces the same growth.
- Prefer `%`/`dvh` over `calc(100dvh - a-number-you-typed)`. A measured header is
  a number that goes stale; React Flow's root has the same requirement, which is
  why the canvas lives in a grid row rather than a flex item.

`npm run test:responsive` is a thin Playwright smoke test at phone and desktop
widths. Keep it thin — it exists to stop a push from silently breaking the phone,
not to pin the design down. Add a case when a responsive bug gets past it.

It already asserts the map does not grow past the viewport, and that assertion
passed all the way through the bug above, because it only ever checked `/map`
with nothing open. **Check the state that holds the most content, not the empty
one** — the empty state is the one that cannot fail.

## Incompleteness is valid

The schemas are deliberately permissive. Only `id` and `title` are required on
most primitives (`stage` is also required on a Step). Do not fill in
`entryConditions`, `rules`, `metrics`, or `exceptions` with plausible-sounding
filler to make a file look complete. An empty field is honest; invented content
is not, and this artifact is meant to be reasoned against later.

Equally: do not restate `purpose` verbatim as `activity`. If the distinction
isn't known yet, leave `activity` out.

The interface makes this visible rather than hiding it. Every primitive shows how
many of its modelable fields are populated and names the ones that are not, so a
thin file reads as a thin file instead of looking the same as a rich one. That is
a navigation aid, not a score to maximise — do not fill fields to move the bar.

## Authority and provenance are load-bearing

Every claim, rule, and bet carries an `authority`: `reference`, `proposed`,
`validated`, or `policy`. Default to `proposed`. The distinction between "something
we think might be true" and "an approved operating rule" is the guardrail that
lets a future agent reason from this model without treating speculation as policy.

`provenance.source` records *why* we believe something — author reasoning, public
research, interview, observation, data, experiment. Git already records who
changed the file; provenance records the reasoning behind it.

## Boundaries

Do not add: a database, a CMS, a graph database, an agent framework, MCP, chat,
authentication, PHI or any real patient/clinician data, production scheduling,
billing, credentialing integrations, or a production matching engine.

Prototypes under `app/prototypes/` use synthetic data only and exist to make one
bet concrete — not to become production systems.

Do not embed runtime instructions ("call tool X, then Y") inside process
definitions. Process context describes reality; agent capability is a separate
future layer. See `docs/future-agent-model.md`.

## Before opening a pull request

```bash
npm run validate:content   # schema + cross-reference errors, names the file and field
npm run validate:research  # research handoffs, decisions, and generated packets
npm run test:research      # the intake contract itself
npm run scan:safety        # credentials, contact details, confidentiality markers
npm run lint
npm run lint:design        # brand values outside the token layer
npm run typecheck
npm run build
npm run test:responsive    # phone and desktop smoke test; builds and serves the app
```

CI runs all nine. Validation failures name the offending file and field.

`test:responsive` needs a browser once: `npx playwright install chromium`.

### Branch from `main`, and target `main`

Enforced by the `Pull request shape` check, and the rule most likely to be
broken by an agent asked for "sequential pull requests":

**Never base a pull request on another feature branch.** Splitting work into a
sequence does not mean stacking it. Branch each pull request from `main`, target
`main`, and let the diffs overlap.

A stacked pull request does not follow its base onto `main` when that base
merges. It stays open, pointed at a branch nobody is developing, and merging it
pushes the work *down* into that dead branch. Checks stay green, GitHub reports
it merged, and `main` receives nothing. This has cost two hand-written recovery
pull requests here — #9 for PRs #3–#7, and #15 for PRs #12–#14.

If a change truly cannot be reviewed without an unmerged one, stack it, add the
`stacked` label so the check passes, and say in the body that the stack must be
**merged top down** — furthest from `main` first. Assume nobody reading the
pull request knows that, because twice nobody did.

## Commit style

Commits record the evolution of understanding, not just of code. Prefer:

```text
model: split clinician selection from onboarding
claim: add initial-caseload retention hypothesis
bet: add guided first caseload
prototype: add initial guided caseload interaction
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
