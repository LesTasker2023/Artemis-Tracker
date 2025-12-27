import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const pngToIco = require("png-to-ico");
let iconGen;
try {
  iconGen = require("icon-gen");
} catch (e) {
  iconGen = null;
}

// Usage: node scripts/generate-icons.mjs [path/to/source.png]
// Default source is build/icon.png (must be a high-res PNG, >= 1024x1024)
const outDir = path.resolve(process.cwd(), "build");
const argSrc = process.argv[2];
const defaultSrc = path.resolve(outDir, "icon.png");
const src = argSrc ? path.resolve(process.cwd(), argSrc) : defaultSrc;

if (!fs.existsSync(src)) {
  console.error(
    `Source icon not found at ${src}. Please add a high-resolution PNG (>=1024x1024).`
  );
  process.exit(1);
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function writeIco() {
  try {
    const fn = pngToIco.default || pngToIco;
    const icoBuffer = await fn(src);
    const target = path.join(outDir, "icon.ico");
    fs.writeFileSync(target, icoBuffer);
    console.log("Wrote", target);
    return true;
  } catch (e) {
    console.warn("png-to-ico failed:", e.message);
    return false;
  }
}

async function writeWithIconGen() {
  try {
    // Request ico, icns, and png outputs
    await iconGen(src, outDir, {
      report: false,
      modes: ["ico", "icns", "png"],
    });
    // icon-gen may create files either directly or in subdirectories. Normalize results.
    const files = fs.readdirSync(outDir, { withFileTypes: true });
    // Flatten any nested dirs created by icon-gen
    for (const entry of files) {
      const p = path.join(outDir, entry.name);
      if (entry.isDirectory()) {
        const inner = fs.readdirSync(p);
        for (const f of inner) {
          const srcPath = path.join(p, f);
          const destPath = path.join(outDir, f);
          if (!fs.existsSync(destPath)) fs.copyFileSync(srcPath, destPath);
        }
        // leave nested dir in place (no harm)
      }
    }

    // Ensure names: copy or rename first matching .icns to icon.icns
    const all = fs.readdirSync(outDir);
    const icns = all.find((f) => f.endsWith(".icns"));
    if (icns) {
      const srcIcns = path.join(outDir, icns);
      const targetIcns = path.join(outDir, "icon.icns");
      if (srcIcns !== targetIcns) fs.copyFileSync(srcIcns, targetIcns);
      console.log("Wrote", targetIcns);
    }

    const ico = all.find((f) => f.endsWith(".ico"));
    if (ico) {
      const srcIco = path.join(outDir, ico);
      const targetIco = path.join(outDir, "icon.ico");
      if (srcIco !== targetIco) fs.copyFileSync(srcIco, targetIco);
      console.log("Wrote", targetIco);
    }

    // icon-gen also emits PNGs for various sizes; ensure a full-size PNG exists
    const pngLarge = all
      .filter((f) => f.endsWith(".png"))
      .map((f) => ({ f, size: fs.statSync(path.join(outDir, f)).size }))
      .sort((a, b) => b.size - a.size)[0];
    if (pngLarge) {
      const srcPng = path.join(outDir, pngLarge.f);
      const targetPng = path.join(outDir, "icon.png");
      if (srcPng !== targetPng) fs.copyFileSync(srcPng, targetPng);
      console.log("Wrote", targetPng);
    }

    return true;
  } catch (e) {
    console.warn("icon-gen failed:", e.message);
    return false;
  }
}

async function generate() {
  // Always ensure a copy of the provided source exists as build/icon.png (electron-builder uses it for linux)
  const canonicalPng = path.join(outDir, "icon.png");
  try {
    fs.copyFileSync(src, canonicalPng);
  } catch (e) {
    console.warn(`Failed to copy source to ${canonicalPng}:`, e.message);
  }

  let ok = false;
  if (iconGen) {
    ok = await writeWithIconGen();
  }

  if (!ok) {
    // Fallback: create ICO from PNG
    await writeIco();
  }

  // Verify essential files
  const missing = [];
  if (!fs.existsSync(path.join(outDir, "icon.ico"))) missing.push("icon.ico");
  if (!fs.existsSync(path.join(outDir, "icon.icns"))) missing.push("icon.icns");
  if (!fs.existsSync(path.join(outDir, "icon.png"))) missing.push("icon.png");

  if (missing.length) {
    console.warn(
      "Icon generation completed, but the following expected files are missing:",
      missing.join(", ")
    );
    console.warn(
      "Ensure the source PNG is a high-resolution square image (>= 1024x1024). For mac, install icon-gen globally or as a dev dependency."
    );
  } else {
    console.log(
      "Icon generation complete. All expected files written to build/ (icon.png, icon.ico, icon.icns)."
    );
  }
}

generate();
