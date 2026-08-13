export function MetricChip({title,status}:{title:string;status?:string}){return <span className="chip">{title}{status?` · ${status}`:""}</span>}
