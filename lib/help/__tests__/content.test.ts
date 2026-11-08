import { describe, expect, it } from "vitest";
import { checkKnowledgeBase } from "../knowledge-base";

describe("content/help", () => {
  it("passes every help article check", () => {
    expect(checkKnowledgeBase({})).toEqual([]);
  });
});
