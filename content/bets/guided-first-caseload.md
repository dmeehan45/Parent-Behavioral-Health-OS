---
id: guided-first-caseload
title: Guided First Caseload
problem: activation-without-productivity
status: concept
confidence: medium
participant: clinician
awaiting: [define-matching-quality]
claims: [claim-first-caseload-retention]
metrics: [time-to-first-match, time-to-first-session]
prototype:
  # Rebuilt against the revised `# Fidelity`, and not yet looked at by a person
  # against it. `working` would be claiming a check nobody has made — see the
  # conformance rule in AGENTS.md. Restamping `builtAgainst` is the reviewer's
  # assertion, and this returns to `working` when they make it.
  status: concept
  route: /prototypes/guided-first-caseload
  builtAgainst: deea66-ce20fd-92aff0-f1a58e-127106-acd1c7
authority: proposed
provenance: { source: author, references: [] }
lastReviewed: 2026-08-14
---

# Bet

Proactively help construct an initial viable caseload rather than leaving early marketplace participation entirely passive.

# Questions

- What constitutes a viable initial caseload?
- How much control should the clinician retain?
- How should match quality trade off against activation speed?

# Learning decision

Whether a clinician wants the platform to **assemble** a first caseload for
them, or only to **surface candidates** and let them build it themselves.

That is the choice the intervention actually forces, and it decides what gets
built rather than how it looks. If clinicians reach for the assembled caseload
and adjust it, guidance is the product. If they consistently abandon it and
build by hand, the value is in surfacing good candidates and the assembly is
wasted work — or worse, pressure applied to somebody who was going to choose
differently.

# Scope

**Participant.** A clinician who has just become match-ready: verified,
configured, with preferences and availability recorded.

**Moment.** The point at which they would otherwise start waiting for demand to
arrive — the gap this bet's Problem says belongs to nobody.

**In-scope path.** Both modes, side by side, reachable from one screen:

- an assembled starting caseload the clinician can accept whole, edit, or reject;
- the same candidates unassembled, to choose from themselves.

Either route reaches a proposed caseload and a closing state that says what
would happen next. Switching between them, and abandoning one for the other, is
the behaviour worth watching, so it stays available at any point.

# Out of scope

How fit is judged: the scores are shown, but the model has not decided what
makes a match good, and `define-matching-quality` is queued as open research.
Also out of scope: the family's side of the interaction, real matching,
scheduling, messaging, and anything that persists.

# Assumptions

Held for the prototype only. None of these is something the model claims:

- Enough demand exists at the moment of assembly for a caseload to be offered at
  all. Where it does not, this interaction has nothing to show.
- The clinician's stated capacity, population and preferences are current and
  complete enough to assemble against.
- The fit scores are provisional and may change. They are labelled as such in
  the interface, because presenting an undecided quality signal as settled is
  the failure most likely to make a session teach the wrong thing.
- Six weekly sessions is a plausible starting capacity. It is a number chosen to
  make the constraint visible, not a finding.

# Signals and safeguards

**Signal.** Which mode the clinician finishes in, and what they do with the
assembled caseload: accept it whole, edit it, or abandon it. Editing is the most
informative outcome — it says guidance helped and control mattered.

**Safeguard — reluctant acceptance.** A clinician taking the assembled caseload
because it was offered rather than because they would have chosen it. Ask about
it directly at the end; do not read a quiet session as its absence. Somebody
accepting without inspecting is the finding, not a success.

**Metrics.** `time-to-first-match` and `time-to-first-session` are what success
would eventually move. Neither is measured today, so this prototype cannot
report against either and must not be read as evidence about them.

# Fidelity

- **Content.** Synthetic and concise. Family details exist to be
  distinguishable from one another, not to be realistic.
- **Interaction.** High for the mode switch and for accept, edit and reject —
  that is the decision under test. Everything else can be static.
- **System.** Faked locally and disclosed. Nothing sends, saves, or matches.
- **Visual.** A surface a clinician would recognise as software they use, not a
  diagram of one. The caseload is the centre of the screen and fills as it is
  built; capacity is a limit you can see rather than a sentence you read; a
  candidate is scannable in one line. Built from the repository design system,
  which raises the bar for craft and not for ornament.
- **Restraint.** Polish must not make the fit scores look decided. They are the
  least settled thing here, and a surface that reads as finished product is
  exactly what makes an undecided number look measured. If the two pull against
  each other, the scores lose the argument.
