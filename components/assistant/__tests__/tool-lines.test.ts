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
    expect(toolLine(cs.assistant, "create_request", "running")).toBe("Zadává tvoji žádost o volno");
  });
});
