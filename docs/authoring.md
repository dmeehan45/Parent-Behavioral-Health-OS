# Authoring the operating model

Git is the authoring interface. Edit one small file, validate it, and open a pull request. Optional fields may be omitted: incompleteness is valid.

## Validate a change

```bash
npm run validate:content
npm run typecheck
```

Errors name the content file and invalid field. IDs use lowercase kebab case and must be unique.

## Frontmatter and body

Every content file has two parts: YAML frontmatter carrying the structured model,
and a Markdown body carrying prose.

Body prose is split into sections on top-level (`#`) headings, and the application
renders a fixed set of section names per primitive:

| Primitive | Headings the application renders |
| --- | --- |
| Stage | `# Current model`, `# Open questions` |
| Step | `# Current model`, `# Open questions` |
| Problem | `# What happens today`, `# Why it matters`, `# Open questions` |
| Bet | `# Bet`, `# Questions`, and the five experiment sections below |
| Entity, Claim, Metric | none — the body renders as a single block of prose |

**Section names are a contract, not a convention.** A heading outside this table
is prose that would never be displayed, so `validate:content` rejects it by name
rather than dropping it silently. `## Subheadings` are free-form and stay inside
their parent section.

All sections are optional. A Stage with no body at all is valid; a Stage whose
prose sits under `# How this works today` is not, because that writing would
disappear.

Items in `# Open questions` are counted and surfaced on the map, so write them as
a Markdown list (`-`, `*`, `+`, or numbered).

## Add a Stage

1. Create `content/stages/<id>.md` with `id` and `title` frontmatter.
2. Add the ID to `stages` in `content/map.yaml`. This is required — `map.yaml`
   owns top-level topology, and a Stage missing from it would never appear on
   the map, so validation rejects it.
3. Add constrained directed edges if known.

The new Stage appears on the map immediately. Its position is derived from the
edges you declare: stages are laid out left to right by how deep they sit in the
flow, and `feedback_to` edges are excluded from that calculation so feedback
loops do not distort the ordering. Nothing in `app/` or `components/` needs to
change.

## Add a Step

Create `content/steps/<id>.md` with `id`, `title`, and an existing `stage`. Add `next` references only when the sequence is known. Purpose, state references, roles, rules, exceptions, claims, and metrics are optional.

Before calling a Step understood, briefly test the applicable failure cases: rejection, delay, disagreement, incorrect information, deterioration, dropout, re-entry, and closure. Record an `exception` only when the route or outcome is actually known; otherwise put the uncertainty in `# Open questions`. A perfectly linear happy path is not the default, but invented recovery detail is not completeness.

A Step does not list the Bets aimed at it. Problems name the Steps they bite,
and Bets name their Problem, so the link already exists in one direction and
does not need repeating in the other.

## Add an Entity

Create `content/entities/<id>.md` with `id` and `title`. Use it from Step inputs and outputs as `{ entity, state }`; do not create detailed clinical-record schemas.

Optionally declare the states the entity can occupy:

```yaml
states:
  - selected
  - match-ready
  - active
```

Declaring `states` opts the entity into validation: every `{ entity, state }`
reference in a Step must then name a declared state. An entity that omits
`states` stays unconstrained, so a state model that is not yet understood does
not have to be invented. Adding a new state is a deliberate edit to the entity
file rather than a new string typed into a Step.

## Add a Claim

Create `content/claims/<id>.md`. Choose a constrained `kind`, `confidence`, and `status`, then target existing Stage or Step IDs. Mark tentative material `authority: proposed`.

## Add a Metric

Create `content/metrics/<id>.md` with `id` and `title`. `dataStatus` explicitly distinguishes an important metric from one currently measured. Also name:

- `perspectives`: Entity actors for whom the metric is `primary`, a `balancing` safeguard, or an `operator` measure;
- `decisionOwner`: the Entity actor accountable for interpreting it; and
- `decision`: the specific choice it can inform.

These fields prevent a platform efficiency measure from being presented as success for a family or clinician. Before treating a consequential metric as actionable, keep its denominator or unit, time horizon, missingness, confounders, balancing risks, and uncertainty visible in its definition or as open research. Do not invent those details merely to fill coverage.

## Name a Problem

A Problem is somewhere the machine is thought to break. Naming one is a complete
contribution: it does not need a proposed answer, and a Problem nobody has
answered yet is the most useful thing on the map.

1. Create `content/problems/<id>.md` with `id`, `title`, and `targets`.
2. `targets` are existing Stage or Step IDs — wherever the problem actually
   bites. At least one is required, because a problem that bites nowhere is not
   a problem with this system.
3. Optionally write `# What happens today`, `# Why it matters`, and
   `# Open questions`.
4. Leave `status` alone unless you know better; it defaults to `open`.

Write the title as the trouble, not the fix. *"A clinician can finish onboarding
and still have no work"* is a problem. *"Add caseload automation"* is a bet
wearing a problem's clothes.

## Add a Bet in under five minutes

A Bet is a proposed answer to one Problem, so the Problem comes first.

1. Copy `content/bets/guided-first-caseload.md` to a kebab-case filename.
2. Change `id` and `title`, and set `problem` to an existing Problem ID.
3. Write `# Bet`, and optionally `# Questions`, in the Markdown body. Do not
   restate the problem — it is already written down in the Problem file, and two
   copies would drift apart.
4. Link existing `claims` and `metrics` if appropriate.
5. Run `npm run validate:content`. The map, the Problem, and every Stage and Step
   the Problem targets pick the new Bet up automatically — no React edit is
   required.

Where the Bet lands in the machine is derived from its Problem's `targets`, so a
Bet never declares targets of its own.

## Shape the experiment before building anything

A Bet says what we would try. Five further optional sections say what *trying it*
would settle, and they are what somebody accountable approves before a prototype
is built:

```markdown
# Learning decision

Whether clinicians want a caseload assembled for them at all, or only shown
what is available.

# Scope

# Assumptions

# Signals and safeguards

# Fidelity
```

Optionally add `participant: <entity-id>` to name the actor the experiment
studies; `# Scope` still says which moment and what path.

All five are optional, and a Bet is allowed to exist long before an experiment
does. But `npm run prototype:brief` will not clear a build without them, and a
Bet with a prototype underway and no learning decision says so on its own page.
That is deliberate: a prototype tests a decision, and if no decision changes,
there is no reason to build it yet.

Do not restate the problem or the intervention in these sections. They describe
the *test*, which is the one thing no other primitive holds.

## Link a prototype

A prototype is an executable question, not an automatic next step for every Bet.
Before building, compose the brief:

```bash
npm run prototype:brief -- <bet-id>
```

It gathers the Bet, its Problem, the flow it lands on, the evidence and its
weaknesses, the honest unknowns, and this repository's build rules into one
piece you can hand to whoever is building — human or agent — alongside
`AGENTS.md`. It refuses to clear a build whose experiment has not been shaped.
[`docs/prototype-workflow.md`](prototype-workflow.md) is the full workflow.

Add a route under `app/prototypes/<id>/page.tsx` that renders only the interaction, wrapped in `PrototypeShell`:

```tsx
export default function Page() {
  return (
    <PrototypeShell route="/prototypes/<id>">
      <YourInteraction />
    </PrototypeShell>
  );
}
```

Then add `prototype: { status: working, route: /prototypes/<id> }` to the Bet. The
shell finds the Bet that points at the route and derives the title, problem,
targets, metrics, and both return paths from it, so the prototype page never
restates anything the model already knows. Use synthetic data only and keep the
prototype intentionally small.

`route` is validated against the filesystem: the Bet page and the map both render
a prominent launch control from it, so a route with no implementation would send
a reader to a 404. Validation also checks the route actually goes through
`PrototypeShell`, because a page rendering without it silently drops the bet, the
problem and the provenance. A Bet without a prototype omits `route` entirely — a
Bet is allowed to exist long before any software does.

Once the prototype is built and you have checked it against the five experiment
sections, record which experiment that was:

```yaml
prototype:
  status: working
  route: /prototypes/<id>
  builtAgainst: deea66-943d88-f1a58e-127106-acd1c7   # printed by prototype:brief
```

Refine any of those sections afterwards and validation says which one moved, so
software cannot go on quietly testing a question the bet no longer asks. Restamp
if it still tests the refined section; set `status: concept` if it does not.

## What you never have to edit

Adding any primitive is a content-only change. A new stage, step, entity, claim,
metric, problem, or bet appears on the map, in search, in its lens, in the detail
panel, and on its own page without a single line of React. If something you added does
not show up, the projection in `lib/model/graph.ts` is missing a relationship —
fix it there, not in a component.

Anyone with the map open sees your change within seconds of it landing, without
reloading.

## Apply accepted research

Research handoffs are staging material and never enter this directory directly.
After the intake review is complete, create a fresh model-change branch from
`main`, apply only accepted decisions, and add traceability to each affected
canonical record:

```yaml
researchTrace:
  - run: example-public-research
    decision: decide-example-public-research-finding-review-first
    finding: finding-review-first
    stance: contextualizes
    sources: [source-project-readme]
```

The IDs must resolve to a current handoff, its finding and sources, and an
`accept` or `accept-with-edits` decision over the current handoff hash. Content
validation rejects missing, rejected, deferred, or stale decisions. The
projection derives a readable evidence reference from this metadata; do not
duplicate research prose in a component. Rejected, deferred, superseded, and
needs-research decisions remain in `research/` as history.
