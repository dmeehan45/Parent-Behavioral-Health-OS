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
