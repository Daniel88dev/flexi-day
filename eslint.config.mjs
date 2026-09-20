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

  eslintReact.configs.recommended,

  {
    rules: {
      // The inverse of @eslint-react's disable-conflict-eslint-plugin-react-hooks
      // preset, which would switch these off on the react-hooks side and hand
      // rules-of-hooks and exhaustive-deps to a third party. One entry here per
      // rule in that preset, so eslint-plugin-react-hooks stays authoritative.
      // Nothing upstream expresses this direction, so a newly overlapping rule
      // arrives as ordinary warning drift — hence @eslint-react's own Dependabot
      // group.
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

      // The three below are suppressed rather than accepted, each with a
      // burn-down issue. 18 hits, all inside one test-setup module:
      // https://github.com/Daniel88dev/flexi-day/issues/148
      "@eslint-react/no-unnecessary-use-prefix": "off",
      // 12 hits across 6 files, concentrated in two calendar components:
      // https://github.com/Daniel88dev/flexi-day/issues/149
      "@eslint-react/no-array-index-key": "off",
      // 12 hits across 7 files:
      // https://github.com/Daniel88dev/flexi-day/issues/150
      "@eslint-react/use-state": "off",
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
