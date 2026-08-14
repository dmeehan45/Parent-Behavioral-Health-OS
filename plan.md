# Goal

Make the visualization and supporting pages easier to understand and quieter to use: plain language, less self-description, and progressive disclosure that leaves room for the reader's own reasoning.

# Acceptance criteria

- The home page leads with what a reader can understand or try; repository, agent, and workflow mechanics are optional contributor detail.
- The map has one obvious default task, while alternate views remain accessible through a secondary view chooser and direct URLs.
- Records lead with their substance and essential relationships; governance metadata and supporting detail remain available without dominating the page.
- Research review preserves evidence, prior art, and impact beside each decision while focusing attention on one finding at a time.
- The guided-caseload prototype does not imply an unexplained matching algorithm or unsupported numerical precision.
- Interface copy uses concrete reader language consistently while canonical values, relationships, authority, provenance, and research gates remain intact.
- Each implementation pull request passes the full repository check suite and responsive checks its most content-heavy changed state.

# Tasks

- [x] Reassess the UX review against the current merged home-page and projection changes at `d03fc97`.
- [x] Sequence the work into independently reviewable pull requests.
- [x] **PR 1 — Copy standard and front door.** Branch from the then-current `main`. Add a concise plain-language/progressive-disclosure standard to `docs/design-system.md` and its review checklist to `CONTRIBUTING.md`. Simplify `app/page.tsx` around understanding the care-delivery flow, examining problems, and trying a prototype. Keep the new derived doors and useful disclosures, but move agent commands, repository mechanics, and the full research-to-prototype explanation out of the default reading path. Add responsive coverage for the longest retained disclosure. Suggested commit: `ux: make the front door reader-first`.
- [ ] **PR 2 — Map entry and view hierarchy.** After PR 1 merges, branch fresh from `main`. Keep `flow` as the default and replace four equally prominent lens tabs with a plain current-view label and accessible `Change view` control. Preserve lens IDs, keyboard shortcuts, URL state, graph derivation, and the full legend. Review visible lens names and empty states for plain language without changing the projection contract. Test keyboard use, direct lens URLs, phone orientation, and the detail-sheet scroll boundary. Suggested commit: `map: make the care flow the clear starting point`.
- [ ] **PR 3 — Record reading hierarchy.** After PR 2 merges, branch fresh from `main`. Add presentation priority to projected detail blocks in `lib/model/` rather than matching labels in components. Lead record pages and sheets with primary content and essential links; disclose supporting blocks, provenance, coverage gaps, and contributor commands later. Keep authority visible wherever hiding it could make a proposal read as policy, and keep open ends capped, aggregated, and last. Test every primitive kind plus the longest sheet at phone and desktop sizes. Suggested commit: `records: put the substance before the bookkeeping`.
- [ ] **PR 4 — Focused research decisions.** After PR 3 merges, branch fresh from `main`. Present one finding at a time while keeping that finding's evidence, uncertainty, prior art, possible model impact, and decision together. Translate visible disposition labels without changing stored enum values. Reveal decision-file mechanics only at completion. Preserve the human-only gate, accepted-versus-applied distinction, copy-to-file workflow, lack of server writes, and research validation. Test multi-finding navigation, draft retention, required rationales, keyboard flow, and generated decision output. Suggested commit: `research: focus review on one decision at a time`.
- [ ] **PR 5 — Honest prototype recommendations.** After PR 4 merges, branch fresh from `main`. Replace unexplained exact fit scores in `components/guided-caseload.tsx` with evidence the synthetic case actually provides and explicit unresolved considerations. Reduce the initial choice set or disclose extra examples. Clarify that the prototype supports review rather than calculating clinical suitability, and make confirmation text describe only the simulated action. Do not add matching logic or canonical claims. Test capacity, selection, confirmation, reset, responsive behavior, and prototype session intake. Suggested commit: `prototype: remove false precision from caseload review`.
- [ ] After each merge, recheck the remaining plan against current `main`; adjust only for repository changes that materially affect the next PR.

# Relevant contracts

- `content/` remains canonical. No PR in this sequence changes what the model claims unless a separately reviewed canonical change is explicitly authorized.
- Components consume `ModelGraph`; presentation priority that depends on primitive meaning belongs in `lib/model/`.
- Authority and provenance remain load-bearing. Progressive disclosure may reduce repetition but must not let proposed material read as validated or policy.
- `/review` remains a reading surface with evidence adjacent to the decision. It never writes server-side, and acceptance remains separate from application.
- Research remains off the map because it is outside the content revision contract.
- Every PR is based on the latest `main` after the previous PR merges and targets `main`. These are sequential, not stacked.
- No database, authentication, production integration, PHI, or matching engine is introduced.

# Validation

For every implementation PR run:

- `npm run validate:content`
- `npm run validate:projection`
- `npm run validate:research`
- `npm run test:research`
- `npm run test:prototype`
- `npm run scan:safety`
- `npm run lint`
- `npm run lint:design`
- `npm run typecheck`
- `npm run build`
- `npm run test:responsive`
- `git diff --check`

PR-specific interaction checks are listed in each task and should be added only where they protect the changed behavior rather than pinning visual design.

# Risks / decisions

- This checkout has no local `main` ref or configured remote. PR 1 is based directly on the latest available merged baseline, `d03fc97`; create the hosted PR against `main` once a remote is available.
- Simplifying governance display must not conceal authority. PR 3 should treat this as an interpretation-safety constraint, not a cosmetic preference.
- Focusing review must not separate a decision from its evidence. PR 4 changes pacing, not the human-accountability contract.
- PR 1 retains the derived navigation and all substantive workflow, responsibility, reuse, and contribution guidance. That depth now sits in two secondary disclosures after the primary care-flow, problem, and prototype paths instead of being removed.
- Build is currently blocked by denied Google Font downloads, and Playwright browser installation is blocked by HTTP 403 from its CDN; responsive execution and the required screenshot remain environment-limited.
