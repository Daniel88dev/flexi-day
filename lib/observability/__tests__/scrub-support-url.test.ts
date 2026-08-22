import { describe, expect, it } from "vitest";
import { scrubSupportQuery, scrubSupportUrlsInEvent } from "../scrub-support-url";

describe("scrubSupportQuery", () => {
  it("strips the query string from support URLs only", () => {
    expect(
      scrubSupportQuery("http://localhost:8080/api/support/organizations?query=a%40b.com")
    ).toBe("http://localhost:8080/api/support/organizations");
    expect(scrubSupportQuery("GET http://x/api/support/organizations?query=jane")).toBe(
      "GET http://x/api/support/organizations"
    );
    // Non-support URLs keep their query string — report filters rely on it.
    expect(scrubSupportQuery("http://x/api/reports/overview?year=2026")).toBe(
      "http://x/api/reports/overview?year=2026"
    );
    expect(scrubSupportQuery("/dashboard/")).toBe("/dashboard/");
  });
});

describe("scrubSupportUrlsInEvent", () => {
  it("scrubs request, breadcrumbs and spans in place", () => {
    const event = {
      request: { url: "http://x/api/support/organizations?query=jane%40acme.com" },
      breadcrumbs: [
        { data: { url: "http://x/api/support/organizations?query=jane%40acme.com" } },
        { data: { url: "http://x/api/vacation?year=2026" } },
        {},
      ],
      spans: [
        {
          description: "GET http://x/api/support/organizations?query=jane%40acme.com",
          data: { "http.url": "http://x/api/support/organizations?query=jane%40acme.com" },
        },
      ],
    };

    scrubSupportUrlsInEvent(event);

    expect(JSON.stringify(event)).not.toContain("jane");
    expect(event.request.url).toBe("http://x/api/support/organizations");
    expect(event.breadcrumbs[1]!.data!.url).toBe("http://x/api/vacation?year=2026");
    expect(event.spans[0]!.description).toBe("GET http://x/api/support/organizations");
  });

  it("returns the event untouched when nothing matches", () => {
    const event = { request: { url: "http://x/api/vacation?year=2026" } };
    expect(scrubSupportUrlsInEvent(event).request.url).toBe("http://x/api/vacation?year=2026");
  });
});
