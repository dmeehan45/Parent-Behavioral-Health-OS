import Link from "next/link";export function PrototypeLink({route,status}:{route:string;status:string}){return <Link className="button" href={route}>Launch {status} prototype →</Link>}
