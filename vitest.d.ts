/// <reference types="vitest/globals" />

import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

// @testing-library/jest-dom@7 augments vitest's `Assertion<T>`, but vitest 5
// renamed that slot to `Assertion<R, T>`, so the merge no longer lands and every
// matcher disappears from the types. Drop this once jest-dom ships vitest 5 types.
declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Matchers<
    R extends void | Promise<void> = void | Promise<void>,
    T = unknown,
  > extends TestingLibraryMatchers<T, R> {}
}
