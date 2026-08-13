import { Fragment, type ReactNode } from "react";

/**
 * A deliberately small Markdown renderer for content bodies.
 *
 * Content files use a narrow subset — paragraphs, lists, sub-headings, and
 * inline emphasis — so this covers it without adding a dependency or reaching
 * for `dangerouslySetInnerHTML`. Everything is rendered as React elements, so
 * nothing in `content/` can inject markup.
 */

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(INLINE).filter(Boolean).map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    if (token.startsWith("**") && token.endsWith("**")) return <strong key={key}>{token.slice(2, -2)}</strong>;
    if (token.startsWith("`") && token.endsWith("`")) return <code key={key}>{token.slice(1, -1)}</code>;
    if (token.startsWith("*") && token.endsWith("*")) return <em key={key}>{token.slice(1, -1)}</em>;

    const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      const external = /^https?:/.test(href);
      return (
        <a key={key} href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
          {label}
        </a>
      );
    }
    return <Fragment key={key}>{token}</Fragment>;
  });
}

type Block =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

function parse(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | undefined;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({ type: "list", ...list });
      list = undefined;
    }
  };

  for (const rawLine of source.split("\n")) {
    const line = rawLine.trim();

    if (line.length === 0) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = /^(#{2,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", level: heading[1].length <= 2 ? 2 : 3, text: heading[2] });
      continue;
    }

    const bullet = /^[-*+]\s+(.*)$/.exec(line);
    const numbered = /^\d+\.\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      const text = (bullet ?? numbered)![1];
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push(text);
      continue;
    }

    // A line directly under a list item continues it. Content files wrap long
    // lines, and without this the tail of a wrapped question would break out of
    // the list and render as a stray paragraph.
    if (list && list.items.length > 0) {
      list.items[list.items.length - 1] += ` ${line}`;
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const blocks = parse(source);
  if (blocks.length === 0) return null;

  return (
    <div className={className ? `prose ${className}` : "prose"}>
      {blocks.map((block, index) => {
        const key = `block-${index}`;
        if (block.type === "heading") {
          const Tag = block.level === 2 ? "h4" : "h5";
          return <Tag key={key}>{renderInline(block.text, key)}</Tag>;
        }
        if (block.type === "list") {
          const Tag = block.ordered ? "ol" : "ul";
          return (
            <Tag key={key}>
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>
              ))}
            </Tag>
          );
        }
        return <p key={key}>{renderInline(block.text, key)}</p>;
      })}
    </div>
  );
}
