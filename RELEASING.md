## Releases & Auto-Update

This project uses `electron-builder` + `electron-updater` with GitHub Releases as the publish provider.

Quick steps to enable releases and updates:

1. Ensure `build.publish` is configured (we use the `github` provider) — electron-builder will infer owner/repo from your git remote when not specified.
2. Add the following repository secrets in GitHub (Settings → Secrets):
   - `GITHUB_TOKEN` (automatically provided in Actions as `GITHUB_TOKEN`, but you can add a personal token if needed)
   - `CSC_LINK` and `CSC_KEY_PASSWORD` for macOS code signing (optional, required for notarized mac builds)
   - `WINDOWS_CERTIFICATE_FILE` and `WINDOWS_CERTIFICATE_PASSWORD` for Windows code signing (optional)
3. Create a tag and push it to trigger the release workflow:
   ```bash
   git tag v1.2.3
   git push origin v1.2.3
   ```
4. The `release` GitHub Action will run `npm run build:electron` and publish artifacts to GitHub Releases.
5. `electron-updater` (in `electron/main.ts`) will use GitHub Releases to detect and download updates. On app startup it runs `checkForUpdatesAndNotify()`; the renderer receives update events via IPC (`update:checking`, `update:available`, `update:progress`, `update:downloaded`, etc.).

Testing updates locally:
- You can test by publishing a small test release (a new tag) to a private repo and ensuring the app installed from an earlier release sees the newer release.
- For Windows-only testing, you can use `--publish=always` with `electron-builder` and a personal token.

If you'd like, I can:
- Add a small UI in the app to show update status and let users trigger manual checks/installs.
- Configure a staging release pipeline (draft releases) for testing before public releases.
