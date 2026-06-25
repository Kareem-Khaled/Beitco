import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// Dedicated Vitest config (kept separate from the Lovable-wrapped vite.config.ts
// so test setup never touches the app's build plugins). jsdom + Testing Library
// for component tests; the `@/` alias resolves via vite-tsconfig-paths.
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false,
  },
});
