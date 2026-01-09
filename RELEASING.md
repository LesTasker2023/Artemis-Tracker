## Releases & Auto-Update

This project uses `electron-builder` + `electron-updater` with GitHub Releases as the publish provider.

Quick steps to enable releases and updates:

1. Ensure `build.publish` is configured (we use the `github` provider) — electron-builder will infer owner/repo from your git remote when not specified.
2. Add the following repository secrets in GitHub (Settings → Secrets):
   - `GITHUB_TOKEN` (automatically provided in Actions as `GITHUB_TOKEN`, but you can add a personal token if needed)
   - `CSC_LINK` and `CSC_KEY_PASSWORD` for macOS code signing (optional, required for notarized mac builds)
   - `WINDOWS_CERTIFICATE_FILE` and `WINDOWS_CERTIFICATE_PASSWORD` for Windows code signing (optional)
3. Create a tag and push it to trigger the release workflow (build only):
   ```bash
   git tag v1.2.3
   git push origin v1.2.3
   ```
4. The `release` GitHub Action will run on the tag and build artifacts; by default it will **not** publish them. The build artifacts are uploaded as action artifacts so you can inspect them safely.
5. To publish the built artifacts to GitHub Releases, set the repository secret `PUBLISH_RELEASE=true` (and ensure `GITHUB_TOKEN` is available). Once set, re-pushing the same tag or creating a new tag will run the workflow and publish the release.
6. `electron-updater` (in `electron/main.ts`) will use GitHub Releases to detect and download updates. On app startup it runs `checkForUpdatesAndNotify()`; the renderer receives update events via IPC (`update:checking`, `update:available`, `update:progress`, `update:downloaded`, etc.).

Notes:

- This two-step approach (build then optional publish) lets you inspect artifacts before releasing them publicly — a safer, best-practice flow.
- For testing, prefer publishing to a **prerelease** or use a separate test repo until you're confident the pipeline, signing, and artifacts are correct.

Testing updates locally:

- You can test by publishing a small test release (a new tag) to a private repo and ensuring the app installed from an earlier release sees the newer release.
- For Windows-only testing, you can use `--publish=always` with `electron-builder` and a personal token.

If you'd like, I can:

- Add a small UI in the app to show update status and let users trigger manual checks/installs.
- Configure a staging release pipeline (draft releases) for testing before public releases.
