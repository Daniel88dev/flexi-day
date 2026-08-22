import { defaultExclude, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
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
  },
});
