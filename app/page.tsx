import Link from "next/link";
import { KindBadge } from "@/components/model/badges";
import { Markdown } from "@/components/markdown";
import { projectModel } from "@/lib/model/graph";
import { KIND_LABELS, KIND_MEANING, ORIENTATION_KINDS } from "@/lib/model/kinds";
import type { NodeKind } from "@/lib/model/types";

export const dynamic = "force-dynamic";

/**
 * The front door gives a reader three ways to begin: see the care-delivery
 * flow, inspect a problem, or try the current prototype. Contributor mechanics
 * belong in the repository guidance, not in the default reading path.
 */
export default function Home() {
  const graph = projectModel();
  const [firstRun] = graph.entryPoints;
  const [firstBet] = graph.buildTargets;
  const unbuilt = graph.buildTargets.filter((bet) => !bet.built);
  const briefCommand = `npm run prototype:brief -- ${firstBet ? firstBet.id : "<bet-id>"}`;
  const sourceFile = (path: string) =>
    graph.sourceUrl ? `${graph.sourceUrl.replace(/\/$/, "")}/${path}` : undefined;
  const agentsFile = sourceFile("AGENTS.md");
  const contributing = sourceFile("CONTRIBUTING.md");

  const loop: Array<{
    name: string;
    kind?: NodeKind;
    essence: string;
    carries: string;
    detail: React.ReactNode;
    command?: string;
  }> = [
    {
      name: "Research",
      essence:
        "A question goes to a chat agent or to a scheduled run, and comes back as a bounded handoff in the repository: sources, findings small enough to argue with one at a time, and what it was still unsure about.",
      carries: "The sources and the uncertainty, still attached to the finding.",
      detail: (
        <p>
          It never edits the model. The brief prints what earlier runs established, and validation rejects an exact
          restatement rather than letting the same finding accumulate unnoticed.
        </p>
      ),
      command: "npm run research:brief -- <question-id>",
    },
    {
      name: "Problem",
      kind: "problem",
      essence:
        "A person reads the finding next to its evidence and decides. What it can become is a named problem: where the care-delivery flow breaks, which stages and steps it affects, and what that costs.",
      carries: "The targets and the evidence, already linked.",
      detail: (
        <p>
          Naming a problem is a complete contribution — it does not need an answer yet. The tooling prepares its
          identity, targets, and reviewed research trace, then leaves the title and body for a person to write.
        </p>
      ),
    },
    {
      name: "Bet",
      kind: "bet",
      essence:
        "One problem, one proposed answer, and the shape of the experiment: what trying it should settle, what it assumes, and the signal that would show we were wrong.",
      carries: "The experiment's shape, with a history.",
      detail: (
        <p>
          A bet links to the problem instead of restating it. Approving the experiment in a pull request leaves the next
          person a durable account of what was agreed.
        </p>
      ),
    },
    {
      name: "Prototype",
      kind: "prototype",
      essence:
        "One command gathers the bet, the problem, the relevant flow and rules, the evidence and its weaknesses, and what is known, assumed, or still unknown.",
      carries: "Everything above, in one brief.",
      detail: (
        <p>
          A coding agent can build from that brief. If nobody has shaped the experiment, the command refuses and names
          the decisions a person still needs to make instead of filling the gaps with guesses.
        </p>
      ),
      command: briefCommand,
    },
    {
      name: "What it teaches",
      essence:
        "Somebody uses the software and reacts. That returns as research for a person to review, because one reaction is a reported observation rather than a proven claim.",
      carries: "Back to the start, as evidence the next review can see.",
      detail: (
        <p>
          An accepted finding can then support a separate change to <code>content/</code>. The open map redraws after
          that change lands and highlights what moved.
        </p>
      ),
    },
  ];

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

      <div className="home-secondary" aria-label="More about this project">
        <details className="disclosure">
          <summary>How questions become prototypes</summary>
          <div className="home-secondary-body">
            <section className="home-band" id="loop">
              <span className="eyebrow">The working loop</span>
              <h2>How a question becomes software you can try</h2>
              <p className="muted">
                Each step leaves a reviewable artifact. Open a step to see what it adds and what moves forward.
              </p>

              <ol className="loop">
                {loop.map((step) => (
                  <li key={step.name}>
                    <details>
                      <summary>
                        <span className="loop-head">
                          <h3>{step.name}</h3>
                          {step.kind ? <KindBadge kind={step.kind} subtle /> : null}
                        </span>
                        <span className="loop-essence">{step.essence}</span>
                        <span className="loop-carry">
                          <strong>Carries forward:</strong> {step.carries}
                        </span>
                      </summary>
                      <div className="loop-detail">
                        {step.detail}
                        {step.command ? <code className="home-command">{step.command}</code> : null}
                      </div>
                    </details>
                  </li>
                ))}
              </ol>

              <div className="home-actions">
                <Link className="button secondary" href="/review">
                  See what research is proposing <span aria-hidden="true">→</span>
                </Link>
              </div>
            </section>

            <section className="home-band">
              <span className="eyebrow">Who decides what</span>
              <h2>What software can prepare, and what only a person decides</h2>
              <p className="muted">The review step keeps this division clear.</p>

              <div className="home-split">
                <div>
                  <span className="field-label">Software can</span>
                  <ul className="plain-list">
                    <li>Read the repository and answer from what is recorded.</li>
                    <li>Gather public research with its sources attached.</li>
                    <li>Check a finding against earlier conclusions.</li>
                    <li>Prepare the next step&rsquo;s context.</li>
                    <li>Build a shaped prototype and run validation.</li>
                  </ul>
                </div>
                <div>
                  <span className="field-label">A person decides</span>
                  <ul className="plain-list">
                    <li>Whether a finding is credible and what it changes.</li>
                    <li>Whether the account reflects family and clinician experience.</li>
                    <li>Which defensible approach is worth trying.</li>
                    <li>Whether a practice could realistically run a proposed change.</li>
                    <li>What an experiment should settle before it is built.</li>
                    <li>What using the prototype teaches.</li>
                  </ul>
                </div>
              </div>

              <p className="muted">
                Research cannot promote itself. A published record must cite a decision made by a named person, and
                validation rejects it otherwise.
              </p>
            </section>
          </div>
        </details>

        <details className="disclosure" id="use-it">
          <summary>Use, adapt, or contribute to this project</summary>
          <div className="home-secondary-body">
            <section className="home-band">
              <span className="eyebrow">Three ways in</span>
              <h2>Read it, build from it, or adapt it</h2>
              <p className="muted">
                The source material is Markdown with YAML frontmatter in <code>content/</code>. There is no database or
                admin screen.
              </p>

              <ol className="home-ways">
                <li>
                  <h3>Study the problem space with your own tools</h3>
                  <p>
                    Clone the repository and ask about its stages, problems, claims, and metrics. Records also name what
                    has not been described, so a thin account remains visibly incomplete.
                  </p>
                  {graph.repoUrl ? <code className="home-command">git clone {graph.repoUrl}.git</code> : null}
                </li>
                <li>
                  <h3>Build a prototype from a bet</h3>
                  <p>
                    The brief provides the problem, relevant flow, evidence, and honest unknowns, or refuses when nobody
                    has decided what the experiment should settle.
                  </p>
                  <code className="home-command">{briefCommand}</code>
                  {firstBet ? (
                    <p className="small muted">
                      The current example is <Link href={firstBet.href}>{firstBet.title}</Link>
                      {firstBet.problemTitle ? <>, responding to &ldquo;{firstBet.problemTitle}&rdquo;</> : null}.{" "}
                      {unbuilt.length > 0
                        ? `${unbuilt.length === 1 ? "It has" : `${unbuilt.length} bets have`} no prototype yet.`
                        : null}{" "}
                      <Link href="/map?lens=bets">See the other bets</Link>.
                    </p>
                  ) : null}
                </li>
                <li>
                  <h3>Adapt the structure to another system</h3>
                  <p>
                    Replace <code>content/</code> and the map, search, record pages, and briefs follow the new material
                    without requiring each record to be added to the application.
                  </p>
                </li>
              </ol>

              <div className="home-actions">
                {graph.repoUrl ? (
                  <a className="button secondary" href={graph.repoUrl} target="_blank" rel="noreferrer">
                    Open the repository <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
                {agentsFile ? (
                  <a className="button secondary" href={agentsFile} target="_blank" rel="noreferrer">
                    Read the repository rules <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
              </div>
            </section>

            <section className="home-band">
              <span className="eyebrow">Contributing</span>
              <h2>Tell us where this is wrong</h2>
              <p className="muted">
                If you have run a practice like this, worked inside one, or been a family on the other side of it, name
                where this account does not match what you have seen. Naming a problem is a complete contribution; you
                do not have to bring the answer.
              </p>
              <div className="home-actions">
                {contributing ? (
                  <a className="button secondary" href={contributing} target="_blank" rel="noreferrer">
                    How to contribute <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
                {graph.repoUrl ? (
                  <a className="button secondary" href={`${graph.repoUrl}/issues`} target="_blank" rel="noreferrer">
                    Open an issue <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
              </div>
            </section>
          </div>
        </details>
      </div>

      <p className="page-note">
        This model is generalized and provisional. Much of it is proposed rather than settled, and naming what is wrong
        or missing is a useful contribution.
      </p>
    </main>
  );
}
