/* eslint-disable @eslint-react/no-array-index-key -- marked's tokens are a fixed list that never reorders */
import { Fragment, type ReactNode } from "react";
import { lexer, type Token, type Tokens } from "marked";

/**
 * Renders a help article's Markdown as React elements from marked's tokens, so no HTML string is
 * ever injected. Images and raw HTML are dropped.
 */
export function HelpMarkdown({ markdown }: { markdown: string }) {
  return <>{renderTokens(lexer(markdown))}</>;
}

function renderTokens(tokens: Token[] | undefined): ReactNode {
  return tokens?.map((token, index) => <Fragment key={index}>{renderToken(token)}</Fragment>);
}

function renderToken(token: Token): ReactNode {
  switch (token.type) {
    case "heading": {
      const { depth, tokens } = token as Tokens.Heading;
      const Tag = (["h2", "h2", "h3", "h4", "h4", "h4"] as const)[depth - 1];
      return <Tag>{renderTokens(tokens)}</Tag>;
    }
    case "paragraph":
      return <p>{renderTokens((token as Tokens.Paragraph).tokens)}</p>;
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
      return <blockquote>{renderTokens((token as Tokens.Blockquote).tokens)}</blockquote>;
    case "code":
      return (
        <pre>
          <code>{(token as Tokens.Code).text}</code>
        </pre>
      );
    case "codespan":
      return <code>{(token as Tokens.Codespan).text}</code>;
    case "strong":
      return <strong>{renderTokens((token as Tokens.Strong).tokens)}</strong>;
    case "em":
      return <em>{renderTokens((token as Tokens.Em).tokens)}</em>;
    case "del":
      return <del>{renderTokens((token as Tokens.Del).tokens)}</del>;
    case "br":
      return <br />;
    case "hr":
      return <hr />;
    case "link": {
      const { href, tokens } = token as Tokens.Link;
      const external = !/^\/(?!\/)/.test(href);
      return (
        <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {renderTokens(tokens)}
        </a>
      );
    }
    case "table": {
      const table = token as Tokens.Table;
      return (
        <table>
          <thead>
            <tr>
              {table.header.map((cell, index) => (
                <th key={index}>{renderTokens(cell.tokens)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, index) => (
                  <td key={index}>{renderTokens(cell.tokens)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    default:
      return null;
  }
}
