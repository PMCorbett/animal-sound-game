import path from "node:path";
import { defineConfig } from "vitest/config";

const repoRoot = path.resolve(__dirname, "../..");

export default defineConfig({
  resolve: {
    alias: {
      "@assets": path.join(repoRoot, "assets"),
    },
  },
  test: {
    environment: "node",
  },
});
