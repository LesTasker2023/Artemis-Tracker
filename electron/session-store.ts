/**
 * ARTEMIS v3 - Session Storage
 * Persists sessions to JSON files in user data directory
 */

import * as fs from "fs";
import * as path from "path";
import { app } from "electron";
import { Session } from "../core/session";

const SESSIONS_DIR = "sessions";

/**
 * Get the sessions directory path
 */
function getSessionsDir(): string {
  const userDataPath = app.getPath("userData");
  const sessionsPath = path.join(userDataPath, SESSIONS_DIR);
  
  // Ensure directory exists
  if (!fs.existsSync(sessionsPath)) {
    fs.mkdirSync(sessionsPath, { recursive: true });
  }
  
  return sessionsPath;
}

/**
 * Get path for a specific session file
 */
function getSessionPath(sessionId: string): string {
  return path.join(getSessionsDir(), `${sessionId}.json`);
}

/**
 * Save a session to disk
 */
export function saveSession(session: Session): void {
  const filePath = getSessionPath(session.id);
  fs.writeFileSync(filePath, JSON.stringify(session, null, 2), "utf8");
}

/**
 * Load a session from disk
 */
export function loadSession(sessionId: string): Session | null {
  const filePath = getSessionPath(sessionId);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const json = fs.readFileSync(filePath, "utf8");
  return JSON.parse(json) as Session;
}

/**
 * Delete a session from disk
 */
export function deleteSession(sessionId: string): boolean {
  const filePath = getSessionPath(sessionId);
  
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  fs.unlinkSync(filePath);
  return true;
}

/**
 * List all saved sessions (metadata only for performance)
 */
export function listSessions(): Array<{
  id: string;
  name: string;
  startedAt: string;
  endedAt?: string;
  eventCount: number;
}> {
  const sessionsDir = getSessionsDir();
  const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith(".json"));
  
  return files.map(file => {
    const filePath = path.join(sessionsDir, file);
    const json = fs.readFileSync(filePath, "utf8");
    const session = JSON.parse(json) as Session;
    
    return {
      id: session.id,
      name: session.name,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      eventCount: session.events.length,
    };
  }).sort((a, b) => 
    new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
}

/**
 * Load all sessions (full data)
 */
export function loadAllSessions(): Session[] {
  const sessionsDir = getSessionsDir();
  const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith(".json"));
  
  return files.map(file => {
    const filePath = path.join(sessionsDir, file);
    const json = fs.readFileSync(filePath, "utf8");
    return JSON.parse(json) as Session;
  }).sort((a, b) => 
    new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
}

/**
 * Export session to a specific path (for user export)
 */
export function exportSession(sessionId: string, exportPath: string): boolean {
  const session = loadSession(sessionId);
  if (!session) return false;
  
  fs.writeFileSync(exportPath, JSON.stringify(session, null, 2), "utf8");
  return true;
}

/**
 * Import session from a file
 */
export function importSession(importPath: string): Session | null {
  if (!fs.existsSync(importPath)) {
    return null;
  }
  
  const json = fs.readFileSync(importPath, "utf8");
  const session = JSON.parse(json) as Session;
  
  // Generate new ID to avoid conflicts
  session.id = `session-${Date.now()}-imported`;
  
  // Save to our sessions directory
  saveSession(session);
  
  return session;
}
