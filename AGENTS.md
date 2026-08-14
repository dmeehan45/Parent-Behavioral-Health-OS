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

`npm run test:responsive` is a thin Playwright smoke test at phone and desktop
widths. Keep it thin — it exists to stop a push from silently breaking the phone,
not to pin the design down. Add a case when a responsive bug gets past it.

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
npm run lint
npm run lint:design        # brand values outside the token layer
npm run typecheck
npm run build
npm run test:responsive    # phone and desktop smoke test; builds and serves the app
```

CI runs all eight. Validation failures name the offending file and field.

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
