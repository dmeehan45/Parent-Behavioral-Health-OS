import Link from "next/link";

/**
 * The page for a URL that names nothing.
 *
 * Without this file, Next serves its own: white ground where every other page
 * is on the wash, a system font where everything else is Manrope, and no way
 * onward. That is the wrong place to stop looking like the product, because a
 * reader who lands here is already lost.
 *
 * It is reached more often than a 404 usually is. View state lives in the URL
 * so that a view can be shared, record ids are derived from filenames, and
 * research is expected to rename and remove things — so a link that was correct
 * when it was sent can name nothing by the time it is opened. Every route that
 * looks a record up by id calls `notFound()` on the way here.
 *
 * So it says the one true thing — this id is not in the model — and then offers
 * the two ways back that always exist, rather than apologising.
 */
export default function NotFound() {
  return (
    <main className="shell page">
      <div className="not-found">
        <p className="field-label">Not in the model</p>
        <h1>
          Nothing here <em className="script">yet</em>
        </h1>
        <p className="lede">
          This address does not name anything the model currently describes. It may have been
          renamed or removed since the link was made — records are named by their files, and
          research changes what the model says.
        </p>
        <div className="not-found-actions">
          <Link className="button" href="/map">
            Open the system map <span aria-hidden="true">→</span>
          </Link>
          <Link className="button secondary" href="/">
            Start from the beginning
          </Link>
        </div>
      </div>
    </main>
  );
}
