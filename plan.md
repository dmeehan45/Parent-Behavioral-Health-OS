# Goal

Audit the repository for claims that outrun their evidence, unsupported or incorrectly attributed data, weak seed content, and important loose ends; preserve the findings in a reviewable artifact and add the smallest enforceable guardrails that prevent the same quality drift.

# Acceptance criteria

- Every canonical primitive is checked against its authority, provenance, confidence, data status, references, wording, and relationships.
- Research staging, generated review material, documentation, prototypes, and relevant merged history are checked for evidence claims that conflict with canonical metadata.
- Findings distinguish demonstrable contradictions from hypotheses, thin records, missing evidence, and intentionally unknown data.
- The audit gives file-level evidence, severity, impact, and a safe recommended disposition without inventing or promoting canonical facts.
- Repeatable checks catch objective provenance/data-quality contradictions where the repository contracts can do so without judging prose.
- Relevant validation passes, changes are committed on a feature branch, and a pull request is created.

# Tasks

- [x] Inventory the provenance and evidence contracts, merged-history context, and all canonical/research records.
- [x] Run structured and prose-level scans for speculation presented as evidence, unsupported numbers, mismatched provenance, and stale or low-quality seed material.
- [x] Trace topology and open ends to identify consequential gaps and misleading implications.
- [x] Write a prioritized audit with evidence, limitations, and recommended human decisions.
- [x] Add focused automated guardrails and tests for objective quality failures discovered by the audit.
- [x] Rebase onto current `main` through PR #40 and separate already-merged functionality from this branch's remaining diff.
- [x] Assess and document breaking changes and functional shifts before merge.
- [x] Re-run all non-build validation and commit the rebased review branch. Build and responsive remain blocked by external Google Fonts retrieval.
- [ ] Push the rebased branch and update the pull request; this environment still needs working GitHub credentials.

# Relevant contracts

- `content/` is canonical, but this audit does not promote new claims or silently rewrite model meaning.
- `author` provenance means reasoning supplied by an author, not interviews, observations, or operational data.
- Unknown data, low confidence, and incomplete fields are valid; the defect is representing them as stronger evidence than they are.
- PR descriptions and historical rationale are evidence-layer records too, but repository checks can only enforce material available in the checkout.

# Validation

- Run all nine checks listed in `AGENTS.md`, plus focused tests for any new audit rule and `git diff --check`.

# Risks / decisions

- A prose audit cannot prove that external evidence never existed; it can prove that the repository does not record it and that stronger claims are unsupported here.
- Historical pull-request bodies were retrieved from the repository's public GitHub API. PR #20 contains the suspected contradiction; the audit quotes only the two material source-category claims and compares them to the committed records.
- Remediation that changes canonical beliefs or promotes research remains a named-person decision.
- The production build still cannot retrieve the configured Google Fonts in this environment. Because responsive testing builds first, it is blocked by the same external dependency rather than by this change.
- The post-rebase prototype contract exposed one additional gap: the working prototype has none of the five experiment sections now required before a build is considered ready.
- The remaining branch intentionally breaks the authoring-validation contract for unsupported evidence labels and seed filler; it does not break runtime routes, APIs, topology, or component behavior.
