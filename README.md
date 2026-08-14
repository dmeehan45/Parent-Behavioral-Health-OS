# Parent Behavioral Health OS

An open, executable model of the operational machinery behind a best-in-class, AI-enabled, parent-focused behavioral-health care-delivery operating system.

## Why this exists

Many product artifacts separate the business model, process model, product strategy, and prototype. This project intentionally links them so we can understand:

```text
how the machine works        Stage, Step
→ where it breaks            Problem
→ what we would do about it  Bet
→ what that looks like       Prototype
```

Each arrow is a link the model actually holds, not a narrative. A Problem names
the Stages and Steps it bites; a Bet names the one Problem it answers. Where a
Bet lands in the machine follows from its Problem, so nothing states the same
trouble twice, and a Problem with no Bet under it stays visible as exactly that.

Repository content is canonical. The React Flow graphs are projections of that content—not a second source of truth.

## System boundary

The model covers the **whole care-delivery operating system** that a practice-management platform could productize to make care higher quality, more accessible and affordable, better measured and improved over time, and more personalized. That includes the family and clinician experience, clinical care, and the surrounding platform work—such as clinician supply, onboarding, matching, coverage, and reliable operations—needed to deliver care.

The boundary is set by what can become a product behavior or a prototype that an end user can evaluate. The model may show human decisions and external dependencies needed to understand that behavior, but organizational redesign, staffing choices, and other company actions that cannot be demonstrated as a product solution are context rather than prototype scope. It is a generalized reference model, not a description of or comparison with any named company.

The map is live. Open it in a browser and leave it there: it polls a fingerprint of `content/`, so a push, a merge, or a local edit made through Claude Code, Codex, or any other tool wired to this repository appears on every open map within seconds, with the changed primitives highlighted. Nobody has to reload, and everybody is looking at the same picture.

## Core loop

```text
Map → Problem → Bet → Prototype → Learn → Update Map
```

## Run locally

```bash
npm install
npm run validate:content
npm run dev
```

Open [http://localhost:3000/map](http://localhost:3000/map). Other checks are `npm run lint`, `npm run typecheck`, and `npm run build`.

Optionally set `NEXT_PUBLIC_CONTENT_SOURCE_URL` to the repository's blob root — for example `https://github.com/<owner>/<repo>/blob/main` — and every primitive links to the canonical file it was projected from.

## Reading the map

`/map` is one canvas with four lenses over the same model:

| Lens | The question it answers |
| --- | --- |
| Operating flow | How does work move through the system, stage by stage? |
| Problems & solutions | Where does the machine break, what have we proposed about it, and what has been built? |
| Evidence | What do we believe, and what would we measure? |
| Entities | What does the system transform, and where? |

Progressive disclosure runs top to bottom. Zooming controls how much of each node is drawn. A stage expands **in place** to reveal its steps, so drilling into a process never costs you the surrounding system. Selecting anything opens a detail panel beside the canvas — a bottom sheet on a phone — and links inside that panel move within it, so you can follow a problem to the bet that answers it to the software that tests it without leaving the graph.

Every record reads in the same order: what it is, what it says, then where it came from. Provenance, freshness, coverage, and the source file sit in one block at the end rather than in front of the writing.

Press <kbd>⌘K</kbd> to search every primitive, including ones the current lens is not showing. The view state — lens, expanded stages, open primitive — lives in the URL, so any view is a link.

## Repository model

- `content/` contains the canonical map, stages, steps, entities, claims, metrics, problems, and bets.
- `lib/schemas/` contains permissive Zod contracts for progressive enrichment.
- `lib/content/` loads content and validates IDs and cross-references.
- `lib/model/` projects that content into the single typed graph the interface renders, and derives node positions from topology.
- `app/` and `components/` render that projection. They contain no model IDs, counts, or relationships.
- `app/prototypes/` contains small executable artifacts linked to Bets.
- `docs/` explains the model, authoring loop, and future semantic boundaries.

## What this is not

This is not a production EHR, a replica of a specific healthcare company, or a completed operating model. It includes no patient records, PHI, production matching, authentication, production billing or clinical workflow, or autonomous agent execution. It can model those domains semantically where they affect care delivery and prototypeable product behavior without implementing regulated production infrastructure.

## Open-source positioning

The reference model represents generalized, provisional thinking about how a parent-focused behavioral-health operating system might work. Do not represent private knowledge from any company as public factual documentation. Company research, if added later, should remain separate from this canonical generalized model.

## Contributing

See [the authoring guide](docs/authoring.md) to add system thinking without editing React code, and [CONTRIBUTING.md](CONTRIBUTING.md) for the process around model and software changes. [AGENTS.md](AGENTS.md) states the rules that keep the model canonical and the projection derived — it applies to human and AI contributors alike.

Every pull request runs content validation, lint, typecheck, and build.
