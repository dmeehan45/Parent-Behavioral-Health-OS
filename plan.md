# Goal

Make the content-driven React Flow system map the refined, interactive front door to the operating model, with clear paths from stages to steps, bets, and working prototypes and back.

# Acceptance criteria

- The system map presents a visually rich, navigable overview derived entirely from canonical content.
- Selecting a stage progressively reveals its summary, model signals, steps, bets, and prototype links; double-clicking enters stage detail.
- Stage process maps support selection before navigation and expose linked bets without overwhelming the graph.
- Detail and prototype pages preserve clear routes back through the model.
- The experience remains usable on narrow screens and with keyboard navigation.

# Tasks

- [x] Replace fixed graph coordinates with a topology-derived layout and enrich the map controls, legend, nodes, and inspector.
- [x] Add progressive stage-step inspection and direct bet/prototype paths using repository-derived view models.
- [x] Refine shared visual styling and responsive behavior without changing the established design direction.
- [x] Verify content validation, lint, typecheck, build, and browser interactions; capture a local screenshot without committing the binary artifact.
- [x] Remove the committed binary that prevented pull request creation.
- [ ] Commit the repair, push the branch, and open a pull request.

# Relevant contracts

- `content/` remains canonical; components receive derived view models and contain no literal model IDs, counts, or relationships.
- React Flow node placement is computed from map topology/order rather than stored as application literals.
- Prototype routes come only from Bet frontmatter.

# Validation

- `npm run validate:content`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Browser smoke test of map selection, stage/step navigation, and prototype round trip.

# Risks / decisions

- The seed map is intentionally incomplete, so the UI must make zero-value and missing sections feel honest rather than manufacturing content.
