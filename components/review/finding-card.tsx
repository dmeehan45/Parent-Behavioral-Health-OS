"use client";

import Link from "next/link";
import { Badge } from "@/components/model/badges";
import {
  CLASSIFICATION_MEANING,
  DISPOSITIONS,
  DISPOSITION_TONE,
  QUALITY_MEANING,
  requiresEditedRecommendation,
  requiresRationale,
  type Disposition,
  type ReviewFinding,
  type ReviewSource,
} from "@/lib/research/view";
import type { Draft } from "@/components/review/review-workspace";

/**
 * One finding, with everything needed to judge it in one place.
 *
 * The order is the order a reader thinks in: what is claimed, what it rests on,
 * what we already thought, what it would change, and only then what to do about
 * it. A packet in a file can list the same facts; it cannot put the earlier
 * run's conclusion next to this one at the moment the question is "does this
 * change my mind".
 */
export function FindingCard({
  finding,
  sources,
  draft,
  supersedable,
  onChange,
}: {
  finding: ReviewFinding;
  sources: ReviewSource[];
  draft: Draft;
  supersedable: Array<{ id: string; run: string; statement: string }>;
  onChange: (patch: Partial<Draft>) => void;
}) {
  const cited = sources.filter((source) => finding.sourceIds.includes(source.id));
  const disposition = draft.disposition;

  return (
    <article className="review-finding">
      <div className="card-badges">
        <Badge tone="neutral" title={CLASSIFICATION_MEANING[finding.classification]}>
          {finding.classification}
        </Badge>
        <Badge tone="quiet">{finding.evidenceStance}</Badge>
        <Badge tone="quiet" title={QUALITY_MEANING[finding.evidenceQuality]}>
          {finding.evidenceQuality} evidence
        </Badge>
        {finding.generalizedApplicability ? null : <Badge tone="warn">company-specific</Badge>}
        {finding.supersededBy ? <Badge tone="warn">superseded by {finding.supersededBy}</Badge> : null}
      </div>

      <h3 className="review-statement">{finding.statement}</h3>

      {finding.extract ? <blockquote className="review-extract">“{finding.extract}”</blockquote> : null}

      <dl className="review-facts">
        <div>
          <dt>Rests on</dt>
          <dd>
            {cited.map((source) => (
              <span className="review-source" key={source.id}>
                {source.url ? (
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.title} ↗
                  </a>
                ) : (
                  <span>{source.title}</span>
                )}
                <span className="small muted">
                  {" "}
                  ({source.kind}, {source.access}
                  {source.alsoReadBy.length ? `; also read by ${source.alsoReadBy.join(", ")}` : ""})
                </span>
              </span>
            ))}
          </dd>
        </div>

        {finding.uncertainty ? (
          <div>
            <dt>The run is unsure about</dt>
            <dd>{finding.uncertainty}</dd>
          </div>
        ) : null}

        {finding.priorArt.length ? (
          <div>
            <dt>Earlier runs read the same sources</dt>
            <dd>
              <ul className="plain-list">
                {finding.priorArt.map((prior) => (
                  <li key={`${prior.run}-${prior.finding}`}>
                    {prior.statement} <span className="small muted">({prior.run} — {prior.state})</span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}

        {finding.existingClaimCandidates.length ? (
          <div>
            <dt>Claims this might already be</dt>
            <dd>
              <ul className="plain-list">
                {finding.existingClaimCandidates.map((claim) => (
                  <li key={claim.id}>
                    <Link href={claim.href}>{claim.statement}</Link>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}

        {finding.suggestedTargets.length ? (
          <div>
            <dt>Where it would land</dt>
            <dd>
              {finding.suggestedTargets.map((target) => (
                <Link className="chip" key={target.id} href={target.href}>
                  {target.title}
                </Link>
              ))}
            </dd>
          </div>
        ) : null}

        {finding.proposedClaim ? (
          <div>
            <dt>Proposed new Claim</dt>
            <dd>
              {finding.proposedClaim.statement} <span className="small muted">({finding.proposedClaim.id})</span>
            </dd>
          </div>
        ) : null}
      </dl>

      {/*
        The five choices, and nothing about what they mean.

        Each meaning is one sentence, and printing all five on every card set
        the same thirty sentences down a page holding six findings — which is
        the wall this surface had become. The vocabulary is a property of the
        page, not of any one finding, so it is stated once above the list and
        the control here is just the choice.
      */}
      <fieldset className="review-decision">
        <legend className="field-label">Authorization, when you are ready</legend>
        <div className="review-choices">
          {DISPOSITIONS.map((option) => (
            <label className={`review-choice${disposition === option ? " selected" : ""}`} key={option}>
              <input
                type="radio"
                name={finding.decisionId}
                value={option}
                checked={disposition === option}
                onChange={() => onChange({ disposition: option as Disposition })}
              />
              <Badge tone={DISPOSITION_TONE[option]}>{option}</Badge>
            </label>
          ))}
        </div>

        {disposition ? (
          <div className="field">
            <label htmlFor={`${finding.decisionId}-rationale`}>
              {requiresRationale(disposition)
                ? "Why — a later run reads this, so say what would change your mind"
                : "Reviewer note or scope — optional"}
            </label>
            <textarea
              id={`${finding.decisionId}-rationale`}
              className="text-input"
              rows={3}
              value={draft.rationale}
              onChange={(event) => onChange({ rationale: event.target.value })}
            />
            {!requiresRationale(disposition) ? (
              <p className="small muted">
                Preserve how you interpreted the finding, what you are not accepting, or the boundary that matters. This note travels with the decision; it does not itself rewrite the model.
              </p>
            ) : null}
          </div>
        ) : null}

        {disposition && requiresEditedRecommendation(disposition) ? (
          <div className="field">
            <label htmlFor={`${finding.decisionId}-edit`}>Replacement wording for canonical application</label>
            <textarea
              id={`${finding.decisionId}-edit`}
              className="text-input"
              rows={3}
              value={draft.editedRecommendation}
              onChange={(event) => onChange({ editedRecommendation: event.target.value })}
            />
            <p className="small muted">
              Use this only when the revised wording is already clear. If the idea itself still needs reshaping, leave it undecided and continue in conversation instead.
            </p>
          </div>
        ) : null}

        {disposition && supersedable.length ? (
          <div className="field">
            <label htmlFor={`${finding.decisionId}-supersedes`}>Does this replace an earlier conclusion?</label>
            <select
              id={`${finding.decisionId}-supersedes`}
              className="text-input"
              value={draft.supersedes}
              onChange={(event) => onChange({ supersedes: event.target.value })}
            >
              <option value="">No — this stands on its own</option>
              {supersedable.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.run}: {entry.statement}
                </option>
              ))}
            </select>
            <p className="small muted">
              Superseding retires the earlier decision. Any canonical record still citing it stops validating, which is
              how a later run actually changes what the model is allowed to claim.
            </p>
          </div>
        ) : null}
      </fieldset>
    </article>
  );
}
