import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const initializePaddleMock = vi.fn();
vi.mock("@paddle/paddle-js", () => ({
  initializePaddle: (...args: unknown[]) => initializePaddleMock(...args),
}));

const ORIGINAL_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
const ORIGINAL_ENV = process.env.NEXT_PUBLIC_PADDLE_ENV;

async function freshModule() {
  vi.resetModules();
  return import("../paddle");
}

describe("isPaddleConfigured", () => {
  beforeEach(() => {
    initializePaddleMock.mockReset();
  });

  it("returns false when no client token is set", async () => {
    delete process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const { isPaddleConfigured } = await freshModule();
    expect(isPaddleConfigured()).toBe(false);
  });

  it("returns true once a client token is present", async () => {
    process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN = "test_token";
    const { isPaddleConfigured } = await freshModule();
    expect(isPaddleConfigured()).toBe(true);
  });
});

describe("getPaddle", () => {
  beforeEach(() => {
    initializePaddleMock.mockReset();
    process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN = "test_token";
    process.env.NEXT_PUBLIC_PADDLE_ENV = "sandbox";
  });

  it("resolves undefined without initialising when the token is missing", async () => {
    delete process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const { getPaddle } = await freshModule();

    await expect(getPaddle()).resolves.toBeUndefined();
    expect(initializePaddleMock).not.toHaveBeenCalled();
  });

  it("initialises once and caches the instance", async () => {
    initializePaddleMock.mockResolvedValue({ id: "paddle" });
    const { getPaddle } = await freshModule();

    await getPaddle();
    await getPaddle();

    expect(initializePaddleMock).toHaveBeenCalledTimes(1);
    expect(initializePaddleMock).toHaveBeenCalledWith({
      token: "test_token",
      environment: "sandbox",
    });
  });

  it("passes production environment through", async () => {
    process.env.NEXT_PUBLIC_PADDLE_ENV = "production";
    initializePaddleMock.mockResolvedValue({ id: "paddle" });
    const { getPaddle } = await freshModule();

    await getPaddle();

    expect(initializePaddleMock).toHaveBeenCalledWith(
      expect.objectContaining({ environment: "production" })
    );
  });

  it("does not cache a rejection, so a later attempt can recover", async () => {
    initializePaddleMock.mockRejectedValueOnce(new Error("blocked by extension"));
    const { getPaddle } = await freshModule();

    await expect(getPaddle()).rejects.toThrow("blocked by extension");

    initializePaddleMock.mockResolvedValue({ id: "paddle" });
    await expect(getPaddle()).resolves.toEqual({ id: "paddle" });
    expect(initializePaddleMock).toHaveBeenCalledTimes(2);
  });
});

describe("openCheckout", () => {
  beforeEach(() => {
    initializePaddleMock.mockReset();
    process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN = "test_token";
  });

  it("returns false when Paddle is unavailable rather than throwing", async () => {
    delete process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const { openCheckout } = await freshModule();

    await expect(openCheckout("txn_1", vi.fn())).resolves.toBe(false);
  });

  it("returns false when initialisation rejects", async () => {
    initializePaddleMock.mockRejectedValue(new Error("cdn down"));
    const { openCheckout } = await freshModule();

    await expect(openCheckout("txn_1", vi.fn())).resolves.toBe(false);
  });

  it("opens the overlay and fires the callback on checkout.completed", async () => {
    const open = vi.fn();
    let handler: ((event: { name: string }) => void) | undefined;
    initializePaddleMock.mockResolvedValue({
      Update: ({ eventCallback }: { eventCallback: (e: { name: string }) => void }) => {
        handler = eventCallback;
      },
      Checkout: { open },
    });
    const { openCheckout } = await freshModule();
    const onCompleted = vi.fn();

    await expect(openCheckout("txn_1", onCompleted)).resolves.toBe(true);
    expect(open).toHaveBeenCalledWith({ transactionId: "txn_1" });

    handler?.({ name: "checkout.closed" });
    expect(onCompleted).not.toHaveBeenCalled();

    handler?.({ name: "checkout.completed" });
    expect(onCompleted).toHaveBeenCalledTimes(1);
  });
});

afterAll(() => {
  if (ORIGINAL_TOKEN === undefined) delete process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  else process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN = ORIGINAL_TOKEN;
  if (ORIGINAL_ENV === undefined) delete process.env.NEXT_PUBLIC_PADDLE_ENV;
  else process.env.NEXT_PUBLIC_PADDLE_ENV = ORIGINAL_ENV;
});
