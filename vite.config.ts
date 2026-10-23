import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// GitHub Pages serves this repo under /uno-web-game/. Dev stays at root.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/uno-web-game/" : "/",
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
}));
