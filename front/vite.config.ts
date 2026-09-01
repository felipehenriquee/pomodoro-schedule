import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Fixed port: the desktop app (Electron: back-node/src/main/index.ts DEV_URL,
// or Tauri: back/tauri.conf.json devUrl) points to 1420.
export default defineConfig({
  base: "./", // relative paths: works when loaded via file:// in the packaged Electron app
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/../back/target/**", "**/../back-node/out/**"],
    },
  },
});
