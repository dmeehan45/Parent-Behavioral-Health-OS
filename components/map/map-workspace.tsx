"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { GraphCanvas } from "@/components/map/graph-canvas";
import { CommandPalette } from "@/components/map/command-palette";
import { DetailSheet } from "@/components/map/detail-sheet";
import { useLiveModel } from "@/components/map/use-live-model";
import { EDGE_COLOR, KIND_COLOR } from "@/components/map/canvas-theme";
import { KIND_LABELS, KIND_MEANING } from "@/lib/model/kinds";
import {
  DEFAULT_FLOW_LAYERS,
  FLOW_LAYER_IDS,
  FLOW_LAYER_TERMS,
  edgeFlowLayers,
  type FlowLayerId,
} from "@/lib/model/flow-layers";
import type { LensId, ModelGraph, ModelNode } from "@/lib/model/types";

export type MapView = {
  lens: LensId;
  open?: string;
  expand: string[];
  layers: FlowLayerId[];
};

/**
 * The map workspace.
 *
 * One canvas, four lenses, toggleable operating-flow layers, and a detail layer
 * that never takes the reader off the map. All view state lives in the URL, so
 * a lens, layer isolation, expanded stage, or open primitive is a link someone
 * else can open and see as the same picture.
 */
export function MapWorkspace({ initialGraph, initialView }: { initialGraph: ModelGraph; initialView: MapView }) {
  const { graph, status, changed, lastChange, refresh } = useLiveModel(initialGraph);

  const [lens, setLens] = useState<LensId>(initialView.lens);
  const [openId, setOpenId] = useState<string | undefined>(initialView.open);
  const [expanded, setExpanded] = useState<string[]>(initialView.expand);
  const [layers, setLayers] = useState<FlowLayerId[]>(initialView.layers);
  const [trail, setTrail] = useState<string[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [focusRequest, setFocusRequest] = useState<{ id: string; nonce: number }>();

  const nodeById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes]);
  const openNode = openId ? nodeById.get(openId) : undefined;

  const layerCounts = useMemo(() => {
    const counts = Object.fromEntries(FLOW_LAYER_IDS.map((id) => [id, 0])) as Record<FlowLayerId, number>;
    for (const edge of graph.edges) {
      if (!edge.lenses.includes("flow")) continue;
      for (const layer of edgeFlowLayers(edge)) counts[layer] += 1;
    }
    return counts;
  }, [graph.edges]);

  /* ---- Shareable view state -------------------------------------------- */

  useEffect(() => {
    const params = new URLSearchParams();
    if (lens !== "flow") params.set("lens", lens);
    if (openId) params.set("open", openId);
    if (expanded.length > 0) params.set("expand", expanded.map((id) => id.replace(/^stage:/, "")).join(","));
    const allLayers = layers.length === DEFAULT_FLOW_LAYERS.length && DEFAULT_FLOW_LAYERS.every((id) => layers.includes(id));
    if (!allLayers) params.set("layers", layers.join(","));
    const query = params.toString();
    // Written directly to history so panning around the model never triggers a
    // server round trip or scroll reset.
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [lens, openId, expanded, layers]);

  const toggleLayer = useCallback((layer: FlowLayerId) => {
    setLayers((previous) => {
      if (previous.includes(layer)) {
        // A completely blank relationship layer looks like a broken map. Keep
        // at least one layer active and let the reader switch which one it is.
        if (previous.length === 1) return previous;
        return previous.filter((id) => id !== layer);
      }
      const enabled = new Set([...previous, layer]);
      return FLOW_LAYER_IDS.filter((id) => enabled.has(id));
    });
  }, []);

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
        else if (layersOpen) setLayersOpen(false);
        else if (legendOpen) setLegendOpen(false);
        else open(undefined);
      } else if (/^[1-9]$/.test(event.key)) {
        const target = graph.lenses[Number(event.key) - 1];
        if (target) setLens(target.id);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [graph.lenses, paletteOpen, layersOpen, legendOpen, open]);

  useEffect(() => {
    if (lens !== "flow") setLayersOpen(false);
  }, [lens]);

  /* ---- Render ----------------------------------------------------------- */

  return (
    <div className={`workspace${openNode || openId ? " sheet-open" : ""}`}>
      {/* The map is a page and needs a name. It had no h1 at all, so its only
          headings were the ones inside the legend and the detail sheet, and a
          screen reader landed on a document with no top-level label. */}
      <h1 className="visually-hidden">System map</h1>

      <div className="workspace-bar">
        {/* The tab labels name the four views; their node counts were four more
            numbers on the busiest control on the page, answering a question
            nobody asks before switching. The description stays as the tooltip. */}
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

          {lens === "flow" ? (
            <button
              type="button"
              className={`legend-toggle${layersOpen ? " active" : ""}`}
              aria-pressed={layersOpen}
              onClick={() => {
                setLegendOpen(false);
                setLayersOpen((value) => !value);
              }}
            >
              <span className="legend-icon" aria-hidden="true">
                ≋
              </span>
              <span className="legend-label">Layers</span>
            </button>
          ) : null}

          {/* The glyph carries it on a phone and the word carries it everywhere
              else, but the word stays in the accessibility tree either way —
              hiding it with `display: none` would leave the control unnamed. */}
          <button
            type="button"
            className={`legend-toggle${legendOpen ? " active" : ""}`}
            aria-pressed={legendOpen}
            onClick={() => {
              setLayersOpen(false);
              setLegendOpen((value) => !value);
            }}
          >
            <span className="legend-icon" aria-hidden="true">
              ?
            </span>
            <span className="legend-label">Legend</span>
          </button>
        </div>
      </div>

      <div className="workspace-canvas">
        {lastChange && changed.size > 0 ? (
          <div className="update-toast" role="status">
            <span className="live-dot" aria-hidden="true" />
            Model updated · {lastChange}
          </div>
        ) : null}

        {layersOpen ? (
          <LayerControls
            active={layers}
            counts={layerCounts}
            onToggle={toggleLayer}
            onClose={() => setLayersOpen(false)}
          />
        ) : null}
        {legendOpen ? <Legend graph={graph} onClose={() => setLegendOpen(false)} /> : null}

        <ReactFlowProvider>
          <GraphCanvas
            graph={graph}
            lens={lens}
            activeLayers={layers}
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

function LayerControls({
  active,
  counts,
  onToggle,
  onClose,
}: {
  active: FlowLayerId[];
  counts: Record<FlowLayerId, number>;
  onToggle: (layer: FlowLayerId) => void;
  onClose: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    headingRef.current?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  return (
    <div className="legend" role="dialog" aria-label="Operating flow layers">
      <div className="legend-head">
        <h2 ref={headingRef} tabIndex={-1}>
          What is flowing?
        </h2>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close layer controls">
          ✕
        </button>
      </div>

      <p className="legend-note">
        Isolate one kind of movement without changing the model underneath it. Nodes stay put so switching layers does not
        redraw the system into a different story.
      </p>

      <ul className="legend-list">
        {FLOW_LAYER_TERMS.map((term) => {
          const enabled = active.includes(term.id);
          const onlyActive = enabled && active.length === 1;
          const count = counts[term.id];
          return (
            <li key={term.id}>
              <label style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr) auto", gap: 10, width: "100%", alignItems: "start" }}>
                <input
                  type="checkbox"
                  checked={enabled}
                  disabled={onlyActive}
                  onChange={() => onToggle(term.id)}
                  aria-label={`${enabled ? "Hide" : "Show"} ${term.label}`}
                />
                <span>
                  <strong>{term.label}</strong> {term.description}
                </span>
                <span className="badge tone-quiet">{count === 0 ? "not explicit" : `${count} ${count === 1 ? "link" : "links"}`}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Legend({ graph, onClose }: { graph: ModelGraph; onClose: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  /**
   * Announcing a dialog and then leaving the reader outside it is worse than
   * not announcing one. Focus moves to the heading on open and back to whatever
   * opened it on close, so the vocabulary key is somewhere a keyboard can get
   * to without hunting for it.
   */
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    headingRef.current?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  return (
    <div className="legend" role="dialog" aria-label="Map legend">
      <div className="legend-head">
        <h2 ref={headingRef} tabIndex={-1}>
          How to read this map
        </h2>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close legend">
          ✕
        </button>
      </div>

      {/*
       * What each lens shows.
       *
       * This lived only in the tab's `title`, which a touch reader cannot reach
       * at all and a keyboard reader reaches inconsistently — so on a phone the
       * four tabs were four unexplained words. The legend is where vocabulary
       * belongs, and it is reachable everywhere now.
       */}
      <section>
        <h3 className="field-label">The four views</h3>
        <ul className="legend-list">
          {graph.lenses.map((entry) => (
            <li key={entry.id}>
              <span>
                <strong>{entry.label}</strong> {entry.description}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="field-label">Operating-flow layers</h3>
        <ul className="legend-list">
          {FLOW_LAYER_TERMS.map((term) => (
            <li key={term.id}>
              <span>
                <strong>{term.label}</strong> {term.description}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* The legend is where someone learns the vocabulary, so it says what each
          word means rather than only pairing it with a colour. */}
      <section>
        <h3 className="field-label">What the words mean</h3>
        <ul className="legend-list legend-terms">
          {(Object.keys(KIND_LABELS) as Array<keyof typeof KIND_LABELS>).map((kind) => (
            <li key={kind}>
              <span className="legend-swatch" style={{ background: KIND_COLOR[kind] }} aria-hidden="true" />
              <span>
                <strong>{KIND_LABELS[kind]}</strong> {KIND_MEANING[kind]}
              </span>
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
