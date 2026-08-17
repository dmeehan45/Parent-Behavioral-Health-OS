"use client";

import Link from "next/link";

/**
 * The page for a render that threw.
 *
 * This is not a hypothetical here. The projection refuses to load a model it
 * cannot vouch for: `checkFlowContinuity` runs inside `getRepository()` and
 * `checkResearchTrace` inside `projectModel()`, both by design, so an edit to
 * `content/` or `research/` that breaks a contract takes every model-driven
 * route down until it is fixed. That is the right behaviour — a map that draws
 * a model it knows is wrong is worse than a map that stops.
 *
 * What was wrong was the page it stopped on, which was Next's own: no way back,
 * no house style, and no hint that the message is about content rather than
 * about software. The message is the most useful thing on the screen, because
 * the validators name the offending file and field, so it is shown rather than
 * hidden — and the command that reproduces it is written down next to it.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="shell page">
      <div className="not-found">
        <p className="field-label">Something stopped</p>
        <h1>
          The model would not <em className="script">load</em>
        </h1>
        <p className="lede">
          This is usually content rather than code. The loader refuses a model whose flow or
          research trace does not hold up, so an edit under <code>content/</code> or{" "}
          <code>research/</code> can stop every model-driven page until it is corrected.
        </p>

        {error.message ? (
          <pre className="error-detail" role="status">
            {error.message}
          </pre>
        ) : null}

        <p className="small muted">
          <code>npm run validate:content</code> and <code>npm run validate:research</code> reproduce
          this on the command line and name the file and field.
          {error.digest ? ` Digest ${error.digest}.` : ""}
        </p>

        <div className="not-found-actions">
          <button className="button" type="button" onClick={reset}>
            Try again
          </button>
          <Link className="button secondary" href="/">
            Start from the beginning
          </Link>
        </div>
      </div>
    </main>
  );
}
