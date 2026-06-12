@AGENTS.md

## Testing

- Test runner: **Vitest** — `npm run test` (single run), `npm run test:watch` (watch mode)
- Tests live **next to their source**: `lib/__tests__/data.test.ts`, `components/__tests__/dashboard-stats.test.tsx` — always in a `__tests__/` folder inside the same directory as the file under test.
- **Every new function in `lib/` must have corresponding unit tests.** Every new component needs at minimum a smoke test (renders without crashing).
- Use `describe("functionName")` + `it("should …")` / `it("returns …")` naming.
- Pure logic tests go in `.test.ts`; component tests go in `.test.tsx` and can use `@testing-library/react`.
- CI runs `npm run test` on every PR — do not merge if tests are red.
