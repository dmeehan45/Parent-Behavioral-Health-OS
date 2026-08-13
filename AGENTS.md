# Working in this repository

This repository is an executable model of how a parent-focused behavioral-health
practice platform operates as a business and care system. It is not an EHR and
is not a description of any specific company.

Read `README.md` for the premise and `docs/system-model.md` for the primitives
before changing anything.

## The one rule that matters most

**`content/` is canonical. The application is a projection of it.**

Stages, steps, entities, claims, metrics, and bets live in `content/` as Markdown
with YAML frontmatter. The React Flow graphs render that content; they are not a
second source of truth.

- Never hardcode a stage, step, claim, metric, or bet into a React component.
- Never encode counts, positions, or relationships in application code that could
  be derived from `content/`.
- Adding new system thinking must not require editing `app/` or `components/`.

If you find yourself adding a literal ID or a literal count to a component, the
model is missing a field. Add the field instead.

## Incompleteness is valid

The schemas are deliberately permissive. Only `id` and `title` are required on
most primitives (`stage` is also required on a Step). Do not fill in
`entryConditions`, `rules`, `metrics`, or `exceptions` with plausible-sounding
filler to make a file look complete. An empty field is honest; invented content
is not, and this artifact is meant to be reasoned against later.

Equally: do not restate `purpose` verbatim as `activity`. If the distinction
isn't known yet, leave `activity` out.

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
npm run lint
npm run typecheck
npm run build
```

CI runs all four. Validation failures name the offending file and field.

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
