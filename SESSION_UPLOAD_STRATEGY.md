# Artemis Tracker - Session Upload Strategy

**Author**: Claude
**Date**: 2026-01-13
**Purpose**: Design efficient data upload system for multi-source hunting data collection

---

## Executive Summary

Artemis Tracker currently implements a sophisticated local session tracking system with file-based persistence. This document outlines the most efficient strategies to upload session data from multiple users to a centralized source for aggregated hunting data analysis.

**Key Finding**: The existing session model is already optimized for serialization and cloud upload with minimal changes required.

---

## Current Session Architecture

### Data Model

**Primary Storage Format**: JSON files (one per session)
**Location**: `~/.artemis-tracker/sessions/session-{timestamp}.json`
**Average File Size**: ~50KB - 500KB per session (depends on event count)

### Session Structure

```typescript
interface Session {
  id: string;                    // session-{timestamp}
  name: string;                  // User-defined name
  tags: string[];                // Categorization
  startedAt: string;             // ISO timestamp
  endedAt?: string;              // ISO timestamp (undefined if active)
  events: SessionEvent[];        // All captured events
  loadoutSnapshots: Record<string, LoadoutSnapshot>;
  manualCostPerShot: number;
}
```

### Data Captured Per Session

**Combat Data**:
- Total shots, hits, misses (with breakdown: dodge/evade/resist/miss/out-of-range)
- Critical hits and damage dealt/taken
- Defensive stats (dodges, evades, deflects, armor hits)
- Kills and deaths

**Economy Data**:
- Per-shot costs (loadout-aware)
- Loot value and item breakdown
- Total spend (ammo + weapon/amp/scope/sight decay)
- Armor decay (per-hit)
- Profit/loss and return rate

**Skills Data**:
- Skill gains by category (combat, attributes, profession, support)
- Per-skill breakdown with timestamps
- Efficiency metrics (skill per PED, per shot, per hour)

**Loot Data**:
- Item-level breakdown (name, quantity, value)
- Shrapnel and ammo tracking
- Global/HOF events

**Loadout Context**:
- Multiple loadouts per session
- Per-loadout profit/loss analysis
- Cost-per-shot snapshots (historical accuracy)

### Current Data Volume Estimate

For a typical hunting session:
- **Duration**: 1-3 hours
- **Event Count**: 500-5000 events
- **File Size**: 100KB - 1MB JSON
- **Daily per user**: 1-5 sessions = 500KB - 5MB
- **Monthly per user**: ~30MB - 150MB

---

## Upload Strategy Design

### Strategy 1: **Real-time Event Streaming** (Not Recommended)

**Approach**: Upload each event as it occurs

**Pros**:
- Immediate data availability
- No data loss if app crashes

**Cons**:
- High network overhead (1000s of requests per session)
- Requires constant internet connection
- Battery drain on laptops
- Expensive for serverless backends
- Complex error handling and retry logic

**Verdict**: ❌ **NOT RECOMMENDED** - Too inefficient for event-dense gaming sessions

---

### Strategy 2: **Batch Session Upload** (RECOMMENDED)

**Approach**: Upload complete sessions after they end

**Pros**:
- Minimal network requests (1 per session)
- Existing JSON format is upload-ready
- Works offline (upload when connected)
- Simple error handling
- Cost-effective for serverless backends
- Preserves full context and relationships

**Cons**:
- Data only available after session ends
- Potential for data loss if not uploaded

**Verdict**: ✅ **HIGHLY RECOMMENDED** - Best balance of efficiency and simplicity

#### Implementation Details

```typescript
// After session ends
async function uploadSession(session: Session, userMetadata: UserMetadata) {
  const payload = {
    session,
    user: {
      userId: userMetadata.userId,        // Anonymous or account-based
      version: app.getVersion(),          // Track app version
      platform: process.platform,         // windows/darwin/linux
      uploadedAt: new Date().toISOString(),
    }
  };

  await fetch('https://api.your-backend.com/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`,
    },
    body: JSON.stringify(payload),
  });
}
```

**Recommended Upload Triggers**:
1. **On session end** (primary)
2. **On app close** (backup for active sessions)
3. **Manual "Upload All" button** (user-initiated)

**Upload Queue System**:
```typescript
interface UploadQueue {
  pending: string[];        // Session IDs not yet uploaded
  uploading: string[];      // Currently uploading
  uploaded: string[];       // Successfully uploaded
  failed: string[];         // Failed uploads (retry later)
}
```

---

### Strategy 3: **Incremental Session Updates** (Advanced)

**Approach**: Upload session periodically during active recording (every 5-10 minutes)

**Pros**:
- Near real-time data
- Reduced data loss risk
- Still efficient (few requests per session)

**Cons**:
- More complex state management
- Requires handling of partial sessions
- Backend must support upserts

**Verdict**: ⚠️ **OPTIONAL** - Consider for premium/pro users or long sessions (3+ hours)

---

### Strategy 4: **Compressed Session Upload** (Optimization)

**Approach**: GZIP compress JSON before upload

**Pros**:
- Reduces bandwidth by 70-85%
- Faster uploads on slow connections
- Lower cloud storage costs

**Cons**:
- Slight CPU overhead (negligible)
- Backend must decompress

**Verdict**: ✅ **RECOMMENDED ENHANCEMENT** to Strategy 2

#### Implementation

```typescript
import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);

async function uploadCompressedSession(session: Session) {
  const json = JSON.stringify(session);
  const compressed = await gzipAsync(json);

  await fetch('https://api.your-backend.com/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Encoding': 'gzip',
    },
    body: compressed,
  });
}
```

**Compression Ratios** (estimated):
- Uncompressed: 500KB
- GZIP: 85KB (83% reduction)
- Brotli: 70KB (86% reduction)

---

## Recommended Architecture

### Overall System Design

```
┌─────────────────────────────────────────────────────┐
│  ARTEMIS TRACKER (Electron App)                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. User hunts → Events captured                    │
│  2. Session ends → Saved to local JSON              │
│  3. Upload queue adds session ID                    │
│  4. Background worker uploads when online           │
│                                                      │
│  ┌──────────────────────────────────────┐           │
│  │  Upload Manager                      │           │
│  │  - Queue: pending/uploading/uploaded │           │
│  │  - Retry logic: exponential backoff  │           │
│  │  - Compression: gzip before send     │           │
│  │  - Auth: JWT token                   │           │
│  └──────────────────────────────────────┘           │
│                      │                               │
└──────────────────────┼───────────────────────────────┘
                       │ HTTPS POST
                       ▼
┌─────────────────────────────────────────────────────┐
│  CLOUD BACKEND (Your choice)                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  API Endpoint: POST /api/sessions                   │
│  - Validate JWT                                     │
│  - Decompress if gzipped                            │
│  - Validate session schema                          │
│  - Store in database                                │
│  - Queue for analytics processing                   │
│                                                      │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  DATABASE (Your choice)                             │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Collections/Tables:                                │
│  - sessions (raw session data)                      │
│  - users (user metadata)                            │
│  - aggregated_stats (pre-computed analytics)        │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Data Flow

1. **Session Creation**: User starts hunt → session created locally
2. **Event Recording**: Events added to session → saved to disk (debounced 500ms)
3. **Session End**: User stops hunt → session marked complete
4. **Upload Trigger**: Session added to upload queue
5. **Background Upload**: Worker uploads when online → marks as uploaded
6. **Backend Processing**: Server validates → stores → analytics

---

## Implementation Components

### Component 1: Upload Manager (Client-side)

**Location**: `src/services/uploadManager.ts`

```typescript
export interface UploadConfig {
  endpoint: string;
  apiKey?: string;
  userId?: string;
  autoUpload: boolean;
  compression: boolean;
  retryAttempts: number;
  retryDelay: number;  // ms
}

export class SessionUploadManager {
  private queue: UploadQueue;
  private config: UploadConfig;

  async uploadSession(sessionId: string): Promise<UploadResult>;
  async uploadAll(): Promise<UploadSummary>;
  async retryFailed(): Promise<UploadSummary>;

  // Queue management
  getPendingCount(): number;
  getFailedCount(): number;
  clearQueue(): void;

  // Status
  isOnline(): boolean;
  canUpload(): boolean;
}
```

### Component 2: Upload Queue Storage

**Location**: `electron/upload-queue.ts`

Store queue state in `~/.artemis-tracker/upload-queue.json`:

```json
{
  "pending": ["session-123", "session-456"],
  "uploading": [],
  "uploaded": ["session-789"],
  "failed": [
    {
      "sessionId": "session-999",
      "attempts": 3,
      "lastError": "Network timeout",
      "lastAttempt": "2026-01-13T10:00:00Z"
    }
  ]
}
```

### Component 3: IPC Handlers

**Location**: `electron/main.ts`

```typescript
ipcMain.handle('upload:session', async (_event, sessionId: string) => {
  return await uploadManager.uploadSession(sessionId);
});

ipcMain.handle('upload:queue:status', async () => {
  return uploadManager.getQueueStatus();
});

ipcMain.handle('upload:retry-failed', async () => {
  return await uploadManager.retryFailed();
});
```

### Component 4: UI Components

**Settings Page**: `src/components/SettingsPage.tsx`
- Toggle auto-upload on/off
- Set API endpoint/key
- View upload queue status
- Manual "Upload All" button
- "Retry Failed" button

**Session List**: `src/components/SessionsPage.tsx`
- Upload status badge per session
  - ✓ Uploaded
  - ⏳ Pending
  - ❌ Failed
  - 📤 Uploading
- Manual upload button per session

---

## Backend Options

### Option 1: Firebase (Easiest)

**Service**: Firestore + Cloud Functions

**Pros**:
- Minimal setup
- Built-in authentication
- Real-time sync
- Free tier: 50K writes/day

**Cons**:
- Vendor lock-in
- Costs scale with usage
- Query limitations

**Sample Implementation**:
```typescript
// Client
import { getFirestore, addDoc, collection } from 'firebase/firestore';

const db = getFirestore();
await addDoc(collection(db, 'sessions'), session);
```

---

### Option 2: Supabase (Best Balance)

**Service**: PostgreSQL + REST API

**Pros**:
- Open source
- SQL queries
- Built-in auth
- Generous free tier
- Real-time subscriptions

**Cons**:
- Requires some backend knowledge
- Less managed than Firebase

**Sample Implementation**:
```typescript
// Client
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const { data, error } = await supabase
  .from('sessions')
  .insert([session]);
```

**Database Schema**:
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  tags TEXT[],
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  events JSONB NOT NULL,
  loadout_snapshots JSONB NOT NULL,
  manual_cost_per_shot DECIMAL(10,2),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  app_version TEXT,
  platform TEXT
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_started_at ON sessions(started_at DESC);
CREATE INDEX idx_sessions_tags ON sessions USING GIN(tags);
```

---

### Option 3: Custom REST API (Most Control)

**Stack**: Node.js + Express + PostgreSQL/MongoDB

**Pros**:
- Full control
- Custom analytics
- No vendor lock-in
- Can self-host

**Cons**:
- More development work
- Requires hosting/maintenance
- Scaling complexity

**Sample Endpoint**:
```typescript
// Server (Express)
app.post('/api/sessions', authenticate, async (req, res) => {
  const { session, user } = req.body;

  // Validate schema
  const validation = sessionSchema.validate(session);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  // Store in database
  await db.collection('sessions').insertOne({
    ...session,
    userId: user.userId,
    uploadedAt: new Date(),
    appVersion: user.version,
  });

  res.json({ success: true });
});
```

---

### Option 4: AWS S3 + Lambda (Scalable)

**Service**: Direct S3 upload + Lambda processing

**Pros**:
- Extremely scalable
- Pay only for storage/compute
- Pre-signed URLs for direct upload
- Can process with Lambda

**Cons**:
- More complex setup
- Requires AWS knowledge

**Sample Implementation**:
```typescript
// Client: Get pre-signed URL
const { uploadUrl } = await fetch('/api/get-upload-url').then(r => r.json());

// Upload directly to S3
await fetch(uploadUrl, {
  method: 'PUT',
  body: JSON.stringify(session),
  headers: { 'Content-Type': 'application/json' }
});

// Lambda processes on upload
```

---

## Privacy & Security Considerations

### User Consent

**CRITICAL**: Users must explicitly opt-in to data upload

**Recommended Flow**:
1. First launch: Show privacy policy and opt-in dialog
2. Settings: Toggle to enable/disable upload
3. Session list: Show upload status, allow deletion before upload

### Data Anonymization

**User Identification**:
- **Option A**: Anonymous UUID (no account required)
- **Option B**: Optional account (email + password)
- **Option C**: Hybrid (anonymous by default, optional account for advanced features)

**Recommended**: Option C

**PII Handling**:
- Player name: Hash or allow opt-out
- Loadout names: May contain personal info (e.g., "John's Gun")
- Session names: May contain personal info

### Data Minimization

**Don't Upload**:
- Full chat logs (only parsed events)
- System paths
- IP addresses (unless needed for geo-analytics)

**Do Upload**:
- Session stats (anonymized)
- Equipment used (public game data)
- Timestamps (UTC)
- Platform/version (analytics)

---

## Performance Optimizations

### 1. Batch Uploads

Upload multiple sessions in one request if >1 pending:

```typescript
// Instead of 5 requests for 5 sessions
await Promise.all(sessions.map(s => uploadSession(s)));

// Do 1 request with array
await fetch('/api/sessions/batch', {
  method: 'POST',
  body: JSON.stringify({ sessions }),
});
```

### 2. Incremental Upload for Active Sessions

For sessions >2 hours, upload snapshot every 10 minutes:

```typescript
// Mark session as "partial"
const partial = { ...session, partial: true };
await uploadSession(partial);

// Final upload on session end
const complete = { ...session, partial: false };
await uploadSession(complete);  // Server upserts
```

### 3. Deduplication

Store hash of uploaded sessions to prevent duplicates:

```typescript
import crypto from 'crypto';

function getSessionHash(session: Session): string {
  const content = JSON.stringify(session);
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Before upload
const hash = getSessionHash(session);
if (uploadedHashes.includes(hash)) {
  console.log('Session already uploaded, skipping');
  return;
}
```

### 4. Progressive Data Upload

For limited bandwidth, upload only summary stats first:

```typescript
// Phase 1: Upload minimal stats (1-5 KB)
const summary = {
  id: session.id,
  stats: calculateSessionStats(session),
  metadata: { name, tags, startedAt, endedAt }
};
await uploadSummary(summary);

// Phase 2: Upload full events later (optional)
if (user.wantsFullData) {
  await uploadFullSession(session);
}
```

---

## Error Handling & Resilience

### Retry Strategy

```typescript
async function uploadWithRetry(
  sessionId: string,
  maxAttempts: number = 3
): Promise<UploadResult> {
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      return await uploadSession(sessionId);
    } catch (error) {
      attempt++;

      // Exponential backoff: 2s, 4s, 8s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));

      if (attempt === maxAttempts) {
        // Move to failed queue
        await markAsFailed(sessionId, error);
        throw error;
      }
    }
  }
}
```

### Network Detection

```typescript
// Check if online before upload
async function isOnline(): Promise<boolean> {
  try {
    await fetch('https://api.your-backend.com/health', {
      method: 'HEAD',
      timeout: 5000,
    });
    return true;
  } catch {
    return false;
  }
}

// Only upload if online
if (await isOnline()) {
  await uploadPendingSessions();
}
```

### Partial Upload Recovery

```typescript
// Use multipart upload for large sessions
async function uploadLargeSession(session: Session) {
  const chunks = splitIntoChunks(session.events, 1000);

  // Upload metadata first
  const uploadId = await initializeUpload(session.id);

  // Upload chunks
  for (const [index, chunk] of chunks.entries()) {
    await uploadChunk(uploadId, index, chunk);
  }

  // Finalize
  await finalizeUpload(uploadId);
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/uploadManager.test.ts
describe('SessionUploadManager', () => {
  it('compresses session before upload', async () => {
    const session = createMockSession();
    const compressed = await manager.compressSession(session);
    expect(compressed.length).toBeLessThan(session.length * 0.3);
  });

  it('retries failed uploads with backoff', async () => {
    // Mock network failure
    fetchMock.mockRejectOnce(new Error('Network error'));
    fetchMock.mockResolveOnce({ ok: true });

    await manager.uploadSession('session-123');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('marks session as uploaded after success', async () => {
    await manager.uploadSession('session-123');

    const status = manager.getUploadStatus('session-123');
    expect(status).toBe('uploaded');
  });
});
```

### Integration Tests

```typescript
// tests/integration/upload.test.ts
describe('Upload Integration', () => {
  it('uploads session to staging backend', async () => {
    const session = await loadTestSession();
    const result = await uploadSession(session);

    expect(result.success).toBe(true);

    // Verify in backend
    const retrieved = await fetchFromBackend(session.id);
    expect(retrieved).toEqual(session);
  });
});
```

---

## Monitoring & Analytics

### Client-side Metrics

Track in local storage:

```typescript
interface UploadMetrics {
  totalUploaded: number;
  totalFailed: number;
  averageUploadTime: number;  // ms
  totalBytesSent: number;
  lastUploadAt: string;
}
```

### Backend Metrics

Track in analytics service (e.g., Google Analytics, Mixpanel):

- Sessions uploaded per day
- Average session size
- Upload errors (by type)
- User retention (active uploaders)
- Data quality (validation failures)

---

## Cost Estimation

### Backend Costs (Monthly)

**Scenario**: 1000 active users, 3 sessions/day average

**Data Volume**:
- 1000 users × 3 sessions/day × 30 days = 90,000 sessions/month
- 90,000 sessions × 200 KB average = 18 GB/month

**Supabase Costs**:
- Free tier: 500 MB database, 1 GB bandwidth (covers ~50 users)
- Pro tier ($25/mo): 8 GB database, 50 GB bandwidth (covers ~1000 users)
- Additional: $0.125/GB storage, $0.09/GB bandwidth

**AWS S3 Costs**:
- Storage: 18 GB × $0.023/GB = $0.41/month
- PUT requests: 90,000 × $0.005/1000 = $0.45/month
- GET requests: negligible
- **Total: ~$1/month for 1000 users**

**Firebase Costs**:
- Free tier: 50K writes/day (covers ~1500 sessions/day)
- Storage: 1 GB free (covers ~5000 sessions)
- Paid: $0.18/100K writes
- **Total: Free for <1500 daily sessions**

---

## Recommended Implementation Roadmap

### Phase 1: MVP (Week 1-2)

**Goal**: Basic upload functionality

1. Create `UploadManager` class
2. Add "Upload Session" button to SessionsPage
3. Implement basic POST to backend endpoint
4. Store upload status locally
5. Add opt-in consent dialog

**Deliverables**:
- Manual upload works
- Status indicators in UI
- Basic error handling

### Phase 2: Automation (Week 3-4)

**Goal**: Automatic upload on session end

1. Auto-trigger upload when session ends
2. Implement upload queue
3. Add retry logic with exponential backoff
4. Background worker for pending uploads
5. Settings page for configuration

**Deliverables**:
- Auto-upload after session end
- Queue persists across app restarts
- Failed uploads retry automatically

### Phase 3: Optimization (Week 5-6)

**Goal**: Improve performance and reliability

1. Add GZIP compression
2. Implement batch uploads
3. Add network detection
4. Implement partial upload recovery
5. Add upload metrics

**Deliverables**:
- 80%+ bandwidth reduction
- Reliable uploads on poor connections
- Metrics dashboard in settings

### Phase 4: Analytics (Week 7-8)

**Goal**: Backend processing and aggregation

1. Backend validation
2. Database schema
3. Aggregation queries
4. Analytics API endpoints
5. Public stats dashboard (optional)

**Deliverables**:
- Central database of all sessions
- Aggregate stats available via API
- Optional: Web dashboard for viewing trends

---

## Alternative Approaches

### Peer-to-Peer Sync

**Concept**: Use P2P to sync sessions between multiple devices

**Pros**: No backend costs, works offline

**Cons**: Complex, requires discovery service, no central aggregation

**Verdict**: ❌ Not suitable for your use case (central data collection)

### Blockchain/Web3

**Concept**: Store sessions on distributed ledger

**Pros**: Decentralized, immutable

**Cons**: Expensive, slow, unnecessary complexity

**Verdict**: ❌ Not suitable for high-volume event data

---

## Conclusion

**RECOMMENDED APPROACH**:

1. **Upload Strategy**: Batch Session Upload (Strategy 2)
2. **Enhancement**: GZIP Compression (Strategy 4)
3. **Backend**: Supabase (PostgreSQL + REST API)
4. **Upload Trigger**: Auto-upload on session end + manual button
5. **Queue System**: Local JSON file with pending/uploaded/failed states
6. **Retry Logic**: Exponential backoff (3 attempts)
7. **Privacy**: Opt-in consent + anonymous UUID

**Expected Performance**:
- **Network Requests**: 1 per session (down from thousands)
- **Bandwidth**: ~50 KB per session (83% reduction with gzip)
- **Upload Time**: <1 second on broadband, <5 seconds on mobile
- **Reliability**: 99%+ success rate with retry logic
- **Cost**: <$1/month per 1000 users

**Next Steps**:
1. Review and approve this strategy
2. Choose backend service (recommend Supabase)
3. Implement Phase 1 (MVP) in 1-2 weeks
4. User testing with small group
5. Iterate based on feedback
6. Roll out to all users

---

## Appendix A: Session JSON Example

```json
{
  "id": "session-1234567890",
  "name": "Hunt 1/13/2026 10:00:00 AM",
  "tags": ["hunting", "maffoid"],
  "startedAt": "2026-01-13T10:00:00.000Z",
  "endedAt": "2026-01-13T12:30:00.000Z",
  "manualCostPerShot": 0.05,
  "loadoutSnapshots": {
    "loadout-abc123": {
      "id": "loadout-abc123",
      "name": "Maffoid Hunting Setup",
      "costPerShot": 0.12
    }
  },
  "events": [
    {
      "timestamp": 1705147200000,
      "raw": "You inflicted 45.2 points of damage",
      "type": "damage_dealt",
      "amount": 45.2,
      "critical": false,
      "loadoutId": "loadout-abc123"
    },
    {
      "timestamp": 1705147202000,
      "raw": "You received Maffoid Hide",
      "type": "loot",
      "itemName": "Maffoid Hide",
      "quantity": 1,
      "value": 0.50,
      "loadoutId": "loadout-abc123"
    }
  ]
}
```

**File Size**: ~500 bytes per event × 1000 events = 500 KB

**Compressed**: ~85 KB (83% reduction)

---

## Appendix B: Privacy Policy Template

```markdown
# Artemis Tracker - Data Collection Policy

## What We Collect

When you enable session upload, we collect:
- Hunting session statistics (damage, loot, skills)
- Equipment used (weapons, armor, loadouts)
- Session duration and timestamps
- App version and platform

## What We DON'T Collect

- Your chat messages
- Your password or personal information
- Your real name or email (unless you create an account)
- Your system files or data outside Artemis Tracker

## How We Use Your Data

- Aggregate statistics across all users
- Improve hunting efficiency recommendations
- Analyze game economy trends
- Research hunting patterns

## Your Privacy

- All data is anonymous by default
- You can disable uploads at any time
- You can delete your uploaded data
- We never share individual data with third parties

## Opting Out

You can disable session upload in Settings at any time.
```

---

**END OF DOCUMENT**
