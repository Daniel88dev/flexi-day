/* eslint-disable @eslint-react/no-array-index-key -- blocks of one finished text, never reordered */
import { Fragment, type ReactNode } from "react";

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

/** Paragraphs, bullet lists and bold, as plain React; no HTML from the model ever reaches the DOM. */
export function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-[15px] leading-[1.6]">
      {text.split(/\n{2,}/).map((block, i) => {
        const lines = block.split("\n").filter((line) => line.length > 0);
        if (lines.length > 0 && lines.every((line) => line.startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-4">
              {lines.map((line, j) => (
                <li key={j}>{inline(line.slice(2))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-line">
            {inline(block)}
          </p>
        );
      })}
    </div>
  );
}
