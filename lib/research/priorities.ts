import type { QueueItem } from "./questions";

export type BetResearchLink = {
  id: string;
  title: string;
  awaiting?: string[];
  prototype?: { status?: string; route?: string };
};

export type ResearchFamily = {
  betId: string;
  title: string;
  prototypeStatus?: string;
  questions: QueueItem[];
};

const OWED_KINDS = new Set(["undecided", "unapplied", "unconverted", "saturated"]);

/**
 * A question that can change a live product experiment is more useful than one
 * that only makes the model more complete. A working prototype outranks a bet
 * with an implemented-but-unchecked route, which outranks an unbuilt bet.
 */
function betRank(bet: BetResearchLink) {
  if (bet.prototype?.status === "working") return 0;
  if (bet.prototype?.route) return 1;
  return 2;
}

function questionRank(questionId: string, bets: BetResearchLink[]) {
  const ranks = bets
    .filter((bet) => bet.awaiting?.includes(questionId))
    .map(betRank);
  return ranks.length ? Math.min(...ranks) : 3;
}

/** Preserve the queue's priority order inside the stronger product signal. */
export function prioritizeQuestions(open: QueueItem[], bets: BetResearchLink[]) {
  const position = new Map(open.map((item, index) => [item.id, index]));
  return [...open].sort(
    (a, b) => questionRank(a.id, bets) - questionRank(b.id, bets) || (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0),
  );
}

/**
 * A Bet is the useful family boundary: it names the product decision the
 * research is supposed to improve. This avoids inventing a second taxonomy
 * beside the operating model while still keeping related questions together.
 */
export function researchFamilies(open: QueueItem[], bets: BetResearchLink[]): ResearchFamily[] {
  const byId = new Map(open.map((item) => [item.id, item]));
  return bets
    .map((bet) => ({
      betId: bet.id,
      title: bet.title,
      prototypeStatus: bet.prototype?.status,
      questions: (bet.awaiting ?? []).map((id) => byId.get(id)).filter((item): item is QueueItem => Boolean(item)),
      rank: betRank(bet),
    }))
    .filter((family) => family.questions.length)
    .sort((a, b) => a.rank - b.rank || a.betId.localeCompare(b.betId))
    .map(({ rank: _rank, ...family }) => family);
}

/**
 * Research intake must not outrun the person who decides what enters the model.
 * Model gaps remain visible, but they are inventory rather than automatic work.
 * The checked-in example run is documentation, not live reviewer debt.
 */
export function blocksNewResearch(gaps: Array<{ kind: string; subject: string }>) {
  return gaps.some((gap) => OWED_KINDS.has(gap.kind) && gap.subject !== "example-public-research");
}
