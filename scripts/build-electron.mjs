/**
 * Build script for Electron main process
 * Compiles TypeScript to CommonJS for Electron
 */

import { build } from "esbuild";
import { copyFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "dist-electron");
const isProd = process.env.NODE_ENV === 'production';

// Ensure output directory exists
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

async function buildElectron() {
  // Build main process
  await build({
    entryPoints: [join(__dirname, "..", "electron", "main.ts")],
    bundle: true,
    platform: "node",
    target: "node18",
    outfile: join(outDir, "main.cjs"),
    format: "cjs",
    // Keep runtime-only modules external so esbuild doesn't try to resolve them
    external: ["electron", "electron-updater", "electron-log"],
    sourcemap: !isProd,
    minify: isProd,
  });

  // Build preload script
  await build({
    entryPoints: [join(__dirname, "..", "electron", "preload.ts")],
    bundle: true,
    platform: "node",
    target: "node18",
    outfile: join(outDir, "preload.cjs"),
    format: "cjs",
    external: ["electron"],
    sourcemap: !isProd,
    minify: isProd,
  });

  console.log("✅ Electron build complete");
}

buildElectron().catch((err) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});
