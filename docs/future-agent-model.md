# Future agent model

The same map may eventually provide structured context to semi-autonomous systems. No autonomous execution is implemented in V0.

A future reader should be able to learn why a Step exists, what permits it to begin, its required entities, participating roles, constraining rules, transformation, outputs, completion criteria, and blocking exceptions. Optional semantic fields allow that context to accumulate without demanding false completeness today.

## Context is not capability

Process context describes reality: a clinician may become match-ready when configuration, usable availability, and capacity exist. It must not contain runtime-specific instructions such as calling a particular model or tool.

Agent capability should be modeled separately in the future: an `activate_clinician` capability might request missing availability or escalate a credential conflict. Keeping these layers separate prevents the operating model from being coupled to an AI runtime and prevents proposed content from being mistaken for authorized policy.

Authority values are essential guardrails: a future agent may reason from `proposed` material, but must not treat it as an approved autonomous operating rule.
