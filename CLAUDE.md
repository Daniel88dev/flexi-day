# CLAUDE.md

Guidance for Claude Code working in `flexi-day`, the frontend of Flexi Day, a vacation/day-off
management product. Next.js 16 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui
(radix-maia style), TanStack Query, better-auth.

## Working style

Solo developer and owner, expert with this stack — skip explanations of standard conventions and
framework basics. Be terse: show results rather than narrating the work. When several
implementation approaches are open, state which you chose and why. Propose a plan and wait for
approval before starting any non-trivial implementation.

## It is a static export against a live backend

`output: "export"` builds to S3 + CloudFront. There is no server runtime, so no route handlers, no
server actions, no `next/image` optimisation, no middleware. Every request goes to `flexi-day-be`
via `NEXT_PUBLIC_API_URL` (local: `http://localhost:8080`), in dev as well as production.

Only the marketing landing page renders standalone, fed by `lib/demo/`. Every `app/(app)/` page
needs a running backend and a signed-in session.

## Running it locally

`npm run dev:scenario` from the workspace root seeds data, then
`http://localhost:3000/dev-sign-in/?email=owner@dev.local` signs you in without email verification.
That route exists only when `NEXT_PUBLIC_DEV_TOOLS=1` is set in `.env.local` — `pageExtensions` in
`next.config.ts` keeps `page.dev.tsx` files out of production builds entirely, so it can never
reach `out/`.

## Testing

- Vitest: `npm run test` (single run), `npm run test:watch`.
- Tests live **next to their source** in a `__tests__/` subfolder, e.g. `lib/__tests__/data.test.ts`,
  `components/__tests__/dashboard-stats.test.tsx`.
- **Every new function in `lib/` needs unit tests; every new component needs at least a smoke test.**
- Naming: `describe("functionName")` with `it("returns …")` / `it("should …")`.
- Pure logic → `.test.ts`; components → `.test.tsx` with `@testing-library/react`.
- CI runs `npm run test` on every PR. Keep it green before merging.

## Formatting is automatic

`.claude/settings.json` runs `prettier --write` after every Write and Edit, so files reformat
immediately after you touch them. Take the reformatted version as current rather than re-editing
to restore your own spacing.
