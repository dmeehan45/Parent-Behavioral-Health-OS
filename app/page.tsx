import Link from "next/link";
import { KIND_COLOR } from "@/components/map/canvas-theme";
import { Markdown } from "@/components/markdown";
import { projectModel } from "@/lib/model/graph";
import { KIND_LABELS, KIND_MEANING } from "@/lib/model/kinds";
import { reviewDebt } from "@/lib/research/glance";
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

  // The loop's live state. Model counts come from the same stats the doors
  // strip used to render; the research count reads staging through the glance
  // helpers, which swallow their errors so a malformed handoff cannot take
  // down the front door. One number, same definition as the nav badge.
  const statOf = (id: string) => graph.stats.find((entry) => entry.id === id);
  const waiting = reviewDebt();
  const stages = statOf("stage");

  /**
   * A node's standing line: the count and the destination derived, the wording
   * local and short.
   *
   * The canonical labels ("problems named", "prototypes you can try") are
   * written for a strip that stands on its own. Under a node already titled
   * Problem they say the word twice, and at a fifth of the row the second copy
   * is what pushes the arrow onto a line of its own. These read as the
   * continuation of the name above them, and hold for any count.
   */
  const standing = (id: string, label: string) => {
    const entry = statOf(id);
    return entry ? { value: entry.value, label, href: entry.href } : undefined;
  };

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
   * A node carries only what survives being read at a glance: its name, its
   * kind, and where the loop currently stands there. Prose in a fifth of a
   * row is prose nobody can read — the mechanism is written at full measure
   * below, once, for all five.
   *
   * Two of the five are model primitives and carry their kind. Research and
   * what a prototype teaches deliberately do not: both are staging a person
   * has to decide on, and a category hue would say they were already part of
   * the model.
   */
  const loop: Array<{
    name: string;
    kind?: NodeKind;
    /** Where the loop currently stands at this step, from the projection. */
    stat?: { value: number; label: string; href: string };
    /** How the step actually works. Never what the primitive *is* — the kind
        already says that, and two copies of it drift apart. */
    mechanism: React.ReactNode;
    carries: string;
    command?: string;
  }> = [
    {
      name: "Research",
      stat: { value: waiting, label: "waiting on you", href: "/review" },
      mechanism: (
        <p>
          A question goes to a chat agent or to a scheduled run, and comes back as a bounded handoff in the repository:
          sources, findings small enough to argue with one at a time, and what it was still unsure about. It never
          edits the model. The brief is what stops a routine finding the same thing forever — it prints what earlier
          runs established, and restating one of them exactly is a validation error rather than a duplicate nobody
          notices.
        </p>
      ),
      carries: "The sources and the uncertainty, still attached to the finding.",
      command: "npm run research:brief -- <question-id>",
    },
    {
      name: "Problem",
      kind: "problem",
      stat: standing("problem", "named"),
      mechanism: (
        <p>
          A person reads the finding next to its evidence and decides. The tooling composes the record&rsquo;s identity,
          the stages and steps it bites, and the trace proving it was reviewed — then leaves every word of the body
          empty, because the sentence that names the trouble is a person&rsquo;s.
        </p>
      ),
      carries: "The targets and the evidence, already linked.",
    },
    {
      name: "Bet",
      kind: "bet",
      stat: standing("bet", "on the table"),
      mechanism: (
        <p>
          Alongside the answer, the bet records the shape of the experiment: what trying it should settle, what it
          assumes, and the signal that would show we were wrong. Approving that is a pull request against the bet
          rather than a message in a chat, so the next person can read what was agreed without asking anybody.
        </p>
      ),
      carries: "The experiment's shape, with a history.",
    },
    {
      name: "Prototype",
      kind: "prototype",
      stat: standing("prototype", "you can try"),
      mechanism: (
        <p>
          One command composes the whole build context — the bet, the problem, the flow it lands on with its rules and
          exceptions, the evidence and where it is weak, and an honest known / assumed / unknown. Hand it to a coding
          agent and it can start. It can also refuse, and the refusal is the point: a bet whose experiment nobody has
          shaped comes back <em>not ready to build</em>, with the questions to put to a person.
        </p>
      ),
      carries: "Everything above, in one paste.",
      command: briefCommand,
    },
    {
      name: "What it teaches",
      mechanism: (
        <p>
          Somebody uses the software and reacts. That re-enters as a handoff decided by a person, because one reaction
          is a reported observation rather than a proven claim. Whatever survives that review changes{" "}
          <code>content/</code>, and every open map redraws within seconds of the change landing, highlighting what
          moved.
        </p>
      ),
      carries: "Back to the top, as evidence the next run can see.",
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
        {/* The loop was described here in a sentence and drawn again directly
            below. The drawing is the better telling, so this says what the
            thing *is* and hands the sequence to the diagram. */}
        <p className="muted small">
          An open-source context-to-prototype system, and a reference model rather than a product. It holds no patient,
          clinician, or practice data, and it is wrong in places we would like you to find.
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


      {/* The loop, drawn rather than described — and the counts are the
          navigation, not decoration: each node says where the loop currently
          stands at that step and leads to the surface that holds it. */}
      <section className="pipeline-band" id="loop" aria-label="How a question becomes software you can try">
        <span className="eyebrow">The loop</span>
        <h2>How a question becomes software you can try</h2>
        <p className="muted">
          Four moves and a return, each leaving a reviewable artifact the next step composes its context from.
        </p>

        <ol className="pipeline">
          {loop.map((step) => (
            <li className="pipeline-node" key={step.name}>
              <span className="pipeline-head">
                {/* The legend's swatch, not a kind badge: the node's name is
                    already the kind's word, and a badge repeated it letter for
                    letter. Hue plus the word still says what it is. */}
                {step.kind ? (
                  <span className="legend-swatch" style={{ background: KIND_COLOR[step.kind] }} aria-hidden="true" />
                ) : null}
                <h3>{step.name}</h3>
              </span>

              {step.stat ? (
                <Link className="pipeline-stat" href={step.stat.href}>
                  <strong>{step.stat.value}</strong>
                  <span>
                    {step.stat.label}
                    {"\u00a0"}
                    <span aria-hidden="true">→</span>
                  </span>
                </Link>
              ) : (
                <span className="pipeline-stat pipeline-return">
                  <span aria-hidden="true">↺</span>
                  <span>back to the top</span>
                </span>
              )}
            </li>
          ))}
        </ol>

        {/* One disclosure for all five, at the article measure — not five
            accordions inside a five-column row, where opening one tore the
            rail out of alignment and set the commands in a 100px gutter. It is
            also the only place the vocabulary is defined now: the separate
            "four words" list said the same things a second time. */}
        <details className="disclosure pipeline-guide">
          <summary>What each step means, and how it works</summary>
          <dl className="define-list">
            <div>
              <dt>
                <span className="legend-swatch" style={{ background: KIND_COLOR.stage }} aria-hidden="true" />
                {KIND_LABELS.stage}
              </dt>
              <dd>
                <p>{KIND_MEANING.stage}</p>
                <p className="pipeline-carry">
                  <strong>Where the loop runs.</strong> Every problem, bet and prototype below is pinned to one.
                </p>
              </dd>
            </div>

            {loop.map((step) => (
              <div key={step.name}>
                <dt>
                  {step.kind ? (
                    <span
                      className="legend-swatch"
                      style={{ background: KIND_COLOR[step.kind] }}
                      aria-hidden="true"
                    />
                  ) : null}
                  {step.name}
                </dt>
                <dd>
                  {step.kind ? <p>{KIND_MEANING[step.kind]}</p> : null}
                  {step.mechanism}
                  <p className="pipeline-carry">
                    <strong>Carries forward:</strong> {step.carries}
                  </p>
                  {step.command ? <code className="home-command">{step.command}</code> : null}
                </dd>
              </div>
            ))}
          </dl>
          <p className="muted small">
            Each is a Markdown file naming the ones it depends on, which is what makes the whole model readable in one
            pass by a person or an agent.
          </p>
        </details>

        <p className="muted small">
          It runs on the machine itself
          {stages ? (
            <>
              {" — "}
              <Link href={stages.href}>
                {stages.value} {stages.label}
                <span aria-hidden="true"> →</span>
              </Link>
              {" — "}
            </>
          ) : (
            ", "
          )}
          and nothing between the steps lives in a chat window.
        </p>
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
          <p className="muted small">Invented families and clinicians. Nothing you do in it is saved anywhere.</p>
        </section>
      ) : null}

      {/* Two lists of equal length, side by side, is the shape this argument
          is usually drawn in and it says the halves weigh the same. They do
          not. The machine's column is the smaller one on purpose. */}
      <section className="home-band quiet">
        <h2>What the machine does, and what only you do</h2>

        <div className="home-split">
          <div className="home-split-minor">
            <span className="field-label">An agent, quickly</span>
            <ul className="plain-list">
              <li>Read the whole repository and answer out of it.</li>
              <li>Reduce public research to findings with their sources attached.</li>
              <li>Check a finding against what earlier runs concluded.</li>
              <li>Compose the next step&rsquo;s context so nothing is lost at the join.</li>
              <li>Build the prototype, and run the validation.</li>
            </ul>
          </div>
          <div className="home-split-major">
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

        <p className="muted small">
          An agent with full write access still cannot promote its own research. A canonical record cites a decision
          written by a named person, and validation refuses the record otherwise.
        </p>
      </section>

      <section className="home-band quiet" id="use-it">
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

      <section className="home-band quiet">
        <h2>Tell us where this is wrong</h2>
        <p className="muted">
          If you have run a practice like this, worked inside one, or been a family on the other side of it, name where
          the model does not match what you saw. Naming a problem is a complete contribution — you do not have to bring
          the answer.
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

      {/* The hero already says this is a reference model rather than a
          product. What is left for the footer is the part it does not cover. */}
      <p className="page-note">
        This model does not describe any particular company, it is not a medical record system, and much of it is still
        marked as proposed rather than settled.
      </p>
    </main>
  );
}
