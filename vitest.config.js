import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["__tests__/setup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "dist/",
        "__tests__/",
        "*.config.js",
        "coverage/",
      ],
    },
    include: ["__tests__/**/*.test.js"],
    testTimeout: 10000,
  },
});
