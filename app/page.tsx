import Link from "next/link";
import { projectModel } from "@/lib/model/graph";

export const dynamic = "force-dynamic";

const LOOP = [
  { step: "Map", detail: "Describe how the machine actually works." },
  { step: "Question", detail: "Name what we do not know." },
  { step: "Bet", detail: "Propose a change worth testing." },
  { step: "Prototype", detail: "Make it concrete in software." },
  { step: "Learn", detail: "Find out whether it was true." },
  { step: "Update", detail: "Change the model, in Git." },
];

export default function Home() {
  const graph = projectModel();

  return (
    <main className="shell page home">
      <section className="home-hero">
        <span className="eyebrow">Open reference model</span>
        <h1>See the operating system. Make the bet concrete.</h1>
        <p className="lede">
          An executable map of how an AI-enabled, parent-focused behavioral-health practice platform might operate —
          linking process knowledge, uncertainty, hypotheses, metrics, and working software in one place.
        </p>
        <div className="home-actions">
          <Link className="button" href="/map">
            Explore the system map <span aria-hidden="true">→</span>
          </Link>
          <Link className="button secondary" href="/map?lens=bets">
            See what we are betting on
          </Link>
        </div>
      </section>

      <section className="home-stats" aria-label="The model at a glance">
        {graph.stats.map((stat) => (
          <div key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="home-loop">
        <span className="eyebrow">Core loop</span>
        <h2>Map → Question → Bet → Prototype → Learn → Update</h2>
        <ol className="loop-list">
          {LOOP.map((entry) => (
            <li key={entry.step}>
              <strong>{entry.step}</strong>
              <span>{entry.detail}</span>
            </li>
          ))}
        </ol>
        <p className="muted">
          Repository content is canonical. Every view in this application — the map, the detail panels, the prototype
          pages — is a projection of the Markdown and YAML under <code>content/</code>, and follows it live as it
          changes.
        </p>
      </section>
    </main>
  );
}
