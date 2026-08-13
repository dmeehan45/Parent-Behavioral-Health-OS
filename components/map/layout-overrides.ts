"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { LensId } from "@/lib/model/types";

/**
 * Node positions a reader has dragged, per lens.
 *
 * Derived layout is the default and the shared baseline; a drag is a local
 * override, so it lives in this browser rather than in `content/`. Exposed
 * through `useSyncExternalStore` so the server render and the first client
 * render agree, and so a second tab picks up the same overrides.
 */

export type Overrides = Record<string, { x: number; y: number }>;

const EMPTY = "{}";
const listeners = new Set<() => void>();

function key(lens: LensId) {
  return `pbh-os:layout:${lens}`;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function notify() {
  for (const listener of listeners) listener();
}

export function useLayoutOverrides(lens: LensId) {
  // Returns the raw string so the snapshot identity is stable between renders.
  const raw = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(key(lens)) ?? EMPTY,
    () => EMPTY,
  );

  const overrides = useMemo<Overrides>(() => {
    try {
      return JSON.parse(raw) as Overrides;
    } catch {
      return {};
    }
  }, [raw]);

  const merge = useCallback(
    (positions: Overrides) => {
      const next = { ...overrides, ...positions };
      window.localStorage.setItem(key(lens), JSON.stringify(next));
      notify();
    },
    [lens, overrides],
  );

  const reset = useCallback(() => {
    window.localStorage.removeItem(key(lens));
    notify();
  }, [lens]);

  return { overrides, merge, reset, hasOverrides: Object.keys(overrides).length > 0 };
}
