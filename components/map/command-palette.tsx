"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { KIND_LABELS } from "@/lib/model/kinds";
import { KindBadge } from "@/components/model/badges";
import type { ModelGraph, ModelNode } from "@/lib/model/types";

/**
 * Find-anything search across the whole model.
 *
 * The map is meant to hold far more context than fits on a screen, which makes
 * pointing-and-panning a poor primary way in. This searches every projected
 * primitive — including ones the current lens is not showing — and hands the
 * canvas somewhere to fly to.
 */
export function CommandPalette({
  graph,
  onClose,
  onPick,
}: {
  graph: ModelGraph;
  onClose: () => void;
  onPick: (node: ModelNode) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

  // Mounted only while open, so opening always starts from an empty query.
  // Where focus came from is captured on the same pass, because closing has to
  // put it back: this is `aria-modal`, and a modal that drops the reader at the
  // top of the document on every search is not one.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const timer = setTimeout(() => inputRef.current?.focus(), 20);
    return () => {
      clearTimeout(timer);
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  /**
   * Keeps Tab inside the dialog.
   *
   * `aria-modal` is a claim about behaviour, not a behaviour: without this,
   * tabbing past the last result walked out through the backdrop into the page
   * underneath — visually obscured, still announced as behind a modal, and with
   * no way back but Shift+Tab.
   */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const palette = paletteRef.current;
      if (!palette) return;

      const focusable = [...palette.querySelectorAll<HTMLElement>("input, button, [href], [tabindex]:not([tabindex='-1'])")]
        .filter((element) => element.offsetParent !== null || element === document.activeElement);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;

      if (event.shiftKey && (current === first || !palette.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, []);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const scored = graph.nodes.map((node) => {
      if (needle.length === 0) return { node, score: node.kind === "stage" ? 3 : 1 };
      const title = node.title.toLowerCase();
      if (title.startsWith(needle)) return { node, score: 100 };
      if (title.includes(needle)) return { node, score: 70 };
      if (node.contentId.includes(needle)) return { node, score: 50 };
      if (node.searchText.includes(needle)) return { node, score: 20 };
      return { node, score: 0 };
    });

    return scored
      .filter((entry) => entry.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.node.kind.localeCompare(b.node.kind) ||
          (a.node.order ?? 0) - (b.node.order ?? 0) ||
          a.node.title.localeCompare(b.node.title),
      )
      .slice(0, 40)
      .map((entry) => entry.node);
  }, [graph.nodes, query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const commit = (node?: ModelNode) => {
    if (node) onPick(node);
    onClose();
  };

  return (
    <div className="palette-backdrop" role="presentation" onClick={onClose}>
      <div
        ref={paletteRef}
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Search the model"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          ref={inputRef}
          className="palette-input"
          type="search"
          placeholder="Search stages, steps, bets, claims, metrics, entities…"
          value={query}
          aria-label="Search the model"
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => Math.min(index + 1, results.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              commit(results[active]);
            } else if (event.key === "Escape") {
              onClose();
            }
          }}
        />

        {results.length === 0 ? (
          <p className="palette-empty">
            Nothing in the model matches that yet. The model is deliberately incomplete — this may be a gap worth
            filling in <code>content/</code>.
          </p>
        ) : (
          <ul className="palette-results" ref={listRef}>
            {results.map((node, index) => (
              <li key={node.id}>
                <button
                  type="button"
                  data-active={index === active}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => commit(node)}
                >
                  <KindBadge kind={node.kind} subtle />
                  <span className="palette-title">{node.title}</span>
                  <span className="palette-meta">{node.subtitle ?? KIND_LABELS[node.kind]}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="palette-foot">
          <span>↑↓ to move</span>
          <span>↵ to open</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  );
}
