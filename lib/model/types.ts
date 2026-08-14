/**
 * View-model types for the system map.
 *
 * These types describe a *projection* of `content/`, not a second source of
 * truth. Every field here is derived in `lib/model/graph.ts` from canonical
 * Markdown and YAML. Components read this shape and nothing else, which is what
 * keeps literal stage/step/bet/claim/metric IDs out of `app/` and `components/`.
 */

/** Every primitive in the model that can appear as a node on a canvas. */
export type NodeKind =
  | "stage"
  | "step"
  | "problem"
  | "bet"
  | "prototype"
  | "claim"
  | "metric"
  | "entity";

/**
 * A lens is a way of looking at the same model. Switching lenses re-projects
 * the canvas rather than navigating somewhere else, which is how the map holds
 * more context than a single diagram could.
 */
export type LensId = "flow" | "bets" | "evidence" | "entities";

export type EdgeKind =
  | "flow" // stage to stage, from content/map.yaml
  | "feedback" // stage to stage, where the relationship loops backwards
  | "process" // step to step, from `next`
  | "problem" // stage or step to a problem said to bite there
  | "bet" // problem to a bet proposed against it
  | "prototype" // bet to its prototype
  | "evidence" // claim or metric to what it targets
  | "state"; // step to entity, via inputs and outputs

export type Tone = "neutral" | "accent" | "evidence" | "warn" | "quiet";

/** A small derived count rendered on a node and in the detail sheet. */
export type Signal = {
  label: string;
  value: number;
  tone: Tone;
};

/**
 * Detail-sheet content. Blocks are built only for fields the content actually
 * populates, so an under-described primitive renders as short rather than as a
 * page full of empty headings.
 */
export type DetailBlock =
  | { type: "prose"; label: string; value: string }
  | { type: "markdown"; label: string; value: string }
  | { type: "list"; label: string; items: string[] }
  | {
      type: "states";
      label: string;
      items: Array<{ entityId: string; entityTitle: string; state: string; href: string }>;
    }
  | {
      type: "rules";
      label: string;
      items: Array<{ id: string; statement: string; authority?: string }>;
    }
  | {
      type: "links";
      label: string;
      items: Array<{ id: string; title: string; href: string; kind: NodeKind; meta?: string }>;
    };

/**
 * How completely a primitive has been described. The schemas are deliberately
 * permissive, so this is a navigational aid rather than a score to maximise:
 * it shows where thinking exists and where it does not.
 */
export type Coverage = {
  filled: number;
  total: number;
  /** Human-readable names of the modelable fields that are still empty. */
  missing: string[];
};

export type ModelNode = {
  /** Globally unique across kinds, e.g. `stage:matching`. */
  id: string;
  kind: NodeKind;
  /** The `id` as written in the content file. */
  contentId: string;
  title: string;
  /** Secondary identity line, e.g. the stage a step belongs to. */
  subtitle?: string;
  summary?: string;
  order?: number;
  status?: string;
  authority?: string;
  confidence?: string;
  dataStatus?: string;
  lastReviewed?: string;
  provenance?: string;
  /** Node id of the containing stage, for steps. Drives in-canvas expansion. */
  parentId?: string;
  /** Canonical detail route for deep links and full-page reads. */
  href: string;
  /** Repository-relative path of the file this node was projected from. */
  file: string;
  signals: Signal[];
  coverage: Coverage;
  /**
   * For a bet: which parts of the approved experiment shape are still unwritten.
   * Derived from the body's sections, so it is empty for every other kind.
   */
  experimentGaps?: string[];
  blocks: DetailBlock[];
  /** Lowercased haystack for the command palette. */
  searchText: string;
  /** Which lenses show this node. */
  lenses: LensId[];
  /**
   * Content fingerprint. The client diffs these across revisions to highlight
   * exactly what changed when someone pushes to the repository.
   */
  hash: string;
};

export type ModelEdge = {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
  label?: string;
  lenses: LensId[];
};

export type LensDescriptor = {
  id: LensId;
  label: string;
  /** One line explaining what question this lens answers. */
  description: string;
  nodeCount: number;
};

export type VocabTerm = {
  id: string;
  label: string;
  description: string;
  tone: Tone;
};

/**
 * A way into the model for someone who has never seen it.
 *
 * Reading a graph is a skill; using a piece of software is not. An entry point
 * pairs the problem in the words the model already uses with the working
 * software built against it, so a first-time reader can start with the thing
 * that needs no explanation and follow it back into the model afterwards.
 */
export type EntryPoint = {
  id: string;
  /** The bet's title. */
  title: string;
  /** Title of the Problem the bet answers. */
  problemTitle?: string;
  problemHref?: string;
  /** The problem the bet was written against, in the model's own words. */
  problem?: string;
  /** What the bet proposes doing about it. */
  intervention?: string;
  /** Route of the working software. */
  href: string;
  betHref: string;
  status?: string;
  confidence?: string;
};

/**
 * The complete projection handed to the client. Small enough to ship whole,
 * which is what lets lens switching and search stay instant.
 */
export type ModelGraph = {
  /** Content fingerprint for the whole repository. Drives live updates. */
  revision: string;
  title: string;
  nodes: ModelNode[];
  edges: ModelEdge[];
  lenses: LensDescriptor[];
  /** Size of the model in plain words. Labels are already pluralised. */
  stats: Array<{ label: string; value: number }>;
  /** Working software a newcomer can try, derived from Bets that declare it. */
  entryPoints: EntryPoint[];
  vocab: {
    authority: VocabTerm[];
    edges: Array<{ kind: EdgeKind; label: string; description: string }>;
  };
  /** Base URL for "view source" links, when configured. */
  sourceUrl?: string;
  /** Repository root, derived from `sourceUrl`, for clone instructions. */
  repoUrl?: string;
};
