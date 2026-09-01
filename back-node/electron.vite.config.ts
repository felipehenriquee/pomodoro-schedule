import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";

// The renderer (React) is the separate project in ../front, with its own Vite.
// Here we only handle the main process and the preload.
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
