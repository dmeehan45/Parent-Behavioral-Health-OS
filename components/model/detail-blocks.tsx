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
  headingLevel = 2,
  collapse = false,
}: {
  blocks: DetailBlock[];
  onNavigate?: (nodeId: string) => void;
  /**
   * What these block labels are headings *of*. On a full page the blocks are the
   * page's own sections and sit under its `h1`; inside the detail sheet they sit
   * under the record's `h2`. Fixing this at `h3` skipped a level on every record
   * page in the model, which is the outline a screen reader navigates by.
   */
  headingLevel?: 2 | 3;
  /**
   * Fold the long-form markdown blocks behind their own headings. The detail
   * sheet sets this: it is a glance layer, and an authored section printed
   * whole in a narrow column buries every link below it. Record pages leave it
   * off — they are the full read, and folded prose there would just be a
   * second click on the way to what the reader already came for.
   */
  collapse?: boolean;
}) {
  if (blocks.length === 0) return null;

  const Heading = `h${headingLevel}` as const;

  return (
    <div className="detail-blocks">
      {blocks.map((block, index) => {
        const key = `${block.type}-${block.label}-${index}`;

        switch (block.type) {
          case "prose":
            return (
              <section className="detail-block" key={key}>
                <Heading className="field-label">{block.label}</Heading>
                <p className="detail-prose">{block.value}</p>
              </section>
            );

          case "markdown":
            if (collapse) {
              // Native disclosure: keyboard-operable as-is, and the heading
              // stays in the outline whether the fold is open or not.
              return (
                <details className="detail-block detail-fold" key={key}>
                  <summary>
                    <Heading className="field-label">{block.label}</Heading>
                  </summary>
                  <Markdown source={block.value} />
                </details>
              );
            }
            return (
              <section className="detail-block" key={key}>
                <Heading className="field-label">{block.label}</Heading>
                <Markdown source={block.value} />
              </section>
            );

          case "list":
            return (
              <section className="detail-block" key={key}>
                <Heading className="field-label">{block.label}</Heading>
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
                <Heading className="field-label">{block.label}</Heading>
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
                <Heading className="field-label">{block.label}</Heading>
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
                <Heading className="field-label">
                  {block.label} <span className="field-count">{block.items.length}</span>
                </Heading>
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
