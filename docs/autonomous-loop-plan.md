# The autonomous loop: what remains between here and self-running

> **Status: written 2026-08-18 after the loop's second full walk; updated the
> same day after rebasing onto the map-topology work.** Changes 1, 3, and 5
> land with this branch — change 3's stage-level half arrived on `main`
> independently, and what remained was the step level, marked below. Change 2's
> tooling half also arrived on `main`: the research queue now pauses new
> research while decisions are owed. The decisions themselves have not — the
> decision file count is unchanged since 08-14 — so changes 2, 4, and 6 remain
> a person's work with an agent doing the clerical half, and 4 and 6 stay
> gated on 2. This is a plan, not a contract: when it disagrees with
> [`AGENTS.md`](../AGENTS.md), `AGENTS.md` wins.

## The aspiration, stated precisely

A person spends their time in conversation: bringing context and findings into
the repository, and reviewing and refining the problems and bets the
repository's own context surfaces. The repository queues its own work — what to
research, what to decide, what to build — and prototypes get built from
approved bets by an agent the person invokes, without anyone narrating the
repository first.

One operating decision is now made and worth recording: **builds run through
conversation, not through a scheduled runner.** The person points a
conversational agent or a coding agent at the routine issue when a bet is
buildable; nothing fires on a clock. The repository's half of the contract is
that every lane is startable from live state — `npm run research:queue`,
`npm run prototype:queue`, and the routine issue that republishes both. A
scheduled trigger can be added later without changing anything here, which is
the reason to not add it now.

## What the second walk proved

The first walk (2026-08-14) proved the research half; its evidence lives in
[`context-intake-plan.md`](context-intake-plan.md). The second walk
(2026-08-16 to 08-17) ran the whole loop, and faster:

- **Question to working software in about two days.** `define-clinician-quality`
  was queued and answered on 08-16; a reflection and two further runs deepened
  it on 08-17; and the same thread produced a canonical Problem, a Bet with a
  complete experiment, and a working prototype that same day. The research came
  through an OpenAI agent on a GitHub connector and the build came from a
  coding agent — the loop is provider-agnostic in practice.
- **The learn join walked for the first time.** A live review of the
  evidence-directed prototype came back as a `session` handoff — five findings,
  a note, three raised questions — and the bet grew a review prompt the same
  day. The refusal machinery held throughout: the rebuilt guided-first-caseload
  prototype honestly sits at `concept` awaiting a person's check.
- **The gate had no throughput, and the loop routed around it.** No decision
  file has been written since 08-14. The queue counts 34 findings and
  candidates waiting on a person across 7 runs, plus 24 undispositioned notes —
  and meanwhile the thread's new Problems, Claim, and Bet were authored with
  `provenance: author` and no `researchTrace`, because the runs that motivated
  them had no decisions to cite. Every record is individually honest, and the
  lineage a reader would want — this research led to this problem led to this
  bet — exists nowhere the projection can see.

That last finding is the one this plan is built around. The loop's speed is no
longer the constraint; decision throughput is, and when it stalls the system
does not stop — it quietly loses its provenance.

## The changes

### 1. Model the family side — lands with this plan

`family-demand` now has three steps — `seek-care`, `understand-care-need`,
`become-ready-to-match` — and the Family entity declares the matching states,
mirroring the clinician ladder from its side. `propose-match`'s family input is
finally produced by something, which closes the model's most-named gap, and
parent-side research has somewhere to land for the first time.

What follows from it: `define-family-patient-caregiver-authority` is already
queued at high priority and bites `family-demand` and `matching`. The loop's next full
cycle should run on the family side — research, problem, bet, prototype — both
because the model is thinnest there and because a second thread proves the
loop was not fitted to clinician supply.

### 2. Pay the decision debt, then retro-fit the traces

A person's work, in the conversational lane, with the agent presenting each
finding and recording what they say. Two passes:

- **Decide the 34.** The runs are read in one sitting each;
  [`research-workflow.md`](research-workflow.md#two-lanes-for-deciding) is the
  mechanics. Notes are dispositioned per run in one line.
- **Apply, and retro-fit.** Accepted findings get applied at `/review/apply`,
  and the clinician-selection records that already exist get the
  `researchTrace` entries the decisions now authorize. That is what makes the
  map's lineage auditable — a record page saying *this rests on that run,
  decided by this person* — which nothing can show today.

The standing rule that keeps the debt from re-accumulating: **a run is
unfinished until its decisions are recorded.** The conversation that produced
the research is the cheapest place to decide it, and ending that conversation
without the decision file is how 34 findings piled up.

*Tooling half landed on `main`, 2026-08-18.* `research:queue` now leads with a
single **next knowledge action** and pauses the invitation to research while
review, application, or synthesis is owed, grouping questions by the product
work they unblock. The queue can refuse to add to the pile; only a person can
shrink it, and the decision file count has not moved.

### 3. Draw the routes the model already has

The stage level got there first: the map-topology work on `main` added
`returns_to` to the relationship vocabulary — operating rework, drawn as a
loop, never ranked forward, deliberately distinct from `feedback_to` — plus
layer toggles and derived connection depth at stage boundaries. The contract
for it now lives in [`AGENTS.md`](../AGENTS.md#stage-topology-and-connection-depth).

*What remained, landing with this branch, is the step level.* The model's
step-scale non-linear paths live in `exceptions.route`, and every route
authored so far returns to `propose-match`: an expired proposal, a declined
match, a care relationship ending in rematch. None of that was validated,
classified, or drawn — `exceptions.route` never passed through `requireRef`,
had no row in the conformance registry, and derived no edge, so a typo'd
route validated green and an expanded stage showed a straight ladder the
model itself contradicts. This branch validates the reference, classifies it,
and derives a `return` edge drawn apart from the forward sequence.

The session findings say the same thing from the operator's side: the
reviewer could not tell what state each route hands off to, and the three
questions that session raised are about exactly these handoffs. When a person
queues them and they get answered, the routes they produce now land as drawn
structure, not prose.

### 4. Give the cross-cutting profile a home — after change 2

The clinician-quality reflection proposes an evidence profile that spans
supply, matching, care monitoring, and network operations — a thing that
belongs to no single stage. Staged and undecided, it can change nothing. Once
decided, the natural home is an Entity whose states thread through step inputs
and outputs, and the entities lens already draws exactly that kind of
cross-stage journey with no new machinery.

This is deliberately sequenced after change 2: composing a canonical record
from an undecided reflection is the route-around this plan exists to end.

### 5. Make sessions visible to the build queue — lands with this branch

`prototype:queue` read only bets, so it said "put it in front of
participants" about a prototype whose first session was already recorded in
staging. A small join through `lib/research/glance.ts` — which already
swallows staging errors so a malformed handoff cannot break a surface — now
lets the queue say *a session is recorded and its findings are undecided*
instead of asking for one that already happened.

### 6. Iterate the evidence-directed prototype — after its session is decided

The session's direction is concrete: reduce simultaneous content, place the
review queue inside the canonical screen-to-select workflow, make each route's
destination explicit, and deepen the human-backed evidence request before
spending anything on override mechanics. That is the next build — but it waits
for the session run's findings to be decided, because building against
undecided observations is the same route-around as change 4, one join earlier.

## What self-running means here

Not autonomy over belief — [`AGENTS.md`](../AGENTS.md) is unambiguous that no
agent changes what the model claims. Self-running means: every join of the
loop is startable by whatever agent arrives, from live state, with the person's
time spent only where judgement lives — deciding, naming, stamping, and
refining. The queues and lanes now exist for all of it. The one dial that sets
the loop's speed is how quickly decisions get recorded, which is exactly where
a person's time is supposed to go.
