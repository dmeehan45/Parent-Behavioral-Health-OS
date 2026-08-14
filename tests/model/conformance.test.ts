import assert from "node:assert/strict";
import test from "node:test";
import { getRepository } from "../../lib/content/repository";
import { projectModel } from "../../lib/model/graph";
import { RELATIONSHIPS, checkProjection } from "../../lib/model/conformance";
import type { ModelGraph } from "../../lib/model/types";
import type { Repository } from "../../lib/content/repository";

const repo = getRepository();
const graph = projectModel();

test("every reference the content authors is represented in the projection", () => {
  assert.deepEqual(checkProjection(repo, graph), []);
});

test("the repository reports references at all, so the check is not vacuous", () => {
  assert.ok(repo.references.length > 50, `only ${repo.references.length} references collected`);
});

// The failure this whole check exists for: content says two things are related,
// the record page reads the field directly and shows it, and every surface that
// reads edges — the map's lenses, open ends — never hears about it.
test("a relationship the projection drops is reported against its file", () => {
  const withoutStepClaims = {
    ...graph,
    edges: graph.edges.filter(
      (edge) => !(edge.kind === "evidence" && edge.source.startsWith("step:") && edge.target.startsWith("claim:")),
    ),
  } as ModelGraph;

  const found = checkProjection(repo, withoutStepClaims);
  assert.ok(found.length > 0, "dropping step→claim edges should be caught");
  // Both `step.claims` and a `claim.targets` naming a step ride on that one
  // edge — which is the point of resolving a relationship from either end, and
  // why removing the edge is reported against whichever file authored it.
  assert.ok(found.every((problem) => ["step.claims", "claim.targets"].includes(problem.field)));
  assert.ok(found.some((problem) => problem.field === "step.claims"));
  assert.match(found[0].reason, /should produce a 'evidence' edge and does not/);
});

// The other half: a reference nobody has classified yet. Adding a field to a
// schema and authoring it in content used to be silent — now it stops the build
// until somebody decides whether it is drawn or deliberately not.
test("a reference nobody has classified fails until somebody chooses", () => {
  const invented = {
    ...repo,
    references: [
      ...repo.references,
      { from: "matching", fromKind: "stage", field: "stage.somethingNew", to: "clinician-supply", file: "content/stages/matching.md" },
    ],
  } as Repository;

  const [problem] = checkProjection(invented, graph);
  assert.equal(problem.field, "stage.somethingNew");
  assert.match(problem.reason, /has never been asked about/);
  assert.match(problem.reason, /lib\/model\/conformance\.ts/);
});

test("every declared relationship says why, not just what", () => {
  for (const [field, resolution] of Object.entries(RELATIONSHIPS)) {
    assert.ok(resolution.note.length > 20, `${field} needs a reason a reader can weigh, not a label`);
  }
});
