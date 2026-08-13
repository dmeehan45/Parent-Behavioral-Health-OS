# Future interaction contract

This document describes a likely semantic boundary; it does not implement an API, MCP server, agent, or filesystem mutation system.

## Reads

`map_get`, `stage_get`, `step_get`, `problem_get`, `bet_get`, `graph_trace`, `knowledge_search`, `model_audit`, and `version_diff` may eventually expose versioned, validated model context.

An `unanswered_problems` read is likely to matter more than any of these. The
model records where the machine breaks separately from what anyone has proposed
about it, so "what has nobody answered yet" is a question it can actually be
asked.

## Proposal-oriented writes

`evidence_add`, `claim_propose`, `step_change_propose`, `stage_change_propose`, `problem_add`, `bet_add`, `proposal_review`, and `proposal_apply` should create reviewable proposals rather than silently rewriting the canonical model.

`problem_add` and `bet_add` stay separate on purpose. Naming a problem is a
complete contribution, and collapsing the two would push every observation into
arriving with a solution attached.

## Trust model

```text
AI reads current model
→ AI proposes change
→ human reviews
→ accepted change enters Git
```

Git remains the record of software evolution and changing understanding. Arbitrary filesystem access is not the intended primary interaction contract.
