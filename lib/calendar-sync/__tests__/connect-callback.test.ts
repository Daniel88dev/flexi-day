// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  parseConnectCallback,
  rememberConnectProvider,
  takeConnectProvider,
} from "../connect-callback";

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
      provider: null,
      configId: "cfg-1",
    });
  });

  it.each(["google", "microsoft"])("returns the %s provider the error redirect names", (slug) => {
    expect(parse(`error=consent_denied&provider=${slug}&config=cfg-1`)).toEqual({
      status: "error",
      error: "consent_denied",
      provider: slug,
      configId: "cfg-1",
    });
  });

  it("returns a null provider for one it does not know", () => {
    expect(parse("error=consent_denied&provider=apple&config=cfg-1")).toEqual({
      status: "error",
      error: "consent_denied",
      provider: null,
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
      provider: null,
      configId: "cfg-1",
    });
  });

  it("returns a null config when the backend could not name one", () => {
    expect(parse("error=state_invalid")).toEqual({
      status: "error",
      error: "state_invalid",
      provider: null,
      configId: null,
    });
  });

  it("returns unknown for an error code it does not know", () => {
    expect(parse("error=something_new&config=cfg-1")).toEqual({
      status: "error",
      error: "unknown",
      provider: null,
      configId: "cfg-1",
    });
    expect(parse("error=toString")).toEqual({
      status: "error",
      error: "unknown",
      provider: null,
      configId: null,
    });
  });

  it("returns an unknown error for a provider it does not know", () => {
    expect(parse("connected=apple&config=cfg-1")).toEqual({
      status: "error",
      error: "unknown",
      provider: null,
      configId: "cfg-1",
    });
  });
});

describe("takeConnectProvider", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("returns the provider rememberConnectProvider stored, once", () => {
    rememberConnectProvider("microsoft");
    expect(takeConnectProvider()).toBe("microsoft");
    expect(takeConnectProvider()).toBeNull();
  });

  it("returns null when nothing was stored", () => {
    expect(takeConnectProvider()).toBeNull();
  });

  it("returns null for a value that is not a provider", () => {
    window.sessionStorage.setItem("flexi-day.calendar-connect-provider", "apple");
    expect(takeConnectProvider()).toBeNull();
  });
});
