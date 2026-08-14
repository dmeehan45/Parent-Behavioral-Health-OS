import Link from "next/link";
import { Markdown } from "@/components/markdown";
import { projectModel } from "@/lib/model/graph";
import { KIND_LABELS, KIND_MEANING, ORIENTATION_KINDS } from "@/lib/model/kinds";

export const dynamic = "force-dynamic";

/**
 * The front door gives a reader three ways to begin: see the care-delivery
 * flow, inspect a problem, or try the current prototype. Contributor mechanics
 * belong in the repository guidance, not in the default reading path.
 */
export default function Home() {
  const graph = projectModel();
  const [firstRun] = graph.entryPoints;
  const contributing = graph.sourceUrl
    ? `${graph.sourceUrl.replace(/\/$/, "")}/CONTRIBUTING.md`
    : undefined;

  return (
    <main className="shell page home">
      <section className="home-hero">
        <h1>
          See how care moves through a practice — and where it can <em className="script">break</em>
        </h1>
        <p className="lede">
          Follow the work a clinician and family move through, examine the problems we have found, and try the ideas
          being tested. The map separates what is known, proposed, and still unanswered.
        </p>
        <p className="muted small">
          This is a general reference model, not a medical record or a description of a particular company. It contains
          no real patient, clinician, or practice data.
        </p>

        <div className="home-actions">
          <Link className="button" href="/map">
            Explore the care flow <span aria-hidden="true">→</span>
          </Link>
          {firstRun ? (
            <Link className="button secondary" href={firstRun.href}>
              Try the prototype
            </Link>
          ) : null}
        </div>
      </section>

      <ul className="home-doors" aria-label="What is in the model, and where to find it">
        {graph.stats.map((entry) => (
          <li key={entry.label}>
            <Link href={entry.href}>
              <strong>{entry.value}</strong>
              <span>
                {entry.label}{" "}
                <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {firstRun ? (
        <section className="home-start">
          <span className="eyebrow">A problem to examine</span>
          <h2>{firstRun.problemTitle ?? firstRun.title}</h2>

          {firstRun.problem ? (
            <div className="start-block">
              <h3 className="field-label">What happens today</h3>
              <Markdown source={firstRun.problem} />
            </div>
          ) : null}

          {firstRun.intervention ? (
            <div className="start-block">
              <h3 className="field-label">What is being tested</h3>
              <Markdown source={firstRun.intervention} />
            </div>
          ) : null}

          <div className="home-actions">
            <Link className="button" href={firstRun.href}>
              Try the prototype <span aria-hidden="true">→</span>
            </Link>
            {firstRun.problemHref ? (
              <Link className="button secondary" href={firstRun.problemHref}>
                Read the problem
              </Link>
            ) : null}
          </div>
          <p className="muted small">The prototype uses invented examples. Nothing you do in it is saved.</p>
        </section>
      ) : null}

      <section className="home-band">
        <span className="eyebrow">The full picture</span>
        <h2>Start with the care flow, then follow what matters to you</h2>
        <p className="muted">
          The map begins with the stages of care delivery. Open a stage to see its steps, or follow a link to a problem,
          the evidence behind it, and any idea being tested. You do not need to understand every part before you begin.
        </p>
        <div className="home-actions">
          <Link className="button secondary" href="/map">
            Open the map <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <details className="disclosure home-vocab">
        <summary>Words used on the map</summary>
        <dl className="define-list">
          {ORIENTATION_KINDS.map((kind) => (
            <div key={kind}>
              <dt>{KIND_LABELS[kind]}</dt>
              <dd>{KIND_MEANING[kind]}</dd>
            </div>
          ))}
        </dl>
      </details>

      <section className="home-band">
        <span className="eyebrow">How it stays trustworthy</span>
        <h2>New evidence is reviewed before it changes the map</h2>
        <p className="muted">
          Research can suggest a change, but it does not become part of this model until a named person reviews it.
          Proposals, approved rules, and unanswered questions remain visibly different.
        </p>
        <div className="home-actions">
          <Link className="button secondary" href="/review">
            Review the research <span aria-hidden="true">→</span>
          </Link>
          {contributing ? (
            <a className="button secondary" href={contributing} target="_blank" rel="noreferrer">
              How to contribute <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </div>
      </section>

      <p className="page-note">
        This model is generalized and provisional. Much of it is proposed rather than settled, and naming what is wrong
        or missing is a useful contribution.
      </p>
    </main>
  );
}
