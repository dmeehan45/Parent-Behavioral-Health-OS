# The context flow: research → problem → bet → prototype

This is a plan, not a description of the system as it stands. It defines what an
excellent version of the repository's learning loop looks like and sequences the
changes that get there from the current machinery. When a change lands, its
section here should be updated to say so; when all of them have, this document
becomes a historical record like `v0-build-plan.md`.

## The loop this is for

A person spends time on the map understanding how the machine works and where it
breaks, helped by a research routine that keeps finding evidence about the
places the model is thin. What they learn becomes better-defined Problems. A
well-defined Problem invites a Bet, and the Bet inherits the Problem's context
instead of restating it. A Bet rich enough to carry the shape of its own
experiment can be handed — together with the repository's building guidelines —
to a coding agent, which builds the prototype on its own for the person to
review. What the review teaches enters as staged research, a person decides what
it means, and the model moves.

Every arrow in that loop already exists here in some form. The research routine,
the review gate, the apply composer, the problem/bet separation, the prototype
workflow, and the prototype shell are all built. What is missing is not another
station — it is that the joins between stations leak, so the most important
context is re-derived by hand (or lost) at each handoff, and the coding-agent
pass has no packet to start from.

The design rule that governs everything below, stated once:

> **Context flows by derivation; belief changes by human authorship.** Every
> station hands the next one a *composed* artifact derived from the projection
> and the research record. Every judgement — what a Problem is, what a Bet
> proposes, what an experiment should teach, what a finding means — is a named,
> durable, reviewable artifact in Git, written by a person. Nothing in this plan
> generates content, and nothing in it adds a second source of truth.

This is the same rule `lib/research/apply.ts` and `AGENTS.md` already state for
research intake. The plan extends it to the rest of the loop.

## Where context leaks today

Walking the loop station by station against the current code:

**Research → problem space.** The routine works end to end: gaps
(`lib/research/gaps.ts`) turn model thinness into suggested questions, the brief
(`lib/research/brief.ts`) hands each run everything earlier runs established,
`/review` puts findings next to evidence, and `/review/apply` composes accepted
findings into Claims and `researchTrace`s. But the composer deliberately stops
at Claims, and nothing picks up where it stops: "naming a Problem stays an
invitation" — correctly — yet the invitation arrives empty-handed. A reviewer
who has just accepted three findings about matching failures gets no help
turning them into a Problem, even though half of one is derivable: the
`suggestedTargets` are the Problem's candidate `targets`, the finding's trace is
its `researchTrace`, and the Claims just composed are its `claims`. Today that
person re-assembles those references by hand or, more likely, doesn't.

**Evidence → the problem space's shape.** A Problem's `claims` and `metrics`
frontmatter renders as detail blocks (`lib/model/graph.ts` builds them) but
derives no edges — `AGENTS.md` notes this, and the same is true of a Bet's
`claims` and `metrics`. Because `lib/model/open-ends.ts` reads edges, a Problem
resting on one low-confidence hypothesis and an unmeasured Metric shows no open
end about either, and a Bet's page cannot say its supporting Claim is weak. The
evidence lens hangs Claims under the Stages they target, but the argument the
user is actually building — *this* Problem is real because of *these* claims,
and *this* metric would settle it — is invisible to every derived surface. The
prototype packet (below) also cannot traverse what the graph does not hold.

**Problem → Bet.** This join is the healthiest: a Bet names its Problem, targets
are inherited, validation rejects a restated `# Problem`, and the projection
gives the Bet page and prototype shell the Problem's context for free. Nothing
to fix in the direction it already covers.

**Bet → prototype pass.** This is the widest leak.
`docs/prototype-workflow.md` defines exactly the right artifact — a working
brief with the learning decision, participant and moment, in-scope path,
exclusions, known/assumed/unknown, signals and safeguards, and fidelity — and
then locates it "in the implementation plan": a chat. The Bet's canonical body
is `# Bet` and `# Questions` (`lib/content/body.ts` enforces it), so the
experiment's shape has no durable home. The consequences compound: the human
checkpoint the workflow requires is approved nowhere reviewable, every build
re-derives the brief from six documents plus the projection, and a coding agent
asked to build has to already know which documents to walk. Compare the research
side, where `npm run research:brief` composes everything a run needs before it
starts — the prototype pass has no equivalent, which means the station designed
to be agent-executed is the one station with no composed input.

**Prototype → learning → model.** The workflow says to record what a review
session taught "in a reviewable artifact appropriate to the implication," but no
home or format exists, so observations live in whoever ran the session. The
research contract is nearly the right container — `provenance.method` is a free
string, `preparedBy.kind: human` exists — but a session observation has no legal
source kind (`web`, `publication`, and `repository` all demand locators a
conversation does not have).

**Teeth.** Validation checks that a declared `prototype.route` has an
implementation, and nothing further. Nothing checks the page actually renders
inside `PrototypeShell`, and `npm run test:responsive` does not visit prototype
routes — the exact "empty state passes, fullest state breaks" trap `AGENTS.md`
documents for the map.

## What does not change

The invariants this plan builds inside, so no step below can be read as
loosening them:

- `content/` stays canonical; the application stays a projection of it.
- Research stays staging; only a named person's decision changes what the model
  claims, enforced in validation and in `projectModel()`.
- Composition never generates. Anything derivable is composed; anything
  requiring judgement is left blank, with the interface teaching what the blank
  means at the point of writing.
- Incompleteness stays valid. Every field and section added below is optional;
  the gates live in what an unfilled field *unlocks*, never in validation
  demanding filler.
- The reading experience stays light: record pages, `/review`, the map, and
  commands. No dashboard, no chat surface, no agent framework, no server-side
  writes.

## The sequence

Six changes, ordered by the direction context flows. Each is independently
valuable and lands as its own pull request from `main`; none is stacked on
another. Changes 2 and 3 can proceed in parallel once 1 has landed; 4 needs 3;
5 needs 4.

### 1. Let Problems and Bets hold their evidence in the graph

**Change.** In `lib/model/graph.ts`, derive `evidence` edges from a Problem's
`claims` and `metrics` frontmatter and from a Bet's `claims` and `metrics`
frontmatter, alongside the blocks already built from them. `AGENTS.md` flags
this as worth doing deliberately because it changes what the map draws — this
is that deliberate change, and the map drawing it is the point: the evidence
lens can then show the argument under a Problem, not only under the Stages the
Claims happen to target.

**What it unlocks.** `open-ends.ts` starts working for the problem space with no
change of its own: a Problem resting on a low-confidence Claim or an unmeasured
Metric now says so as an invitation, which is precisely the "loose end a reader
is best placed to help with." The research gap finder gets sharper for free
(`unevidenced` currently means "no claims/metrics frontmatter"; with edges, the
distinction between *unevidenced* and *weakly evidenced* becomes derivable). And
change 4's packet can traverse Bet → Problem → evidence without private
knowledge.

**Deliberately not done.** No new frontmatter. No back-references (a Claim still
does not list the Problems that cite it in its own file — the projection derives
the reverse direction, as it does everywhere else).

### 2. Give accepted research a hand into the problem space

**Change.** Extend the apply surface (`lib/research/apply.ts` and
`/review/apply`) with a second composition alongside "create this Claim": **name
a Problem from these findings**. It composes only what is derivable — candidate
`targets` from the findings' `suggestedTargets`, `claims` from the Claims the
same session composed, the `researchTrace` — and hands the person a skeleton
whose `title`, `summary`, and body sections are blank. At the point of writing
the title, the interface teaches the one rule that matters, the same way
`CLAIM_KIND_MEANING` teaches claim kinds: *the title is the trouble, not the
fix* — "A clinician can finish onboarding and still have no work" is a Problem;
"Add caseload automation" is a Bet wearing a Problem's clothes.

In the same spirit at the other end of the funnel: where an open end or a gap
suggests a question worth researching (record pages, `/review`'s "worth
investigating"), offer the composed question file —
`research/questions/<id>.yaml` with `targets` and `why` prefilled from the gap
that raised it — for the person to save and commit, exactly as `/review` hands
back a decision file. Git records it; no server write appears.

**What it unlocks.** The two manual re-assembly points in the
research-to-problem join disappear, while both judgements stay exactly where
they are. Naming a Problem remains an invitation — now an invitation with the
references already carried.

**Deliberately not done.** No generated titles, summaries, or prose, ever — a
Problem generated from a finding would be invented content wearing the clothes
of evidence. No auto-queued questions: a gap *suggests*; a person queues.

### 3. Let the Bet carry the shape of its experiment

**Change.** Give the working brief's judgement half a canonical home in the Bet
file itself. Extend `RENDERED_SECTIONS.bets` in `lib/content/body.ts` (and the
Bet coverage counter) with five optional sections mirroring the five things
`docs/prototype-workflow.md` already says a person must approve before
implementation:

| Section | The checkpoint item it makes durable |
| --- | --- |
| `# Learning decision` | What someone should be better able to decide after trying it. |
| `# Scope` | The participant, the moment in the flow, the thinnest in-scope path, and what is explicitly out. |
| `# Assumptions` | What the team assumes for the prototype, kept separate from what the model claims. |
| `# Signals and safeguards` | The observable success signal, linked Metrics where they exist, and the harms watched for. |
| `# Fidelity` | The minimum realism per dimension, so polish has a stated reason. |

Five named sections rather than one free-form `# Experiment` block, because the
names are what make readiness *derivable*: coverage can count them, open ends
can say which is missing, and change 4's packet can gate on their presence. All
five are optional — a Bet is allowed to exist long before an experiment shape
does, and `# Problem` remains rejected. Optionally add one structured field,
`participant: <entity-id>`, so the projection can link the experiment to the
actor it studies.

**What it unlocks.** The prototype workflow's required human checkpoint becomes
a reviewable Git artifact: approving the experiment's shape is now a pull-request
review of the Bet file, with the same history, provenance, and drift-resistance
as every other judgement in the repository. The Bet page and `PrototypeShell`
render the sections automatically through the projection — a reviewer standing
in the prototype sees what it is meant to teach without the builder narrating.
And `open-ends.ts` gains one rule: a Bet with a prototype declared or underway
and no `# Learning decision` invites exactly the question the workflow asks —
*if no decision changes, why build it?*

**Deliberately not done.** No restating the Problem, no targets, no second
description of the intervention — the sections describe the *experiment*, the
one thing no other primitive holds. Validation stays permissive: a missing
section is an honest state, surfaced as an invitation and a closed gate, not an
error.

### 4. Compose the build packet

**Change.** `npm run prototype:brief -- <bet-id>` — the exact analogue of
`npm run research:brief`, for the station that today has nothing. A new
server-side composer (suggested home: `lib/prototype/brief.ts`) renders, from
the projection and the research view, everything `docs/prototype-workflow.md`
step 1 currently asks the builder to go read:

- the Bet — intervention, questions, confidence, authority, and the five
  experiment sections from change 3, verbatim;
- its Problem — what happens today, why it matters, open questions;
- where it lands — each targeted Stage and Step with roles, entities and
  states, rules, exceptions, and open questions;
- the evidence — linked Claims with kind and confidence, linked Metrics with
  perspectives, decision owner, decision informed, and data status (edges from
  change 1);
- the research — accepted traces, and findings about these records still
  `accepted, not yet in the model`, flagged as such;
- **known / assumed / unknown, seeded honestly** — the model's populated fields
  as known, the Bet's `# Assumptions` as assumed, and every unfilled modelable
  field listed by name as unknown, so a blank never quietly becomes plausible
  product behavior;
- the build contract — the non-negotiables from the prototype workflow
  (synthetic data only, no production simulation, genuine end states),
  `PrototypeShell` usage, the design-system rules that break most often (tokens
  only, 44px floor, bounded scrollports), and the definition of done;
- **the readiness verdict** — which of the five checkpoint sections are
  present. If any are missing, the packet says so and stops short of a build
  instruction: *not ready to build — these are the questions to put to the
  person.* The workflow's readiness check becomes mechanical, and the gate
  lives exactly where an agent starts.

Deterministic, derived, printed — not stored. Like the research brief it is a
projection in text; committing it would create the second source of truth this
repository exists to avoid.

**What it unlocks.** The user's target interaction: hand a coding agent one
command's output plus `AGENTS.md`, and the agent has the same context a careful
human builder would have assembled over an afternoon — including the instruction
to stop and ask when the shape is not approved. The Bet page can print the
command next to the prototype block; a line of `<code>`, not a button.

**Deliberately not done.** No runtime instructions inside process definitions
(the packet is composed *from* the model, keeping `docs/future-agent-model.md`'s
layer separation), no agent invocation machinery, no stored packets.

### 5. Give the pass teeth, and the learning a way home

**Change.** Three small pieces, one per gap in the loop's tail:

1. **Shell check.** `validate:content` (or a sibling check) verifies that every
   declared `prototype.route`'s page renders within `PrototypeShell`. A static,
   grep-shaped check, honest about its limits — it proves the contract was
   invoked, not that the prototype is good.
2. **Responsive coverage derived from content.** `test:responsive` derives its
   route list from the model: every declared `prototype.route` gets the
   phone-and-desktop overflow assertion. This tests the fullest state rather
   than the empty one — the lesson `AGENTS.md` records — and adding a prototype
   adds its test with no code change, the same way adding a Stage adds its node.
3. **Learning intake.** Extend the research contract minimally so a prototype
   review session can enter as a handoff: a `session` source kind whose locator
   names the Bet, the date, and the participant description (never an identity),
   with `provenance.method: prototype-review`. Observations, interpretations,
   and implications then flow through the machinery that already exists —
   packet, `/review`, decision, apply — and the workflow's closing table gets a
   concrete home for its "record what was learned" row. A session observation
   is `reported` evidence at best, and the reviewer holds that line.

**What it unlocks.** The loop closes through the same single human gate it
opens with. A prototype session that weakened a Bet becomes a staged finding a
person decides about — not a Slack message, and not an automatic edit.

**Deliberately not done.** No analytics in prototypes (observation stays
manual, as the workflow requires), no new review surface — `/review` already
orders by what is owed, and session findings simply appear in it.

### 6. Keep the reading surface light — and say so

**Change.** Almost nothing, on purpose, and this section exists so "tighten the
system" is never read as "add surfaces." After 1–5 land: the Bet page shows its
experiment sections and their absence through coverage and open ends it already
renders; Problem pages show their evidence and its weakness through edges and
invitations; `/review` is untouched; the map gains only what change 1's edges
draw. The one addition is the composed command printed on the Bet page. Then
update `docs/prototype-workflow.md` and `docs/authoring.md` to route through the
new artifacts — the workflow's step 1 becomes "run `prototype:brief`," its
checkpoint becomes "review the Bet's experiment sections in the PR," and its
closing table's research row points at session intake.

**Deliberately not done — permanently, as far as this plan is concerned:** no
generated Problems or Bets, no auto-promotion of research or observations, no
build-status dashboard, no chat surface, no agent framework, no database, and
no server-side writes. Every one of these would replace a judgement this
repository deliberately keeps human, or add a source of truth it deliberately
keeps singular.

## The loop, walked through the finished system

The routine's morning run reads the queue, finds matching quality thin, runs its
brief, and opens an intake PR with two findings. The reviewer reads them at
`/review` next to what earlier runs established, accepts one and edits the
other, and at `/review/apply` composes a Claim — choosing `reported` and `low`,
because the interface explains what those commit her to — and then takes the
offered skeleton and names the Problem, writing the title as the trouble. The
Problem lands with its targets, claims, and trace already carried; the map now
shows a Problem with evidence under it and no Bet — the most useful thing on
the map.

A week later someone proposes a Bet against it: intervention, questions, and —
after one focused conversation — a learning decision, scope, assumptions,
signals, and fidelity, reviewed and approved as an ordinary pull request. Anyone
opening the Bet's page sees what the experiment would teach and that nothing has
tested it yet.

Then the person hands a coding agent two things: the output of
`npm run prototype:brief -- <bet-id>` and the repository's guidelines. The
packet carries the Problem's failure story, the Steps' roles and rules, the
evidence and its weakness, the approved experiment shape, the honest unknowns,
and the build contract. The agent builds the thinnest honest flow inside
`PrototypeShell`, validation confirms the shell and the responsive floor, and
the person reviews a prototype whose page already says what it is testing.

The review session's observations enter as a `session`-sourced handoff. One
finding weakens an assumption; the reviewer accepts it; the Bet's confidence
moves in a model-change PR that cites the run. The map updates on every open
screen, the gap finder notices what the session left unmeasured, and the
routine has its next question.

At no point did an agent change what the model claims. At no point did a person
re-assemble context a machine already held.
