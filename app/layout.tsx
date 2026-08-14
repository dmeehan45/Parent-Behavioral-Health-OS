import type { Metadata } from "next";
import { Caveat, Manrope } from "next/font/google";
import Link from "next/link";
import { reviewDebt } from "@/lib/research/glance";
import "./globals.css";

/**
 * The design system's two typefaces, Satoshi and Caveat, are licensed
 * third-party faces; the source site's use of them is recorded, not granted.
 *
 * Caveat is OFL and ships here as itself — it is the signature device and no
 * substitute reads the same. Satoshi is not redistributable, so the primary
 * face is Manrope: the nearest open geometric grotesque, matched on the same
 * weights the system uses.
 */
const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-fallback",
  display: "swap",
});

const script = Caveat({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Parent Behavioral Health OS",
  description:
    "A written model of how a parent-focused behavioral health practice works, where we think it breaks, and the software we are building to test the fixes.",
};

/**
 * Navigation points at views of the model rather than at individual primitives,
 * so nothing here has to change when content does.
 *
 * One entry per destination. The lenses are ways of looking at the map rather
 * than separate places, so they are chosen on the map itself; listing them here
 * made three of four links lead to the same page.
 */
const NAV = [
  { href: "/map", label: "System map" },
  { href: "/prototypes", label: "Prototypes" },
  { href: "/review", label: "Research" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const source = process.env.NEXT_PUBLIC_CONTENT_SOURCE_URL;
  /*
   * Research arrives from conversations held elsewhere and from scheduled runs
   * nobody watched. Without a count on the one surface that is on every page,
   * the only way to discover that four findings are waiting is to remember to
   * go and look — and the thing this model is worst at surviving is a reviewer
   * who stops noticing.
   */
  const waiting = reviewDebt();

  return (
    <html lang="en" className={`${sans.variable} ${script.variable}`}>
      <body>
        <a className="skip-link" href="#content">
          Skip to content
        </a>

        <header className="app-header">
          <Link className="brand" href="/" aria-label="Parent Behavioral Health OS, home">
            <span className="brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="brand-text">Parent Behavioral Health OS</span>
          </Link>

          <nav className="app-nav" aria-label="Primary">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
                {item.href === "/review" && waiting > 0 ? (
                  <span className="nav-count" aria-label={`${waiting} waiting on you`}>
                    {waiting}
                  </span>
                ) : null}
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
