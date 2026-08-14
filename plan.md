# Goal

Create a provider-neutral, Git-native workflow that lets a user research in Claude, ChatGPT, or another conversational agent and then use that provider's GitHub connector to submit a structured research handoff. The repository validates and reflects questions or decisions back through reviewable files, validation output, and pull-request discussion before any accepted thinking changes canonical `content/`. A coding agent with direct repository access must be able to follow the identical workflow as a fallback.

# Acceptance criteria

- A chat or coding agent can turn conversation context into a small, documented handoff without copying an entire transcript or adding private/regulated material.
- The handoff has a stable, versioned contract and records the initiating question, synthesized findings, sources, target suggestions, uncertainties, and provenance of the handoff.
- Ingestion is a repository operation: the agent creates files on a feature branch and opens a PR; no provider API, webhook, MCP server, database, authentication, or chat-specific runtime is required.
- Deterministic validation returns actionable file-and-field errors for malformed, duplicate, unsafe, or unresolved handoffs.
- Valid handoffs produce a review packet that clearly separates suggested model changes from questions and decisions requiring the accountable user's approval.
- Canonical Stages, Steps, Entities, Claims, Metrics, Problems, and Bets do not change until the user accepts the relevant decisions in a separate model-change PR.
- Accepted changes retain traceability from canonical content to the handoff, sources, decision, and Git history without making research material a second source of truth for the system map.
- The documented happy path and error paths work the same through a conversational GitHub connector and a directly connected coding-agent session.
- Each implementation PR branches independently from `main`, targets `main`, and is useful on its own; the series is not stacked.

# Tasks

- [x] **PR 1 — Define the connector-neutral handoff and review protocol.** Add an architecture decision and author guide covering roles, trust boundaries, lifecycle, directory layout, file ownership, minimal transcript handling, source treatment, and the exact happy path: research in chat → synthesize handoff → connector creates branch/PR → CI validates → reviewer resolves questions → follow-up model-change PR. Specify the coding-agent fallback and a capability checklist for connectors that cannot edit an existing PR or read CI output.
- [x] **PR 2 — Add research handoff contracts and fixtures.** Introduce a versioned, content-backed envelope for a research run, source records, atomic findings, suggested targets, and unresolved questions. Keep this staging area outside the canonical model projection. Add valid examples and schema tests. Use stable IDs and structured source locators so repeated runs can be compared without relying on raw URLs or prose matching alone.
- [x] **PR 3 — Add deterministic intake validation and safety checks.** Load and validate handoffs with actionable errors for unknown targets, missing source locators, duplicate IDs, conflicting source identities, unsupported contract versions, oversized verbatim extracts, forbidden sensitive-data declarations, and incomplete provenance. Add repository commands and CI coverage that both connector and coding-agent paths can invoke.
- [x] **PR 4 — Add synthesis, deduplication, and evidence stance.** Represent whether a finding is new, duplicate, qualifying, conflicting, or out of scope; link it to an existing Claim or proposed new Claim where relevant; and distinguish `supports`, `contradicts`, `qualifies`, and `contextualizes`. Automated matching may suggest candidates but must never merge, discard, or promote findings without review.
- [x] **PR 5 — Generate a review packet and decision queue.** Add a deterministic command that turns a valid handoff into a concise, committed review artifact listing proposed changes, evidence quality/applicability, conflicts, deduplication candidates, open questions, and explicit decisions. Give each decision a stable ID and allowed responses so a chat connector can ask the user and write the answers back without interpreting free-form approval.
- [x] **PR 6 — Add the approval gate and canonical change recipe.** Validate decision responses and generate or document a minimal patch recipe for accepted changes. Require accepted decisions before authority promotion or canonical mutation. Preserve rejected, deferred, and superseded recommendations. Keep application code out of content-only model changes and require the resulting model-change PR to reference the originating handoff and decision IDs.
- [x] **PR 7 — Project research traceability after approval.** Extend the server-side model projection and UI detail surfaces so accepted canonical records can show their decision, supporting or conflicting evidence, and source metadata. Derive reverse relationships in `lib/model/graph.ts`; do not place research workflow logic or literal model IDs in components. Do not show unreviewed staging material as canonical map content.
- [x] **PR 8 — Document and test end-to-end connector scenarios.** Add thin fixtures or scripted tests for the happy path and the error states below, update contributor guidance and PR templates, and run the full repository validation suite. Confirm the same checked-in inputs and commands work when authored by a GitHub connector or by a coding agent.

## Error states to cover

- Connector has read-only access, cannot create a branch, cannot open a PR, or cannot update its existing PR.
- Connector loses conversational context, sends an incomplete envelope, repeats a prior handoff, or uses an older contract version.
- Research contains unreachable/paywalled sources, bare assertions, malformed locators, excessive quotations, or sources that disagree.
- Suggested targets do not exist, multiple existing Claims appear semantically equivalent, or a finding applies to company-specific rather than generalized model content.
- Handoff may contain PHI, personally identifiable clinician/family information, secrets, private company material, or other content outside repository boundaries.
- CI cannot run, validation fails, the branch is stale, or the model changes while a decision is pending.
- User accepts only part of a recommendation, rejects it, defers it, requests more research, or later supersedes an earlier decision.
- A provider cannot read CI/PR feedback conversationally; the review packet remains the portable response that the user can paste into a new chat or hand to a coding agent.

# Relevant contracts

- **Transport:** Git branch, commits, pull request, CI output, and committed review artifacts. Provider chat context is an input, not a repository dependency.
- **Handoff envelope:** versioned metadata plus research question, bounded synthesis, sources, atomic findings, suggested existing targets, unresolved questions, and provenance. Raw chat transcripts are excluded by default.
- **Trust boundary:** connector-authored handoffs are untrusted proposals. Deterministic validation checks shape and references; the accountable reviewer makes semantic decisions.
- **State boundary:** research intake and review artifacts are staging records. Only accepted follow-up edits under canonical `content/` change the system model.
- **Response channel:** validation errors, review packets, and PR comments. The repository does not attempt to call back into Claude or ChatGPT.
- **Decision response:** stable decision ID, constrained disposition (`accept`, `reject`, `defer`, `needs-research`, or `accept-with-edits`), reviewer rationale when needed, and the reviewed handoff revision.
- **Idempotency:** stable run/source/finding IDs and content hashes prevent retries or connector limitations from silently duplicating research.

# Validation

- Schema and unit tests for valid, incomplete, duplicate, stale-version, unsafe, and contradictory handoffs.
- Golden-file tests for deterministic review-packet output and stable decision IDs.
- Cross-reference tests for source, finding, Claim, decision, and canonical target links.
- End-to-end fixture showing both connector-authored and coding-agent-authored handoffs produce the same validated result.
- Per implementation PR: `npm run validate:content`, `npm run lint`, `npm run lint:design`, `npm run typecheck`, `npm run build`, and `npm run test:responsive` when the UI becomes perceptibly different.

# Risks / decisions

- GitHub connectors vary in branch, PR, CI-reading, and follow-up editing capabilities. The protocol must degrade to a portable file plus copyable validation/review output rather than depend on any one provider feature.
- The repository cannot initiate a conversational callback without adding provider-specific runtime infrastructure, which is outside current boundaries. “Respond back” therefore means producing structured review output through Git/PR surfaces that the connector can read or the user can paste back into chat.
- Research staging should not be included in the live canonical model revision until accepted; otherwise an unreviewed handoff could appear to users as established system thinking.
- Exact duplicate detection can be deterministic. Semantic similarity is advisory and always requires a reviewer.
- No implementation PR may introduce authentication, a database, an agent framework, MCP, PHI, or provider credentials.


## Completion note

All eight planned capabilities are implemented as one coherent review unit on the current feature branch rather than opened as eight simultaneous pull requests. The contracts remain separated by module and commit-ready concern; any later split must branch independently from `main`. The checked-in example intentionally remains unapproved, proving that intake and packet generation do not mutate canonical `content/`.
