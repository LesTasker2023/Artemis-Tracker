# ARTEMIS v3

Entropia Universe Activity Tracker - Clean rebuild focused on core functionality.

## v3.0.0-alpha.1 Features

- Live chat.log event viewer
- Real-time parsing of hunting & mining events
- Secure Electron architecture

## Quick Start

```bash
# Install dependencies
npm install

# Run in development
npm run dev:electron
```

## Linux Setup

For Linux users, Entropia Universe chat.log is typically located at:

- `~/.steam/steam/steamapps/common/Entropia Universe/chat.log`
- `~/.local/share/Steam/steamapps/common/Entropia Universe/chat.log`

The app includes automatic detection for common Linux Steam paths, or you can manually select the file using the "Select File" button.

### Building for Linux

```bash
# Build AppImage for Linux
npm run build
npx electron-builder --linux AppImage
```

## Architecture

```
artemis-v3/
├── electron/           # Main process (Node.js)
│   ├── main.ts         # App lifecycle, log watching
│   └── preload.ts      # Secure IPC bridge
├── src/                # Renderer process (React)
│   ├── App.tsx         # Event viewer UI
│   └── types/          # TypeScript definitions
└── scripts/            # Build tools
```

## Security

- Context isolation: ✅ Enabled
- Node integration: ✅ Disabled
- Sandbox: ✅ Enabled
- CSP headers: ✅ Configured

## Roadmap

- [ ] Session tracking (start/stop hunts)
- [ ] Stats calculation
- [ ] Loadout management
- [ ] Mining support (space + ground)
- [ ] Data persistence
