import { describe, expect, it } from "vitest";
import { appLabel } from "../ai-connections";

describe("appLabel", () => {
  const app = { clientId: "client-1", name: "Claude", verified: true, host: "claude.ai" };

  it("returns the app's own name", () => {
    expect(appLabel(app)).toBe("Claude");
  });

  it("returns the host when the app gave no name", () => {
    expect(appLabel({ ...app, name: null })).toBe("claude.ai");
    expect(appLabel({ ...app, name: "  " })).toBe("claude.ai");
  });

  it("returns the client id when there is neither", () => {
    expect(appLabel({ ...app, name: null, host: "" })).toBe("client-1");
  });
});
