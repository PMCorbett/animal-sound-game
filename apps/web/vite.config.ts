import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoRoot = path.resolve(__dirname, "../..");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@assets": path.join(repoRoot, "assets"),
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [repoRoot],
    },
  },
});
