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
 * Step, Entity, role, and Problem records already say about that relationship so
 * the same answer ships in `ModelGraph` to every consumer.
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
      const label = `${entity?.title ?? output.entity} · ${output.state}`;
      transfers.set(`data:${output.entity}:${output.state}`, {
        layer: "data",
        label,
        sourceIds: [nodeId("step", source.id), nodeId("entity", output.entity), nodeId("step", target.id)],
      });
    }

    // Roles describe who is involved in the authored Step. When the same role
    // appears on both sides of a direct cross-stage `next`, that continuity is
    // useful on the map in its own right. Require the role to be primary on at
    // least one side so background helpers do not turn into a wall of actors.
    const sourcePrimary = new Set(source.roles?.primary ?? []);
    const targetPrimary = new Set(target.roles?.primary ?? []);
    const sourceRoles = new Set([...(source.roles?.primary ?? []), ...(source.roles?.supporting ?? [])]);
    const targetRoles = new Set([...(target.roles?.primary ?? []), ...(target.roles?.supporting ?? [])]);
    for (const role of sourceRoles) {
      if (!targetRoles.has(role)) continue;
      if (!sourcePrimary.has(role) && !targetPrimary.has(role)) continue;
      const entity = entityById.get(role);
      const label = entity?.title ?? humanize(role);
      transfers.set(`experience:${role}`, {
        // `experience` is the persisted layer id for shareable URLs. The UI
        // names it Actors because the canonical signal we can currently prove
        // is role continuity, not a richer claim about subjective experience.
        layer: "experience",
        label,
        sourceIds: [nodeId("step", source.id), nodeId("step", target.id)],
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
  for (const transfer of transfers.values()) layers.add(transfer.layer);

  const gaps = new Set<FlowLayerId>();
  if (layers.has("operating") && processHandoffs.length === 0) gaps.add("operating");
  if (layers.has("data") && ![...transfers.values()].some((transfer) => transfer.layer === "data")) gaps.add("data");
  // A feedback arrow says a learning relationship exists. Until the signal,
  // attribution context, cadence, and permitted use are explicit, its payload
  // remains a gap even though the relationship itself is canonical.
  if (layers.has("learning")) gaps.add("learning");

  return {
    layers: FLOW_LAYER_IDS.filter((layer) => layers.has(layer)),
    transfers: [...transfers.values()].sort((a, b) => a.layer.localeCompare(b.layer) || a.label.localeCompare(b.label)),
    processHandoffs,
    problems: problemLinks.sort((a, b) => a.title.localeCompare(b.title)),
    gaps: FLOW_LAYER_IDS.filter((layer) => gaps.has(layer)),
  };
}

function humanize(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
