/* eslint-disable @eslint-react/no-array-index-key -- marked's tokens of one finished text never reorder */
import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { lexer, type Token, type Tokens } from "marked";
import { SITE_URL } from "@/lib/site";

/** Where a link in an answer may point and still be clickable: a path here, this app, or the site. */
export function ownLink(href: string): { kind: "path" | "origin"; href: string } | null {
  if (/^\/(?![/\\])/.test(href)) return { kind: "path", href };
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const own = new Set([new URL(SITE_URL).origin]);
  if (typeof window !== "undefined") own.add(window.location.origin);
  return own.has(url.origin) ? { kind: "origin", href: url.href } : null;
}

/**
 * The Assistant's Markdown as React elements built from marked's tokens, so no
 * HTML string reaches the DOM. Images and raw HTML are dropped, and only links
 * to our own origins are clickable; any other link shows as its plain text.
 */
export function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-[15px] leading-[1.6] [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-4">
      {renderTokens(lexer(text))}
    </div>
  );
}

function renderTokens(tokens: Token[] | undefined): ReactNode {
  return tokens?.map((token, index) => <Fragment key={index}>{renderToken(token)}</Fragment>);
}

function renderToken(token: Token): ReactNode {
  switch (token.type) {
    case "heading":
      return <p className="font-semibold">{renderTokens((token as Tokens.Heading).tokens)}</p>;
    case "paragraph":
      return (
        <p className="whitespace-pre-line">{renderTokens((token as Tokens.Paragraph).tokens)}</p>
      );
    case "text": {
      const text = token as Tokens.Text;
      return text.tokens ? renderTokens(text.tokens) : text.text;
    }
    case "escape":
      return (token as Tokens.Escape).text;
    case "list": {
      const list = token as Tokens.List;
      const items = list.items.map((item, index) => (
        <li key={index}>{renderTokens(item.tokens)}</li>
      ));
      return list.ordered ? (
        <ol start={typeof list.start === "number" ? list.start : undefined}>{items}</ol>
      ) : (
        <ul>{items}</ul>
      );
    }
    case "blockquote":
      return (
        <blockquote className="border-l-2 pl-3" style={{ borderColor: "var(--border-strong)" }}>
          {renderTokens((token as Tokens.Blockquote).tokens)}
        </blockquote>
      );
    case "code":
      return (
        <pre className="overflow-x-auto rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-2 text-[13px]">
          <code>{(token as Tokens.Code).text}</code>
        </pre>
      );
    case "codespan":
      return <code className="text-[13.5px]">{(token as Tokens.Codespan).text}</code>;
    case "strong":
      return (
        <strong className="font-semibold">{renderTokens((token as Tokens.Strong).tokens)}</strong>
      );
    case "em":
      return <em>{renderTokens((token as Tokens.Em).tokens)}</em>;
    case "del":
      return <del>{renderTokens((token as Tokens.Del).tokens)}</del>;
    case "br":
      return <br />;
    case "link": {
      const { href, tokens } = token as Tokens.Link;
      const label = renderTokens(tokens);
      const own = ownLink(href);
      if (!own) return label;
      const className =
        "font-medium text-[color:var(--primary-strong)] underline underline-offset-2";
      return own.kind === "path" ? (
        <Link href={own.href} className={className}>
          {label}
        </Link>
      ) : (
        <a href={own.href} target="_blank" rel="noopener noreferrer" className={className}>
          {label}
        </a>
      );
    }
    default:
      // Images, raw HTML, link definitions, tables, rules: nothing the panel shows.
      return null;
  }
}
