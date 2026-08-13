# Authoring the operating model

Git is the authoring interface. Edit one small file, validate it, and open a pull request. Optional fields may be omitted: incompleteness is valid.

## Validate a change

```bash
npm run validate:content
npm run typecheck
```

Errors name the content file and invalid field. IDs use lowercase kebab case and must be unique.

## Add a Stage

1. Create `content/stages/<id>.md` with `id` and `title` frontmatter.
2. Add the ID to `stages` in `content/map.yaml`.
3. Add constrained directed edges if known.

## Add a Step

Create `content/steps/<id>.md` with `id`, `title`, and an existing `stage`. Add `next` references only when the sequence is known. Purpose, state references, roles, rules, exceptions, claims, metrics, and bets are optional.

## Add an Entity

Create `content/entities/<id>.md` with `id` and `title`. Use it from Step inputs and outputs as `{ entity, state }`; do not create detailed clinical-record schemas.

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
