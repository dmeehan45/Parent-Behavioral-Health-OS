import type { ModelGraph, ModelNode } from "@/lib/model/types";

/**
 * Where the model is unfinished here, derived rather than written down.
 *
 * A record page is good at telling a reader what we currently think. It is
 * silent about the thing a reader is actually best placed to help with: the
 * loose ends. A problem nobody has proposed an answer to, a low-confidence
 * assumption several things are resting on, a metric that would settle an
 * argument and that nobody measures — those are the invitations to think, and
 * they were only visible by reading every linked page and holding it in mind.
 *
 * Every rule reads the projection's own shape — node kinds, edge kinds,
 * confidence, data status. Nothing here names a stage or a claim, so adding
 * content never touches this file.
 *
 * Pure, and free: the graph is already in hand on a record page, so this costs
 * no extra read.
 */

export type OpenEnd = {
  /** What kind of loose end this is, for the reader to recognise the pattern. */
  kind: "unanswered" | "unproven" | "unmeasured" | "untested" | "thin";
  /** Written as an invitation, not a scolding. */
  invitation: string;
  href?: string;
  linkLabel?: string;
};

/** Everything one hop from this node, in whichever direction the edge runs. */
function neighbours(graph: ModelGraph, node: ModelNode, kind: string) {
  const byId = new Map(graph.nodes.map((candidate) => [candidate.id, candidate]));
  return graph.edges
    .filter((edge) => edge.kind === kind && (edge.source === node.id || edge.target === node.id))
    .map((edge) => byId.get(edge.source === node.id ? edge.target : edge.source))
    .filter((candidate): candidate is ModelNode => Boolean(candidate));
}

/** "A", "A and B", "A, B and two more" — one line however many there are. */
function names(titles: string[], limit = 2) {
  if (titles.length === 1) return titles[0];
  if (titles.length <= limit) return `${titles.slice(0, -1).join(", ")} and ${titles[titles.length - 1]}`;
  const rest = titles.length - limit;
  return `${titles.slice(0, limit).join(", ")} and ${rest} ${rest === 1 ? "other" : "others"}`;
}

export function openEnds(graph: ModelGraph, node: ModelNode): OpenEnd[] {
  const ends: OpenEnd[] = [];

  // A problem with no bet is the model saying "we know this breaks and nobody
  // has said what to do about it" — the single most useful thing to find, and
  // the one kind worth listing individually, because each is a separate
  // invitation to think.
  const problems = node.kind === "problem" ? [node] : neighbours(graph, node, "problem").filter((n) => n.kind === "problem");
  for (const problem of problems.slice(0, 2)) {
    if (neighbours(graph, problem, "bet").some((candidate) => candidate.kind === "bet")) continue;
    ends.push({
      kind: "unanswered",
      invitation: `Nobody has proposed an answer to “${problem.title}”.`,
      href: problem.href,
      linkLabel: "Read the problem",
    });
  }

  const evidence = neighbours(graph, node, "evidence");

  // Something the model reasons from that it is not sure of. Worth knowing
  // before you build on it, and worth attacking if you disagree.
  const unproven = evidence.filter((candidate) => candidate.kind === "claim" && candidate.confidence === "low");
  if (unproven.length) {
    ends.push({
      kind: "unproven",
      invitation:
        unproven.length === 1
          ? `“${unproven[0].title}” is held at low confidence.`
          : `${unproven.length} claims here are held at low confidence, including “${unproven[0].title}”.`,
      href: unproven[0].href,
      linkLabel: "Read the claim",
    });
  }

  // Numbers that would settle an argument, that nobody is collecting. Rolled
  // into one line: six near-identical sentences is another wall, which is the
  // thing this section exists to be an alternative to.
  const unmeasured = evidence.filter(
    (candidate) => candidate.kind === "metric" && (candidate.dataStatus === "unknown" || candidate.dataStatus === "not-measured"),
  );
  if (unmeasured.length) {
    ends.push({
      kind: "unmeasured",
      invitation:
        unmeasured.length === 1
          ? `${unmeasured[0].title} would tell us whether this works, and nobody measures it.`
          : `Nothing here is measured yet — ${names(unmeasured.map((metric) => metric.title))}.`,
      href: unmeasured[0].href,
      linkLabel: unmeasured.length === 1 ? "Read the metric" : "Start with one",
    });
  }

  // A bet is an argument until something runs.
  if (node.kind === "bet" && !neighbours(graph, node, "prototype").length) {
    ends.push({ kind: "untested", invitation: "This bet has no prototype, so nothing has tested it yet." });
  }

  if (node.coverage.total > 0 && node.coverage.filled / node.coverage.total < 1 / 2) {
    ends.push({
      kind: "thin",
      invitation: `Thinly described — nothing written down for ${names(node.coverage.missing, 3).toLowerCase()}.`,
    });
  }

  return ends;
}
