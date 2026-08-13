import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Parent Behavioral Health OS",
  description: "A Git-native executable model of a parent-focused behavioral-health operating system.",
};

/**
 * Navigation points at views of the model rather than at individual primitives,
 * so nothing here has to change when content does.
 */
const NAV = [
  { href: "/map", label: "System map" },
  { href: "/map?lens=bets", label: "Bets" },
  { href: "/map?lens=evidence", label: "Evidence" },
  { href: "/prototypes", label: "Prototypes" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const source = process.env.NEXT_PUBLIC_CONTENT_SOURCE_URL;

  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#content">
          Skip to content
        </a>

        <header className="app-header">
          <Link className="brand" href="/">
            <span className="brand-mark" aria-hidden="true" />
            Parent Behavioral Health OS
          </Link>

          <nav className="app-nav" aria-label="Primary">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
            {source ? (
              <a href={source} target="_blank" rel="noreferrer">
                Repository ↗
              </a>
            ) : null}
          </nav>
        </header>

        <div id="content">{children}</div>
      </body>
    </html>
  );
}
