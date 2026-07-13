/**
 * Vite Configuration — Hospital Information Assistant Frontend
 *
 * Why it is written:
 * To configure the Vite build tool with React, Tailwind CSS v4, and
 * a development proxy that forwards /api requests to the FastAPI backend.
 *
 * What it does:
 * - Registers the React plugin for JSX/TSX support.
 * - Registers the Tailwind CSS v4 Vite plugin for zero-config styling.
 * - Proxies /api requests to http://localhost:8000 during development
 *   to avoid CORS issues without needing backend CORS wildcard in dev.
 *
 * Inputs:
 * - None (loaded automatically by Vite CLI).
 *
 * Outputs:
 * - Vite configuration object consumed by `vite dev` and `vite build`.
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
