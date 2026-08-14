# Goal

Apply the accountable reviewer's D1-D8 decisions from the 2026-08-14 adversarial review so the repository explicitly models a productizable care-delivery operating system, makes metric beneficiaries visible, separates onboarding from matching and care initiation, and records the major care, quality, authority, evidence, and recovery questions that remain.

# Acceptance criteria

- The product boundary distinguishes prototypeable platform capabilities from care delivery and non-prototypeable organizational context without naming a specific company.
- Metrics identify whose outcome they represent, including the practice-management platform as an actor, and the projection makes that context visible.
- A first-principles care lifecycle contrast identifies missing domains and nonlinear paths without presenting unresearched detail as settled truth.
- Administrative readiness ends at match readiness; matching and care initiation own distinct proposed transitions and do not collapse an accepted match into ongoing care.
- Authoring and research guidance prompts for failure/recovery, metric interpretation, and proportionate constructive challenge while preserving human promotion.
- Unresolved family/authority and quality questions—especially for clinician onboarding and patient matching—are explicitly logged.
- All nine repository checks pass or any genuine environment limitation is documented.
- Changes are committed on a feature branch and a pull request is created.

# Tasks

- [x] Create a feature branch from the repository's current base revision and document the accepted system boundary (the checkout has no local `main` ref; `work` is the only base branch).
- [x] Extend the Metric contract/projection with actor and decision context; enrich current metrics without inventing results.
- [x] Add the independent care-delivery lifecycle contrast and log unresolved family, authority, quality, and measurement questions.
- [x] Separate onboarding readiness, matching, and care-initiation transitions in canonical proposed content, including nonlinear recovery paths where they are known.
- [x] Add lightweight failure/recovery and proportionate evidence prompts to authoring/research workflows.
- [x] Update the adversarial review decision queue with dispositions and remaining accountable work.
- [x] Run all nine repository checks and fix failures where possible.
- [x] Update this plan, commit the coherent change, and create a pull request.

# Relevant contracts

- `content/` remains canonical for model primitives; new system thinking must project through `lib/model/` rather than components.
- Metric actor context is descriptive accountability, not access control or a production analytics schema.
- New lifecycle detail remains `proposed`; open questions remain visibly unanswered rather than being filled with plausible clinical or legal detail.
- Research may be passed through ordinary GitHub-connected chats, but only a named person's accepted decision can authorize a research-derived canonical claim.

# Validation

- Run `npm run validate:content`, `npm run validate:research`, `npm run test:research`, `npm run scan:safety`, `npm run lint`, `npm run lint:design`, `npm run typecheck`, `npm run build`, and `npm run test:responsive`.

# Risks / decisions

- Legal/privacy, clinical safety, family authority, causal attribution, and detailed quality definitions require qualified or lived-experience input and will remain open questions.
- The model should be comprehensive enough to expose prototype opportunities, but not imply that organizational change or non-demonstrable company actions are product capabilities.
- D5 and D6 cannot be resolved in one pass; this change must improve the question structure without claiming premature answers.
- `npm run build` and `npm run test:responsive` reach the production build but cannot retrieve the vendored Google-font build resources in this environment; the same network restriction blocks Playwright's Chromium download and therefore the requested screenshot. Development projection was verified through `/api/model`.
