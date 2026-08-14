# Goal

Build on the completed D1-D8 system-boundary, metric-accountability, and lifecycle work with a deeper adversarial pass on clinician readiness, patient matching, and the first care transition. Produce decision-ready journey, measurement, misuse, evidence, candidate-Problem, and prototype analyses without promoting unreviewed research into canonical `content/`.

# Acceptance criteria

- The pass reconstructs onboarding/readiness and matching from family, patient, clinician, and platform decisions rather than only the existing Stage sequence.
- Readiness dimensions, expiring conditions, observable defects, counter-hypotheses, and attribution limits are explicit.
- Matching distinguishes eligibility, recommendation, mutual review, acceptance, initiation, constrained supply, and recovery outcomes.
- Every proposed measure states its denominator, horizon, missingness, confounders, balancing risks, permitted use, and prohibited inference.
- Misuse and gaming risks are assessed before automation or clinician-level feedback is recommended.
- Public research enters as validated research handoffs and generated review packets; it does not directly change `content/`.
- Candidate Problems are ranked by harm, breadth, uncertainty, prototypeability, and learning value; prototype recommendations remain proposals pending reviewer decisions.
- Work requiring lived experience, clinical/safety expertise, privacy review, or operational data is clearly assigned rather than guessed.
- The completed D1-D8 implementation remains intact: product boundary, actor-aware Metrics, separated onboarding/matching/initiation transitions, failure/recovery prompts, and open research questions.
- Relevant repository validation passes, changes are committed on a new branch, and a pull request is created if tooling permits.

# Tasks

- [x] Create a new branch and inventory the current onboarding, matching, initiation, Claims, Metrics, and queued research contracts.
- [x] Preserve the completed D1-D8 implementation that this deeper pass analyzes rather than duplicating its completed task list.
- [ ] Conduct bounded public research on clinician readiness/onboarding quality and matching/access/measurement quality (blocked: configured web search returned HTTP 401 and direct NCBI access returned proxy HTTP 403).
- [ ] Write separate public-research handoffs and review packets (not produced because source retrieval was blocked; inventing sources would violate the intake contract).
- [x] Produce the deep-dive decision packet: actor journeys, readiness model, matching failure/recovery model, metric protocol, and misuse register.
- [x] Rank repository-grounded candidate Problems and recommend the smallest high-learning prototype targets without adding canonical Problems or Bets; source-backed ranking remains pending public research and direct evidence.
- [x] Record the remaining direct-research, qualified-review, operational-data, and accountable-reviewer decisions.
- [x] Run repository validation and safety checks, resolve the `plan.md` merge conflict in favor of the current deeper pass while retaining its completed prerequisite, and update this branch.

# Relevant contracts

- `content/` remains unchanged by this research pass. Any later canonical claim, Problem, Metric, or topology change requires an accepted, current decision and `researchTrace` where applicable.
- Public sources can sharpen generalized hypotheses but cannot substitute for parent lived experience, clinician workflow observation, clinical judgment, legal/privacy advice, or company-specific operating evidence.
- No PHI, private company material, raw transcript, production permissions, matching algorithm, or clinical protocol is introduced.
- The D1-D8 implementation is the completed prerequisite for this pass. Its old execution checklist is intentionally not duplicated here; `plan.md` remains the current execution record rather than a cumulative changelog.

# Validation

- Run `npm run generate:research-review`, `npm run validate:research`, `npm run test:research`, `npm run scan:safety`, `npm run validate:content`, `npm run lint`, `npm run lint:design`, `npm run typecheck`, and `git diff --check`.

# Risks / decisions

- Quantitative thresholds and causal attribution will remain undefined without operational data and predeclared analysis plans.
- Family/patient authority, safety escalation, and permitted information sharing require qualified review and cannot be resolved by public research alone.
- Prototype ranking is advisory until the accountable reviewer accepts the relevant research findings and Problem framing.
- Public-source retrieval is an environment blocker rather than evidence that no research exists. The packet records repository observations, inferences, and hypotheses only; the two existing high-priority public-research questions remain open.
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
