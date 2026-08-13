# Parent Behavioral Health OS

An open, executable model of the operational machinery behind a best-in-class, AI-enabled, parent-focused behavioral-health practice platform.

## Why this exists

Many product artifacts separate the business model, process model, product strategy, and prototype. This project intentionally links them so we can understand:

```text
how the machine works
→ where it breaks
→ what we believe might improve it
→ what that improvement looks like as software
```

Repository content is canonical. The React Flow graphs are projections of that content—not a second source of truth.

## Core loop

```text
Map → Question → Bet → Prototype → Learn → Update Map
```

## Run locally

```bash
npm install
npm run validate:content
npm run dev
```

Open [http://localhost:3000/map](http://localhost:3000/map). Other checks are `npm run lint`, `npm run typecheck`, and `npm run build`.

## Repository model

- `content/` contains the canonical map, stages, steps, entities, claims, metrics, and bets.
- `lib/schemas/` contains permissive Zod contracts for progressive enrichment.
- `lib/content/` loads content and validates IDs and cross-references.
- `app/` and `components/` project the model into maps and detail pages.
- `app/prototypes/` contains small executable artifacts linked to Bets.
- `docs/` explains the model, authoring loop, and future semantic boundaries.

## What this is not

This is not a production EHR, a replica of a specific healthcare company, or a completed operating model. It includes no patient records, PHI, production matching, authentication, billing, clinical workflow, or autonomous agent execution.

## Open-source positioning

The reference model represents generalized, provisional thinking about how a parent-focused behavioral-health operating system might work. Do not represent private knowledge from any company as public factual documentation. Company research, if added later, should remain separate from this canonical generalized model.

See [the authoring guide](docs/authoring.md) to add system thinking without editing React code.
