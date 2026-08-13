"use client";

import Link from "next/link";
import { Markdown } from "@/components/markdown";
import { KindBadge } from "@/components/model/badges";
import type { DetailBlock } from "@/lib/model/types";

/**
 * Renders the detail of any primitive from its projected blocks.
 *
 * One renderer covers stages, steps, bets, claims, metrics, entities, and
 * prototypes, because the projection already decided what each of them has to
 * say. Blocks are only built for populated fields, so a thinly described
 * primitive renders short rather than as a wall of empty headings.
 *
 * When `onNavigate` is supplied, links traverse *within* the detail panel and
 * the reader keeps the map behind them. Without it — on full pages — the same
 * links are ordinary navigation.
 */
export function DetailBlocks({
  blocks,
  onNavigate,
}: {
  blocks: DetailBlock[];
  onNavigate?: (nodeId: string) => void;
}) {
  if (blocks.length === 0) return null;

  return (
    <div className="detail-blocks">
      {blocks.map((block, index) => {
        const key = `${block.type}-${block.label}-${index}`;

        switch (block.type) {
          case "prose":
            return (
              <section className="detail-block" key={key}>
                <h3 className="field-label">{block.label}</h3>
                <p className="detail-prose">{block.value}</p>
              </section>
            );

          case "markdown":
            return (
              <section className="detail-block" key={key}>
                <h3 className="field-label">{block.label}</h3>
                <Markdown source={block.value} />
              </section>
            );

          case "list":
            return (
              <section className="detail-block" key={key}>
                <h3 className="field-label">{block.label}</h3>
                <ul className="detail-list">
                  {block.items.map((item, itemIndex) => (
                    <li key={`${key}-${itemIndex}`}>{item}</li>
                  ))}
                </ul>
              </section>
            );

          case "states":
            return (
              <section className="detail-block" key={key}>
                <h3 className="field-label">{block.label}</h3>
                <ul className="state-list">
                  {block.items.map((item, itemIndex) => (
                    <li key={`${key}-${itemIndex}`}>
                      {onNavigate ? (
                        <button type="button" onClick={() => onNavigate(`entity:${item.entityId}`)}>
                          <strong>{item.entityTitle}</strong>
                          <span>{item.state}</span>
                        </button>
                      ) : (
                        <Link href={item.href}>
                          <strong>{item.entityTitle}</strong>
                          <span>{item.state}</span>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );

          case "rules":
            return (
              <section className="detail-block" key={key}>
                <h3 className="field-label">{block.label}</h3>
                <ul className="rule-list">
                  {block.items.map((rule) => (
                    <li key={rule.id}>
                      <p>{rule.statement}</p>
                      {rule.authority ? <span className="badge tone-quiet">{rule.authority}</span> : null}
                    </li>
                  ))}
                </ul>
              </section>
            );

          case "links":
            return (
              <section className="detail-block" key={key}>
                <h3 className="field-label">
                  {block.label} <span className="field-count">{block.items.length}</span>
                </h3>
                <ul className="link-list">
                  {block.items.map((item) => {
                    const body = (
                      <>
                        <KindBadge kind={item.kind} subtle />
                        <span className="link-title">{item.title}</span>
                        {item.meta ? <span className="link-meta">{item.meta}</span> : null}
                      </>
                    );
                    return (
                      <li key={item.id}>
                        {onNavigate ? (
                          <button type="button" onClick={() => onNavigate(item.id)}>
                            {body}
                          </button>
                        ) : (
                          <Link href={item.href}>{body}</Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
        }
      })}
    </div>
  );
}
