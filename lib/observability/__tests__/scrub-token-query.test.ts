import { describe, expect, it } from "vitest";
import { scrubTokenInQuery, scrubTokenInUrl } from "../scrub-token-query";

const SECRET = "s3cr3tInv1teT0ken";

describe("scrubTokenInUrl", () => {
  it("replaces the token on the invite page, absolute or relative", () => {
    expect(scrubTokenInUrl(`http://localhost:3000/join/?token=${SECRET}`)).toBe(
      "http://localhost:3000/join/?token=[Filtered]"
    );
    expect(scrubTokenInUrl(`/join/?token=${SECRET}`)).toBe("/join/?token=[Filtered]");
  });

  it("replaces the token on the password reset page and keeps the other parameters", () => {
    expect(
      scrubTokenInUrl(`https://app.flexi-day.com/reset-password/?lang=cs&token=${SECRET}#top`)
    ).toBe("https://app.flexi-day.com/reset-password/?lang=cs&token=[Filtered]#top");
  });

  it("handles a span description with a leading method", () => {
    expect(scrubTokenInUrl(`GET http://localhost:3000/join/?token=${SECRET}`)).toBe(
      "GET http://localhost:3000/join/?token=[Filtered]"
    );
  });

  it("scrubs a token inside the redirect of the sign-in page", () => {
    const url = `/sign-in/?redirect=${encodeURIComponent(`/join/?token=${SECRET}`)}`;
    const scrubbed = scrubTokenInUrl(url);

    expect(scrubbed).toBe("/sign-in/?redirect=%2Fjoin%2F%3Ftoken%3D%5BFiltered%5D");
    expect(new URL(scrubbed, "http://localhost:3000").searchParams.get("redirect")).toBe(
      "/join/?token=[Filtered]"
    );
  });

  it("scrubs a token inside the redirect of the two-factor page and keeps methods", () => {
    const url = `http://localhost:3000/two-factor/?redirect=${encodeURIComponent(
      `/join/?token=${encodeURIComponent(SECRET)}`
    )}&methods=totp%2Cotp`;

    expect(scrubTokenInUrl(url)).toBe(
      "http://localhost:3000/two-factor/?redirect=%2Fjoin%2F%3Ftoken%3D%5BFiltered%5D&methods=totp%2Cotp"
    );
  });

  it("leaves URLs without a token unchanged, including redirects", () => {
    const urls = [
      "/dashboard/",
      "http://localhost:3000/requests/?status=pending",
      "/sign-in/?redirect=%2Frequests%2F%3Fstatus%3Dpending",
      "/sign-in/?redirect=%2Fteam%2F&tokenless=1",
    ];
    for (const url of urls) expect(scrubTokenInUrl(url)).toBe(url);
  });
});

describe("scrubTokenInQuery", () => {
  it("replaces a bare token pair", () => {
    expect(scrubTokenInQuery(`token=${SECRET}&lang=cs`)).toBe("token=[Filtered]&lang=cs");
  });

  it("replaces a token inside an encoded redirect", () => {
    expect(
      scrubTokenInQuery(`redirect=${encodeURIComponent(`/join/?token=${SECRET}`)}&_rsc=abc`)
    ).toBe("redirect=%2Fjoin%2F%3Ftoken%3D%5BFiltered%5D&_rsc=abc");
  });

  it("keeps a pair without a value", () => {
    expect(scrubTokenInQuery("token&lang=cs")).toBe("token&lang=cs");
  });

  it("leaves a query without a token unchanged", () => {
    const query = "redirect=%2Frequests%2F%3Fstatus%3Dpending&methods=totp";
    expect(scrubTokenInQuery(query)).toBe(query);
  });
});
