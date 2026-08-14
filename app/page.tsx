import Link from "next/link";
import { KindBadge } from "@/components/model/badges";
import { Markdown } from "@/components/markdown";
import { projectModel } from "@/lib/model/graph";
import { KIND_LABELS, KIND_MEANING, ORIENTATION_KINDS } from "@/lib/model/kinds";
import type { NodeKind } from "@/lib/model/types";

export const dynamic = "force-dynamic";

/**
 * The front door.
 *
 * Orientation only: what we are modelling and why, how a question becomes
 * software, which half of that work is a machine's and which half is only ever
 * a person's, and what to do with it. Everything specific to the model — the
 * counts, the problem, the bet, the software that exists — is derived from
 * `content/`, so this page never names a stage, a bet, or a number.
 *
 * Depth is behind disclosures rather than laid out end to end. Collapsed, the
 * loop still reads as a complete five-sentence account with its handoffs; open,
 * it adds the mechanism and the commands. A reader should be able to finish the
 * page, not abandon it partway down.
 */
export default function Home() {
  const graph = projectModel();
  const [firstRun] = graph.entryPoints;
  const [firstBet] = graph.buildTargets;
  const unbuilt = graph.buildTargets.filter((bet) => !bet.built);

  // A bet id is content, so the example command borrows one rather than
  // stating it. With nothing to borrow the placeholder is the honest form.
  const briefCommand = `npm run prototype:brief -- ${firstBet ? firstBet.id : "<bet-id>"}`;

  /** A file on the repository's own branch, when the source URL is configured. */
  const sourceFile = (path: string) =>
    graph.sourceUrl ? `${graph.sourceUrl.replace(/\/$/, "")}/${path}` : undefined;

  const agentsFile = sourceFile("AGENTS.md");
  const contributing = sourceFile("CONTRIBUTING.md");

  /*
   * The loop, in the order it runs. It describes the repository's own workflow
   * rather than anything in `content/`, which is why it can live in code: the
   * steps do not change when a stage or a bet does.
   *
   * `essence` and `carries` stay visible; `detail` is what opening a step adds.
   * Two of the five are model primitives and carry their kind. Research and
   * what a prototype teaches deliberately do not: both are staging a person has
   * to decide on, and a category hue would say they were already part of the
   * model.
   */
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
          It never edits the model. The brief is what stops a routine finding the same thing forever: it prints what
          earlier runs established, and restating one of them exactly is a validation error rather than a duplicate
          nobody notices.
        </p>
      ),
      command: "npm run research:brief -- <question-id>",
    },
    {
      name: "Problem",
      kind: "problem",
      essence:
        "A person reads the finding next to its evidence and decides. What it can become is a named problem: where the machine breaks, which stages and steps it bites, and what that costs.",
      carries: "The targets and the evidence, already linked.",
      detail: (
        <p>
          Naming a problem is a complete contribution — it does not need an answer yet. The tooling composes the
          record&rsquo;s identity, its targets and the trace proving it was reviewed, then leaves every word of the body
          empty, because the sentence that names the trouble is a person&rsquo;s.
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
          A bet never restates the trouble, because two copies of it drift apart. Approving the experiment is a pull
          request against the bet rather than a message in a chat, so the next person can read what was agreed without
          asking anybody.
        </p>
      ),
    },
    {
      name: "Prototype",
      kind: "prototype",
      essence:
        "One command composes the whole build context — the bet, the problem, the flow it lands on with its rules and exceptions, the evidence and where it is weak, and an honest known / assumed / unknown.",
      carries: "Everything above, in one paste.",
      detail: (
        <p>
          Hand it to a coding agent and it can start. It can also refuse, and the refusal is the point: a bet whose
          experiment nobody has shaped comes back <em>not ready to build</em>, with the questions to put to a person. A
          guess written into a blank field becomes something the built software makes look real.
        </p>
      ),
      command: briefCommand,
    },
    {
      name: "What it teaches",
      essence:
        "Somebody uses the software and reacts. That re-enters as a handoff decided by a person, because one reaction is a reported observation rather than a proven claim.",
      carries: "Back to the top, as evidence the next run can see.",
      detail: (
        <p>
          Whatever survives that review changes <code>content/</code>, and every open map redraws within seconds of the
          change landing, highlighting what moved.
        </p>
      ),
    },
  ];

  return (
    <main className="shell page home">
      <section className="home-hero">
        {/* One script word per page, in the h1, in brand blue. It is the design
            system's signature device and it stops working if it is used twice. */}
        <h1>
          The problems in a parent behavioral health practice that software could <em className="script">solve</em>
        </h1>
        <p className="lede">
          A model of how the practice actually runs and where it breaks, narrowed to the problems technology can fix —
          so clinicians and families get better outcomes, and what works can be productized.
        </p>
        <p className="home-lead">
          It is an open-source context-to-prototype system. Research becomes a named problem, a problem gets one bet, a
          bet becomes software somebody can try, and what that teaches comes back in. The point is to prototype the
          right solutions to the right problems.
        </p>
        <p className="muted small">
          A reference model, not a product. It holds no patient, clinician, or practice data, and it is wrong in places
          we would like you to find.
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
          <a className="button secondary" href="#use-it">
            Use it yourself
          </a>
        </div>
      </section>

      {/* The counts are the navigation, not decoration: each leads to what it
          counts, so the shape of the model is also the way into it. */}
      <ul className="home-doors" aria-label="What is in the model, and where to find it">
        {graph.stats.map((entry) => (
          <li key={entry.label}>
            <Link href={entry.href}>
              <strong>{entry.value}</strong>
              {/* The space before the arrow is non-breaking. In the narrowest
                  column a plain one drops the arrow onto a line of its own,
                  where it reads as a stray glyph rather than as a link. */}
              <span>
                {entry.label}
                {" "}
                <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <details className="disclosure home-vocab">
        <summary>The four words the model is built from</summary>
        <dl className="define-list">
          {ORIENTATION_KINDS.map((kind) => (
            <div key={kind}>
              <dt>{KIND_LABELS[kind]}</dt>
              <dd>{KIND_MEANING[kind]}</dd>
            </div>
          ))}
        </dl>
        <p className="muted small">
          Each is a Markdown file naming the ones it depends on, which is what makes the whole model readable in one
          pass by a person or an agent.
        </p>
      </details>

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
          <p className="muted small">Invented families and clinicians. Nothing you do in it is saved anywhere.</p>
        </section>
      ) : null}

      <section className="home-band" id="loop">
        <span className="eyebrow">The loop</span>
        <h2>How a question becomes software you can try</h2>
        <p className="muted">
          Four moves and a return. Each leaves a reviewable artifact, and each join is a command that composes the next
          step&rsquo;s context out of what is already written down. Open a step for the mechanism.
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

        <p className="muted">
          Nothing between the steps lives in a chat window. That is why it moves quickly: no context is rebuilt from
          memory, and none goes missing between the question and the build.
        </p>

        <div className="home-actions">
          <Link className="button secondary" href="/review">
            See what research is proposing <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="home-band">
        <span className="eyebrow">Division of labour</span>
        <h2>What the machine does, and what only you do</h2>
        <p className="muted">The loop is arranged around this split, and the review gate is what enforces it.</p>

        <div className="home-split">
          <div>
            <span className="field-label">An agent, quickly</span>
            <ul className="plain-list">
              <li>Read the whole repository and answer out of it.</li>
              <li>Find public research and reduce it to findings with their sources attached.</li>
              <li>Check a finding against what earlier runs already concluded.</li>
              <li>Compose the next step&rsquo;s context so nothing is lost at the join.</li>
              <li>Build the prototype, and run the validation.</li>
            </ul>
          </div>
          <div>
            <span className="field-label">A person, and only a person</span>
            <ul className="plain-list">
              <li>Decide whether a finding is true, and what it changes.</li>
              <li>Bring curiosity and empathy for the family and the clinician.</li>
              <li>Choose between approaches equally defensible on paper.</li>
              <li>Say whether a bet is realistic — whether a practice would run it.</li>
              <li>Approve what an experiment should settle, before it is built.</li>
              <li>Use the prototype, and say how it felt.</li>
            </ul>
          </div>
        </div>

        <p className="muted">
          An agent with full write access here still cannot promote its own research: a canonical record cites a
          decision written by a named person, and validation refuses the record otherwise.
        </p>
      </section>

      <section className="home-band" id="use-it">
        <span className="eyebrow">Three ways in</span>
        <h2>Read it, build against it, or take it</h2>
        <p className="muted">
          Everything is Markdown with YAML frontmatter in <code>content/</code>. No database, no admin screen.
        </p>

        <ol className="home-ways">
          <li>
            <h3>Learn the problem space with your own agent</h3>
            <p>
              Clone it and ask. An agent reads every stage, problem, claim and metric in one pass: what we think breaks,
              what we are only assuming, and which numbers nobody collects. Each record names the fields it has left
              empty, so a thin file reads as one.
            </p>
            {graph.repoUrl ? <code className="home-command">git clone {graph.repoUrl}.git</code> : null}
          </li>

          <li>
            <h3>Point it at a bet and build your own prototype</h3>
            <p>
              Run the brief and hand its output to your coding agent with <code>AGENTS.md</code>. You get the problem,
              the flow it lands on, the evidence and the honest unknowns — or a refusal, if nobody has said what the
              experiment should settle.
            </p>
            <code className="home-command">{briefCommand}</code>
            {firstBet ? (
              <p className="small muted">
                That is <Link href={firstBet.href}>{firstBet.title}</Link>
                {firstBet.problemTitle ? <>, against &ldquo;{firstBet.problemTitle}&rdquo;</> : null}.{" "}
                {unbuilt.length > 0
                  ? `${unbuilt.length === 1 ? "It has" : `${unbuilt.length} bets have`} nothing built against ${
                      unbuilt.length === 1 ? "it" : "them"
                    } yet.`
                  : null}{" "}
                <Link href="/map?lens=bets">Find another on the map</Link>.
              </p>
            ) : null}
          </li>

          <li>
            <h3>Fork it and point it at your own system</h3>
            <p>
              None of the primitives are specific to behavioral health. Replace <code>content/</code> and the map, the
              search, the record pages and the briefs all follow — new thinking needs no application code at all.
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
              Read AGENTS.md <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </div>
      </section>

      <section className="home-band">
        <span className="eyebrow">Contributing</span>
        <h2>Tell us where this is wrong</h2>
        <p className="muted">
          Most of this is marked proposed rather than settled. If you have run a practice like this, worked inside one,
          or been a family on the other side of it, name where our understanding does not match what you have seen.
        </p>
        <p className="muted">
          A pull request is the whole process, and naming a problem is a complete contribution — you do not have to
          bring the answer.
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

      <p className="page-note">
        This model is generalized and provisional. It does not describe any particular company, it is not a medical
        record system, and much of it is still marked as proposed rather than settled.
      </p>
    </main>
  );
}
