# ADR 0001: Git-native research intake

## Status

Accepted

## Decision

Research produced in any conversational tool enters the repository as a versioned
YAML handoff under `research/handoffs/`. A connector or coding agent creates a
branch, commits the handoff, and opens a pull request. The handoff is an
untrusted proposal: CI checks its shape and references, while the accountable
reviewer makes semantic decisions in a review packet derived from the handoff.

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
- **GitHub connector/coding agent:** writes the handoff, and only the handoff;
  treats conversation context as input rather than repository state.
- **CI:** performs deterministic structural and safety validation.
- **Accountable reviewer:** accepts, rejects, defers, requests research, or asks
  for edits through constrained decision responses.
- **Model contributor:** applies accepted decisions in a later pull request.

The handoff author owns `research/handoffs/<run-id>.yaml` and writes nothing
else. The packet is generated, never hand-edited, and belongs to whatever renders
it. Reviewers own `research/decisions/<run-id>.yaml`.

## Connector capability fallback

A connector should be able to read files, create a branch, commit files, open a
pull request, and ideally update that pull request and read CI output. It cannot
be assumed to run anything. If it cannot update a PR, it may open a replacement
branch/PR with the same run ID and revised content. If it cannot read CI, the
user can paste the actionable output back into chat. If it is read-only or cannot
create a branch/PR, it should return the complete YAML handoff for the user or a
coding agent to commit.

## Consequences

No provider API, webhook, authentication, database, agent framework, MCP server,
or provider credential is needed. Git history is the transport and audit trail.
Stable IDs and hashes make retries comparable; only an explicit, reviewed
canonical edit changes the operating model.

## Amendment, 2026-08-14: the packet is derived, not required

As first written, this decision said the connector "runs the same repository
commands", and intake validation required the generated packet to be committed
beside the handoff. Those two sentences are incompatible. A conversational agent
on a GitHub connector writes files through the contents API and has no execution
environment; it cannot run Node, and the packet carries a banner forbidding the
one route it does have, which is writing the file by hand.

The first real connector intake — pull request #43 — failed on exactly this, and
would have failed forever. The gap stayed hidden because every packet in the
repository until then had been committed by a coding agent with a shell.

So the packet stops being an input. It is a pure function of the handoff, and CI
renders it onto the intake pull request instead
(`.github/workflows/research-packet.yml`). `research/reviews/` may still hold
one, and validation still requires that a packet which *is* present matches its
handoff — that is what catches a hand-edit. Nothing requires one to exist.

The trust boundary is unchanged. The packet never authorized anything; the
reviewer's decision file does, and `checkResearchTrace` still enforces that at
content validation and inside `projectModel()`. What changed is only who renders
a reading aid.

The general rule this leaves behind: **an intake commits the handoff and nothing
else.** Anything derivable from it is derived by something that can execute.
