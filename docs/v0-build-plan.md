# Parent Behavioral Health OS V0 execution plan

> **Historical record, closed out.** This is the plan the V0 build was executed
> against, kept because it documents the contracts the initial implementation
> was aiming at. It is not a description of the system as it stands — see
> [`system-model.md`](system-model.md) for that, and
> [`authoring.md`](authoring.md) for how to contribute.
>
> Its status lines are settled below, and **[What changed after
> V0](#what-changed-after-v0)** records where the shipped system has since moved
> away from this plan. Nothing else here is maintained: read the contracts as
> what was aimed at in the first build, not as current fact.

## Executive overview

Build a Git-native, open-source system-map explorer for product and care-operations thinkers. Repository Markdown and YAML files will remain canonical; the Next.js application will validate and project that content into a restrained React Flow map, drill-down pages, linked bets, and one synthetic guided-caseload prototype.

We will prove the V0 by installing dependencies, validating all content references, running lint/type/build checks, and manually exercising the navigation loop: `/map` → clinician onboarding stage → linked step → Guided First Caseload bet → working prototype.

## Contracts first

### Content contracts

- Stable IDs use lowercase kebab case.
- Markdown primitives contain YAML frontmatter plus optional Markdown body sections.
- Required fields stay minimal: Stage (`id`, `title`), Step (`id`, `title`, `stage`), Entity (`id`, `title`), Claim (`id`, `statement`, `kind`, `confidence`, `targets`, `status`), Metric (`id`, `title`), Bet (`id`, `title`, `targets`).
- `content/map.yaml` owns top-level stage membership and constrained directed relationships.
- Cross-reference validation checks unique IDs and references across stages, steps, entities, claims, metrics, and bets.
- Content loaders return typed records with parsed Markdown sections and file paths for actionable errors.

### UI contracts

- `SystemMap` receives validated stages, topology edges, and derived counts; selection opens an inspector and exploration uses routes.
- `StageMap` receives ordered stage steps and displays directed step edges from content order/relationships.
- Stage and Step nodes show orientation metadata only, never the full semantic model.
- Detail routes hide optional sections when data is absent.
- Bet pages resolve target, claim, metric, and prototype links from content, not component constants.
- Prototype UI uses synthetic, local-only sample data and holds no patient or production state.

### Stub file map

- Framework: `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`, `app/layout.tsx`, `app/globals.css`
- Routes: `app/page.tsx`, `app/map/page.tsx`, `app/stages/[stageId]/page.tsx`, `app/steps/[stepId]/page.tsx`, `app/bets/[betId]/page.tsx`, `app/prototypes/guided-first-caseload/page.tsx`
- UI: `components/system-map/*`, `components/stage-map/*`, `components/stage-node/*`, `components/step-node/*`, `components/bet-card/*`, `components/metric-chip/*`, `components/inspector/*`, `components/prototype-link/*`
- Schemas/loaders: `lib/schemas/*`, `lib/content/*`
- Canonical knowledge: `content/map.yaml`, `content/{stages,steps,entities,claims,metrics,bets}/*`
- Documentation: `README.md`, `docs/system-model.md`, `docs/authoring.md`, `docs/interaction-contract.md`, `docs/future-agent-model.md`

## Workstreams

### 1. Platform foundation

**Ownership:** framework configuration, global shell, package scripts.

**Inputs:** technology choices in the build brief.

**Outputs:** runnable Next.js/TypeScript/Tailwind application with React Flow, frontmatter parsing, YAML, Zod, and linting.

**Tasks:**

1. Add minimal dependency and framework configuration.
2. Add global layout, navigation, typography, and restrained design tokens.
3. Add scripts for development, linting, type checking, content validation, and production build.

**Success criteria:** `npm install`, lint, typecheck, and build complete; the home page links to `/map`.

**Edge cases:** server-only filesystem loaders must not enter client bundles; no environment variables or external services.

### 2. Schemas and content loading

**Ownership:** `lib/schemas/**`, `lib/content/**`, validation script.

**Inputs:** content contracts above.

**Outputs:** permissive Zod schemas, typed Markdown/YAML loaders, repository-wide semantic validation, derived relationship helpers.

**Tasks:**

1. Model provenance, authority, entity state references, rules, exceptions, graph relationships, and optional fields.
2. Parse frontmatter and Markdown sections with file-aware Zod errors.
3. Validate uniqueness and every referenced ID.
4. Derive target counts and related records from canonical files.

**Success criteria:** valid seed content loads; an intentionally invalid fixture/temporary mutation fails with file, field, and expected value details.

**Edge cases:** absent optional arrays, empty Markdown bodies, a target that may be either stage or step, duplicate IDs.

### 3. Canonical seed model

**Ownership:** `content/**`.

**Inputs:** schemas and provisional operating model in the brief.

**Outputs:** eight stages, non-linear topology, seven onboarding steps, lightweight entities, one claim, three metrics, and Guided First Caseload bet.

**Tasks:**

1. Add stage Markdown with concise definitions and provisional status.
2. Add onboarding step state transformations and explicit directed sequence.
3. Add stable entity references.
4. Add required claim, metrics, and bet with provenance.

**Success criteria:** all content validates and changing a content file changes its rendered projection without component edits.

**Edge cases:** proposed material must not read as policy; all examples remain generalized and synthetic.

### 4. Map and detail experience

**Ownership:** map/stage/step/bet routes and reusable visualization/detail components.

**Inputs:** validated loader results and UI contracts.

**Outputs:** top-level React Flow map with filters and inspector, stage step graph, progressive Step detail, Bet detail and bidirectional navigation.

**Tasks:**

1. Render a compact non-linear stage graph from `map.yaml`.
2. Derive counts for steps, claims, questions, bets, and working prototypes.
3. Implement selection inspector, double-click navigation, and accessible Explore links.
4. Render internal onboarding process and progressive detail sections.
5. Resolve and display cross-linked bets, claims, metrics, and targets.

**Success criteria:** all four map filters work and the full map-to-bet navigation path is keyboard and pointer accessible.

**Edge cases:** filtered edges with hidden endpoints; nonexistent dynamic IDs return 404; empty optional sections remain hidden.

### 5. Guided First Caseload prototype

**Ownership:** prototype route and its client interaction component.

**Inputs:** Guided First Caseload bet contract.

**Outputs:** synthetic clinician context, suggested family cards, selection/review interaction, success metric context, and links back to the bet/targets.

**Tasks:**

1. Present Dr. Maya Chen and synthetic fit/capacity details.
2. Allow users to review/select suggested initial matches locally.
3. Keep bet, target, and intended metric context visible.

**Success criteria:** interaction works without a backend and refresh safely resets synthetic state.

**Edge cases:** no selection and multiple selections are clearly represented; no data is persisted or transmitted.

### 6. Documentation and contributor loop

**Ownership:** `README.md`, `docs/**`.

**Inputs:** implemented content and application contracts.

**Outputs:** project positioning, system model, under-five-minute Bet authoring path, future agent context/action separation, and proposal-oriented interaction contract.

**Tasks:**

1. Explain mission, exclusions, core loop, setup, and open-source positioning.
2. Document each primitive authoring flow and validation.
3. Document future semantic reads/writes and human-review trust model without implementing agents.

**Success criteria:** a contributor can add a Bet and validate it without editing React code.

**Edge cases:** documentation must not imply production healthcare readiness or company-specific knowledge.

## Integration plan

1. Establish schemas and UI props before feature implementation.
2. Load all UI data through one validated content repository boundary.
3. Connect route references using stable IDs and verify forward/back navigation.
4. Run content validation, lint, typecheck, build, and a local browser smoke test.
5. Capture screenshots of the perceptible web application at the map and prototype surfaces.
6. Review the final diff for secrets, production-healthcare scope creep, and untracked content state.

## Acceptance checklist

- [x] Feature branch is not `main` and repository instructions have been followed.
- [x] Next.js application installs and runs with the requested technology stack.
- [x] All canonical knowledge lives under `content/`, not React components.
- [x] Zod validates schemas, unique IDs, and cross-references with actionable file errors.
- [x] Eight-stage non-linear `/map` renders from `content/map.yaml`.
- [x] Derived counts and all four lightweight filters work.
- [x] Stage inspector, double-click, and explicit Explore interactions work.
- [x] Clinician Onboarding renders seven linked Steps.
- [x] Step pages progressively disclose only populated semantic sections.
- [x] Claims, metrics, and bets resolve across stages and steps.
- [x] Guided First Caseload Bet links to a working synthetic prototype.
- [x] Complete map → stage → step → bet → prototype loop works in both directions.
- [x] README and all requested docs explain authoring and future-agent boundaries.
- [x] No database, auth, PHI, EHR, agent, CMS, graph database, or external service is introduced.
- [x] Lint, typecheck, content validation, and production build pass.
- [x] Browser route smoke test confirms the main UI surfaces.
- [x] Changes are committed and a pull request is created without merging.
- [x] Screenshot capture: unavailable to the V0 build, which had no browser in
      its environment. Later work runs Chromium through Playwright and verifies
      surfaces visually, so this constraint no longer applies.

## Risks and mitigations

- **Build-tooling approval:** this greenfield build requires new package/framework configuration. Pause after this plan until the accountable reviewer explicitly approves that required stop point.
- **Schema overreach:** keep only identity fields required where possible and validate references separately.
- **Client/server boundary:** isolate filesystem access in server-only modules and pass serializable graph data to client components.
- **Visual overflow:** use a fixed, compact layout sized for a laptop and fit-view controls rather than a sprawling editable canvas.
- **Healthcare misinterpretation:** label the content provisional, use synthetic examples, and state explicitly that this is not production care infrastructure.
- **Dependency churn:** use the smallest set required by the specified stack and commit the lockfile once.

## Final status

- [x] Inspected repository contents, Git branch, and scoped instructions.
- [x] Defined contracts, workstreams, integration, acceptance checks, and risks.
- [x] Build-tooling/configuration changes were explicitly approved by the reviewer.
- [x] Implementation, content validation, lint, typecheck, production build, and route smoke testing are complete.
- [x] Committed, pushed, and delivered as a pull request. V0 is merged; this plan is closed.

## What changed after V0

The shipped system has moved past this plan in four ways. They are recorded here
so nothing above is mistaken for current fact.

**Problem became a primitive.** V0 let a Bet attach straight to a Stage, with the
problem written as prose inside the Bet. The chain is now
`Stage or Step → Problem → Bet → Prototype`. A Problem declares the stages and
steps it bites; a Bet declares the one Problem it answers and nothing else.
Required fields changed accordingly — Bet is now (`id`, `title`, `problem`), and
Problem (`id`, `title`, `targets`) joined the list. `bets` was removed from Step,
and `# Problem` from the Bet body, both being second statements of a link that
already exists in one direction.

**One projection replaced per-surface data plumbing.** The "UI contracts" above
describe components receiving validated content directly. Everything now goes
through `projectModel()` in `lib/model/graph.ts`, which turns `content/` into a
single typed graph — nodes, edges, derived signals, detail blocks, coverage, and
a per-node content hash. Components read that shape and never reach back into
content. The stub file map is obsolete: the component tree is
`components/map/*`, `components/model/*`, and `components/prototype/*`, and node
positions are derived from topology in `lib/model/layout.ts` rather than stored.

**Filters became lenses, and the map went live.** V0 planned four filters over one
static graph. There are four *lenses*, each re-projecting the same model, with
view state in the URL so any view is a link. The map polls a fingerprint of
`content/` and redraws within seconds of a change landing, so model-driven routes
are `force-dynamic` rather than prerendered.

**Reading order was inverted.** Records used to open with coverage, freshness, and
counts. Every surface now reads: what this is, what it says, where it came from.

Everything V0 ruled out — database, auth, CMS, graph database, agent framework,
PHI — is still ruled out.
