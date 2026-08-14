type StateRef = { entity: string; state: string };

type FlowStep = {
  id: string;
  file: string;
  next?: string[];
  inputs?: StateRef[];
  outputs?: StateRef[];
};

const key = (ref: StateRef) => `${ref.entity}:${ref.state}`;

/** Every step reachable from `start` by following `next`, cycles included. */
function reachable(start: string, next: Map<string, string[]>) {
  const seen = new Set<string>();
  const stack = [...(next.get(start) ?? [])];
  while (stack.length) {
    const step = stack.pop()!;
    if (seen.has(step)) continue;
    seen.add(step);
    stack.push(...(next.get(step) ?? []));
  }
  return seen;
}

/**
 * Refuse a handoff the model asserts and the flow cannot carry.
 *
 * A Step says what it consumes and what it produces, and `next` says what the
 * flow does afterwards. Those are two authored facts about the same sequence,
 * and they can disagree: if one Step outputs a Clinician in `match-ready` and
 * another takes a Clinician in `match-ready` as an input, the model is claiming
 * a handoff between them, and a missing `next` makes it a claim nothing carries.
 *
 * This is not a completeness rule, and it must not become one. A Step with no
 * `next` is fine — the ladder has to end somewhere, and nothing consumes what
 * the last Step produces. A state nobody produces yet is fine too; that is a
 * part of the system we have not modelled, and inventing Steps to satisfy a
 * checker is the one thing this repository asks nobody to do. Only the
 * contradiction fails: both ends written down, and no path between them.
 *
 * Worth stating why it exists. Splitting `first-successful-family` into
 * separate matching and care-initiation Steps was a real improvement, and it
 * removed the one `next` that carried a clinician out of onboarding without
 * writing a replacement. The process graph fell into five disconnected islands
 * and every check stayed green, because no check read the shape of the flow —
 * the entity states still described the sequence correctly, so the model knew
 * where each Step belonged and no surface asked. A reader of `/map` saw five
 * stranded chains and nothing saying that was wrong.
 */
export function checkFlowContinuity(steps: FlowStep[]) {
  const next = new Map(steps.map((step) => [step.id, step.next ?? []]));
  const byId = new Map(steps.map((step) => [step.id, step]));
  const consumers = new Map<string, string[]>();
  for (const step of steps) {
    for (const input of step.inputs ?? []) {
      consumers.set(key(input), [...(consumers.get(key(input)) ?? []), step.id]);
    }
  }

  const breaks: string[] = [];
  for (const producer of steps) {
    let downstream: Set<string> | undefined;
    for (const output of producer.outputs ?? []) {
      for (const consumerId of consumers.get(key(output)) ?? []) {
        if (consumerId === producer.id) continue;
        downstream ??= reachable(producer.id, next);
        if (downstream.has(consumerId)) continue;
        breaks.push(
          `${producer.file} produces '${output.entity}' in state '${output.state}', which ` +
            `${byId.get(consumerId)?.file ?? consumerId} takes as an input`,
        );
      }
    }
  }

  if (!breaks.length) return;

  // Every break, not the first one. A missing link usually strands more than
  // one handoff, and the nearest break is rarely the one that sorts first — a
  // single failure would send an author to add the link it happened to name,
  // which is how a flow acquires a shortcut that skips the steps between.
  // Sorted so the same content always reports the same list, whatever order
  // the directory happened to be read in.
  throw new Error(
    `Broken flow: the model claims ${breaks.length} handoff${breaks.length === 1 ? "" : "s"} that no chain of ` +
      `'next' carries.\n${breaks
        .sort()
        .map((line) => `  - ${line}`)
        .join("\n")}\nAdd the missing links, or correct the states so the model does not claim a handoff its ` +
      `flow cannot carry. One link often restores several of these, so re-run after each.`,
  );
}
