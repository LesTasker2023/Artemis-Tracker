# Artemis v3 - Land Area Event System Plan

## The Opportunity

Current LA events are boring:

- Set goal, wait 2-4 hours, winner announced
- No feedback loop, no tension
- Favors biggest spenders, not skill

**Artemis v3 becomes the event platform** - real-time tracking transforms LA events into exciting competitions.

---

## Event Formats

### 1. Real-Time Leaderboard Events

Everyone running Artemis, scores update live:

- **Kill Race** - First to 500 kills wins
- **Loot Race** - First to loot 100 PED wins
- **Global Hunt** - Points per global, live standings

### 2. Efficiency Competitions (Log-Verifiable)

- **Loot/Damage Ratio** - Best efficiency wins
- **Loot/Kill Ratio** - Most value per kill
- Levels playing field - skill beats wallet

### 3. Multi-Metric Scoring

```
Points = (Kills × 1) + (Globals × 50) + (HoFs × 500)
       - (Deaths × 25) + (Loot/Damage × 1000)
```

### 4. Team/Society Wars

- Aggregate stats across team members
- Society vs Society competitions
- Live team standings

### 5. Bounty Board Events

Dynamic achievements during event:

- First blood: +100 pts
- First global: +200 pts
- 50 kill streak: +150 pts

### 6. Speed Runs

- Fastest to 1000 damage dealt
- Fastest to 100 kills
- Timer starts when entering LA

### 7. Fixed-Equipment Events

- LA owner specifies equipment (e.g., "Opalo + A101 only")
- Cost basis is identical for all
- Profit becomes verifiable

---

## Anti-Cheat Strategy

### The Problem

- Loadout cost is user input, can be faked
- Can't verify profit without knowing true cost

### Log-Only Metrics (Cheat-Proof)

| Metric       | Verifiable?                |
| ------------ | -------------------------- |
| Kills        | ✅ Yes                     |
| Loot PED     | ✅ Yes                     |
| Globals      | ✅ Yes                     |
| Damage Dealt | ✅ Yes                     |
| Loot/Kill    | ✅ Yes                     |
| Loot/Damage  | ✅ Yes                     |
| Profit       | ❌ No (cost is user input) |

### Real-Time Streaming (Hardest to Cheat)

- Events streamed to server AS they happen
- Can't edit what's already submitted
- Sequence numbers detect gaps
- Chained hashes prevent modification

---

## Live Log Streaming Architecture

### Data Flow

```
chat.log → FileWatcher → Parser → IPC → Renderer
                              ↓
                         EventStreamer → WebSocket → Event Server
```

### Client: EventStreamer (Electron)

```typescript
// electron/event-streamer.ts
import WebSocket from "ws";
import crypto from "crypto";
import type { LogEvent } from "../src/core/types";

interface StreamConfig {
  serverUrl: string;
  eventId: string;
  participantToken: string;
}

class EventStreamer {
  private ws: WebSocket | null = null;
  private config: StreamConfig | null = null;
  private buffer: LogEvent[] = [];
  private sequence = 0;

  connect(config: StreamConfig) {
    this.config = config;
    this.ws = new WebSocket(config.serverUrl);

    this.ws.on("open", () => {
      this.send({
        type: "auth",
        eventId: config.eventId,
        token: config.participantToken,
      });

      // Flush buffer
      this.buffer.forEach((event) => this.streamEvent(event));
      this.buffer = [];
    });

    this.ws.on("close", () => {
      setTimeout(() => this.connect(config), 3000);
    });

    this.ws.on("error", (err) => {
      console.error("Streamer error:", err);
    });
  }

  streamEvent(event: LogEvent) {
    if (!this.config) return;

    const payload = {
      type: "event",
      seq: this.sequence++,
      timestamp: Date.now(),
      gameTimestamp: event.time,
      event: event,
      hash: this.hashEvent(event),
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send(payload);
    } else {
      this.buffer.push(event);
    }
  }

  private hashEvent(event: LogEvent): string {
    const data = JSON.stringify(event) + this.sequence;
    return crypto.createHash("sha256").update(data).digest("hex").slice(0, 16);
  }

  private send(data: unknown) {
    this.ws?.send(JSON.stringify(data));
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
    this.config = null;
  }
}

export const eventStreamer = new EventStreamer();
```

### Hook into Main Process

```typescript
// electron/main.ts additions

import { eventStreamer } from "./event-streamer";

function onNewEvents(events: LogEvent[]) {
  // Existing: send to renderer
  mainWindow?.webContents.send("log-events", events);
  popoutWindow?.webContents.send("log-events", events);

  // New: stream to server
  events.forEach((event) => eventStreamer.streamEvent(event));
}

// IPC handlers
ipcMain.handle("event:join", async (_, config: StreamConfig) => {
  eventStreamer.connect(config);
  return { success: true };
});

ipcMain.handle("event:leave", async () => {
  eventStreamer.disconnect();
  return { success: true };
});
```

### Server: Event Server (Node.js)

```typescript
// server/event-server.ts
import { WebSocketServer, WebSocket } from "ws";

interface Participant {
  ws: WebSocket;
  eventId: string;
  participantId: string;
  events: StreamedEvent[];
  lastSeq: number;
}

const participants = new Map<string, Participant>();
const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  let participant: Participant | null = null;

  ws.on("message", (data) => {
    const msg = JSON.parse(data.toString());

    if (msg.type === "auth") {
      const { eventId, token } = msg;
      const participantId = validateToken(token);

      participant = {
        ws,
        eventId,
        participantId,
        events: [],
        lastSeq: -1,
      };
      participants.set(participantId, participant);

      ws.send(JSON.stringify({ type: "auth_ok" }));
      broadcastLeaderboard(eventId);
    }

    if (msg.type === "event" && participant) {
      if (msg.seq !== participant.lastSeq + 1) {
        console.warn(
          `Sequence gap: expected ${participant.lastSeq + 1}, got ${msg.seq}`
        );
      }
      participant.lastSeq = msg.seq;
      participant.events.push(msg);

      updateScores(participant.eventId, participant.participantId, msg.event);
      broadcastLeaderboard(participant.eventId);
    }
  });

  ws.on("close", () => {
    if (participant) {
      participant.ws = null as any;
    }
  });
});

function broadcastLeaderboard(eventId: string) {
  const scores = calculateLeaderboard(eventId);
  const message = JSON.stringify({ type: "leaderboard", scores });

  participants.forEach((p) => {
    if (p.eventId === eventId && p.ws?.readyState === WebSocket.OPEN) {
      p.ws.send(message);
    }
  });
}
```

---

## Anti-Cheat Measures

| Measure                  | How It Works                           |
| ------------------------ | -------------------------------------- |
| **Sequence numbers**     | Gaps = suspicious, can't insert events |
| **Chained hashes**       | Can't modify past events               |
| **Server timestamps**    | Detect if events come too fast/slow    |
| **Real-time only**       | Can't batch-submit old data            |
| **Token auth**           | Know who's who                         |
| **Server re-calculates** | Don't trust client scores              |

---

## Event Tiers

### Tier 1 (Casual)

- Log-only metrics (kills, loot, loot/damage)
- Honor system + public results
- Community callouts catch obvious cheaters

### Tier 2 (Competitive)

- Fixed equipment requirements
- Submit encrypted log at end
- Server validates parsing matches

### Tier 3 (High Stakes)

- Real-time streaming to server
- Video proof required for podium
- Entry fee held in escrow

---

## Revenue Model for LA Owners

1. **Entry fees** - 10 PED to enter, winner takes pot
2. **More hunters** - Exciting events = more participants = more tax
3. **Sponsorships** - Societies sponsor prizes for exposure
4. **Regular events** - Weekly schedule builds community

---

## Implementation Steps

1. [ ] Add EventStreamer to Electron main process
2. [ ] Build minimal event server (WebSocket + scoring)
3. [ ] Add "Join Event" UI in Artemis
4. [ ] Live leaderboard component
5. [ ] Event creation/management interface
6. [ ] Log segment export with hash verification
7. [ ] Optional: Video proof integration

---

## The USP Pitch

> "Download Artemis to compete. See your score update in real-time. Watch the leaderboard. Know exactly where you stand. **The first event where skill beats wallet.**"
