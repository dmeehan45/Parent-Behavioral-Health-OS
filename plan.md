# Goal

Produce a repository-grounded adversarial review of the current parent-focused behavioral-health system map that challenges its scope, topology, mechanisms, evidence, metrics, and missing perspectives without prematurely changing canonical `content/`.

# Acceptance criteria

- The review distinguishes repository observations, reviewer inferences, externally sourced evidence, and decisions that remain with the accountable reviewer.
- Every current Stage and top-level edge is assessed, including its carrier, plausible mechanism, counterexample, evidence status, and provisional verdict.
- Parent, clinician, clinical-safety, family-systems, operations, equity, privacy/records, economics, evidence-methods, product-boundary, failure-mode, and first-principles perspectives are represented.
- Important Step handoffs, entity lifecycles, explicit Claims, implied assumptions, and Metrics are challenged.
- The output identifies foundational gaps and misshapen boundaries before proposing detailed enrichment.
- Findings are prioritized into a decision queue with falsification or research needs; no unreviewed conclusion mutates canonical `content/`.
- Relevant repository validation passes, changes are committed on the current feature branch, and a pull request is created.

# Tasks

- [x] Inventory the canonical map quantitatively and inspect all Stage, Step, Entity, Claim, Metric, Problem, and Bet records.
- [x] Establish review method, evidence labels, and limitations of simulated perspectives.
- [x] Conduct first-principles and product-boundary review.
- [x] Conduct perspective passes and synthesize missing workflows, actors, failure paths, and equity/safety concerns.
- [x] Audit every Stage and top-level edge, then audit material Step handoffs and entity state transformations.
- [x] Audit explicit and implicit claims plus metrics for evidence, validity, incentives, and gaming risks.
- [x] Produce a prioritized decision queue and recommended research sequence in a committed review artifact.
- [x] Validate the artifact, update this checklist, and commit the coherent change.
- [ ] Create a pull request (blocked: this environment exposes no `make_pr` tool and the repository has no Git remote).

# Relevant contracts

- `content/` remains canonical and is not changed by this review.
- Review material belongs outside `content/`; it may recommend later research handoffs or model-change PRs but cannot make those decisions implicitly.
- Public sources are supporting evidence, not authority for company-specific operating claims. Simulated stakeholder perspectives generate questions, not lived-experience evidence.
- The review must respect repository boundaries: no PHI, patient data, production EHR implementation, authentication, database, or regulated workflow is introduced.

# Validation

- Verify all canonical IDs and map edges are covered by the review using a deterministic local check.
- Run `npm run validate:content`, `npm run validate:research`, `npm run lint`, `npm run lint:design`, and `npm run typecheck`.
- Run `npm run build`; responsive testing is unnecessary unless the review causes a perceptible UI change.

# Risks / decisions

- This review can identify high-value hypotheses but cannot substitute for interviews with parents, clinicians, clinical leaders, or compliance specialists.
- The phrase “best-in-class EHR” may conflict with the current artifact's marketplace and practice-platform scope; resolving that boundary is a foundational product decision, not a documentation edit.
- Current public evidence can establish common EHR obligations and known risks, but it cannot validate the repository's specific causal edges without operational data or targeted research.
- External source retrieval was unavailable in the execution environment, so this pass deliberately labels domain expectations as research questions and does not claim source-backed validation.
- `npm run build` reached the Next.js production build but failed because the environment could not retrieve Google Font assets; content validation, research validation, lint, design lint, typecheck, and deterministic review-coverage validation passed.
- Pull-request creation is blocked by environment configuration: the required `make_pr` tool is unavailable and `git remote -v` reports no remote to use with the GitHub CLI.
