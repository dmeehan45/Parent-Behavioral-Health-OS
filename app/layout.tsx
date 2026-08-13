import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
export const metadata: Metadata = { title: "Parent Behavioral Health OS", description: "A Git-native executable operating model." };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><header className="shell header"><Link className="brand" href="/map">Parent Behavioral Health OS</Link><nav className="nav"><Link href="/map">System map</Link><Link href="/bets/guided-first-caseload">Featured bet</Link><a href="https://github.com" aria-label="Project repository">Git-native model</a></nav></header>{children}</body></html> }
