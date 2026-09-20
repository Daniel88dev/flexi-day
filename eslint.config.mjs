import { defineConfig, globalIgnores } from "eslint/config";
import eslintReact from "@eslint-react/eslint-plugin";
import next from "@next/eslint-plugin-next";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  next.configs["core-web-vitals"],

  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
    },
  },

  reactHooks.configs.flat.recommended,

  // jsx-a11y ships no preset this small. These six are the ones eslint-config-next
  // turned on, and the set is kept as it was rather than widened.
  {
    plugins: { "jsx-a11y": jsxA11y },
    rules: {
      "jsx-a11y/alt-text": ["warn", { elements: ["img"], img: ["Image"] }],
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-proptypes": "warn",
      "jsx-a11y/aria-unsupported-elements": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/role-supports-aria-props": "warn",
    },
  },

  // strict rather than recommended: eight more rules, and jsx-no-children-prop
  // raised to error. Six of the eight fire nowhere here and are kept anyway,
  // because a guard costs least to install before the API it guards is in use.
  // That argument stops at the preset boundary. Every other category preset —
  // naming-convention, web-api, dom, jsx, rsc, x — is a subset of strict, and the
  // rules `all` holds beyond it are all-only: upstream left them out of every
  // curated preset, so adopting them on future cost would rest on no judgement but
  // ours. Silence is not the reason either — no-missing-context-display-name has
  // live findings here and is excluded all the same.
  eslintReact.configs.strict,

  {
    rules: {
      // The inverse of @eslint-react's disable-conflict-eslint-plugin-react-hooks
      // preset, which would switch these off on the react-hooks side and hand
      // rules-of-hooks and exhaustive-deps to a third party. One entry here per
      // rule in that preset, so eslint-plugin-react-hooks stays authoritative.
      // Nothing upstream expresses this direction, so a newly overlapping rule
      // arrives as ordinary warning drift — hence @eslint-react's own Dependabot
      // group. Re-derived against @eslint-react 5.20.0 under strict: twelve
      // entries, nine of them active, no drift.
      "@eslint-react/error-boundaries": "off",
      "@eslint-react/exhaustive-deps": "off",
      "@eslint-react/globals": "off",
      "@eslint-react/immutability": "off",
      "@eslint-react/purity": "off",
      "@eslint-react/refs": "off",
      "@eslint-react/rules-of-hooks": "off",
      "@eslint-react/set-state-in-effect": "off",
      "@eslint-react/set-state-in-render": "off",
      "@eslint-react/static-components": "off",
      "@eslint-react/unsupported-syntax": "off",
      "@eslint-react/use-memo": "off",
    },
  },

  {
    rules: {
      // Too aggressive — fires on event handlers, not just render. Date.now() in
      // a submit handler is intentional and stable enough for ID generation.
      "react-hooks/purity": "off",
    },
  },

  {
    // @eslint-react exempts hook-shaped stand-ins written inline in a vi.mock
    // factory, but not ones lifted into a module so two suites can share them.
    // Every use-prefixed key in this file has to match an export of
    // lib/api/queries for vi.mock to intercept it, so the names are not ours to
    // choose and the rule's advice would break the mock. Scoped to the one file
    // rather than to test files at large: this is the repo's only shared mock
    // module, and a second one should have to earn its own entry here.
    files: ["components/shell/__tests__/shell-test-setup.ts"],
    rules: {
      "@eslint-react/no-unnecessary-use-prefix": "off",
    },
  },

  globalIgnores([
    // Inherited from eslint-config-next's defaults; ours to carry now.
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated output
    "coverage/**",
    // Local tooling scratch space — holds full checkouts (with their own .next/
    // build output), which the paths above only ignore at the repo root.
    ".claude/**",
  ]),
]);

export default eslintConfig;
