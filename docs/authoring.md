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
| Bet | `# Problem`, `# Bet`, `# Questions` |
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

Create `content/steps/<id>.md` with `id`, `title`, and an existing `stage`. Add `next` references only when the sequence is known. Purpose, state references, roles, rules, exceptions, claims, metrics, and bets are optional.

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

Create `content/metrics/<id>.md` with `id` and `title`. `dataStatus` explicitly distinguishes an important metric from one currently measured.

## Add a Bet in under five minutes

1. Copy `content/bets/guided-first-caseload.md` to a kebab-case filename.
2. Change `id`, `title`, and `targets`; all targets must already exist.
3. Write `# Problem`, `# Bet`, and optionally `# Questions` in the Markdown body.
4. Link existing `claims` and `metrics` if appropriate.
5. Run `npm run validate:content`. The map and target pages derive the new Bet automatically—no React edit is required.

## Link a prototype

Add a route implementation under `app/prototypes/<id>/page.tsx`, then add `prototype: { status: working, route: /prototypes/<id> }` to the Bet. Use synthetic data only and keep the prototype intentionally small.

`route` is validated against the filesystem: the Bet page renders a prominent
launch control from it, so a route with no implementation would send a reader to
a 404. A Bet without a prototype omits `route` entirely — a Bet is allowed to
exist long before any software does.
