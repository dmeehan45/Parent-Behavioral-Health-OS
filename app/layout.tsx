import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
export const metadata: Metadata = { title: "Parent Behavioral Health OS", description: "A Git-native executable operating model." };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><header className="shell header"><Link className="brand" href="/map">Parent Behavioral Health OS</Link><nav className="nav"><Link href="/map">System map</Link><a href="https://github.com/dmeehan45/Parent-Behavioral-Health-OS">Repository</a></nav></header>{children}</body></html> }
