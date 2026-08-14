# Research handoff workflow

This workflow turns research from Claude, ChatGPT, or another agent into a small,
reviewable proposal without making chat history or unreviewed research canonical.

## Happy path

1. Research a question in chat using public, non-sensitive material.
2. Ask the agent to synthesize `research/handoffs/<run-id>.yaml` using
   `research/contract/v1.example.yaml` as the contract example. Do not include a
   raw transcript; quote no more than 25 words from one source across extracts.
3. Through the provider's GitHub connector, create a feature branch from `main`,
   commit the handoff, and open a pull request to `main`. A coding agent with
   repository access performs these exact steps when connector capabilities are
   unavailable.
4. Run `npm run validate:research` and `npm run generate:research-review`.
   Commit the deterministic review packet. CI runs both validation modes and
   verifies that generated packets are current.
5. The accountable reviewer answers every decision in
   `research/decisions/<run-id>.yaml` using an allowed disposition. Run
   `npm run validate:research` again.
6. After this intake PR is reviewed, create a separate model-change PR from
   `main`. Apply only accepted decisions and add `researchTrace` entries naming
   the run, decision, finding, stance, and source IDs. Never copy the research
   staging record into canonical prose wholesale.

## Contract summary

- `contractVersion` is exactly `1` until a migration is documented.
- IDs are lowercase kebab case and stable across retries.
- A source has a stable `id`, `identity` (for deduplication), kind, and structured
  locator. Public web sources require an HTTPS URL; publication records require
  a DOI; repository sources require a repository and path.
- Findings are atomic and name their sources, suggested existing targets,
  evidence stance, and review classification. Matching is advisory: `duplicate`
  or `qualifying` records name candidate Claims, but automation never merges,
  discards, or promotes them.
- `generalizedApplicability: false` marks company-specific or otherwise
  out-of-scope material; such a finding cannot propose a new canonical Claim.
- Each unresolved question remains visible in the packet rather than being
  filled with plausible prose.

Validation errors name the file and field. A stale contract, missing locator,
unknown target, conflicting source identity, duplicate ID, excessive quotation,
unsafe declaration, or incomplete provenance blocks intake. Unreachable and
paywalled sources are allowed only when explicitly declared; reachability itself
is a reviewer concern, not a nondeterministic CI network check.

Partial acceptance is represented by separate decision IDs. `accept-with-edits`
requires `editedRecommendation`; `reject`, `defer`, and `needs-research` require
a rationale. Later work supersedes rather than erases old decisions.

## Failure recovery

- **Lost context or incomplete handoff:** preserve the run ID, correct the file,
  and regenerate. Validation shows the missing fields.
- **Repeated run:** reuse the run ID; a second file with that ID is rejected.
- **Connector cannot edit:** open a replacement PR or hand the YAML and CI text
  to a coding agent. Close/supersede the obsolete PR rather than merging both.
- **Stale branch or changed model:** rebase from `main`, rerun validation, and
  confirm the packet's recorded model revision before deciding.
- **Conflicting sources or equivalent Claims:** keep all findings and candidates;
  the packet asks the reviewer. Deterministic tools never resolve semantics.
- **Sensitive/private material suspected:** do not commit it. Stop, remove it
  from the synthesis, and record only a non-sensitive uncertainty if useful.
- **CI unavailable:** run the two npm commands locally and commit their artifacts.

The architecture rationale and complete trust boundary are recorded in
`docs/decisions/0001-git-native-research-intake.md`.
