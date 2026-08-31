import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";

// O renderer (React) e o projeto separado em ../front, com o proprio Vite.
// Aqui so cuidamos do processo main e do preload.
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "out/main",
      lib: { entry: resolve(__dirname, "src/main/index.ts") },
      rollupOptions: {
        output: { format: "cjs" },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "out/preload",
      lib: { entry: resolve(__dirname, "src/preload/index.ts") },
      rollupOptions: {
        output: { format: "cjs" },
      },
    },
  },
});
