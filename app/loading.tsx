/**
 * The pending state for every model-driven route.
 *
 * All of them are `force-dynamic`, so following a link is a server round trip
 * that produced no visible response at all until the new page painted. On a slow
 * connection that reads as a dead control rather than as work in progress.
 *
 * Deliberately a shape, not a spinner: it matches the header every record page
 * opens with, so the page appears to fill in rather than to replace itself.
 */
export default function Loading() {
  return (
    <main className="shell page" aria-busy="true">
      <p className="visually-hidden" role="status">
        Loading
      </p>

      <div className="skeleton-head" aria-hidden="true">
        <span className="skeleton skeleton-crumb" />
        <span className="skeleton skeleton-badges" />
        <span className="skeleton skeleton-title" />
        <span className="skeleton skeleton-lede" />
      </div>
    </main>
  );
}
