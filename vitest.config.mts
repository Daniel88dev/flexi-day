import { defaultExclude, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // .claude/worktrees holds full checkouts of this repo; their tests are not ours to run.
    exclude: [...defaultExclude, "**/.claude/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["lib/**", "components/**"],
      exclude: ["components/ui/**", "**/.claude/**"],
    },
    // Starting jsdom costs more than most .ts tests themselves take, so they run in node.
    // A .ts test that needs the DOM opts back in with `// @vitest-environment jsdom`.
    projects: [
      {
        extends: true,
        test: { name: "dom", environment: "jsdom", include: ["**/*.test.tsx"] },
      },
      {
        extends: true,
        test: { name: "node", environment: "node", include: ["**/*.test.ts"] },
      },
    ],
  },
});
