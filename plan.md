# Goal

Define a repeatable, human-accountable workflow for turning one canonical Bet into a small prototype that supports self-directed research and discovery without confusing a prototype with production software or allowing an agent to invent canonical claims.

# Acceptance criteria

- The workflow names the inputs inherited from the Problem, Bet, targeted system context, evidence, metrics, and repository design/build rules.
- It separates facts, assumptions, open questions, and prototype decisions, and says when missing information should stop or narrow the build.
- It defines the user checkpoints needed to refine scope and consequential decisions without turning every implementation detail into an approval request.
- It describes a thin end-to-end user flow, synthetic-data and safety boundaries, learning instrumentation, review, and the path from learning back to research or canonical content.
- It distinguishes work an agent may perform from decisions and promotions that remain human-accountable.
- Existing authoring and repository orientation docs point contributors to the workflow.
- Relevant repository checks pass, changes are committed on a feature branch, and a pull request is created.

# Tasks

- [x] Create a feature branch from the current merged base.
- [x] Write the Bet-to-prototype workflow and its decision gates.
- [x] Link the workflow from the repository and authoring guidance.
- [x] Review the guidance against the current Bet, prototype shell, research workflow, and system boundaries.
- [x] Run relevant validation and documentation checks. All non-build checks pass; build and responsive remain limited by blocked Google-font retrieval.
- [x] Update this plan and commit the change. Pull-request creation was attempted but GitHub CLI has no authentication in this environment.
- [x] Rebase onto current `origin/main` and align the workflow with the new record-page open ends and `/review/apply` learning path.

# Relevant contracts

- `content/` remains canonical; a prototype consumes model context but does not restate or silently amend it.
- A Bet answers one Problem, and its system targets remain derived from that Problem.
- Prototype routes use `PrototypeShell`, synthetic data, and no production integrations, PHI, authentication, or autonomous clinical/operational action.
- Agent-produced research stays under `research/`; only a named person's accepted decision may authorize research-derived changes to canonical content.

# Validation

- Run the documentation-relevant content, research, safety, lint, design-lint, and type checks.
- Inspect links and the final diff for consistency with the existing model and research contracts.

# Risks / decisions

- The workflow must enable self-directed progress without letting automation decide the purpose, safety boundary, evidence interpretation, or canonical promotion of a prototype.
- Not every Bet is ready to prototype; an explicit narrow/defer outcome is necessary to avoid filling missing knowledge with plausible product behavior.
