import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Too aggressive — fires on event handlers, not just render. Date.now() in
      // a submit handler is intentional and stable enough for ID generation.
      "react-hooks/purity": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
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
