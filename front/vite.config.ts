import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Porta fixa: o app desktop (Electron: back-node/src/main/index.ts DEV_URL,
// ou Tauri: back/tauri.conf.json devUrl) aponta pra 1420.
export default defineConfig({
  base: "./", // caminhos relativos: funciona ao ser carregado via file:// no Electron empacotado
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
