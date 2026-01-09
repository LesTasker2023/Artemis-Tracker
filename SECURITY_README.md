Security & Packaging Recommendations for Releases

This short guide explains recommended steps to reduce the chance of exposing source code, sourcemaps, or secrets in shipped Electron apps.

1) Don't ship source maps in production ✅
- Build tools (esbuild / Vite) should be configured to NOT emit source maps when NODE_ENV=production.
- We set conditional sourcemap flags in:
  - `scripts/build-electron.mjs` (esbuild): `sourcemap: !isProd`
  - `vite.config.ts`: `build.sourcemap = false`
- Verify distribution does not include any `.map` files before publishing.

2) Enable ASAR packaging ✅
- Archive app files into an ASAR via electron-builder (`asar: true` in `package.json`) to make it harder for casual inspection.
- Note: ASAR is not encryption — it only packs files into a single archive. Use other measures for true protection.

3) Minify/obfuscate production builds ✅
- Enable minification during production builds (esbuild `minify: true`). Consider an additional obfuscation step for the renderer bundle if you need more protection.

4) Keep secrets server-side 🚫
- Never embed private keys, secrets, or API credentials in client code or environment variables that get bundled into the app.
- Use short-lived tokens and server-side proxies for privileged operations.

5) Remove or gate debug and diagnostic logging ⚠️
- Avoid shipping verbose logs or developer helper endpoints to production builds.
- Use runtime feature flags or environment checks to enable logs only for debug builds.

6) Code signing & auto-updates 🔐
- Sign your releases on Windows/macOS so updates come from a verified publisher and users get proper OS-level protections.
- Configure CI to build and sign artifacts before publishing.

7) CI checks before release ✅
- Build a release artifact in CI with NODE_ENV=production and verify:
  - No `.map` files are present
  - `asar` archive exists and includes the expected files
  - No dev-only config files, test data, or hard-coded secrets are present

8) Make reverse-engineering harder (choose based on risk) 💡
- Use native modules for highly sensitive logic where possible (compiled code is harder to reverse engineer).
- Consider additional JS obfuscation tools, but weigh the trade-offs for maintainability and performance.

If you'd like, I can:
- Add a small CI check that fails the build if `.map` files are present in the release artifact.
- Add a short script to validate release contents and assert `asar` is present.

---
Notes:
- These steps increase the difficulty for reverse-engineering but do not make it impossible. Always keep critical secrets and signing keys off the client.
