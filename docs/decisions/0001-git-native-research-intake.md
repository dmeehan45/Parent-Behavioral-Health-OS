# ADR 0001: Git-native research intake

## Status

Accepted

## Decision

Research produced in any conversational tool enters the repository as a versioned
YAML handoff under `research/handoffs/`. A connector or coding agent creates a
branch, commits the handoff, runs the same repository commands, and opens a pull
request. The handoff is an untrusted proposal: CI checks its shape and references,
while the accountable reviewer makes semantic decisions in a generated review
packet under `research/reviews/`.

Raw transcripts are excluded. A handoff contains only a bounded synthesis,
atomic findings, public source locators, uncertainties, and enough provenance to
understand how it was prepared. It must declare that it contains no PHI, secrets,
identifiable family or clinician data, or private company material.

Research and review files are staging records, not model primitives. They are not
read by the map revision or projected as canonical content. An accepted decision
is implemented in a separate model-change pull request. That pull request cites
the handoff and decision IDs in a canonical record's `researchTrace` field.

## Roles and ownership

- **Researcher/chat agent:** investigates and synthesizes; never approves.
- **GitHub connector/coding agent:** writes the handoff and generated packet;
  treats conversation context as input rather than repository state.
- **CI:** performs deterministic structural and safety validation.
- **Accountable reviewer:** accepts, rejects, defers, requests research, or asks
  for edits through constrained decision responses.
- **Model contributor:** applies accepted decisions in a later pull request.

The handoff author owns `research/handoffs/<run-id>.yaml`. The generated packet
owns `research/reviews/<run-id>.md`; it must not be hand-edited. Reviewers own
`research/decisions/<run-id>.yaml`.

## Connector capability fallback

A connector should be able to read files, create a branch, commit files, open a
pull request, and ideally update that pull request and read CI output. If it
cannot update a PR, it may open a replacement branch/PR with the same run ID and
revised content. If it cannot read CI, the user can paste the actionable output
back into chat. If it is read-only or cannot create a branch/PR, it should return
the complete YAML handoff for the user or a coding agent to commit. The committed
review packet is the portable response when no conversational callback exists.

## Consequences

No provider API, webhook, authentication, database, agent framework, MCP server,
or provider credential is needed. Git history is the transport and audit trail.
Stable IDs and hashes make retries comparable; only an explicit, reviewed
canonical edit changes the operating model.
