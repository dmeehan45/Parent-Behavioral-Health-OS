import { ROUTES, nodeId } from "@/lib/model/kinds";
import { FLOW_LAYER_IDS, edgeFlowLayers } from "@/lib/model/flow-layers";
import type { Entity, Problem, Step } from "@/lib/schemas";
import type {
  FlowConnectionDepth,
  FlowLayerId,
  FlowProcessHandoff,
  FlowProblemLink,
  FlowTransfer,
  ModelEdge,
} from "@/lib/model/types";

/**
 * Project the detail already present behind one authored Stage connection.
 *
 * The Stage edge remains the top-level topology from `content/map.yaml`. This
 * function does not add a new Stage relationship. It asks what the canonical
 * Step, Entity, and Problem records already say about that relationship so the
 * same answer ships in `ModelGraph` to every consumer.
 */
export function projectConnectionDepth(
  edge: ModelEdge,
  steps: Step[],
  entities: Entity[],
  problems: Problem[],
): FlowConnectionDepth {
  const stepById = new Map(steps.map((step) => [step.id, step]));
  const entityById = new Map(entities.map((entity) => [entity.id, entity]));
  const sourceStage = edge.source.replace(/^stage:/, "");
  const targetStage = edge.target.replace(/^stage:/, "");

  const crossing: Array<{ source: Step; target: Step }> = [];
  for (const source of steps) {
    if (source.stage !== sourceStage) continue;
    for (const nextId of source.next ?? []) {
      const target = stepById.get(nextId);
      if (target?.stage === targetStage) crossing.push({ source, target });
    }
  }

  const processHandoffs: FlowProcessHandoff[] = crossing.map(({ source, target }) => ({
    sourceId: nodeId("step", source.id),
    sourceTitle: source.title,
    targetId: nodeId("step", target.id),
    targetTitle: target.title,
  }));

  const transfers = new Map<string, FlowTransfer>();
  for (const { source, target } of crossing) {
    for (const output of source.outputs ?? []) {
      const input = (target.inputs ?? []).find(
        (candidate) => candidate.entity === output.entity && candidate.state === output.state,
      );
      if (!input) continue;
      const entity = entityById.get(output.entity);
      const label = `${entity?.title ?? output.entity}: ${output.state}`;
      transfers.set(`${output.entity}:${output.state}`, {
        layer: "data",
        label,
        sourceIds: [nodeId("step", source.id), nodeId("entity", output.entity), nodeId("step", target.id)],
      });
    }
  }

  const problemLinks: FlowProblemLink[] = [];
  for (const problem of problems) {
    const touched = new Set<string>();
    for (const target of problem.targets) {
      const step = stepById.get(target);
      touched.add(step?.stage ?? target);
    }
    if (!touched.has(sourceStage) || !touched.has(targetStage)) continue;
    problemLinks.push({
      id: nodeId("problem", problem.id),
      title: problem.title,
      href: ROUTES.problem(problem.id),
    });
  }

  const layers = new Set<FlowLayerId>(edgeFlowLayers(edge));
  if (transfers.size > 0) layers.add("data");

  const gaps = new Set<FlowLayerId>();
  if (layers.has("operating") && processHandoffs.length === 0) gaps.add("operating");
  if (layers.has("data") && transfers.size === 0) gaps.add("data");
  // Experience is a real design concern in the model, but there is no authored
  // cross-boundary experience payload yet. Showing that absence is more useful
  // than inferring one from adjacency or participant roles.
  if (layers.has("operating")) gaps.add("experience");
  // A feedback arrow says a learning relationship exists. Until the signal,
  // attribution context, cadence, and permitted use are explicit, its payload
  // remains a gap even though the relationship itself is canonical.
  if (layers.has("learning")) gaps.add("learning");

  return {
    layers: FLOW_LAYER_IDS.filter((layer) => layers.has(layer)),
    transfers: [...transfers.values()].sort((a, b) => a.label.localeCompare(b.label)),
    processHandoffs,
    problems: problemLinks.sort((a, b) => a.title.localeCompare(b.title)),
    gaps: FLOW_LAYER_IDS.filter((layer) => gaps.has(layer)),
  };
}
