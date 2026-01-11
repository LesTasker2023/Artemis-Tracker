# Release and Auto-Update Guide

## Auto-Update System

Artemis v3 now includes automatic updates via GitHub Releases. The app will:

1. **Check for updates** on startup
2. **Download updates** automatically in the background
3. **Prompt user** when update is ready to install
4. **Seamlessly update** without requiring full reinstall

## How It Works

### For Users

When you launch Artemis v3:
- The app checks GitHub Releases for newer versions
- If an update is available, it downloads automatically
- A notification appears in the bottom-right corner showing download progress
- When download completes, you can click "Restart & Install" to update
- Or dismiss and install later - the update will apply on next restart

### For Developers

#### 1. Automated Releases (Recommended)

**The easiest way - fully automated via GitHub Actions:**

1. Update the version in `package.json`:
   ```json
   {
     "version": "0.3.2"
   }
   ```

2. Commit and push to your branch:
   ```bash
   git add package.json
   git commit -m "chore: bump version to 0.3.2"
   git push
   ```

3. Merge your PR to `main` branch

4. **GitHub Actions automatically:**
   - Builds for Windows, macOS, and Linux
   - Creates a GitHub Release tagged `v0.3.2`
   - Uploads all installers to the release
   - Generates release notes from commits

That's it! No manual builds or uploads needed.

#### 2. Manual Release (Alternative)

**If you prefer to build locally:**

```bash
# Update version in package.json
# Example: "version": "0.3.2"

# Build the app with electron-builder
npm run build:electron

# This creates installers in the dist/ folder:
# - Windows: .exe (NSIS installer)
# - macOS: .dmg
# - Linux: .AppImage and .deb
```

**Publishing manually:**

1. Go to https://github.com/LesTasker2023/Artemis-Tracker/releases
2. Click "Create a new release"
3. Tag version: `v0.3.2` (must match package.json version with "v" prefix)
4. Release title: `Artemis v0.3.2`
5. Upload the files from `dist/`:
   - `Artemis-v3-{version}.exe` (Windows)
   - `Artemis-v3-{version}.dmg` (macOS)
   - `Artemis-v3-{version}.AppImage` (Linux)
   - `Artemis-v3-{version}.deb` (Linux)
   - `latest.yml` or `latest-mac.yml` or `latest-linux.yml` (update metadata)
6. Click "Publish release"

#### 3. Version Numbering

Follow semantic versioning:
- **Major**: Breaking changes (`1.0.0`)
- **Minor**: New features (`0.4.0`)
- **Patch**: Bug fixes (`0.3.2`)

Current version scheme: `0.3.x` → `0.4.x` → `1.0.0`

#### 4. GitHub Actions Workflow

The automated release workflow is defined in `.github/workflows/release.yml`:

**Triggers on:**
- Push to `main` branch (when PR is merged)

**What it does:**
1. Builds app for all platforms (Windows, macOS, Linux) in parallel
2. Reads version from `package.json`
3. Creates GitHub Release with tag `v{version}`
4. Uploads all installers and update metadata files
5. Generates release notes from commit history

**No configuration needed** - it works automatically when you merge to main!

#### 5. Update Configuration

The auto-updater is configured in:
- **package.json**: Repository info and build settings
- **electron/main.ts**: Update checking logic
- **src/components/UpdateNotification.tsx**: UI notification

Configuration:
```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/LesTasker2023/Artemis-Tracker.git"
  },
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "LesTasker2023",
        "repo": "Artemis-Tracker"
      }
    ]
  }
}
```

## Testing Updates

### Automated Testing (via GitHub)

1. **Create a test release:**
   - Update `package.json` to `0.3.1`
   - Merge to `main` branch
   - GitHub Actions builds and creates release `v0.3.1`

2. **Install test release**

3. **Create next version:**
   - Update `package.json` to `0.3.2`
   - Merge to `main` branch
   - GitHub Actions builds and creates release `v0.3.2`

4. **Test auto-update:**
   - Launch version `0.3.1`
   - It should detect and download `0.3.2` automatically

### Local Testing (Advanced)

1. Build and install version `0.3.1` locally
2. Create GitHub release `v0.3.2` (manual or via GitHub Actions)
3. Launch version `0.3.1` - should detect update from GitHub

### Debug Mode

Check the logs at:
- **Windows**: `%USERPROFILE%\AppData\Roaming\artemis-v3\logs\main.log`
- **macOS**: `~/Library/Logs/artemis-v3/main.log`
- **Linux**: `~/.config/artemis-v3/logs/main.log`

Look for:
```
[AutoUpdater] Checking for update...
[AutoUpdater] Update available: 0.3.2
[AutoUpdater] Update downloaded
```

## Troubleshooting

### Update not detected
- Ensure GitHub Release is published (not draft)
- Version in package.json must be < release version
- Check `latest.yml` is uploaded to release

### Download fails
- Check internet connection
- Verify GitHub Release assets are public
- Check electron-log for errors

### Update doesn't apply
- User must click "Restart & Install"
- Or restart app manually
- Update is cached and will install on restart

## Security

- All downloads are verified via code signing
- Updates only from official GitHub repository
- HTTPS-only connections
- Signature verification before installation
