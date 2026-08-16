import { initializePaddle, type Paddle } from "@paddle/paddle-js";

let paddlePromise: Promise<Paddle | undefined> | null = null;

/**
 * Whether a checkout can be opened at all. Inlined at build time, so callers
 * can hide Subscribe buttons *before* asking the backend to mint a Paddle
 * transaction — otherwise a build with no token creates orphaned transactions
 * on every click.
 */
export const isPaddleConfigured = (): boolean =>
  Boolean(process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN);

/**
 * Lazily initialises Paddle.js with the public client token. Returns
 * undefined when the environment has no token (billing disabled) — callers
 * must treat that as "checkout unavailable", not an error.
 */
export function getPaddle(): Promise<Paddle | undefined> {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  if (!token) return Promise.resolve(undefined);

  paddlePromise ??= initializePaddle({
    token,
    environment: process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox",
  }).catch((error: unknown) => {
    // Never cache a rejection: an ad-blocker or a transient CDN failure would
    // otherwise poison every later attempt until a full page reload.
    paddlePromise = null;
    throw error;
  });
  return paddlePromise;
}

/**
 * Opens the Paddle checkout overlay for a transaction the backend created.
 * `onCompleted` fires on the overlay's completed event; the webhook remains
 * the source of truth, so callers refetch rather than trusting the callback.
 */
export async function openCheckout(
  transactionId: string,
  onCompleted: () => void
): Promise<boolean> {
  let paddle: Paddle | undefined;
  try {
    paddle = await getPaddle();
  } catch {
    return false;
  }
  if (!paddle) return false;

  paddle.Update({
    eventCallback: (event) => {
      if (event.name === "checkout.completed") onCompleted();
    },
  });
  paddle.Checkout.open({ transactionId });
  return true;
}
