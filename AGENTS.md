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

## The same rule, for documentation

**A contract statement lives in exactly one file. Everywhere else links to it.**

This file is the contract: the loop diagram, the check list, the section tables,
the branch rule, and every rule about the model and its projection live here and
nowhere else. `CONTRIBUTING.md` routes; `docs/authoring.md` teaches primitives;
`docs/research-workflow.md` is intake mechanics and `docs/research-practice.md`
the research craft; `docs/prototype-workflow.md` turns a Bet into software. Each
has one job.

This is the same rule as the one above, applied to prose instead of components.
It exists because a planning-file audit found four documents describing
contribution and disagreeing three ways — the loop diagram, the pre-PR check
list, and how many experiment sections a Bet has. Each was fixed by editing
every copy, which is the fix that does not last. If a rule needs restating to be
findable, the link is the restatement.

Adding a document is a real decision: prefer a section in the file that already
owns the topic. Two runs in a row added a research document, which is how four
became the number.

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
  a relationship inside a React component. `docs/relationships.md` covers when a
  reference should become an edge and when it should stay a block — the answer
  is usually that it should stay a block.
- **A relationship counts once, from whichever end wrote it down.** `claim.targets`
  and `step.claims` are the same link from two sides, and the projection resolves
  both into one edge. When both ends may legitimately author a link, resolve both
  and deduplicate; do not make contributors learn which side is read.
- **Every reference must be classified.** `lib/model/conformance.ts` declares,
  for each reference field, either the edge the projection derives or a
  deliberate block-only decision and its reason. `npm run validate:projection`
  fails on a reference that is neither — which is what stops a schema field from
  being validated, rendered, and still invisible to every surface that reads
  edges. Adding a reference field means adding a row.
- **Respect the server boundary.** `lib/model/graph.ts` reads the filesystem and
  is server-only. Anything a client component needs — kind labels, routes, lens
  bands — lives in `lib/model/kinds.ts`. Importing `graph.ts` from a `"use client"`
  component fails the build with a `node:fs` chunking error.

### Stage topology and connection depth

`content/map.yaml` owns the top-level Stage relationships. Step `next` owns the
process sequence. The map may derive richer handoff detail from those authored
facts, but it may not turn an attractive diagram into a new claim about the
system.

The relationship vocabulary has four different jobs:

- `flows_to`, `supplies`, and `enables` are forward operating progression and
  determine left-to-right Stage rank.
- `returns_to` is operating rework or return. It is drawn as a loop and never
  participates in forward ranking.
- `informs`, `influences`, `depends_on`, and `constrains` are data or contextual
  couplings. They stay visible without pushing the target into a later rank.
- `feedback_to` is learning feedback. It is drawn as a loop and never
  participates in forward ranking.

Do not collapse `returns_to` and `feedback_to`. A failed start returning to
Matching is work going backward; evidence changing future matching behavior is
learning going backward. They may look similar on a canvas and mean different
things to the operating system.

The Operating flow lens can isolate `operating`, `data`, `experience`, and
`learning`. **Layer toggles change ink, never topology or node position.** A gap
belongs to a layer too: an Experience-only view may show boundaries whose
experience payload is explicitly *unmodelled*. Hiding the boundary because the
payload is unknown hides the research surface the layer exists to reveal.

Connection depth is part of `ModelGraph`, not a canvas helper. For an authored
Stage relationship the projection may derive:

- a cross-stage operating handoff when a Step's `next` points to a Step in the
  target Stage;
- a data/state transfer when that producing Step's output and the consuming
  Step's input agree on the same Entity and state;
- canonical Problems that already target both sides of the Stage boundary;
- an explicit gap when the relationship exists but the operating mechanism,
  data payload, participant-experience context, or learning payload is not yet
  described.

Do not infer an experience payload from adjacency, roles, preferences, or prose
that merely says experience matters. Do not infer a learning payload from a
feedback arrow. Until signal, attribution, cadence, confidence, or permitted use
is canonical, show the gap. Research that proposes what should fill it remains
under `research/` and cannot be painted on the canonical map before review.

Node positions are derived too. `lib/model/layout.ts` computes them from topology,
so the same revision always draws the same picture and a shared URL shows the same
view. A reader dragging a node is overriding a derived position locally; it is not
an edit to the model.

## The flow has to carry what the states claim

A Step says what it consumes and what it produces; `next` says what the flow does
afterwards. Those are two authored facts about one sequence, and they can
disagree. When one Step outputs a Clinician in `match-ready` and another takes a
Clinician in `match-ready` as an input, the model is asserting a handoff — and a
missing `next` makes it a handoff nothing carries. `checkFlowContinuity` in
`lib/content/flow.ts` refuses that. It runs inside `getRepository()`, so it holds
for the live map and not only for `npm run validate:content`, and it reports
every stranded input rather than the first: one missing link usually strands
several, and the nearest is rarely the one that sorts first.

The question is asked once per input, and **one supplier is enough**. This flow
will not stay linear — `docs/care-delivery-lifecycle-contrast.md` is explicit
about rematching, transfer and closure routes — so once two paths both carry an
accepted Match to their own next Step, demanding that each producer reach every
consumer would refuse a correct model for handoffs nobody wrote down. A Step's
own output does not supply its own input either: what a Step produces exists
once it has run, and an input has to exist before it does.

This is not a completeness rule, and it must not become one:

- **A Step with no `next` is fine.** The ladder ends somewhere, and nothing
  consumes what the last Step produces.
- **A state nobody produces is fine.** That is a part of the system nobody has
  modelled yet — `propose-match` needs a Family in `match-ready`, and no Step
  makes one, because `family-demand` has no Steps at all. The interface says so,
  as an open end on the Step that feels the absence. Validation stays quiet,
  because the answer is somebody describing what really happens, not a plausible
  Step invented to satisfy a checker.

Only the contradiction fails: both ends written down, and no path between them.

Worth knowing why it exists. Splitting `first-successful-family` into separate
matching and care-initiation Steps was a real improvement, and it removed the one
`next` that carried a clinician out of onboarding without writing a replacement.
The process graph fell into five disconnected islands, every check stayed green,
and `/map` drew five stranded chains with nothing saying that was wrong — because
the entity states still described the sequence correctly, and no check read the
shape of the flow.

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
`research/`, never as an edit to `content/`. `docs/research-workflow.md` is the
mechanics, one run and on a schedule; `docs/research-practice.md` is the craft.

Read the practice document before researching. The agent is responsible for
helping the user learn along with the repository: orient from the current model
before external research, pressure-test findings before handoff, and close
reviewed/applied work with a learning checkpoint before moving to the next
question. Do not rely on chat history as the source of current understanding;
reconstruct it from the repository and let the user correct the framing. The
same file governs source selection and evidence appraisal — recency in
proportion to how fast the subject changes, directness, study strength,
triangulation, and a bar that rises with the decision a finding could support.

The rule that matters here: **an agent cannot change what the model claims.**
A canonical record cites research through `researchTrace`, and that citation
only validates against an `accept` or `accept-with-edits` decision, written by a
named person, over the current handoff hash, not since superseded. This is
enforced in `checkResearchTrace` at content validation *and* inside
`projectModel()`, so it holds for the live map too. An agent with full write
access to this repository still cannot promote its own research.

Four consequences worth knowing before you touch any of it:

- **`research/` never moves the map's revision.** `contentRevision()` hashes
  `content/` only. Staging churn must not make every open map re-fetch.
- **The queue counts what is owed, not only what is thin.** `findGaps` reports
  `undecided`, `unapplied`, `unconverted` and `saturated` above every invitation
  to go and research something, because those are answered by writing rather
  than by researching. `saturated` — several pieces of context anchored to a
  record that still claims nothing — is the anti-bloat instrument: a context
  base growing correctly and changing nothing looks fine from the inside until
  something counts it.
- **An intake commits the handoff and nothing else.** Everything a reviewer
  reads is derived from that one file, and the actor this workflow is written
  for — a conversational agent on a GitHub connector — writes files through the
  contents API and cannot execute anything. Requiring it to commit a generated
  packet made the one step it could not perform the one step it could not skip,
  and every connector intake failed on it. So CI renders the packet onto the
  pull request instead (`.github/workflows/research-packet.yml`), and the
  scheduled routine folds the brief into its issue for the same reason.

  The general form, and the thing to check before adding any intake step:
  **never require an artifact from an actor that cannot produce it.** If a step
  needs a shell, it belongs in CI.
- **Read the brief before researching.** `npm run research:brief -- <id>` prints
  what earlier runs established. Restating an earlier finding exactly is a
  validation error, because a routine running twice a day would otherwise
  resurface the same sentence forever.
- **A finding is not the only thing a run produces.** A finding proposes
  something the model might come to believe and costs a judgement each. A
  **note** is context that changes no claim, dispositioned as a set, and it is
  how volume gets in without the reviewer paying per item. Two rules keep it
  honest: a note must be **anchored** to a record or a queued question, and a
  note can never be cited by `researchTrace`. When in doubt propose a finding —
  a note needing its own judgement is a finding filed wrong.
- **A reflection is a run that thinks rather than reads.** `run.kind:
  reflection` carries structured thinking about the model or about earlier runs,
  and may propose **candidates**: that something should *exist*, as a Problem or
  a queued question. A candidate carries no title and the schema is strict, so
  writing one is an error rather than a silently dropped field — naming is the
  judgement that separates recording a trouble from recording a fix, and
  accepting a candidate composes a skeleton with the name left blank. Candidates
  are decided one at a time; only notes are decided as a set.
- **Adding an optional field to a research contract must not invalidate a
  review.** Absent and empty values are normalized away before a handoff is
  hashed, so a field nobody used hashes as it did before it existed. The
  corollary is a rule: **add fields, never reorder or rename them.** Key order
  still reaches the digest. `handoffHash` lives in `lib/research/schema.ts`
  beside the contract, because the loader and the intake both check it and a
  second copy of the recipe once let the live map refuse a trace that validation
  had passed.
- **The decision file is the gate, not the surface that produced it.** A person
  may decide at `/review` — a reading surface, not a form, where the evidence,
  the prior art, and what a finding would change sit next to the decision — or
  in the conversation the research happened in, with the agent recording what
  they said over the hash CI printed on the intake pull request. Everything
  enforced lives in the file, so both lanes carry the same guarantees;
  `decidedVia` records which was used, and gates nothing.

  What an agent may never do is supply a disposition the person did not state,
  name them as reviewer without their say, or treat silence as assent. Do not
  add a way to skip the person, and do not add server-side writes to make
  `/review` "complete" — it hands back a decision file, and Git records it.

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

Applying an accepted finding also offers to compose the **Problem** it points
at — carrying the targets, the claims and the trace, and leaving the title and
every word of the body empty. Naming the trouble is still a person's sentence,
and the rule that decides whether a Problem is a Problem is said next to the box
where it is written: *the trouble, not the fix*.

A prototype review comes back in the same way, as a handoff with a `session`
source. Observations are not truth: one participant's reaction is a `reported`
observation at best, and whether it changes what the model claims is decided at
`/review` like anything else.

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

### Applying is composed, never generated

`/review/apply` turns an accepted decision into the change that makes the model
say it. `lib/research/apply.ts` composes what is **derivable** — the record's
identity, where it lands, the `researchTrace` that proves it was reviewed — and
refuses to compose what requires judgement.

That line is the whole design. A Problem generated from a finding would be
invented content wearing the clothes of evidence, which is the one thing this
repository asks nobody to do. So the person chooses what kind of belief a Claim
is and how confident they are, and naming a Problem stays an invitation. Do not
"finish" this by having it write Problems and Bets.

Choosing between `reported`, `observed`, `inference`, `assumption` and
`hypothesis` is also the moment somebody actually learns what the model means by
a Claim, which is why the interface explains each one at the point of choosing
rather than assuming it is known.

## Navigation should leave a reader knowing more

A record page is good at saying what we currently think and was silent about the
thing a reader is best placed to help with: the loose ends. `lib/model/open-ends.ts`
derives them from the projection's own shape — a Problem with no Bet, a
low-confidence Claim several things rest on, a Metric that would settle an
argument and that nobody collects, a Bet with no prototype, a thin record.

Two rules keep it from becoming another wall:

- **Aggregate, never enumerate.** Six near-identical sentences about unmeasured
  metrics is the problem this section exists to be an alternative to. One line
  names the count and the first two.
- **Cap it, and put it last.** Four at most, after everything the model does
  say, because it is the question a reader leaves with rather than what they
  arrived for.

It reads edges, so it only sees relationships the projection actually derives —
and that is a smaller set than the references in `content/`.
`docs/relationships.md` explains what an edge is, which references become one,
and why most of them should not.

The rule that decides it: **an edge is the inverse index of an authored
reference**, so it exists when some surface has to answer a question from the
end that did not write the link down. A Problem's own `claims` and `metrics`
stay blocks, because that question is already answered on the Stage the Problem
bites, one click away and with more context.

## A bet carries the shape of its experiment, and the packet can refuse

A Bet says what we would try. Six optional sections — `# Learning decision`,
`# Scope`, `# Out of scope`, `# Assumptions`, `# Signals and safeguards`,
`# Fidelity` — say what *trying it* would settle. `# Out of scope` is separate
because exclusions are the half that stops a prototype quietly growing, and a
builder who is not told them invents them. Where an exclusion is waiting on a
decision nobody has made, `awaiting: [<question-id>]` names the open research
question, so the boundary reads as provisional rather than arbitrary and the
research queue can see a bet is held up by it. They are the five things `docs/prototype-workflow.md`
requires a person to approve before anything is built, and they live in the Bet
so that approval is a pull request with history rather than a message in a chat.

`npm run prototype:brief -- <bet-id>` composes everything a builder needs from
the model: the bet and its experiment, the problem, the flow it lands on with
roles and rules and exceptions, the evidence and where it is weak, the research
that names any of it, known/assumed/unknown, and the build contract. Hand its
output to a coding agent with this file and that is the whole handover.

Three rules keep this from rotting:

- **The packet is derived and printed, never committed.** A packet on disk would
  be a second description of a Bet, stale the moment the model moved — the same
  reason `research:brief` prints rather than writes.
- **It refuses, and the refusal is the point.** A Bet with no learning decision
  gets *not ready to build* and the questions to put to a person. Do not
  "helpfully" fill those sections in to unblock a build: a guess written there
  becomes something the built artifact makes look real, which is worse than the
  gap. Naming what an experiment should teach is the person's judgement.
- **Unknown means unknown.** Every unfilled modelable field is listed by name in
  the packet. A blank field is not a licence to invent behaviour — label it in
  the interface, keep it out of the flow, or ask.

The sections describe the *test*. They never restate the problem or the
intervention, which are already written down once each.

`npm run prototype:queue` holds the same contract across every Bet at once: it
prints each bet's derivable state — unshaped, buildable, unstamped, stale,
reviewable — and the one next action, and the scheduled routine republishes it
on its issue beside the research queue. That is what lets a build start because
the model says a bet is ready rather than because somebody remembered. It
composes and decides nothing: building is work an agent may take from the
queue, while stamping a build and judging what a session taught stay with a
person.

### A built prototype says which experiment it was built against

Readiness is a question about the bet. Once software exists there is a second
question about the artifact, and refining the bet is exactly what makes it go
stale. A built prototype therefore carries `builtAgainst`, a fingerprint of the
five sections printed by `prototype:brief` and written by a person.

**A machine can prove staleness; only a person can assert conformance.** Nothing
reads the prototype's source and decides whether it implements a scope — that is
semantics, which deterministic tooling here does not resolve. It proves the
cheaper, sufficient thing: somebody looked at both, and neither has moved since.

- **Do not restamp to clear a failing check.** The stamp means the software was
  looked at against the refined section. If it has not been, `prototype.status:
  concept` is the honest answer and costs nothing.
- **The check lives in `validate:content`, not the loader.** A loader that threw
  on drift would make the repository unloadable the moment somebody refined a
  bet — taking down the map, every record page, and the packet whose whole job
  is to say what changed. A gate that breaks the tool for fixing it is not a
  gate.

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

### Fitting is not the same as being readable

A front-page band shipped with its prose set at fifteen characters a line: five
equal columns of a 1000px measure, about 110px each, every one carrying a
twelve-word sentence, a disclosure and a shell command. The gist wrapped to six
ragged lines and `npm run prototype:brief -- guided-first-caseload` broke across
six more. It was unreadable, and it went through review green.

Three things had to be true at once, and each is worth fixing separately:

- **The measure was bounded above and never below.** The one typography
  assertion in the repository was `width <= 760px`, so 110px passed it. A range
  checked at one end reads as protection and is not: `docs/design-system.md`
  now names the floor beside the article measure, and `tests/legibility.spec.ts`
  enforces it in characters per line — the unit the standard is written in,
  measured from the glyphs rather than from how the last line happened to fall.
- **The state that was checked was the one that could not fail.** The band was
  screenshotted with all five of its disclosures shut. That is the same trap as
  the map above, met in a new component and not recognised, so the legibility
  check now opens every `<details>` on the page before it measures anything.
- **The browser step was ad-hoc, and it was checking intent.** Nothing required
  opening the page, so it happened when somebody remembered, and the question
  being asked was *is this what I meant to build* rather than *is this how it
  should be built*. Those are different questions, and only the second one finds
  a bug like this.

So, before you commit anything visual: **serve the built app and look at it, at
both widths, in the state that holds the most** — every disclosure open, the
longest record, the sheet docked. What a check cannot measure is exactly what
that look is for: rows that fall out of alignment when one of them grows, a
heading that wraps to four lines, the same sentence said twice on one screen.
Fix what you find before the commit, not after the review.

The measure floor is a floor, not a target. Narrow columns are a legitimate
choice and the check argues with none of them; it fails at the point where text
has stopped being prose and become a column of word fragments. If a change makes
it fail, widen the container, shorten the text, or move it somewhere with room —
do not raise the threshold to fit the design.

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
npm run validate:projection # references the projection would silently ignore
npm run validate:research  # research handoffs, decisions, and generated packets
npm run test:research      # the intake contract itself
npm run test:prototype     # the build packet, and what it refuses to compose
npm run test:model         # the projection contract: edges, flow continuity, conformance
npm run scan:safety        # credentials, contact details, confidentiality markers
npm run lint
npm run lint:design        # brand values outside the token layer
npm run scan:design-tells  # AI-default drift the colour rule cannot see
npm run test:design        # the scanner's own contract
npm run typecheck
npm run build
npm run test:responsive    # phone and desktop: does it fit, and can it be read
```

CI runs all of them. Validation failures name the offending file and field.

`test:responsive` needs a browser once: `npx playwright install chromium`. It
builds and serves the app itself and runs everything under `tests/*.spec.ts` —
the responsive smoke test and the legibility floor.

**A visual change is not finished when those pass.** Serve it and look at it
first, in the state that holds the most; the section above says what that means
and why it is the step that was missing.

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