# Research handoff workflow

This workflow turns research from Claude, ChatGPT, or another agent into a small,
reviewable proposal without making chat history or unreviewed research canonical.

This file is the mechanics: the files, the commands, the pull requests, and the
gates. The craft that runs inside them — researching with a person, and judging
what you find — is [`research-practice.md`](research-practice.md). Read it
before a run. Running the same workflow on a schedule is
[at the end of this file](#running-it-on-a-schedule).

## Happy path

0. Find out what is worth researching and what is already known:

   ```bash
   npm run research:queue                    # questions and gaps
   npm run research:brief -- <question-id>   # what previous runs established
   npm run research:new -- <question-id>     # scaffold, with a collision-safe run ID
   ```

   The brief is not optional housekeeping. A run that skips it will restate
   something an earlier run already found, and validation rejects that.

   For a human-guided run, do not jump from the brief straight into external
   research. Read the target canonical records and explain the current model,
   material prior decisions, important unknowns, the question this run will
   answer, and what is out of scope. Let the user correct that framing first.
   A connector that cannot run `research:brief` reconstructs the same orientation
   from `research/questions/`, prior handoffs and decisions, and the target
   records under `content/`.
1. Research a question in chat using public, non-sensitive material. Prefer
   recent evidence when the claim depends on current technology, workflow,
   regulation, or care-delivery practice; use older evidence deliberately rather
   than treating old and new sources as interchangeable. Record publication
   dates when known and make material age, directness, design, or transferability
   limitations explicit in the handoff.

   Keep the research conversational. Distinguish what the repository currently
   believes from what external evidence says and from what the agent is inferring.
   Surface conflicts, explain the emerging model in ordinary language, and pause
   when the evidence reveals a scope change or a choice the user should make.
2. Before writing the handoff, pressure-test the small candidate finding set with
   the user. Show the material uncertainties and let the user challenge, narrow,
   or request stronger support. Then synthesize
   `research/handoffs/<run-id>.yaml` using
   `research/contract/v1.example.yaml` as the contract example. Do not include a
   raw transcript; quote no more than 25 words from one source across extracts.

   The conversation can be exploratory and iterative. The user should be able
   to correct scope, add context, ask follow-ups, and request stronger support
   before the handoff is created. The handoff is the concise durable result,
   not a demand that every thought be defended in advance.
3. Through the provider's GitHub connector, create a feature branch from `main`,
   commit the handoff, and open a pull request to `main`. A coding agent with
   repository access performs these exact steps when connector capabilities are
   unavailable.

   **Commit the handoff and nothing else.** An intake is one file. Everything a
   reviewer reads is derived from it, and a connector cannot run anything, so
   asking it for a generated artifact asks for the one thing it cannot do.
4. CI takes it from there. `.github/workflows/research-packet.yml` renders the
   review packet onto the pull request as a comment, rewritten in place if you
   correct the handoff. Validation checks the handoff's shape, references, and
   safety declarations.

   If you *can* run commands, `npm run validate:research` and
   `npm run scan:safety` say the same thing sooner, and
   `npm run generate:research-review` writes the packet to `research/reviews/`
   for reading locally. Committing it is optional; if you do, CI checks that it
   still matches the handoff, because a packet is generated and never
   hand-edited.
5. The accountable reviewer decides — **in one of two lanes**, described below.
   Either way the output is `research/decisions/<run-id>.yaml`, and a partial
   review is valid: the validator reports what is still outstanding rather than
   failing. Run `npm run validate:research` again.
6. **`/review/apply`** composes each accepted decision into the file to create
   or the frontmatter to add, with the `researchTrace` already filled in. It
   composes what is derivable and asks you for what is not: what kind of belief
   this is, and how confident you are. Never copy the research staging record
   into canonical prose wholesale. The decision and the apply may share one pull
   request — see below.
7. For a human-guided run, close with the learning checkpoint from
   [`research-practice.md`](research-practice.md) before selecting another
   research problem. Briefly cover what changed, what became clearer, what was
   narrowed or ruled out, what remains unknown, which new questions may be worth
   queueing, and the current model in plain language. Ask the user whether that
   matches their understanding.

   Do not automatically turn every unknown into a queued question. Propose only
   the few that would materially deepen the model or unblock a decision, and
   queue the ones the user agrees are worth pursuing. Do not begin the next
   queued problem until this checkpoint has happened unless the user explicitly
   skips it.

The run ID is the join between everything the run produces, so each is named for
it: `research/handoffs/<run-id>.yaml`, `research/decisions/<run-id>.yaml`, the
derived packet wherever it is rendered, and the `run` field of every
`researchTrace` that cites it. Validation enforces the naming rather than
letting a file drift away from the ID inside it.

## Two kinds of output: findings and notes

Choosing correctly between them is most of what makes a run cheap to review.

A **finding** proposes something the model might come to believe. It costs the
reviewer a judgement, one at a time, and it is the only thing that can end up
cited in a `researchTrace`.

A **note** is context that changes no claim: a source worth knowing about, a
standard definition, how something is usually done, the shape of a regulation,
what a competitor does. Most of what a research conversation produces is this.

```yaml
notes:
  - id: note-telehealth-consent-varies-by-state
    statement: Consent requirements for telebehavioral care differ materially by state.
    sourceIds: [source-hhs-telebehavioral-guidance]
    anchors: [care-initiation, define-matching-quality]
```

Two rules make notes safe to accept in bulk, and both are enforced:

- **A note must be anchored** to at least one canonical record or queued
  question — the thing it is context *for*. Unanchored context is how a context
  base turns into a landfill: it accumulates, nothing retrieves it, and nobody
  can later say what it was for. An anchored note reaches the record page it
  bears on, and the brief of the next run over that territory.
- **A note cannot become belief.** `researchTrace` resolves finding IDs, and a
  note is not one; validation says so by name if anybody tries. Context that
  turns out to bear on what the model claims comes back as a finding in a later
  run, through the full gate.

The reviewer dispositions the whole set in one line:

```yaml
notes:
  disposition: noted      # or discard
  except: [note-id]       # the few going the other way
```

**When in doubt, propose a finding.** A note that turns out to need its own
judgement is a finding filed wrong, and the reviewer should say so rather than
accepting it as context. The cheap lane is for material that is genuinely cheap;
using it to slip a claim past a judgement is the one way to abuse it.

## Reflections: thinking about the model, not reading about it

A research run goes and reads things. A **reflection** is structured thinking
*about* the model or about earlier runs — the learning checkpoint's durable
form, when a session produced something worth keeping, and the door for a large
piece of analysis that would otherwise sit in a Markdown file no surface can
read.

```yaml
run:
  kind: reflection
  reflectsOn: [2026-08-14-what-makes-clinician-onboarding-high-quality]
```

It is a handoff and nothing more: same packet, same `/review`, same decision
file, same gate. Its sources may be internal — earlier runs, repository
documents, a prototype session — through the `repository` source kind.

What a reflection can carry that a research run usually does not is
**candidates**: proposals that something should *exist* in the model.

```yaml
candidates:
  - id: candidate-readiness-is-presence
    kind: problem                       # or question
    description: >
      A clinician can be declared match-ready because fields are present, while
      uncertainty, stale capacity, misunderstanding, or support needs remain
      invisible.
    targets: [clinician-onboarding, become-match-ready]
    restsOn: [claim-selection-predicts-quality]
    rationale: Directly precedes the current prototype focus.
    wouldWeakenIf: Observed onboarding shows readiness defects are rare.
```

**A candidate carries no title, and cannot.** The schema is strict, so writing
one is an error rather than a field silently dropped. Naming is the judgement
that decides whether the model records a trouble or a fix, and it stays the
person's sentence — accepting a candidate composes a skeleton at
`/review/apply` with targets, evidence and trace filled in and the name blank,
the proposer's own words sitting beside it as a comment.

Candidates are decided **one at a time**, like findings, because proposing that
something belongs in the model is a judgement rather than context. A candidate
problem must say where it bites, for the same reason a Problem file must.

**The first reflection to write is a migration.** The
[readiness/matching deep dive](adversarial-deep-dive-readiness-matching-2026-08-14.md)
ranks eight candidate Problems with falsification prompts. As prose they are
invisible to the queue, to `/review` and to the map. As a reflection they are
eight things a person can decide at whatever pace they like — and the
conversion copies structure somebody already wrote, inventing nothing.

## Two lanes for deciding

**The decision file is the gate, not the page that produced it.** Everything
this repository actually enforces — that the hash matches the current handoff,
that a named person is accountable, that a superseded decision stops
authorizing — is checked in the file. So a decision carries identical
guarantees whichever way it was written, and there are two ways.

**At `/review`.** The page puts each finding next to its evidence, what earlier
runs concluded from the same sources, and what it would change in the model,
then hands back the complete file. The packet comment on the intake pull
request carries the same skeleton in text, for reviewing from GitHub without
running the app.

**In the conversation.** When the person who will decide is already in the chat
that produced the research, they can decide there: the agent presents each
finding, the person says accept, reject, defer, or accept-with-edits and how to
narrow it, and the agent writes the decision file naming them, over the hash CI
printed on the intake pull request. The person's words are the decision; the
agent is doing the clerical half.

Record which lane with `decidedVia: review | conversation`. It is optional
provenance and gates nothing — it exists because the two lanes trade
differently, and the trade should stay visible.

**Which to use.** The conversational lane is much cheaper and it is the right
default for a run the reviewer participated in. `/review` is the better lane
when the reviewer was *not* in the conversation, when a run is contested or
consequential, or when the findings need reading without the researcher's
framing in your ear — which is a real advantage, and the reason the page is not
going anywhere.

Neither lane changes what a decision is. An agent may never supply a
disposition the person did not state, may never name them as reviewer without
their say, and may never decide by default or by silence. If the person has not
said what they think about a finding, it has no decision and the validator will
say so.

### One pull request or two

The handoff is always its own pull request. Staging has to land before anybody
decides about it, which is what makes the decision auditable — a handoff and its
decision arriving together is indistinguishable from a decision written to fit
whatever the research happened to say.

After that, **the decision and the model change may share one pull request.**
The decision authorizes; the apply cites it in `researchTrace`; content
validation checks the citation against the decision in the same tree, so they
are consistent or the pull request is red. Two files, one review, one merge.

That takes a run from four pull requests to two:

```text
1. handoff                        → CI renders the packet and prints the hash
2. decision + applied model change → validated together
```

Split them when the decision needs its own discussion, when the apply touches
more than the decision authorized, or when you want the decisions recorded
before anybody has time to write the model change. The two-file pull request is
a convenience, not a requirement.

## Contract summary

- `contractVersion` is exactly `1` until a migration is documented.
- IDs are lowercase kebab case and stable across retries.
- A source has a stable `id`, `identity` (for deduplication), kind, and structured
  locator. Each kind requires the locator that makes it findable again, and this
  is enforced rather than merely described: web sources require an HTTPS URL;
  publications a DOI or URL; repository sources a repository and path; and a
  `session` — a prototype review — the bet observed, the date, and a
  non-identifying description of who took part. A session names people by their
  relationship to the system, never by who they are, and cannot claim a URL.
  `docs/prototype-workflow.md` covers writing one up.
- Record `publishedAt` when it is known. It is review context, not an automatic
  pass/fail rule; source age matters in proportion to how quickly the subject
  changes.
- Findings are atomic and name their sources, suggested existing targets,
  evidence stance, and review classification. Matching is advisory: `duplicate`
  or `qualifying` records name candidate Claims, but automation never merges,
  discards, or promotes them.
- **Notes** are the other half of what a run produces — see below. Optional,
  anchored, dispositioned as a set, and never citable as evidence.
- Adding an optional field to this contract does not change the hash of a
  handoff that does not use it, so a review already given stays valid. Absent
  and empty values are normalized away before hashing. The corollary: **add
  fields, never reorder or rename them.**
- `evidenceQuality` is deliberately coarse and must not be read as a truth score:
  primary evidence can be weak or indirect, and a strong recent synthesis can
  be more decision-relevant than one primary study.
- `generalizedApplicability: false` marks company-specific or otherwise
  out-of-scope material; such a finding cannot propose a new canonical Claim.
- Each unresolved question remains visible in the packet rather than being
  filled with plausible prose.

## A proportionate bar

The intake bar should improve an idea, not prevent one from being offered.

- A question or Problem needs no evidence to be recorded.
- A research handoff needs traceable public sources, atomic findings, honest
  uncertainty, and a clear account of what it could change—not proof fit for a
  production clinical policy.
- The agent should challenge consequential leaps, counterexamples, conflicts,
  and missing perspectives constructively. It should ask focused follow-ups or
  preserve an uncertainty instead of turning the chat into an exhaustive
  defense.
- The reviewer may accept, edit, reject, defer, or request more research one
  finding at a time. Partial progress is valid.
- The bar rises with the proposed use. Exploration and a prototype can proceed
  with explicit uncertainty; claims used for clinical safety, individual
  selection, matching policy, or quality attribution require stronger,
  appropriately qualified review.

This keeps GitHub-connected ChatGPT, Claude, and similar conversations fast:
run the brief, orient with the user, develop the thought through normal
back-and-forth, pressure-test the finding set, then write the small contract
artifact and open the intake pull request. After review/application, teach the
updated model back to the user before moving on. Human promotion remains the one
non-negotiable gate.

Validation errors name the file and field. A stale contract, missing locator,
unknown target, conflicting source identity, duplicate ID, excessive quotation,
unsafe declaration, or incomplete provenance blocks intake. Unreachable and
paywalled sources are allowed only when explicitly declared; reachability itself
is a reviewer concern, not a nondeterministic CI network check.

Partial acceptance is represented by separate decision IDs. `accept-with-edits`
requires `editedRecommendation`; `reject`, `defer`, and `needs-research` require
a rationale.

Later work supersedes rather than erases old decisions, and superseding has
teeth: a decision names the earlier decision it replaces, and any canonical
record still citing the replaced one stops validating. That is how the model
changes its mind instead of accumulating contradictions. A decision may only
supersede one from an earlier run.

An exact restatement of an earlier run's finding is rejected, naming the run
that said it first. A source identity read by more than one run is reported and
allowed — re-reading a source to qualify what it was taken to say is what a
later run is for.

## Nothing confidential

```bash
npm run scan:safety
```

CI runs it on every pull request. It looks for the shapes of things that must
not be in a public repository: credentials, tokens, connection strings, contact
details, patient identifiers, and confidentiality markers carried over from
another document.

Anything it flags is either a real leak — remove it, and rotate it if it is
live, because it is in Git history now — or a false positive, which the
reviewer approves by pasting the printed block into
`research/safety-allowlist.yaml`. The match is recorded as a hash rather than as
text, so approving something never writes it into the repository a second time,
and an approval covers exactly one match in one file.

It cannot catch confidential material written as ordinary prose. Nothing
regex-shaped could, and the check does not pretend otherwise.

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
- **CI unavailable:** run `npm run validate:research` and `npm run scan:safety`
  locally, and read the packet with `npm run generate:research-review`.
- **A canonical record cites a run with no decision yet:** content validation
  refuses it and names the decision file to write. Acceptance is what authorizes
  a canonical change; `reject`, `defer`, and `needs-research` do not.
- **Packet reported stale after you only read it:** this only happens to a packet
  someone committed. Regenerate it, or delete it — it does not need to be in the
  repository. Line endings and trailing whitespace are ignored in the comparison,
  so a stale report means the handoff itself moved, not that an editor touched
  the file.
- **Connector cannot run the repository's commands:** it is not supposed to. Commit
  the handoff alone; CI renders the packet onto the pull request and validates.

The architecture rationale and complete trust boundary are recorded in
`docs/decisions/0001-git-native-research-intake.md`.

## Running it on a schedule

Everything above describes one run. Running it twice a day is the same workflow
at a cadence — it needs no provider API, no agent framework, and no runner
holding a model key.

`.github/workflows/research-routine.yml` runs `npm run research:queue`, briefs
the top of that queue, and keeps one issue up to date with both. It calls no
model and holds no secret: it publishes the queue so a person or an agent has
something to open. The brief is folded *into* the issue rather than named as a
command, because the agent that reads the issue cannot run one — the same reason
the intake asks for a handoff and nothing else.

Everything else is a conversation. Twice a day, in Claude, ChatGPT, or anything
else wired to this repository:

> Read the research routine issue. Take the top item, read the brief folded
> underneath it, and follow it.

A run that starts from that issue has already had step 0.

### How runs stay separate

A twice-daily agent researching the same public sources will resurface the same
statement forever unless something stops it. Three mechanisms, in the order they
act — all three described above, collected here because the schedule is what
makes them matter:

- **Prevention — the brief.** Every previous statement, every source already
  read, and every reviewer decision go into the next run before it starts.
  Repeats mostly do not get produced.
- **Detection — validation.** An exact restatement of an earlier run's finding
  is an error, naming the run that said it first. Only exact restatement is
  enforced; judging whether two differently-worded findings are the same claim
  is semantics, and that judgement is the reviewer's.
- **Resolution — supersedes.** A later decision retires an earlier one, and the
  authorization goes with it.

### What the routine cannot do

It cannot decide anything. Every path to `content/` runs through a decision file
a person wrote, enforced at content validation *and* inside `projectModel()`. An
agent with full write access to this repository still cannot change what the
model claims.

It cannot judge whether research is good. Validation checks shape, references,
safety declarations, and provenance. Whether a finding is true, well-evidenced,
and worth acting on is a human judgement the tooling deliberately declines to
make.

It cannot catch confidential material written as ordinary prose, as the safety
scan section above says.

### If it gets noisy

The failure mode to watch is the intake running ahead of the model. It has four
shapes, and `npm run research:queue` prints all of them above the model's own
thin spots, under **already owed**:

| | |
| --- | --- |
| `undecided` | Findings and candidates waiting on a person |
| `unapplied` | Accepted findings no canonical record cites — somebody authorized a change that was never made |
| `unconverted` | Accepted candidates nothing in the model answers to yet |
| `saturated` | A record several pieces of context anchor to, that still claims nothing |

They sort first because they are **answered by writing, not by researching**.
Everything below them invites a run; these invite a sentence. `saturated` is the
anti-bloat instrument in particular: context accumulating correctly, gated
correctly, and changing nothing is exactly what a growing context base looks
like from the inside, and it is invisible until something counts it.

If the debt grows, slow the routine down rather than lowering the bar for
accepting a finding. The bottleneck is a person reading carefully, and that is
the part worth protecting — which is why notes exist, so that the reading a
person does is reading that needed their judgement.
