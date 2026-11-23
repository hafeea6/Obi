// eslint-disable-next-line import/no-unresolved -- resolver does not read package "exports"
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "node",
  },
});
