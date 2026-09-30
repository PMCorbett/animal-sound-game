import path from "node:path";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoRoot = path.resolve(__dirname, "../..");
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;

export default defineConfig({
  build: {
    sourcemap: sentryAuthToken ? "hidden" : false,
  },
  plugins: [
    react(),
    ...(sentryAuthToken
      ? [
          sentryVitePlugin({
            org: "pmcorbett-hw",
            project: "animal-sound-game",
            authToken: sentryAuthToken,
          }),
        ]
      : []),
  ],
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
