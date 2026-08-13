import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/lib/content/repository";
import { ProvenanceNote } from "@/components/provenance/provenance";
import { targetLinks } from "@/lib/content/links";

export function generateStaticParams() {
  return getRepository().claims.map((claim) => ({ claimId: claim.id }));
}

export default async function ClaimPage({ params }: { params: Promise<{ claimId: string }> }) {
  const { claimId } = await params;
  const repo = getRepository();
  const claim = repo.claims.find((c) => c.id === claimId);
  if (!claim) notFound();

  const targets = targetLinks(repo, claim.targets);
  const bets = repo.bets.filter((bet) => bet.claims?.includes(claim.id));

  return (
    <main className="shell main">
      <div className="breadcrumb">
        <Link href="/map">System map</Link>
        <span>→</span>
        <span>Claim</span>
      </div>

      <header className="detail-head">
        <div>
          <span className="eyebrow">
            {claim.kind} · {claim.confidence} confidence · {claim.authority ?? "proposed"}
          </span>
          <h1 style={{ fontSize: 40 }}>{claim.statement}</h1>
        </div>
        <div className="meta">
          <span>{claim.status}</span>
        </div>
      </header>

      <div className="grid two">
        <div>
          {claim.body && (
            <section className="section">
              <h2>Reasoning</h2>
              <p className="markdown">{claim.body}</p>
            </section>
          )}
          {bets.length > 0 && (
            <section className="section">
              <h2>Bets resting on this claim</h2>
              <ul className="list">
                {bets.map((bet) => (
                  <li key={bet.id}>
                    <Link href={`/bets/${bet.id}`}>{bet.title}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <aside>
          {targets.length > 0 && (
            <section className="section">
              <h2>Concerns</h2>
              <div className="chips">
                {targets.map((target) => (
                  <Link className="chip" key={target.id} href={target.href}>
                    {target.title}
                  </Link>
                ))}
              </div>
            </section>
          )}
          <ProvenanceNote provenance={claim.provenance} lastReviewed={claim.lastReviewed} />
        </aside>
      </div>
    </main>
  );
}
