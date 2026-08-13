# Future interaction contract

This document describes a likely semantic boundary; it does not implement an API, MCP server, agent, or filesystem mutation system.

## Reads

`map_get`, `stage_get`, `step_get`, `bet_get`, `graph_trace`, `knowledge_search`, `model_audit`, and `version_diff` may eventually expose versioned, validated model context.

## Proposal-oriented writes

`evidence_add`, `claim_propose`, `step_change_propose`, `stage_change_propose`, `bet_add`, `proposal_review`, and `proposal_apply` should create reviewable proposals rather than silently rewriting the canonical model.

## Trust model

```text
AI reads current model
→ AI proposes change
→ human reviews
→ accepted change enters Git
```

Git remains the record of software evolution and changing understanding. Arbitrary filesystem access is not the intended primary interaction contract.
