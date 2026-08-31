// Copia o build do front (../front/dist) para out/renderer, pra o electron-builder
// empacotar junto (files: out/**).
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "../../front/dist");
const dst = resolve(here, "../out/renderer");

if (!existsSync(src)) {
  console.error("front/dist nao existe. Rode antes: npm --prefix ../front run build");
  process.exit(1);
}

rmSync(dst, { recursive: true, force: true });
cpSync(src, dst, { recursive: true });
console.log("renderer copiado ->", dst);
