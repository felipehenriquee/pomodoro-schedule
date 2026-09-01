import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import Icons from "unplugin-icons/vite";

// Fixed port: the desktop app (Electron: back-node/src/main/index.ts DEV_URL,
// or Tauri: back/tauri.conf.json devUrl) points to 1420.
export default defineConfig({
  base: "./", // relative paths: works when loaded via file:// in the packaged Electron app
  // Icons are compiled into the bundle at build time (no runtime fetch), so
  // they keep working offline under file://. Import as `~icons/<set>/<name>`.
  plugins: [react(), Icons({ compiler: "jsx", jsx: "react" })],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/../back/target/**", "**/../back-node/out/**"],
    },
  },
});
