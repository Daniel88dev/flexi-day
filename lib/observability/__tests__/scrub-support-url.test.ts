import { describe, expect, it } from "vitest";
import { scrubBreadcrumbUrls, scrubSupportQuery, scrubUrlsInEvent } from "../scrub-support-url";

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

describe("scrubUrlsInEvent", () => {
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

    scrubUrlsInEvent(event);

    expect(JSON.stringify(event)).not.toContain("jane");
    expect(event.request.url).toBe("http://x/api/support/organizations");
    expect(event.breadcrumbs[1]!.data!.url).toBe("http://x/api/vacation?year=2026");
    expect(event.spans[0]!.description).toBe("GET http://x/api/support/organizations");
  });

  it("returns the event untouched when nothing matches", () => {
    const event = { request: { url: "http://x/api/vacation?year=2026" } };
    expect(scrubUrlsInEvent(event).request.url).toBe("http://x/api/vacation?year=2026");
  });
});

describe("scrubUrlsInEvent with page tokens", () => {
  const SECRET = "s3cr3tInv1teT0ken";
  const joinUrl = `http://localhost:3000/join/?token=${SECRET}`;
  const signInPath = `/sign-in/?redirect=${encodeURIComponent(`/join/?token=${SECRET}`)}`;
  const signInUrl = `http://localhost:3000${signInPath}`;

  const breadcrumbs = () => [
    { category: "navigation", data: { from: `/join/?token=${SECRET}`, to: signInPath } },
    { category: "fetch", data: { url: `${signInUrl}&_rsc=abc`, method: "GET" } },
  ];

  it("keeps the token out of an error event", () => {
    const event = {
      request: { url: signInUrl, headers: { Referer: joinUrl, "User-Agent": "test" } },
      breadcrumbs: breadcrumbs(),
    };

    scrubUrlsInEvent(event);

    expect(JSON.stringify(event)).not.toContain(SECRET);
    expect(event.request.url).toBe(
      "http://localhost:3000/sign-in/?redirect=%2Fjoin%2F%3Ftoken%3D%5BFiltered%5D"
    );
    expect(event.request.headers.Referer).toBe("http://localhost:3000/join/?token=[Filtered]");
    expect(event.breadcrumbs[0]!.data.from).toBe("/join/?token=[Filtered]");
  });

  it("keeps the token out of a page-load transaction event", () => {
    const event = {
      request: { url: joinUrl, headers: { Referer: signInUrl } },
      breadcrumbs: breadcrumbs(),
      contexts: { trace: { data: { "url.full": signInUrl, "sentry.op": "navigation" } } },
      spans: [
        { description: joinUrl, data: { "sentry.op": "browser.request" } },
        {
          description: `GET ${signInUrl}&_rsc=abc`,
          data: {
            "url.full": `${signInUrl}&_rsc=abc`,
            "url.query": `redirect=${encodeURIComponent(`/join/?token=${SECRET}`)}&_rsc=abc`,
          },
        },
      ],
    };

    scrubUrlsInEvent(event);

    expect(JSON.stringify(event)).not.toContain(SECRET);
    expect(event.spans[0]!.description).toBe("http://localhost:3000/join/?token=[Filtered]");
    expect(event.spans[1]!.data["url.query"]).toBe(
      "redirect=%2Fjoin%2F%3Ftoken%3D%5BFiltered%5D&_rsc=abc"
    );
    expect(event.contexts.trace.data["sentry.op"]).toBe("navigation");
  });
});

describe("scrubBreadcrumbUrls", () => {
  it("scrubs navigation and fetch breadcrumbs and leaves others alone", () => {
    const navigation = {
      category: "navigation",
      data: { from: "/join/?token=abc123", to: "/sign-in/?redirect=%2Fjoin%2F%3Ftoken%3Dabc123" },
    };
    const fetchCrumb = {
      category: "fetch",
      data: { url: "http://x/api/support/organizations?query=jane%40acme.com" },
    };
    const consoleCrumb = { category: "console", message: "?token=x", data: { logger: "console" } };

    expect(scrubBreadcrumbUrls(navigation).data).toEqual({
      from: "/join/?token=[Filtered]",
      to: "/sign-in/?redirect=%2Fjoin%2F%3Ftoken%3D%5BFiltered%5D",
    });
    expect(scrubBreadcrumbUrls(fetchCrumb).data.url).toBe("http://x/api/support/organizations");
    expect(scrubBreadcrumbUrls(consoleCrumb)).toEqual({
      category: "console",
      message: "?token=x",
      data: { logger: "console" },
    });
  });
});
