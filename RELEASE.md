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

#### 1. Building a Release

```bash
# Update version in package.json
# Example: "version": "3.0.0-alpha.2"

# Build the app with electron-builder
npm run build:electron

# This creates installers in the dist/ folder:
# - Windows: .exe (NSIS installer)
# - macOS: .dmg
# - Linux: .AppImage and .deb
```

#### 2. Publishing to GitHub Releases

**Automatic Publishing:**

```bash
# Ensure you have GH_TOKEN environment variable set
export GH_TOKEN=your_github_personal_access_token

# Build and publish
npm run build:electron -- --publish always
```

**Manual Publishing:**

1. Go to https://github.com/LesTasker2023/Artemis-Tracker/releases
2. Click "Create a new release"
3. Tag version: `v3.0.0-alpha.2` (must match package.json version)
4. Release title: `Artemis v3.0.0-alpha.2`
5. Upload the files from `dist/`:
   - `Artemis-v3-{version}.exe` (Windows)
   - `Artemis-v3-{version}.dmg` (macOS)
   - `Artemis-v3-{version}.AppImage` (Linux)
   - `Artemis-v3-{version}.deb` (Linux)
   - `latest.yml` or `latest-mac.yml` or `latest-linux.yml` (update metadata)
6. Click "Publish release"

#### 3. Version Numbering

Follow semantic versioning:
- **Major**: Breaking changes (`4.0.0`)
- **Minor**: New features (`3.1.0`)
- **Patch**: Bug fixes (`3.0.1`)
- **Pre-release**: Alpha/Beta (`3.0.0-alpha.1`, `3.0.0-beta.1`)

#### 4. Update Configuration

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

### Local Testing

1. Build two versions:
   ```bash
   # Version 1
   npm run build:electron
   ```

2. Install version 1

3. Update package.json to version 2

4. Build and publish version 2:
   ```bash
   npm run build:electron -- --publish always
   ```

5. Launch version 1 - it should detect and download version 2

### Debug Mode

Check the logs at:
- **Windows**: `%USERPROFILE%\AppData\Roaming\artemis-v3\logs\main.log`
- **macOS**: `~/Library/Logs/artemis-v3/main.log`
- **Linux**: `~/.config/artemis-v3/logs/main.log`

Look for:
```
[AutoUpdater] Checking for update...
[AutoUpdater] Update available: 3.0.0-alpha.2
[AutoUpdater] Update downloaded
```

## Pre-release vs. Stable

By default, the app only checks for stable releases. To enable pre-release updates:

In `electron/main.ts`:
```typescript
autoUpdater.allowPrerelease = true;  // Enable alpha/beta updates
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
