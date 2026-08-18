import assert from "node:assert/strict";
import test from "node:test";
import { projectModel } from "../../lib/model/graph";
import { edgeFlowTransfers, edgeProjectedFlowLayers } from "../../lib/model/flow-layers";
import { layoutGraph } from "../../lib/model/layout";

test("stage boundaries surface entity state already carried by the Step graph", () => {
  const graph = projectModel();
  const handoff = graph.edges.find(
    (edge) => edge.source === "stage:clinician-onboarding" && edge.target === "stage:matching" && edge.kind === "flow",
  );
  assert.ok(handoff, "expected onboarding to connect to matching");

  const transfers = edgeFlowTransfers(graph, handoff);
  assert.ok(
    transfers.some((transfer) => transfer.label === "Clinician: match-ready"),
    `expected the existing clinician match-ready handoff, got ${transfers.map((transfer) => transfer.label).join(", ")}`,
  );
  assert.ok(edgeProjectedFlowLayers(graph, handoff).includes("data"));
});

test("informational coupling does not force parallel demand and supply into a funnel", () => {
  const graph = projectModel();
  const nodes = graph.nodes.filter((node) => node.kind === "stage" && node.lenses.includes("flow"));
  const present = new Set(nodes.map((node) => node.id));
  const edges = graph.edges.filter(
    (edge) => edge.lenses.includes("flow") && present.has(edge.source) && present.has(edge.target),
  );
  const layout = layoutGraph("flow", nodes, edges, new Set());
  const byId = new Map(layout.nodes.map((node) => [node.id, node]));

  const family = byId.get("stage:family-demand");
  const supply = byId.get("stage:clinician-supply");
  const onboarding = byId.get("stage:clinician-onboarding");
  const matching = byId.get("stage:matching");
  assert.ok(family && supply && onboarding && matching);

  assert.equal(family.x, supply.x, "family demand and clinician supply should begin in parallel");
  assert.ok(onboarding.x > supply.x, "clinician onboarding should advance the supply lane");
  assert.ok(matching.x > onboarding.x, "matching should sit after the two lanes converge");
});
