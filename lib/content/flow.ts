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
 * The question is asked once per consumer, and one supplier is enough. Asking
 * it of every producer/consumer pair would be the Cartesian product of a shared
 * state, and `docs/care-delivery-lifecycle-contrast.md` is explicit that this
 * flow will not stay linear: once a rematch path and a first-match path both
 * carry an accepted Match to their own next Step, demanding that each producer
 * reach every consumer would refuse a correct model for handoffs nobody wrote
 * down. This check runs inside `getRepository()`, so that mistake would not
 * merely fail a script — it would take the live map down.
 *
 * A Step's own output never supplies its own input, either. What a Step
 * produces exists once it has run, and an input has to exist before it does.
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
  const producers = new Map<string, FlowStep[]>();
  for (const step of steps) {
    for (const output of step.outputs ?? []) {
      producers.set(key(output), [...(producers.get(key(output)) ?? []), step]);
    }
  }

  const walked = new Map<string, Set<string>>();
  const downstream = (id: string) => {
    const known = walked.get(id);
    if (known) return known;
    const found = reachable(id, next);
    walked.set(id, found);
    return found;
  };

  const breaks: string[] = [];
  for (const consumer of steps) {
    for (const input of consumer.inputs ?? []) {
      const supply = (producers.get(key(input)) ?? []).filter((step) => step.id !== consumer.id);
      if (!supply.length) continue;
      if (supply.some((step) => downstream(step.id).has(consumer.id))) continue;
      breaks.push(
        `${consumer.file} takes '${input.entity}' in state '${input.state}' as an input, and no chain of 'next' ` +
          `reaches it from ${supply
            .map((step) => step.file)
            .sort()
            .join(" or ")}`,
      );
    }
  }

  if (!breaks.length) return;

  // Every break, not the first one. A missing link usually strands more than
  // one input, and the nearest break is rarely the one that sorts first — a
  // single failure would send an author to add the link it happened to name,
  // which is how a flow acquires a shortcut that skips the steps between.
  // Sorted so the same content always reports the same list, whatever order
  // the directory happened to be read in.
  throw new Error(
    `Broken flow: ${breaks.length} input${breaks.length === 1 ? "" : "s"} the model says something supplies, and ` +
      `no chain of 'next' carries.\n${breaks
        .sort()
        .map((line) => `  - ${line}`)
        .join("\n")}\nAdd the missing links, or correct the states so the model does not claim a handoff its ` +
      `flow cannot carry. One link often restores several of these, so re-run after each.`,
  );
}
