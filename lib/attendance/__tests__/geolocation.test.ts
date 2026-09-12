import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();

vi.mock("@/lib/api/attendance", () => ({
  updateSessionLocation: (...args: unknown[]) => send(...args),
}));

import { captureSessionLocation } from "../geolocation";

const getCurrentPosition = vi.fn();

const position = (accuracy: number, latitude = 50.0755, longitude = 14.4378) =>
  ({ coords: { latitude, longitude, accuracy } }) as GeolocationPosition;

const denial = () =>
  ({
    code: 1,
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  }) as GeolocationPositionError;

const timeout = () =>
  ({
    code: 3,
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  }) as GeolocationPositionError;

/** Answers the next `getCurrentPosition` call with a fix, in call order. */
const answersWith = (...outcomes: (GeolocationPosition | GeolocationPositionError)[]) => {
  let call = 0;
  getCurrentPosition.mockImplementation(
    (
      onFix: PositionCallback,
      onError: PositionErrorCallback,
      _options: PositionOptions // eslint-disable-line @typescript-eslint/no-unused-vars
    ) => {
      const outcome = outcomes[call++];
      if (outcome && "coords" in outcome) onFix(outcome);
      else onError(outcome as GeolocationPositionError);
    }
  );
};

describe("captureSessionLocation", () => {
  beforeEach(() => {
    getCurrentPosition.mockReset();
    send.mockReset();
    send.mockResolvedValue({ applied: true });
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("asks twice, coarse first and precise second", async () => {
    answersWith(position(900), position(6));

    await captureSessionLocation("session-1", "IN");

    expect(getCurrentPosition).toHaveBeenCalledTimes(2);
    const [, , coarse] = getCurrentPosition.mock.calls[0] as [unknown, unknown, PositionOptions];
    const [, , precise] = getCurrentPosition.mock.calls[1] as [unknown, unknown, PositionOptions];
    expect(coarse.enableHighAccuracy).toBe(false);
    expect(precise.enableHighAccuracy).toBe(true);
    // Both timeouts together have to fit inside the backend's two minutes.
    expect((coarse.timeout ?? 0) + (precise.timeout ?? 0)).toBeLessThan(120_000);
  });

  it("sends both fixes, the sharper one second", async () => {
    answersWith(position(900), position(6));

    await captureSessionLocation("session-1", "IN");

    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenNthCalledWith(
      1,
      "session-1",
      expect.objectContaining({ accuracy: 900 })
    );
    expect(send).toHaveBeenNthCalledWith(2, "session-1", expect.objectContaining({ accuracy: 6 }));
  });

  it("tags the fix with the end it belongs to", async () => {
    answersWith(position(20), position(5));

    await captureSessionLocation("session-1", "OUT");

    expect(send).toHaveBeenCalledWith("session-1", expect.objectContaining({ end: "OUT" }));
  });

  it("stops after a refusal rather than asking a second time", async () => {
    answersWith(denial(), position(5));

    await expect(captureSessionLocation("session-1", "IN")).resolves.toBeUndefined();

    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalled();
  });

  it("carries on to the precise pass after a timeout", async () => {
    answersWith(timeout(), position(5));

    await captureSessionLocation("session-1", "IN");

    expect(getCurrentPosition).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith("session-1", expect.objectContaining({ accuracy: 5 }));
  });

  it("swallows a failed update instead of raising it", async () => {
    answersWith(position(900), position(6));
    send.mockRejectedValue(new Error("offline"));

    await expect(captureSessionLocation("session-1", "IN")).resolves.toBeUndefined();

    expect(send).toHaveBeenCalledTimes(2);
  });

  it("drops a reading the backend would only refuse", async () => {
    answersWith(position(0), position(Number.NaN));

    await captureSessionLocation("session-1", "IN");

    expect(send).not.toHaveBeenCalled();
  });

  it("does nothing at all where the browser has no geolocation", async () => {
    vi.stubGlobal("navigator", {});

    await expect(captureSessionLocation("session-1", "IN")).resolves.toBeUndefined();

    expect(send).not.toHaveBeenCalled();
  });
});
