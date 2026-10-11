import { describe, expect, it } from "vitest";
import { parseConnectCallback } from "../connect-callback";

const parse = (query: string) => parseConnectCallback(new URLSearchParams(query));

describe("parseConnectCallback", () => {
  it("returns null when the page was not reached from a callback", () => {
    expect(parse("")).toBeNull();
    expect(parse("tab=feeds")).toBeNull();
  });

  it("returns the provider and config of a successful connection", () => {
    expect(parse("connected=google&config=cfg-1")).toEqual({
      status: "connected",
      provider: "google",
      configId: "cfg-1",
    });
    expect(parse("connected=microsoft&config=cfg-2")).toEqual({
      status: "connected",
      provider: "microsoft",
      configId: "cfg-2",
    });
  });

  it.each([
    "state_invalid",
    "consent_denied",
    "provider_error",
    "config_not_found",
    "target_exists",
    "scope_denied",
    "exchange_failed",
    "server_error",
  ])("returns the %s error with its config", (code) => {
    expect(parse(`error=${code}&config=cfg-1`)).toEqual({
      status: "error",
      error: code,
      configId: "cfg-1",
    });
  });

  it.each([
    ["team_scope", "team_config"],
    ["provider_off", "provider_disabled"],
  ])("returns %s under the API error name %s", (code, name) => {
    expect(parse(`error=${code}&config=cfg-1`)).toEqual({
      status: "error",
      error: name,
      configId: "cfg-1",
    });
  });

  it("returns a null config when the backend could not name one", () => {
    expect(parse("error=state_invalid")).toEqual({
      status: "error",
      error: "state_invalid",
      configId: null,
    });
  });

  it("returns unknown for an error code it does not know", () => {
    expect(parse("error=something_new&config=cfg-1")).toEqual({
      status: "error",
      error: "unknown",
      configId: "cfg-1",
    });
    expect(parse("error=toString")).toEqual({
      status: "error",
      error: "unknown",
      configId: null,
    });
  });

  it("returns an unknown error for a provider it does not know", () => {
    expect(parse("connected=apple&config=cfg-1")).toEqual({
      status: "error",
      error: "unknown",
      configId: "cfg-1",
    });
  });
});
