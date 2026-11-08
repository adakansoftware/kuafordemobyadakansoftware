import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["tests/**/*.test.mts"],
    environment: "node",
    setupFiles: ["tests/vitest.setup.mts"],
    coverage: {
      provider: "v8",
      include: ["lib/**"],
    },
  },
})
