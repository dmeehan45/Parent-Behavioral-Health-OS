# Conversational research review

The repository should organize what was learned. It should not force the reviewer to do the learning inside a form.

For human-guided research, the default review loop is:

```text
research handoff → inspect in /review → work with it in conversation → write back durable reflection/questions → explicitly authorize only what is ready → apply → prototype or research next
```

## Three surfaces, three jobs

**Conversation is the working surface.** Use it to challenge findings, combine evidence with operating context, refine candidate Problems, notice implications, ask follow-up questions, and move toward Bets or Prototypes. Complex thinking should not be compressed into an `accept-with-edits` textarea merely because a review page exists.

**The repository is the organized record.** Handoffs preserve research staging. Reflection handoffs preserve structured thinking that is worth carrying forward before it is canonical. Decision files record explicit authorization. `content/` remains the canonical model.

**The visualization is the tracing surface.** It should make the lineage from research to Problem to Bet to Prototype legible. It is a projection of repository state, not another place to author truth.

## Do not force granular decisions too early

A research run can be useful before every finding has a disposition. Leave a finding or candidate undecided while its implication or framing still needs work.

The evidence pass should already have done the basic work of source traceability, uncertainty, counterevidence, and claim discipline before handoff. Human review is therefore not primarily a second literature-quality gate. The reviewer is deciding what the evidence means for this operating model and what is worth doing with it.

Use direct dispositions when the next move is genuinely clear:

- `accept` authorizes a later canonical change.
- `accept-with-edits` is for a narrow wording correction when the replacement is already clear. It is not a substitute for collaborative refinement.
- `reject`, `defer`, and `needs-research` remain useful when those are actually the conclusions.

Silence is not approval. An undecided item simply remains staging.

## What a conversation should write back

The chat transcript is not durable research infrastructure. When the conversation produces something worth preserving, write the smallest structured artifact that carries it.

Use a **reflection handoff** when the reviewer has materially refined the interpretation of a run, reframed a candidate Problem, identified a candidate question, or connected findings into a useful operating hypothesis. Set `run.kind: reflection` and `run.reflectsOn` to the earlier run or runs. The reflection can carry refined `candidates`, anchored `notes`, and unresolved `questions` through the existing review gate.

Use a **decision file** only for findings or candidates the accountable reviewer explicitly authorizes, rejects, defers, or sends back for more research. The conversational agent may perform the clerical write, but it may not invent the reviewer's disposition.

Use **canonical content** only after an authorizing decision exists.

## From research toward building

The useful output of review is not a perfectly classified research archive. It is a better model and a better next move.

During the conversation, keep asking:

- What changed in our model of the problem?
- Which candidate Problem is now sharp enough to record?
- What question would materially change a decision?
- Is there a research-supported Bet we can now state?
- What is the smallest Prototype that could falsify or deepen that Bet?

This is how research stays connected to the repository's core loop:

```text
Map → Problem → Bet → Prototype → Learn → Update Map
```

The review gate protects the model. It should not become the work itself.
