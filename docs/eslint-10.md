# ESLint stays on 9 for now

ESLint 10 cannot be adopted in this repo yet. Dependabot's bump to 10.9.1
([#83](https://github.com/Daniel88dev/flexi-day/pull/83)) fails CI, and the failure sits two
layers deep, so this file records both before they are forgotten.

## Layer 1: the `brace-expansion` override

`package.json` pins `brace-expansion` to `^2.0.2` via `overrides`, added in
[#27](https://github.com/Daniel88dev/flexi-day/pull/27) to clear a ReDoS advisory. ESLint 10
depends on `minimatch@10`, which requires `brace-expansion ^5` and calls its named `expand`
export. The override forces 2.x into it, and the first glob ESLint evaluates throws:

```
TypeError: (0 , brace_expansion_1.expand) is not a function
```

This is the error PR #83's CI actually shows. The override is obsolete — every published
`brace-expansion` line (1.1.12+, 2.0.2+, 5.x) carries the ReDoS fix, and removing it keeps
`npm audit --audit-level=high` at zero. Remove it as part of the ESLint 10 upgrade, or it will
mask the real compatibility work below.

## Layer 2: `eslint-plugin-react` does not support ESLint 10

With the override gone, lint crashes on the next layer:

```
TypeError: Error while loading rule 'react/display-name': contextOrFilename.getFilename is not a function
```

ESLint 10 removed the deprecated `context.getFilename()` API, and `eslint-plugin-react@7.37.5` —
the newest stable release — still calls it, with its ESLint peer range capped at `^9.7`. This is
tracked upstream in
[jsx-eslint/eslint-plugin-react#3977](https://github.com/jsx-eslint/eslint-plugin-react/issues/3977).
As of 2026-08-30 the fix exists only in the `7.8.0-rc.0` prerelease (their versioning reset), and
`eslint-config-next` — including the 16.4 canaries — still depends on `^7.37.0`.

## What unblocks the upgrade

A stable `eslint-config-next` release whose `eslint-plugin-react` dependency resolves to an
ESLint-10-compatible version. When that ships, the upgrade PR is: bump `eslint` to `^10`, delete
the `brace-expansion` line from `overrides`, reinstall, and confirm `npm run lint` and
`npm audit --audit-level=high` both pass.
