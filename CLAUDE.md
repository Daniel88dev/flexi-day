# CLAUDE.md

Guidance for Claude Code working in `flexi-day`, the frontend of Flexi Day, a vacation/day-off
management product. Next.js 16 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui
(radix-maia style), TanStack Query, better-auth.

## Working style

Solo developer and owner, expert with this stack — skip explanations of standard conventions and
framework basics. Be terse: lead with results, and while working say a line when you start a new
phase or hit something unexpected. When several
implementation approaches are open, state which you chose and why. Propose a plan and wait for
approval before starting any non-trivial implementation.

## It is a static export against a live backend

`output: "export"` builds to S3 + CloudFront. There is no server runtime, so no route handlers, no
server actions, no `next/image` optimisation, no middleware. Every request goes to `flexi-day-be`
via `NEXT_PUBLIC_API_URL` (local: `http://localhost:8080`), in dev as well as production.

One kind of route handler survives the export: a `GET` with `export const dynamic = "force-static"`
that reads no request, which the build writes out as a file. `app/(help)/help/kb.json/route.ts` is
the one there is: the knowledge base the backend fetches, built from `content/help/` at
`out/help/kb.json` and served from the same path by `next dev`. Anything that reads the request or
answers a method other than `GET` breaks the export, so it stays out.

The bucket, the distribution and its redirect function are Terraform in `terraform/`, applied by
hand. See [`docs/terraform.md`](docs/terraform.md).

Only the marketing landing page renders standalone, fed by `lib/demo/`. Every `app/(app)/` page
needs a running backend and a signed-in session.

## Running it locally

`pnpm run dev:scenario` from the workspace root seeds data, then
`http://localhost:3000/dev-sign-in/?email=owner@dev.local` signs you in without email verification.
That route exists only when `NEXT_PUBLIC_DEV_TOOLS=1` is set in `.env.local` — `pageExtensions` in
`next.config.ts` keeps `page.dev.tsx` files out of production builds entirely, so it can never
reach `out/`.

## Testing

- Vitest: `pnpm run test` (single run), `pnpm run test:watch`.
- Tests live **next to their source** in a `__tests__/` subfolder, e.g. `lib/__tests__/data.test.ts`,
  `components/__tests__/dashboard-stats.test.tsx`.
- **Every new function in `lib/` needs unit tests; every new component needs at least a smoke test.**
- Naming: `describe("functionName")` with `it("returns …")` / `it("should …")`.
- Pure logic → `.test.ts`; components → `.test.tsx` with `@testing-library/react`.
- `.test.ts` files run in node, not jsdom. One that needs the DOM (`renderHook`, `window`) starts
  with `// @vitest-environment jsdom`.
- CI runs `pnpm run test` on every PR. Keep it green before merging.

## Help articles

`content/help/{en,cs}/` holds the help articles the Assistant and AI connections answer from. A
change users can see or do updates its articles in both languages in the same ticket, and a new
page under `app/(app)/` goes into an article's `routes` or `content/help/uncovered-routes.json`.
Read the workspace `help-article` skill before editing one (`.claude/skills/help-article/SKILL.md`
in the workspace root, which a session started here doesn't load). `pnpm run help:check` runs the
checks CI runs.

## Formatting is automatic

`.claude/settings.json` runs `prettier --write` after every Write and Edit, so files reformat
immediately after you touch them. Take the reformatted version as current rather than re-editing
to restore your own spacing.

## Supply-chain policy

`pnpm-workspace.yaml` blocks too-new versions and unapproved build scripts. A new `allowBuilds`
entry needs a comment saying what the script does and why the package fails without it, plus a
call-out in the PR. `minimumReleaseAgeExclude` and `trustPolicyExclude` entries are exact-version
(`pkg@1.2.3`), and each GHSA waiver in `.github/dependency-review-config.yml` names its reason and
Fenro task. Policy: T-561.

## Merging pull requests

Never merge a PR yourself — no `gh pr merge`, no merge button, no auto-merge — unless the user
asks for that merge outright. Push the branch, open the PR, report CI, and stop. Opening a PR is
not permission to merge it, and one merge the user asked for does not carry to the next.

## Agent skills

### Issue tracker

Agent work lives in fenro tasks (`T-12`) through the `fenro-prod` MCP server, each task's
`repository` naming its repo. GitHub Issues stay for external reports and are attached to a task
as its source. See [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md).

### Triage labels

The five canonical roles as fenro labels, each paired with a status so only `ready-for-agent`
tasks reach the ready queue. See [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md).

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See
[`docs/agents/domain.md`](docs/agents/domain.md).
