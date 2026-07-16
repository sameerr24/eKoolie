import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Lets a tunnel (ngrok etc.) reach the dev server — Vite otherwise
    // rejects requests whose Host header it doesn't recognize.
    allowedHosts: true,
    proxy: {
      // Forwards /api/* to the backend so the phone (and the browser in
      // general) only ever talks to one origin — sidesteps CORS entirely
      // and avoids cross-site cookie issues with the refresh-token cookie
      // when frontend/backend end up on different tunnel domains.
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
});
