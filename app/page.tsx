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
 * Its whole job is orientation: what this is, how a question becomes software
 * you can try, which half of that work is a machine's and which half is only
 * ever a person's, and what to do with it if you want to use it yourself.
 * Everything specific to the model — the numbers, the problem, the bet, the
 * software that exists — is derived from `content/`, so this page describes the
 * artifact without ever naming a stage, a bet, or a count.
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
   * Two of the five are model primitives and carry their kind; research and
   * what a prototype teaches deliberately are not. Both are staging, decided by
   * a person before they can change what the model claims, and colouring them
   * like a primitive would say the opposite.
   */
  const loop: Array<{
    name: string;
    kind?: NodeKind;
    body: React.ReactNode;
    carries: string;
    command?: string;
  }> = [
    {
      name: "Research",
      body: (
        <>
          <p>
            A question goes to a chat agent — Claude, ChatGPT, anything — or to a scheduled run that works through the
            queue on its own twice a day. What comes back is a bounded handoff committed to the repository: the sources,
            findings small enough to argue with one at a time, and what the run was still unsure about. It never edits
            the model.
          </p>
          <p>
            The brief is what stops a routine from finding the same thing forever: it prints what earlier runs already
            established, and restating one of them exactly is a validation error rather than a duplicate nobody
            notices.
          </p>
        </>
      ),
      command: "npm run research:brief -- <question-id>",
      carries: "The sources and the uncertainty, still attached to the finding rather than summarised away.",
    },
    {
      name: "Problem",
      kind: "problem",
      body: (
        <>
          <p>
            A person reads the finding next to its evidence and decides. Accepting one authorises a change to the model;
            it does not make one. What it can become is a named problem: where the machine breaks, which stages and
            steps it bites, and what it costs when it does.
          </p>
          <p>
            Naming a problem is a complete contribution. It does not need an answer yet, and a problem with nothing
            under it stays visible as exactly that. The tooling composes the record&rsquo;s identity, its targets and the
            trace proving it was reviewed — and leaves every word of the body empty, because the sentence that names the
            trouble is a person&rsquo;s.
          </p>
        </>
      ),
      carries: "The targets and the evidence, already linked, so the trouble is written down exactly once.",
    },
    {
      name: "Bet",
      kind: "bet",
      body: (
        <>
          <p>
            A bet names the one problem it answers and what we would do about it. Nothing more: it never restates the
            trouble, because two copies of the same trouble drift apart.
          </p>
          <p>
            It also carries the shape of its experiment — the decision trying it should settle, who meets it and by
            which path, what it assumes, the signal that would support or weaken it and the harm to watch for, and how
            real it needs to be. Approving that is a pull request against the bet, not a message in a chat, so the next
            person can read what was agreed without asking anybody.
          </p>
        </>
      ),
      carries: "The experiment's shape, with a history — what this is meant to settle, and what it is not.",
    },
    {
      name: "Prototype",
      kind: "prototype",
      body: (
        <>
          <p>
            One command composes everything a builder needs: the bet and its approved experiment, the problem it
            answers, the flow it lands on with its roles and rules and exceptions, the evidence and where it is weak,
            an honest known / assumed / unknown, and the rules this repository builds under. Hand that output to a
            coding agent and it can start.
          </p>
          <p>
            It can also refuse, and the refusal is the point. A bet whose experiment nobody has shaped comes back{" "}
            <em>not ready to build</em>, with the questions to put to a person. Every unfilled field is named, because a
            guess written there becomes something the built software makes look real.
          </p>
        </>
      ),
      command: briefCommand,
      carries: "The whole context for the build, in one paste — nothing reconstructed from a conversation.",
    },
    {
      name: "What it teaches",
      body: (
        <>
          <p>
            Somebody uses the software and reacts. That comes back the same way public research does — as a handoff,
            read and decided by a person — because one participant&rsquo;s reaction is a reported observation, not a
            proven claim. It can expose a defect, challenge an assumption, or start the next question.
          </p>
          <p>
            Whatever survives that review changes <code>content/</code>, and the map redraws within seconds of the
            change landing, highlighting what moved.
          </p>
        </>
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
          How the practice works, where it breaks, and the <em className="script">loop</em> that tests a fix
        </h1>
        <p className="lede">
          This is a written model of a parent-focused behavioral health practice: the stages a clinician and a family
          move through, what has to happen at each one, and the places we are not confident it holds up. Around it runs
          a loop — research becomes a named problem, a problem gets one bet, a bet becomes software somebody can
          actually try, and what that teaches comes back in.
        </p>
        <p className="muted small">
          It is a reference model, not a product, and it holds no patient, clinician, or practice data. It is open
          source, and it is wrong in places we would like you to find.
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
          Each of those is a Markdown file, and each names the ones it depends on. That is what makes the whole thing
          readable in one pass by a person or by an agent.
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

      {/*
        The loop was the part of this repository a reader could only discover by
        reading three documents in the right order. It is the reason the rest of
        it is arranged the way it is, so it belongs on the front door.
      */}
      <section className="home-band" id="loop">
        <span className="eyebrow">The loop</span>
        <h2>How a question becomes software you can try</h2>
        <p className="muted">
          Four moves and a return. Each one leaves a separate, reviewable artifact in the repository, and each join is a
          command that composes the context for the next step out of what is already written down.
        </p>

        <ol className="loop">
          {loop.map((step) => (
            <li key={step.name}>
              <h3>
                {step.name}
                {step.kind ? <KindBadge kind={step.kind} subtle /> : null}
              </h3>
              {step.body}
              {step.command ? <code className="home-command">{step.command}</code> : null}
              <span className="loop-carry">
                <strong>Carries forward:</strong> {step.carries}
              </span>
            </li>
          ))}
        </ol>

        <p className="muted">
          Nothing between those steps lives in a chat window, and that is the whole reason it moves quickly. The context
          for the next move is composed from what the repository already holds, so nobody reconstructs it from memory and
          nothing quietly goes missing between the question and the build.
        </p>

        <div className="home-actions">
          <Link className="button secondary" href="/review">
            See what research is proposing <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="home-band">
        <span className="eyebrow">Division of labour</span>
        <h2>The parts a machine is good at, and the parts only you are</h2>
        <p className="muted">
          The loop is arranged around this split rather than around a tool. An agent moves context and produces
          candidates; a person decides what is true, what matters, and what is worth building. The review gate exists to
          keep those two from blurring.
        </p>

        <div className="home-split">
          <div>
            <span className="field-label">An agent, quickly</span>
            <ul className="plain-list">
              <li>Read the whole repository at once and answer out of it.</li>
              <li>Find public research fast and reduce it to atomic findings with their sources still attached.</li>
              <li>Check a new finding against everything earlier runs already concluded.</li>
              <li>Compose the brief for the next step so nothing is lost at the join.</li>
              <li>Build the prototype, and run the validation that proves it stayed inside the rules.</li>
            </ul>
          </div>
          <div>
            <span className="field-label">A person, and only a person</span>
            <ul className="plain-list">
              <li>Decide whether a finding is true, and what it actually changes.</li>
              <li>Bring curiosity and empathy for the family and the clinician living inside the process.</li>
              <li>Choose between approaches that are equally defensible on paper.</li>
              <li>Say whether a bet is realistic — whether a practice would really run it.</li>
              <li>Approve what an experiment is meant to settle before anything gets built.</li>
              <li>Use the prototype, and say how it felt.</li>
            </ul>
          </div>
        </div>

        <p className="muted">
          That second column is enforced rather than encouraged. A canonical record cites research through a decision
          written by a named person over a specific version of a specific handoff, and validation refuses the record
          otherwise. An agent with full write access to this repository still cannot promote its own research.
        </p>
      </section>

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
        Three ways in, ordered by how much the reader has to commit: read it,
        build one thing with it, or take the whole apparatus somewhere else.
      */}
      <section className="home-band" id="use-it">
        <span className="eyebrow">Three ways in</span>
        <h2>Read it, build against it, or take it</h2>
        <p className="muted">
          Everything here is Markdown with YAML frontmatter in <code>content/</code>. There is no database and no admin
          screen, which is what makes all three of these a clone away.
        </p>

        <ol className="home-ways">
          <li>
            <h3>Learn the problem space with your own agent</h3>
            <p>
              Clone it and ask. An agent can read every stage, problem, claim and metric in one pass and answer from
              them — what we think breaks and why, what we are only assuming, where the evidence is thin, and which
              numbers nobody collects. Every record says which of its fields are still empty, so a thin file reads as a
              thin file rather than looking the same as a rich one.
            </p>
            {graph.repoUrl ? <code className="home-command">git clone {graph.repoUrl}.git</code> : null}
          </li>

          <li>
            <h3>Point it at a bet and build your own prototype</h3>
            <p>
              Pick a bet, run the brief, and hand its output to your coding agent together with <code>AGENTS.md</code>.
              You get the problem, the flow it lands on, the evidence and the honest unknowns without having to read the
              repository first — and a refusal instead of a build if nobody has said what the experiment should settle.
            </p>
            <code className="home-command">{briefCommand}</code>
            {firstBet ? (
              <p className="small muted">
                That is <Link href={firstBet.href}>{firstBet.title}</Link>
                {firstBet.problemTitle ? <>, the bet against &ldquo;{firstBet.problemTitle}&rdquo;</> : null}.{" "}
                {unbuilt.length > 0
                  ? `${unbuilt.length === 1 ? "It has" : `${unbuilt.length} bets have`} no software behind ${
                      unbuilt.length === 1 ? "it" : "them"
                    } yet.`
                  : "Every bet here already has something built against it, so start by reading what a brief contains."}{" "}
                <Link href="/map">Find another on the map</Link>.
              </p>
            ) : null}
          </li>

          <li>
            <h3>Fork it and point it at your own system</h3>
            <p>
              It is open source, and none of the primitives are specific to behavioral health. Stages, steps, problems,
              bets, claims and metrics are a general way to write down how a business actually runs and where you think
              it does not. Replace <code>content/</code> and the map, the search, the record pages, the coverage and the
              briefs all follow — adding new thinking requires no application code at all.
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
        <p className="muted small">
          Leave the map open while your agent works. The page watches the repository and redraws within a few seconds of
          a change landing, highlighting whatever moved.
        </p>
      </section>

      <section className="home-band">
        <span className="eyebrow">Contributing</span>
        <h2>Tell us where this is wrong</h2>
        <p className="muted">
          Most of this model is marked proposed rather than settled, and the parts we are least sure of say so on their
          own pages. If you have run a practice like this, worked inside one, or been a family on the other side of it,
          the most useful thing you can do is name where our understanding does not match what you have seen.
        </p>
        <p className="muted">
          A pull request is the whole process. Naming a problem is a complete contribution on its own — you do not have
          to bring the answer. Correcting a claim, adding the metric that would settle an argument, or arguing that a
          bet would not survive contact with a real practice are each a change to one Markdown file, and every pull
          request runs the same validation ours do.
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
