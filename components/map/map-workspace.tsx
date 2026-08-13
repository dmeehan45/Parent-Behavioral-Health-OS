"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { GraphCanvas } from "@/components/map/graph-canvas";
import { CommandPalette } from "@/components/map/command-palette";
import { DetailSheet } from "@/components/map/detail-sheet";
import { useLiveModel } from "@/components/map/use-live-model";
import { EDGE_COLOR, KIND_COLOR } from "@/components/map/canvas-theme";
import { KIND_LABELS } from "@/lib/model/kinds";
import type { LensId, ModelGraph, ModelNode } from "@/lib/model/types";

export type MapView = {
  lens: LensId;
  open?: string;
  expand: string[];
};

/**
 * The map workspace.
 *
 * One canvas, four lenses, and a detail layer that never takes the reader off
 * the map. All view state lives in the URL, so any view — a lens, an expanded
 * stage, an open primitive — is a link someone else can open and see the same
 * thing.
 */
export function MapWorkspace({ initialGraph, initialView }: { initialGraph: ModelGraph; initialView: MapView }) {
  const { graph, status, changed, lastChange, refresh } = useLiveModel(initialGraph);

  const [lens, setLens] = useState<LensId>(initialView.lens);
  const [openId, setOpenId] = useState<string | undefined>(initialView.open);
  const [expanded, setExpanded] = useState<string[]>(initialView.expand);
  const [trail, setTrail] = useState<string[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [focusRequest, setFocusRequest] = useState<{ id: string; nonce: number }>();

  const nodeById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes]);
  const openNode = openId ? nodeById.get(openId) : undefined;
  const activeLens = graph.lenses.find((entry) => entry.id === lens) ?? graph.lenses[0];

  /* ---- Shareable view state -------------------------------------------- */

  useEffect(() => {
    const params = new URLSearchParams();
    if (lens !== "flow") params.set("lens", lens);
    if (openId) params.set("open", openId);
    if (expanded.length > 0) params.set("expand", expanded.map((id) => id.replace(/^stage:/, "")).join(","));
    const query = params.toString();
    // Written directly to history so panning around the model never triggers a
    // server round trip or scroll reset.
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [lens, openId, expanded]);

  /* ---- Navigation ------------------------------------------------------- */

  const open = useCallback((nodeId?: string) => {
    setTrail([]);
    setOpenId(nodeId);
  }, []);

  const navigateWithin = useCallback(
    (nodeId: string) => {
      setTrail((previous) => (openId ? [...previous, openId] : previous));
      setOpenId(nodeId);
      // Following a link to something the current lens cannot show would leave
      // the reader looking at an unrelated picture, so switch to a lens that can.
      const target = nodeById.get(nodeId);
      if (target && !target.lenses.includes(lens) && target.lenses.length > 0) setLens(target.lenses[0]);
    },
    [openId, nodeById, lens],
  );

  const back = useCallback(() => {
    setTrail((previous) => {
      if (previous.length === 0) return previous;
      setOpenId(previous[previous.length - 1]);
      return previous.slice(0, -1);
    });
  }, []);

  const focus = useCallback(
    (nodeId: string) => {
      const target = nodeById.get(nodeId);
      if (!target) return;
      if (!target.lenses.includes(lens) && target.lenses.length > 0) setLens(target.lenses[0]);
      // A step is only on the canvas while its stage is open, so reveal it.
      if (target.parentId) setExpanded((previous) => (previous.includes(target.parentId!) ? previous : [...previous, target.parentId!]));
      setFocusRequest({ id: nodeId, nonce: Date.now() });
    },
    [nodeById, lens],
  );

  const toggleExpand = useCallback((nodeId: string) => {
    setExpanded((previous) =>
      previous.includes(nodeId) ? previous.filter((id) => id !== nodeId) : [...previous, nodeId],
    );
  }, []);

  const pickFromPalette = useCallback(
    (node: ModelNode) => {
      open(node.id);
      focus(node.id);
    },
    [open, focus],
  );

  /* ---- Keyboard --------------------------------------------------------- */

  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      const element = target as HTMLElement | null;
      return Boolean(element?.closest("input, textarea, select, [contenteditable='true']"));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (isTyping(event.target)) return;

      if (event.key === "/") {
        event.preventDefault();
        setPaletteOpen(true);
      } else if (event.key === "Escape") {
        if (paletteOpen) setPaletteOpen(false);
        else if (legendOpen) setLegendOpen(false);
        else open(undefined);
      } else if (/^[1-9]$/.test(event.key)) {
        const target = graph.lenses[Number(event.key) - 1];
        if (target) setLens(target.id);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [graph.lenses, paletteOpen, legendOpen, open]);

  /* ---- Render ----------------------------------------------------------- */

  return (
    <div className={`workspace${openNode || openId ? " sheet-open" : ""}`}>
      <div className="workspace-bar">
        <div className="lens-tabs" role="tablist" aria-label="Map lens">
          {graph.lenses.map((entry) => (
            <button
              key={entry.id}
              role="tab"
              aria-selected={entry.id === lens}
              className={`lens-tab${entry.id === lens ? " active" : ""}`}
              onClick={() => setLens(entry.id)}
              title={entry.description}
            >
              {entry.label}
              <span className="lens-count">{entry.nodeCount}</span>
            </button>
          ))}
        </div>

        <div className="bar-actions">
          <button type="button" className="search-trigger" onClick={() => setPaletteOpen(true)}>
            <span aria-hidden="true">⌕</span>
            <span className="search-label">Search the model</span>
            <kbd>⌘K</kbd>
          </button>

          <button
            type="button"
            className={`live-pill live-${status}`}
            onClick={refresh}
            title={
              status === "offline"
                ? "Cannot reach the model right now. Click to retry."
                : "This map follows content/. Click to check for changes now."
            }
          >
            <span className="live-dot" aria-hidden="true" />
            <span className="live-label">
              {status === "offline" ? "Offline" : status === "syncing" ? "Syncing" : "Live"}
            </span>
          </button>

          <button
            type="button"
            className={`legend-toggle${legendOpen ? " active" : ""}`}
            aria-pressed={legendOpen}
            onClick={() => setLegendOpen((value) => !value)}
          >
            Legend
          </button>
        </div>
      </div>

      <div className="workspace-canvas">
        <div className="canvas-orientation">
          <strong>{activeLens?.label}</strong>
          <span>{activeLens?.description}</span>
        </div>

        {lastChange && changed.size > 0 ? (
          <div className="update-toast" role="status">
            <span className="live-dot" aria-hidden="true" />
            Model updated · {lastChange}
          </div>
        ) : null}

        {legendOpen ? <Legend graph={graph} onClose={() => setLegendOpen(false)} /> : null}

        <ReactFlowProvider>
          <GraphCanvas
            graph={graph}
            lens={lens}
            selectedId={openId}
            expanded={expanded}
            changed={changed}
            focusRequest={focusRequest}
            sheetOpen={Boolean(openId)}
            onSelect={open}
            onToggleExpand={toggleExpand}
          />
        </ReactFlowProvider>
      </div>

      <DetailSheet
        key={openId}
        graph={graph}
        node={openNode}
        missing={Boolean(openId) && !openNode}
        trailDepth={trail.length}
        onBack={back}
        onClose={() => open(undefined)}
        onNavigate={navigateWithin}
        onFocus={focus}
      />

      {paletteOpen ? (
        <CommandPalette graph={graph} onClose={() => setPaletteOpen(false)} onPick={pickFromPalette} />
      ) : null}
    </div>
  );
}

function Legend({ graph, onClose }: { graph: ModelGraph; onClose: () => void }) {
  return (
    <div className="legend" role="dialog" aria-label="Map legend">
      <div className="legend-head">
        <h2>How to read this map</h2>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close legend">
          ✕
        </button>
      </div>

      <section>
        <h3 className="field-label">Primitives</h3>
        <ul className="legend-list">
          {(Object.keys(KIND_LABELS) as Array<keyof typeof KIND_LABELS>).map((kind) => (
            <li key={kind}>
              <span className="legend-swatch" style={{ background: KIND_COLOR[kind] }} aria-hidden="true" />
              {KIND_LABELS[kind]}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="field-label">Connections</h3>
        <ul className="legend-list">
          {graph.vocab.edges.map((edge) => (
            <li key={edge.kind}>
              <span
                className={`legend-line legend-line-${edge.kind}`}
                style={{ background: EDGE_COLOR[edge.kind] }}
                aria-hidden="true"
              />
              <span>
                <strong>{edge.label}</strong> {edge.description}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="field-label">Authority</h3>
        <ul className="legend-list">
          {graph.vocab.authority.map((term) => (
            <li key={term.id}>
              <span className={`badge tone-${term.tone}`}>{term.label}</span>
              <span>{term.description}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="legend-note">
        Bars under a primitive show how much of it has been described. The model is deliberately incomplete — an empty
        field is honest, so gaps are shown rather than filled in.
      </p>
    </div>
  );
}
