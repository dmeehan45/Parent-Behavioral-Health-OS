import Link from "next/link";
import { Markdown } from "@/components/markdown";
import { projectModel } from "@/lib/model/graph";
import { KIND_LABELS, KIND_MEANING, ORIENTATION_KINDS } from "@/lib/model/kinds";

export const dynamic = "force-dynamic";

/**
 * The front door.
 *
 * Its whole job is orientation: what this is, what the words mean, what to try
 * first, and how to work on it with your own tools. Everything specific to the
 * model — the numbers, the problem, the software that exists — is derived from
 * `content/`, so this page describes the artifact without ever naming a stage,
 * a bet, or a count.
 */
export default function Home() {
  const graph = projectModel();
  const [firstRun] = graph.entryPoints;

  return (
    <main className="shell page home">
      <section className="home-hero">
        {/* One script word per page, in the h1, in brand blue. It is the design
            system's signature device and it stops working if it is used twice. */}
        <h1>
          How the practice <em className="script">actually</em> works, and where we think it breaks
        </h1>
        <p className="lede">
          This is a written model of a parent-focused behavioral health practice. It lays out the stages a clinician and
          a family move through, what has to happen at each one, and the places we are not confident it holds up. Where
          we have a fix worth testing, there is working software you can try.
        </p>
        <p className="muted small">
          It is a reference model, not a product, and it holds no patient, clinician, or practice data.
        </p>

        <div className="home-actions">
          {firstRun ? (
            <Link className="button" href={firstRun.href}>
              Try the prototype <span aria-hidden="true">→</span>
            </Link>
          ) : null}
          <Link className={firstRun ? "button secondary" : "button"} href="/map">
            Open the system map
          </Link>
        </div>
      </section>

      <section className="home-band">
        <span className="eyebrow">What you are looking at</span>
        <p className="home-lead">These words do most of the work here.</p>
        <dl className="define-list">
          {ORIENTATION_KINDS.map((kind) => (
            <div key={kind}>
              <dt>{KIND_LABELS[kind]}</dt>
              <dd>{KIND_MEANING[kind]}</dd>
            </div>
          ))}
        </dl>
        <p className="muted">
          The loop is short. Write down how the machine works. Mark the places it breaks. Pick one, write the bet, and
          build the smallest thing that tests it. Put what you learn back into the model.
        </p>
      </section>

      <section className="home-stats" aria-label="The size of the model today">
        {graph.stats.map((entry) => (
          <div key={entry.label}>
            <strong>{entry.value}</strong>
            <span>{entry.label}</span>
          </div>
        ))}
      </section>

      {firstRun ? (
        <section className="home-start">
          <span className="eyebrow">Start here</span>
          <h2>{firstRun.problemTitle ?? firstRun.title}</h2>

          {firstRun.problem ? (
            <div className="start-block">
              <h3 className="field-label">What happens today</h3>
              <Markdown source={firstRun.problem} />
            </div>
          ) : null}

          {firstRun.intervention ? (
            <div className="start-block">
              <h3 className="field-label">What we want to try</h3>
              <Markdown source={firstRun.intervention} />
            </div>
          ) : null}

          <div className="home-actions">
            <Link className="button" href={firstRun.href}>
              Try it <span aria-hidden="true">→</span>
            </Link>
            <Link className="button secondary" href={firstRun.betHref}>
              Read the reasoning
            </Link>
            {firstRun.problemHref ? (
              <Link className="button secondary" href={firstRun.problemHref}>
                Read the problem
              </Link>
            ) : null}
          </div>
          <p className="muted small">
            The prototype uses invented families and clinicians. Nothing you do in it is saved anywhere.
          </p>
        </section>
      ) : null}

      <section className="home-band">
        <span className="eyebrow">The rest of it</span>
        <h2>Everything else lives on one map</h2>
        <p className="muted">
          The map shows the whole model on a single canvas, with the stages laid out in the order work moves through
          them. Open a stage to see the steps inside it without losing the rest of the picture. Whatever you select
          opens beside the canvas, showing what we know, what we are assuming, and what we have not worked out yet.
        </p>
        <div className="home-actions">
          <Link className="button secondary" href="/map">
            Open the system map <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/*
        The front door described the model, the map and the prototypes, and said
        nothing about where new thinking comes from — so the loop that actually
        keeps the model current was discoverable only by noticing a word in the
        navigation. It is the part a reader is most likely to want to join.
      */}
      <section className="home-band">
        <span className="eyebrow">Keeping it current</span>
        <h2>Research arrives as a proposal, and a person decides</h2>
        <p className="muted">
          Reading about this practice in ChatGPT or Claude produces things worth writing down. Those arrive here as a
          bounded handoff in the repository — sources, findings, and what the run was unsure about — never as an edit to
          the model. A scheduled run adds more twice a day, working from questions people asked and from gaps the model
          has in itself.
        </p>
        <p className="muted">
          Nothing becomes part of the model until somebody reads it and decides. That decision is the point: it is where
          you work out what is actually true, what it changes, and what is worth building against. No agent can skip it.
        </p>
        <div className="home-actions">
          <Link className="button secondary" href="/review">
            See what research is proposing <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="home-band">
        <span className="eyebrow">Working on this</span>
        <h2>Point your coding agent at it</h2>
        <p className="muted">
          Everything on this page comes from Markdown files in <code>content/</code>. There is no database and no admin
          screen, which means any coding agent you already use can read the model, argue with it, and add to it.
        </p>
        <ol className="home-steps">
          <li>
            <strong>Clone the repository.</strong>
            {graph.repoUrl ? <code className="home-clone">git clone {graph.repoUrl}.git</code> : null}
          </li>
          <li>
            <strong>Have it read <code>AGENTS.md</code> first.</strong> That file sets out the rules that keep this
            honest, including the one that matters most: content is the source, and the interface only draws it.
          </li>
          <li>
            <strong>Ask for one small thing.</strong> Describe a problem you have seen in practice, write a bet against
            it, or build the software that would test one.
          </li>
        </ol>
        <p className="muted">
          Leave the map open while it works. The page watches the repository and redraws within a few seconds of a
          change landing, highlighting whatever moved, so you can watch the model change as it is edited.
        </p>
        {graph.repoUrl ? (
          <div className="home-actions">
            <a className="button secondary" href={graph.repoUrl} target="_blank" rel="noreferrer">
              Open the repository <span aria-hidden="true">↗</span>
            </a>
          </div>
        ) : null}
      </section>

      <p className="page-note">
        This model is generalized and provisional. It does not describe any particular company, it is not a medical
        record system, and much of it is still marked as proposed rather than settled.
      </p>
    </main>
  );
}
