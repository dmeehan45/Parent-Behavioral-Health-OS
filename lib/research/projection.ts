import { getRepository } from "@/lib/content/repository";
import { decisionId, loadDecisions, loadHandoffs, supersededDecisions } from "./intake";
import { loadQuestions } from "./questions";
import type { ReviewFinding, ReviewIndex, ReviewRun, ReviewSource } from "./view";

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

      return {
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
      packetFile: `research/reviews/${handoff.run.id}.md`,
      decisionFile: `research/decisions/${handoff.run.id}.yaml`,
      answers: (handoff.run.answers ?? []).map((id) => ({ id, question: questionText.get(id) ?? id })),
      sources,
      findings,
      openQuestions: handoff.questions,
      reviewer: record?.reviewer,
      decided: findings.filter((finding) => finding.decision).length,
      total: findings.length,
    };
  });

  const supersedable = runs.flatMap((run) =>
    run.findings
      .filter((finding) => finding.decision && ["accept", "accept-with-edits"].includes(finding.decision.disposition) && !finding.supersededBy)
      .map((finding) => ({ id: finding.decisionId, run: run.id, statement: finding.statement })),
  );

  return { runs, supersedable, sourceUrl: process.env.NEXT_PUBLIC_CONTENT_SOURCE_URL };
}
