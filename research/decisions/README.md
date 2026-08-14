# Decisions

The accountable reviewer owns this directory. One file per research run, named
for its run ID: `research/decisions/<run-id>.yaml`.

A handoff proposes; nothing here is written by an agent on the reviewer's
behalf. The review packet ends with a ready-to-fill skeleton carrying the run ID
and the reviewed handoff hash — copy it here, replace every `TODO`, and run
`npm run validate:research`. Read the packet at `/review/<run-id>`, or in the
comment CI leaves on the intake pull request.

```yaml
contractVersion: 1
runId: example-public-research
reviewedHandoffHash: <the hash printed in the review packet>
reviewer: who is accountable for this decision
decisions:
  - id: decide-example-public-research-finding-review-first
    disposition: accept
```

Allowed dispositions are `accept`, `reject`, `defer`, `needs-research`, and
`accept-with-edits`. `reject`, `defer`, and `needs-research` require a
`rationale`; `accept-with-edits` requires an `editedRecommendation`.

A partial review is valid — deciding three findings out of five is a real
contribution, and `npm run validate:research` reports what is still outstanding
rather than failing. Rejected, deferred, and superseded decisions stay here as
history; nothing is deleted to make a run look resolved.

Only `accept` and `accept-with-edits` authorize a canonical change, and that
change happens in a separate model-change pull request whose `researchTrace`
cites the run, decision, and finding. See `docs/research-workflow.md`.
