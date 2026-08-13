import { getRepository } from "@/lib/content/repository";
import { SystemMap } from "@/components/system-map/system-map";

export default function MapPage() {
  const repository = getRepository();
  const stages = repository.map.stages.map((id) => repository.stages.find((stage) => stage.id === id)!).map((stage) => {
    const steps = repository.steps.filter((step) => step.stage === stage.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const claims = repository.claims.filter((claim) => claim.targets.includes(stage.id));
    const bets = repository.bets.filter((bet) => bet.targets.includes(stage.id));
    return {
      id: stage.id,
      title: stage.title,
      order: stage.order,
      status: stage.status,
      summary: stage.summary,
      steps: steps.length,
      claims: claims.length,
      questions: (stage.sections["Open questions"]?.match(/^- /gm) ?? []).length,
      bets: bets.length,
      prototypes: bets.filter((bet) => bet.prototype?.status === "working").length,
      stepsList: steps.map((step) => ({ id: step.id, title: step.title })),
      betsList: bets.map((bet) => ({ id: bet.id, title: bet.title, confidence: bet.confidence, prototype: bet.prototype })),
    };
  });

  return <main className="shell main map-page"><header className="map-intro"><div><span className="eyebrow">Reference operating model · Interactive</span><h1>The system, in view.</h1><p className="lede">Trace how demand, clinical supply, care delivery, and learning connect. Start broad, then move into the process detail, evidence, bets, and working prototypes behind each stage.</p></div><div className="map-summary"><span><strong>{stages.length}</strong> operating stages</span><span><strong>{repository.steps.length}</strong> modeled steps</span><span><strong>{repository.bets.length}</strong> active bet</span></div></header><SystemMap stages={stages} edges={repository.map.edges} /></main>;
}
