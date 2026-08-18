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
  | "return" // step to step, from `exceptions.route` — rework going backward, never ranked
  | "problem" // stage or step to a problem said to bite there
  | "bet" // problem to a bet proposed against it
  | "prototype" // bet to its prototype
  | "evidence" // claim or metric to what it targets
  | "state"; // step to entity, via inputs and outputs

/**
 * Different things can move across the same Stage boundary. These are view
 * semantics over canonical relationships, never a second authored topology.
 */
export type FlowLayerId = "operating" | "data" | "experience" | "learning";

/** A state or information payload the projection can prove crosses a boundary. */
export type FlowTransfer = {
  layer: FlowLayerId;
  label: string;
  /** Projected node ids whose authored relationships establish the transfer. */
  sourceIds: string[];
};

/** A direct Step `next` that crosses the same Stage boundary as a Stage edge. */
export type FlowProcessHandoff = {
  sourceId: string;
  sourceTitle: string;
  targetId: string;
  targetTitle: string;
};

/** A canonical Problem whose targets reach both sides of a Stage connection. */
export type FlowProblemLink = {
  id: string;
  title: string;
  href: string;
};

/**
 * What the projection knows about a Stage-to-Stage connection.
 *
 * `layers` says which kinds of movement are explicitly present. `gaps` says a
 * relationship exists but the model cannot yet describe the payload or handoff
 * at that layer. A gap is intentionally different from an inferred answer.
 */
export type FlowConnectionDepth = {
  layers: FlowLayerId[];
  transfers: FlowTransfer[];
  processHandoffs: FlowProcessHandoff[];
  problems: FlowProblemLink[];
  gaps: FlowLayerId[];
};

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
      /**
       * True when the order of these links is itself a fact about the model —
       * a stage's steps run in sequence, and drawing them as a numbered chain
       * says so. Most link blocks are sets: a bet's targets are places it
       * lands, in no order, and numbering them would assert a sequence nobody
       * wrote down. So this is opt-in, and the projection decides it.
       */
      sequence?: boolean;
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
  /**
   * For a bet: which experiment sections have moved since the prototype was
   * last checked against them. Empty unless something is built and has drifted.
   */
  experimentDrift?: string[];
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
  /** Present only for projected Stage-to-Stage flow and feedback connections. */
  connection?: FlowConnectionDepth;
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
 * A bet somebody could hand to their own coding agent.
 *
 * The front door tells a reader to point an agent at a bet, and an example is
 * worth more there than a placeholder — but a bet id written into a component
 * is a literal from `content/` in application code, which is the one thing the
 * projection exists to prevent. Ordered so the first entry is the most useful
 * invitation: a bet with no software behind it yet.
 */
export type BuildTarget = {
  id: string;
  title: string;
  href: string;
  /** Title of the Problem the bet answers, so a list of bets says why. */
  problemTitle?: string;
  /** Whether a prototype already exists for it. */
  built: boolean;
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
  /**
   * Size of the model in plain words, each count leading to what it counts.
   * Labels are already pluralised.
   */
  stats: Array<{ id: string; label: string; value: number; href: string }>;
  /** Working software a newcomer can try, derived from Bets that declare it. */
  entryPoints: EntryPoint[];
  /** Every Bet, unbuilt ones first, for a reader who wants to build one. */
  buildTargets: BuildTarget[];
  vocab: {
    authority: VocabTerm[];
    edges: Array<{ kind: EdgeKind; label: string; description: string }>;
  };
  /** Base URL for "view source" links, when configured. */
  sourceUrl?: string;
  /** Repository root, derived from `sourceUrl`, for clone instructions. */
  repoUrl?: string;
};
