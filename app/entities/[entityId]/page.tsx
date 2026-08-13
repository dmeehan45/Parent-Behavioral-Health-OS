import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/lib/content/repository";
import { ProvenanceNote } from "@/components/provenance/provenance";

export function generateStaticParams() {
  return getRepository().entities.map((entity) => ({ entityId: entity.id }));
}

export default async function EntityPage({ params }: { params: Promise<{ entityId: string }> }) {
  const { entityId } = await params;
  const repo = getRepository();
  const entity = repo.entities.find((e) => e.id === entityId);
  if (!entity) notFound();

  // Where this entity is consumed and produced. Together these are the entity's
  // observed lifecycle across the model — the transitions the steps actually claim.
  const consumedBy = repo.steps.filter((step) => step.inputs?.some((ref) => ref.entity === entity.id));
  const producedBy = repo.steps.filter((step) => step.outputs?.some((ref) => ref.entity === entity.id));

  const statesFor = (step: (typeof repo.steps)[number], field: "inputs" | "outputs") =>
    (step[field] ?? []).filter((ref) => ref.entity === entity.id).map((ref) => ref.state);

  return (
    <main className="shell main">
      <div className="breadcrumb">
        <Link href="/map">System map</Link>
        <span>→</span>
        <span>Entity</span>
        <span>→</span>
        <span>{entity.title}</span>
      </div>

      <header className="detail-head">
        <div>
          <span className="eyebrow">Entity</span>
          <h1>{entity.title}</h1>
          {entity.body && <p className="lede">{entity.body}</p>}
        </div>
      </header>

      {entity.states?.length ? (
        <section className="section">
          <h2>States</h2>
          <p className="muted">
            Declared states are validated: a Step may only reference this entity in one of them.
          </p>
          <div className="chips">
            {entity.states.map((state) => (
              <span className="chip" key={state}>
                {state}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid two">
        <div>
          {producedBy.length > 0 && (
            <section className="section">
              <h2>Produced by</h2>
              <ul className="list">
                {producedBy.map((step) => (
                  <li key={step.id}>
                    <Link href={`/steps/${step.id}`}>{step.title}</Link>
                    <span className="muted"> → {statesFor(step, "outputs").join(", ")}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {consumedBy.length > 0 && (
            <section className="section">
              <h2>Consumed by</h2>
              <ul className="list">
                {consumedBy.map((step) => (
                  <li key={step.id}>
                    <Link href={`/steps/${step.id}`}>{step.title}</Link>
                    <span className="muted"> ← {statesFor(step, "inputs").join(", ")}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {producedBy.length === 0 && consumedBy.length === 0 && (
            <section className="section">
              <p className="muted">No Step references this entity yet.</p>
            </section>
          )}
        </div>
        <aside>
          <ProvenanceNote provenance={entity.provenance} lastReviewed={entity.lastReviewed} />
        </aside>
      </div>
    </main>
  );
}
