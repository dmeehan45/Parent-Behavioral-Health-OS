# Goal

Complete a deeper adversarial pass on clinician readiness, patient matching, and the first care transition, producing decision-ready journey, measurement, misuse, evidence, candidate-Problem, and prototype analyses without promoting unreviewed research into canonical `content/`.

# Acceptance criteria

- The pass reconstructs onboarding/readiness and matching from family, patient, clinician, and platform decisions rather than only the existing Stage sequence.
- Readiness dimensions, expiring conditions, observable defects, counter-hypotheses, and attribution limits are explicit.
- Matching distinguishes eligibility, recommendation, mutual review, acceptance, initiation, constrained supply, and recovery outcomes.
- Every proposed measure states its denominator, horizon, missingness, confounders, balancing risks, permitted use, and prohibited inference.
- Misuse and gaming risks are assessed before automation or clinician-level feedback is recommended.
- Public research enters as validated research handoffs and generated review packets; it does not directly change `content/`.
- Candidate Problems are ranked by harm, breadth, uncertainty, prototypeability, and learning value; prototype recommendations remain proposals pending reviewer decisions.
- Work requiring lived experience, clinical/safety expertise, privacy review, or operational data is clearly assigned rather than guessed.
- Relevant repository validation passes, changes are committed on a new branch, and a pull request is created if tooling permits.

# Tasks

- [x] Create a new branch and inventory the current onboarding, matching, initiation, Claims, Metrics, and queued research contracts.
- [ ] Conduct bounded public research on clinician readiness/onboarding quality and matching/access/measurement quality (blocked: configured web search returned HTTP 401 and direct NCBI access returned proxy HTTP 403).
- [ ] Write separate public-research handoffs and review packets (not produced because source retrieval was blocked; inventing sources would violate the intake contract).
- [x] Produce the deep-dive decision packet: actor journeys, readiness model, matching failure/recovery model, metric protocol, and misuse register.
- [x] Rank repository-grounded candidate Problems and recommend the smallest high-learning prototype targets without adding canonical Problems or Bets; source-backed ranking remains pending public research and direct evidence.
- [x] Record the remaining direct-research, qualified-review, operational-data, and accountable-reviewer decisions.
- [x] Run repository validation and safety checks, update this plan, commit, and attempt pull-request creation (the checkout has no remote and no `make_pr` tool is exposed).

# Relevant contracts

- `content/` remains unchanged by this research pass. Any later canonical claim, Problem, Metric, or topology change requires an accepted, current decision and `researchTrace` where applicable.
- Public sources can sharpen generalized hypotheses but cannot substitute for parent lived experience, clinician workflow observation, clinical judgment, legal/privacy advice, or company-specific operating evidence.
- No PHI, private company material, raw transcript, production permissions, matching algorithm, or clinical protocol is introduced.
- This branch is based on `codex/apply-adversarial-decisions` because the prior decision implementation is not present on the repository's only other local base branch, `work`; any pull request is therefore explicitly stacked.

# Validation

- Run `npm run generate:research-review`, `npm run validate:research`, `npm run test:research`, `npm run scan:safety`, `npm run validate:content`, `npm run lint`, `npm run lint:design`, `npm run typecheck`, and `git diff --check`.

# Risks / decisions

- Quantitative thresholds and causal attribution will remain undefined without operational data and predeclared analysis plans.
- Family/patient authority, safety escalation, and permitted information sharing require qualified review and cannot be resolved by public research alone.
- Prototype ranking is advisory until the accountable reviewer accepts the relevant research findings and Problem framing.
- Public-source retrieval is an environment blocker rather than evidence that no research exists. The packet records repository observations, inferences, and hypotheses only; the two existing high-priority public-research questions remain open.
