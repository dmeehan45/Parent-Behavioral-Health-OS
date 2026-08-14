"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "pbhos:research:seen";

/** Only another tab can change this underneath us; our own write is deliberate. */
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

const read = () => window.localStorage.getItem(STORAGE_KEY);

/**
 * What has arrived since this browser last looked at the research page.
 *
 * There is no database and no account here, so "since you last looked" cannot
 * be a server-side fact and should not pretend to be one. It is a per-browser
 * memory of the run and decision IDs already seen — exactly as much as this can
 * honestly know, and enough for what it is for: research arriving from
 * conversations held elsewhere and from runs nobody watched, and a person who
 * needs to notice without being told twice.
 *
 * Read through `useSyncExternalStore` rather than an effect, so the server
 * renders nothing and the first client render already has the answer. The write
 * is the effect, because updating an external system is what effects are for.
 *
 * Nothing depends on it. With storage unavailable, or on a fresh browser, the
 * page reads as it always did: this only ever adds a line, never hides one.
 */
export function SinceLastLook({ ids }: { ids: string[] }) {
  const stored = useSyncExternalStore(subscribe, read, () => null);

  const fresh = useMemo(() => {
    let seen: unknown;
    try {
      seen = JSON.parse(stored ?? "null");
    } catch {
      return 0;
    }
    // A first visit is not "everything is new" — that would announce the whole
    // repository as fresh news and teach the reader to ignore the count.
    if (!Array.isArray(seen) || seen.length === 0) return 0;
    const known = new Set(seen);
    return ids.filter((id) => !known.has(id)).length;
  }, [ids, stored]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Private browsing, or storage disabled. The page still works.
    }
  }, [ids]);

  if (!fresh) return null;

  return (
    <p className="since-last-look" role="status">
      {fresh} new since you last looked.
    </p>
  );
}
