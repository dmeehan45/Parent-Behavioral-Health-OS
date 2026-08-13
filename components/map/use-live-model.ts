"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ModelGraph } from "@/lib/model/types";

export type LiveStatus = "live" | "syncing" | "offline";

export type LiveModel = {
  graph: ModelGraph;
  status: LiveStatus;
  /** Node ids added or edited by the most recent update, for a brief highlight. */
  changed: Set<string>;
  /** Human-readable summary of the last update, or undefined if nothing changed yet. */
  lastChange?: string;
  lastSyncedAt?: number;
  refresh: () => void;
};

const POLL_INTERVAL_MS = 8_000;
const OFFLINE_BACKOFF_MS = 30_000;
const HIGHLIGHT_MS = 9_000;

function summarise(previous: ModelGraph, next: ModelGraph): { changed: Set<string>; summary: string } {
  const before = new Map(previous.nodes.map((node) => [node.id, node.hash]));
  const after = new Map(next.nodes.map((node) => [node.id, node.hash]));

  const added: string[] = [];
  const edited: string[] = [];
  for (const [id, hash] of after) {
    if (!before.has(id)) added.push(id);
    else if (before.get(id) !== hash) edited.push(id);
  }
  const removed = [...before.keys()].filter((id) => !after.has(id));

  const parts: string[] = [];
  if (added.length > 0) parts.push(`${added.length} added`);
  if (edited.length > 0) parts.push(`${edited.length} updated`);
  if (removed.length > 0) parts.push(`${removed.length} removed`);

  return {
    changed: new Set([...added, ...edited]),
    summary: parts.length > 0 ? parts.join(" · ") : "content changed",
  };
}

/**
 * Keeps an open map in step with the repository.
 *
 * The map is rendered on the server for a fast first paint, then this hook
 * takes over: it polls a cheap content fingerprint and pulls the full
 * projection only when that fingerprint moves. Updates are applied
 * immediately — everyone looking at the map converges on the same picture
 * without anyone reloading — and the nodes that actually changed are returned
 * so the canvas can say what moved rather than silently redrawing.
 *
 * Polling pauses while the tab is hidden and backs off when the server is
 * unreachable, so a map left open on a second monitor costs almost nothing.
 */
export function useLiveModel(initial: ModelGraph): LiveModel {
  const [graph, setGraph] = useState(initial);
  const [status, setStatus] = useState<LiveStatus>("live");
  const [changed, setChanged] = useState<Set<string>>(() => new Set());
  const [lastChange, setLastChange] = useState<string>();
  const [lastSyncedAt, setLastSyncedAt] = useState<number>();

  // Held in a ref so the polling effect never needs the graph as a dependency,
  // which would restart the timer on every update.
  const revisionRef = useRef(initial.revision);
  const inFlightRef = useRef(false);

  const pull = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setStatus("syncing");
    try {
      const response = await fetch("/api/model", { cache: "no-store" });
      if (!response.ok) throw new Error(`model request failed: ${response.status}`);
      const next = (await response.json()) as ModelGraph;
      setGraph((previous) => {
        if (previous.revision === next.revision) return previous;
        const { changed: ids, summary } = summarise(previous, next);
        setChanged(ids);
        setLastChange(summary);
        return next;
      });
      revisionRef.current = next.revision;
      setLastSyncedAt(Date.now());
      setStatus("live");
    } catch {
      setStatus("offline");
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      let delay = POLL_INTERVAL_MS;

      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        try {
          const response = await fetch("/api/model/revision", { cache: "no-store" });
          if (!response.ok) throw new Error(`revision request failed: ${response.status}`);
          const { revision } = (await response.json()) as { revision: string };
          if (revision !== revisionRef.current) await pull();
          else {
            setStatus("live");
            setLastSyncedAt(Date.now());
          }
        } catch {
          setStatus("offline");
          delay = OFFLINE_BACKOFF_MS;
        }
      }

      if (!cancelled) timer = setTimeout(tick, delay);
    };

    timer = setTimeout(tick, POLL_INTERVAL_MS);

    // Check straight away when the reader comes back to the tab, so returning
    // to a map never shows a stale picture.
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        timer = setTimeout(tick, 0);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pull]);

  // Highlights are a nudge, not a permanent state.
  useEffect(() => {
    if (changed.size === 0) return;
    const timer = setTimeout(() => setChanged(new Set()), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [changed]);

  return { graph, status, changed, lastChange, lastSyncedAt, refresh: pull };
}
