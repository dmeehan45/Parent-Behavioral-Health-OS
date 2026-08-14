# Research handoff workflow

This workflow turns research from Claude, ChatGPT, or another agent into a small,
reviewable proposal without making chat history or unreviewed research canonical.

Running it on a schedule is described in `docs/research-routine.md`.
Source selection and evidence appraisal are governed by
`docs/research-source-quality.md`; agents should read it before researching.

## Happy path

0. Find out what is worth researching and what is already known:

   ```bash
   npm run research:queue                    # questions and gaps
   npm run research:brief -- <question-id>   # what previous runs established
   npm run research:new -- <question-id>     # scaffold, with a collision-safe run ID
   ```

   The brief is not optional housekeeping. A run that skips it will restate
   something an earlier run already found, and validation rejects that.
1. Research a question in chat using public, non-sensitive material. Prefer
   recent evidence when the claim depends on current technology, workflow,
   regulation, or care-delivery practice; use older evidence deliberately rather
   than treating old and new sources as interchangeable. Record publication
   dates when known and make material age, directness, design, or transferability
   limitations explicit in the handoff.
2. Ask the agent to synthesize `research/handoffs/<run-id>.yaml` using
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
5. The accountable reviewer decides, at **`/review`**. The page puts each
   finding next to its evidence, what earlier runs concluded from the same
   sources, and what it would change in the model, then hands back a complete
   decision file to save as `research/decisions/<run-id>.yaml`. Run
   `npm run validate:research` again.

   The packet comment on the intake pull request carries the same skeleton in
   text, for reviewing from GitHub without running the app. Either way a partial
   review is valid: the validator reports what is still outstanding rather than
   failing.
6. After this intake PR is reviewed, create a separate model-change PR from
   `main`. **`/review/apply`** composes each accepted decision into the file to
   create or the frontmatter to add, with the `researchTrace` already filled in.
   It composes what is derivable and asks you for what is not: what kind of
   belief this is, and how confident you are. Never copy the research staging
   record into canonical prose wholesale.

The run ID is the join between everything the run produces, so each is named for
it: `research/handoffs/<run-id>.yaml`, `research/decisions/<run-id>.yaml`, the
derived packet wherever it is rendered, and the `run` field of every
`researchTrace` that cites it. Validation enforces the naming rather than
letting a file drift away from the ID inside it.

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
run the brief, develop the thought through normal back-and-forth, then ask the
agent to write the small contract artifact and open the intake pull request.
Human promotion remains the one non-negotiable gate.

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
