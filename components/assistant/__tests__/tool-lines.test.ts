import { describe, expect, it } from "vitest";
import { cs } from "@/lib/i18n/dictionaries/cs";
import { en } from "@/lib/i18n/dictionaries/en";
import { toolLine } from "../chat-parts";

describe("toolLine", () => {
  it("names each write tool's step in English and Czech", () => {
    expect(
      ["create_request", "cancel_my_request", "clock_in", "clock_out"].map((name) =>
        toolLine(en.assistant, name, "done")
      )
    ).toEqual([
      "Booked your time off",
      "Cancelled your request",
      "Clocked you in",
      "Clocked you out",
    ]);
    expect(toolLine(cs.assistant, "clock_out", "failed")).toBe("Odchod se nepodařilo zaznamenat");
    // A write only prepares its card while it runs; nothing changes before the user confirms.
    expect(
      ["create_request", "cancel_my_request", "clock_in", "clock_out"].map((name) =>
        toolLine(en.assistant, name, "running")
      )
    ).toEqual([
      "Preparing your request",
      "Preparing the cancellation",
      "Preparing your clock-in",
      "Preparing your clock-out",
    ]);
    expect(toolLine(cs.assistant, "create_request", "running")).toBe(
      "Připravuje tvoji žádost o volno"
    );
  });

  it("names the help lookups in English and Czech", () => {
    expect(toolLine(en.assistant, "search_docs", "running")).toBe("Searching the help");
    expect(toolLine(en.assistant, "read_doc", "done")).toBe("Read a help article");
    expect(toolLine(cs.assistant, "search_docs", "done")).toBe("Prohledal nápovědu");
    expect(toolLine(cs.assistant, "read_doc", "failed")).toBe(
      "Článek nápovědy se nepodařilo otevřít"
    );
  });
});
