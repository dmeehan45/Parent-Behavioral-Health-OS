import { getRepository } from "@/lib/content/repository";
import { findGaps } from "./gaps";
import { decisionId, loadDecisions, loadHandoffs, supersededDecisions } from "./intake";
import { buildQueue, loadQuestions, nextUp } from "./questions";
import { findingState, type QueueEntry, type ReviewFinding, type ReviewIndex, type ReviewRun, type ReviewSource } from "./view";

/**
 * `research/` projected for the review interface.
 *
 * The same relationship the map has to `content/`: this reads the filesystem
 * and is server-only, and the interface reads the shape it returns rather than
 * the files. Adding a handoff, a question, or a decision file needs no change
 * under `app/` or `components/`.
 *
 * Research is staging, so nothing here is canonical and none of it moves the
 * map's revision. It exists so the reviewer's step — the one place a person's
 * judgement enters the model — is a page you can read and think in, rather than
 * a YAML file you assemble by hand.
 */
export function projectReview(): ReviewIndex {
  const handoffs = loadHandoffs();
  const decisions = loadDecisions();
  const questions = loadQuestions();
  const repo = getRepository();
  const superseded = supersededDecisions(decisions);

  const decisionsByRun = new Map(decisions.map((record) => [record.decisions.runId, record.decisions]));
  const questionText = new Map(questions.map(({ question }) => [question.id, question.question]));

  const records = [...repo.stages, ...repo.steps, ...repo.problems, ...repo.bets, ...repo.claims, ...repo.metrics, ...repo.entities];
  const titleOf = (id: string) => {
    const record = records.find((candidate) => candidate.id === id);
    if (!record) return { title: id, href: "#", kind: "unknown" };
    const kind = repo.stages.includes(record as never)
      ? "stage"
      : repo.steps.includes(record as never)
        ? "step"
        : repo.problems.includes(record as never)
          ? "problem"
          : repo.bets.includes(record as never)
            ? "bet"
            : repo.claims.includes(record as never)
              ? "claim"
              : repo.metrics.includes(record as never)
                ? "metric"
                : "entity";
    const title = "title" in record ? record.title : "statement" in record ? record.statement : id;
    return { title, href: `/${kind}s/${id}`, kind };
  };

  // Which canonical records already cite which decision. This is what separates
  // "a reviewer accepted this" from "the model actually says it now" — the gap
  // where accepted research otherwise sits forever having changed nothing.
  const appliedBy = new Map<string, Array<{ id: string; title: string; href: string; kind: string }>>();
  for (const record of records) {
    for (const trace of record.researchTrace ?? []) {
      appliedBy.set(trace.decision, [...(appliedBy.get(trace.decision) ?? []), { id: record.id, ...titleOf(record.id) }]);
    }
  }

  // Which runs read which source, so a reviewer can see when a run is going
  // over ground an earlier one covered.
  const readers = new Map<string, string[]>();
  for (const { handoff } of handoffs) {
    for (const source of handoff.sources) {
      readers.set(source.identity, [...(readers.get(source.identity) ?? []), handoff.run.id]);
    }
  }

  const runs: ReviewRun[] = handoffs.map(({ handoff, file, hash }) => {
    const record = decisionsByRun.get(handoff.run.id);
    const byDecisionId = new Map((record?.decisions ?? []).map((decision) => [decision.id, decision]));

    const sources: ReviewSource[] = handoff.sources.map((source) => ({
      id: source.id,
      identity: source.identity,
      kind: source.kind,
      title: source.title,
      access: source.access,
      locator: source.locator.url ?? source.locator.doi ?? [source.locator.repository, source.locator.path].filter(Boolean).join("/"),
      url: source.locator.url,
      alsoReadBy: (readers.get(source.identity) ?? []).filter((run) => run !== handoff.run.id),
    }));

    const findings: ReviewFinding[] = handoff.findings.map((finding) => {
      const id = decisionId(handoff.run.id, finding.id);
      // What earlier runs concluded from the same sources. This is the context
      // that turns "is this true" into "does this change what we already
      // thought", which is the question actually worth a reviewer's time.
      const identities = new Set(
        finding.sourceIds.map((sourceId) => handoff.sources.find((source) => source.id === sourceId)?.identity).filter(Boolean) as string[],
      );
      const priorArt = handoffs
        .filter((other) => other.handoff.run.id !== handoff.run.id)
        .flatMap((other) =>
          other.handoff.findings
            .filter((candidate) =>
              candidate.sourceIds.some((sourceId) =>
                identities.has(other.handoff.sources.find((source) => source.id === sourceId)?.identity ?? ""),
              ),
            )
            .map((candidate) => {
              const otherId = decisionId(other.handoff.run.id, candidate.id);
              const otherDecision = decisionsByRun.get(other.handoff.run.id)?.decisions.find((entry) => entry.id === otherId);
              return {
                run: other.handoff.run.id,
                finding: candidate.id,
                statement: candidate.statement,
                state: superseded.get(otherId) ? `superseded by ${superseded.get(otherId)}` : (otherDecision?.disposition ?? "not yet reviewed"),
              };
            }),
        );

      const partial = {
        id: finding.id,
        decisionId: id,
        statement: finding.statement,
        classification: finding.classification,
        evidenceStance: finding.evidenceStance,
        evidenceQuality: finding.evidenceQuality,
        generalizedApplicability: finding.generalizedApplicability,
        sourceIds: finding.sourceIds,
        suggestedTargets: finding.suggestedTargets.map((target) => ({ id: target, ...titleOf(target) })),
        existingClaimCandidates: (finding.existingClaimCandidates ?? []).map((claimId) => ({
          id: claimId,
          statement: repo.claims.find((claim) => claim.id === claimId)?.statement ?? claimId,
          href: `/claims/${claimId}`,
        })),
        proposedClaim: finding.proposedClaim,
        extract: finding.extract,
        uncertainty: finding.uncertainty,
        priorArt,
        decision: byDecisionId.get(id),
        supersededBy: superseded.get(id),
        appliedIn: appliedBy.get(id) ?? [],
      };
      return { ...partial, state: findingState(partial) };
    });

    const candidates = handoff.candidates.map((candidate) => {
      const id = decisionId(handoff.run.id, candidate.id);
      const partial = {
        id: candidate.id,
        decisionId: id,
        kind: candidate.kind,
        description: candidate.description,
        targets: candidate.targets.map((target) => ({ id: target, ...titleOf(target) })),
        restsOn: candidate.restsOn,
        rationale: candidate.rationale,
        wouldWeakenIf: candidate.wouldWeakenIf,
        decision: byDecisionId.get(id),
        appliedIn: appliedBy.get(id) ?? [],
      };
      // The same three states a finding has, and for the same reason: accepted
      // and applied are different, and a candidate accepted months ago that
      // never became a Problem is exactly the debt this distinction exists for.
      return { ...partial, state: findingState({ ...partial, appliedIn: partial.appliedIn }) };
    });

    // A note's state comes from one line covering the whole set, plus the
    // exceptions named against it. `except` flips whichever way the batch went,
    // so one good note survives a discarded batch and one bad note can be
    // dropped from a kept one.
    const notesDecision = record?.notes;
    const flipped = new Set(notesDecision?.except ?? []);
    const notes = handoff.notes.map((note) => {
      const kept = notesDecision ? (notesDecision.disposition === "noted") !== flipped.has(note.id) : undefined;
      return {
        id: note.id,
        statement: note.statement,
        sourceIds: note.sourceIds,
        // An anchor may be a queued question rather than a canonical record.
        // `titleOf` would call that unknown, which is exactly backwards: a note
        // gathered for an open question is doing the job notes exist for.
        anchors: note.anchors.map((anchor) =>
          questionText.has(anchor)
            ? { id: anchor, title: questionText.get(anchor) as string, href: `/review#${anchor}`, kind: "question" }
            : { id: anchor, ...titleOf(anchor) },
        ),
        note: note.note,
        state: kept === undefined ? ("awaiting" as const) : kept ? ("kept" as const) : ("discarded" as const),
      };
    });

    return {
      id: handoff.run.id,
      question: handoff.run.question,
      synthesis: handoff.run.synthesis,
      createdAt: handoff.run.createdAt.toISOString().slice(0, 10),
      preparedBy: [handoff.run.preparedBy.kind, handoff.run.preparedBy.provider, handoff.run.preparedBy.model].filter(Boolean).join(" · "),
      provenance: `${handoff.run.provenance.method} — ${handoff.run.provenance.context}`,
      hash,
      file,
      decisionFile: `research/decisions/${handoff.run.id}.yaml`,
      answers: (handoff.run.answers ?? []).map((id) => ({ id, question: questionText.get(id) ?? id })),
      kind: handoff.run.kind ?? "research",
      reflectsOn: handoff.run.reflectsOn ?? [],
      sources,
      findings,
      candidates,
      notes,
      notesDecision,
      openQuestions: handoff.questions,
      reviewer: record?.reviewer,
      // Candidates count here too: they are decided one at a time, so a
      // reflection carrying eight undecided candidates is eight pieces of work
      // and should not read as "reviewed" because its findings were.
      decided: [...findings, ...candidates].filter((item) => item.decision).length,
      total: findings.length + candidates.length,
    };
  });

  const supersedable = runs.flatMap((run) =>
    run.findings
      .filter((finding) => finding.decision && ["accept", "accept-with-edits"].includes(finding.decision.disposition) && !finding.supersededBy)
      .map((finding) => ({ id: finding.decisionId, run: run.id, statement: finding.statement })),
  );

  // The same queue `npm run research:queue` prints. Asked questions first,
  // then gaps the model has in itself — so somebody deciding what is worth
  // investigating is looking at the same list a scheduled run would pick from,
  // rather than at a terminal they have to remember to open.
  // Which bets are already held up by which question. A question nothing is
  // waiting on and a question blocking a build look identical in a list ordered
  // by priority alone, and the second is the one worth answering first.
  const awaiting = new Map<string, string[]>();
  for (const bet of repo.bets) {
    for (const id of bet.awaiting ?? []) awaiting.set(id, [...(awaiting.get(id) ?? []), bet.title]);
  }

  const queue: QueueEntry[] = [
    ...nextUp(buildQueue(questions, handoffs)).map((item) => ({
      kind: "question" as const,
      id: item.id,
      question: item.question,
      detail: item.why ?? `Asked by ${item.askedBy}.`,
      blocking: awaiting.get(item.id) ?? [],
    })),
    ...findGaps(repo, handoffs, questions).map((gap) => ({
      kind: "gap" as const,
      id: `${gap.kind}-${gap.subject}`,
      question: gap.suggestedQuestion,
      detail: gap.why,
      subject: gap.subjectKind === "run" ? undefined : { id: gap.subject, ...titleOf(gap.subject) },
    })),
  ];

  return { runs, supersedable, queue, sourceUrl: process.env.NEXT_PUBLIC_CONTENT_SOURCE_URL };
}
