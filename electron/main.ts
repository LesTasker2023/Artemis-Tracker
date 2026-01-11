/**
 * Electron Main Process
 * SECURITY: Context isolation enabled, node integration disabled
 */

const { app, BrowserWindow, ipcMain, dialog, nativeImage } = require('electron');
const path = require('path');
import fs from 'fs';
const os = require('os');
import { updateEquipmentDatabase, checkForUpdates, needsInitialization } from './equipment-updater';

// Global error handlers to catch crashes and unhandled rejections
process.on('uncaughtException', (err: any) => {
  console.error('[Main] Uncaught Exception:', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason: any) => {
  console.error('[Main] Unhandled Rejection:', reason);
});

// Renderer error forwarding
ipcMain.on('renderer:error', (_event: any, payload: any) => {
  console.error('[Renderer] Error forwarded:', payload);
});

let mainWindow: typeof BrowserWindow | null = null;
let popoutWindow: typeof BrowserWindow | null = null;
let logWatcher: fs.FSWatcher | null = null;
let lastPosition = 0;

// ==================== Log Path Detection ====================

function detectLogPath(): string | undefined {
  const userHome = os.homedir();
  const isWindows = process.platform === 'win32';
  const isLinux = process.platform === 'linux';
  
  const possiblePaths = [
    // Windows paths
    ...(isWindows ? [
      path.join(userHome, 'Documents', 'Entropia Universe', 'chat.log'),
      path.join(userHome, 'OneDrive', 'Documents', 'Entropia Universe', 'chat.log'),
      path.join('C:', 'Program Files (x86)', 'Steam', 'steamapps', 'common', 'Entropia Universe', 'chat.log'),
      path.join('D:', 'SteamLibrary', 'steamapps', 'common', 'Entropia Universe', 'chat.log'),
    ] : []),
    // Linux paths
    ...(isLinux ? [
      path.join(userHome, '.steam', 'steam', 'steamapps', 'common', 'Entropia Universe', 'chat.log'),
      path.join(userHome, '.local', 'share', 'Steam', 'steamapps', 'common', 'Entropia Universe', 'chat.log'),
      // Flatpak Steam location
      path.join(userHome, '.var', 'app', 'com.valvesoftware.Steam', 'data', 'Steam', 'steamapps', 'common', 'Entropia Universe', 'chat.log'),
    ] : []),
  ];

  for (const logPath of possiblePaths) {
    if (fs.existsSync(logPath)) {
      console.log('[Main] Found chat.log at:', logPath);
      return logPath;
    }
  }
  
  console.log('[Main] chat.log not found in common locations');
  return undefined;
}

// ==================== Event Types ====================

type EventCategory =
  | 'combat'
  | 'loot'
  | 'skill'
  | 'mining'
  | 'healing'
  | 'death'
  | 'equipment'
  | 'effect'
  | 'global'
  | 'social'
  | 'vehicle'
  | 'position'
  | 'transaction'
  | 'system';

interface ParsedEvent {
  timestamp: number;
  raw: string;
  category: EventCategory;
  type: string;
  data: Record<string, unknown>;
}

// ==================== Parser Functions ====================

function extractTimestamp(line: string): number {
  const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
  return match ? new Date(match[1]).getTime() : Date.now();
}

function isSystemMessage(line: string): boolean {
  // Must be YOUR system channel: "[System] []" - not someone else's quoted system message
  return /\[System\] \[\]/.test(line);
}

function isGlobalsMessage(line: string): boolean {
  return line.includes('[Globals]');
}

// Combat parser
function parseCombatEvent(line: string): Partial<ParsedEvent> | null {
  // Critical hit damage dealt
  const critHitMatch = line.match(/Critical hit.*You inflicted ([\d.]+) points of damage/);
  if (critHitMatch) {
    return {
      category: 'combat',
      type: 'CRITICAL_HIT',
      data: { damage: parseFloat(critHitMatch[1]), critical: true, resisted: line.includes('Target resisted') },
    };
  }

  // Normal damage dealt
  const hitMatch = line.match(/You inflicted ([\d.]+) points of damage/);
  if (hitMatch) {
    return {
      category: 'combat',
      type: 'HIT',
      data: { damage: parseFloat(hitMatch[1]), critical: false, resisted: line.includes('Target resisted') },
    };
  }

  // Critical damage taken
  const critDmgTakenMatch = line.match(/Critical hit.*You took ([\d.]+) points of damage/);
  if (critDmgTakenMatch) {
    return { category: 'combat', type: 'CRITICAL_DAMAGE_TAKEN', data: { damage: parseFloat(critDmgTakenMatch[1]), critical: true } };
  }

  // Normal damage taken
  const dmgTakenMatch = line.match(/You took ([\d.]+) points of damage/);
  if (dmgTakenMatch) {
    return { category: 'combat', type: 'DAMAGE_TAKEN', data: { damage: parseFloat(dmgTakenMatch[1]), critical: false } };
  }

  // Damage reduction
  const reducedMatch = line.match(/Reduced ([\d.]+) points of (critical|armor piercing) damage/);
  if (reducedMatch) {
    return { category: 'combat', type: 'DAMAGE_REDUCED', data: { amount: parseFloat(reducedMatch[1]), damageType: reducedMatch[2] } };
  }

  if (line.includes('You missed')) return { category: 'combat', type: 'MISS', data: {} };
  if (line.includes('target Dodged')) return { category: 'combat', type: 'TARGET_DODGED', data: {} };
  if (line.includes('target Evaded')) return { category: 'combat', type: 'TARGET_EVADED', data: {} };
  if (line.includes('target resisted all damage')) return { category: 'combat', type: 'TARGET_RESISTED', data: {} };
  if (line.includes('You Evaded the attack')) return { category: 'combat', type: 'PLAYER_EVADED', data: {} };
  if (line.includes('You Dodged the attack')) return { category: 'combat', type: 'PLAYER_DODGED', data: {} };
  if (line.includes('attack missed you')) return { category: 'combat', type: 'ENEMY_MISSED', data: {} };
  if (line.includes('Damage deflected')) return { category: 'combat', type: 'DEFLECT', data: {} };
  if (line.includes('Target out of range')) return { category: 'combat', type: 'OUT_OF_RANGE', data: {} };

  return null;
}

// Death parser
function parseDeathEvent(line: string): Partial<ParsedEvent> | null {
  const deathMatch = line.match(/You were killed by the (\w+) (.+)/);
  if (deathMatch) {
    return { category: 'death', type: 'PLAYER_DEATH', data: { adjective: deathMatch[1], creature: deathMatch[2].trim() } };
  }

  const deathLocMatch = line.match(/Your death location: \[position:(\d+)\$\(([^)]+)\)\$(\d+),(\d+),(-?\d+)\$([^\]]*)\]/);
  if (deathLocMatch) {
    return { category: 'death', type: 'DEATH_LOCATION', data: { x: parseInt(deathLocMatch[3]), y: parseInt(deathLocMatch[4]), z: parseInt(deathLocMatch[5]), label: deathLocMatch[6] || 'Death location' } };
  }

  if (line.includes('You have been revived')) return { category: 'death', type: 'REVIVED', data: {} };
  if (line.includes('saved from certain death by divine intervention')) return { category: 'death', type: 'DIVINE_INTERVENTION', data: {} };

  return null;
}

// Loot parser
function parseLootEvent(line: string): Partial<ParsedEvent> | null {
  // Standard format: You received Shrapnel x (29194) Value: 2.91 PED
  const lootFullMatch = line.match(/You received (.+?) x \((\d+)\) Value: ([\d.]+) PED/);
  if (lootFullMatch) {
    return { category: 'loot', type: 'LOOT', data: { item: lootFullMatch[1].trim(), quantity: parseInt(lootFullMatch[2]), value: parseFloat(lootFullMatch[3]) } };
  }

  // Alt format without value
  const lootAltMatch = line.match(/You received (.+?) \((\d+)\)(?! Value)/);
  if (lootAltMatch) {
    return { category: 'loot', type: 'LOOT', data: { item: lootAltMatch[1].trim(), quantity: parseInt(lootAltMatch[2]), value: 0 } };
  }

  return null;
}

// Skill parser
function parseSkillEvent(line: string): Partial<ParsedEvent> | null {
  const skillGainMatch = line.match(/You have gained ([\d.]+) experience in your (.+) skill/);
  if (skillGainMatch) {
    return { category: 'skill', type: 'SKILL_GAIN', data: { amount: parseFloat(skillGainMatch[1]), skill: skillGainMatch[2] } };
  }

  const rankMatch = line.match(/You have gained a new rank in (.+)!/);
  if (rankMatch) {
    return { category: 'skill', type: 'SKILL_RANK', data: { skill: rankMatch[1] } };
  }

  const newSkillMatch = line.match(/acquired a new skill; (.+)/);
  if (newSkillMatch) {
    return { category: 'skill', type: 'SKILL_ACQUIRED', data: { skill: newSkillMatch[1] } };
  }

  // Attribute gain with decimal: "You have gained 0.1234 Courage" or "You have gained 0.1234 experience in your Courage"
  const attrGainDecimalMatch = line.match(/You have gained ([\d.]+) (?:experience in your )?(\w+)$/);
  if (attrGainDecimalMatch) {
    return { category: 'skill', type: 'ATTRIBUTE_GAIN', data: { amount: parseFloat(attrGainDecimalMatch[1]), attribute: attrGainDecimalMatch[2] } };
  }

  // Attribute gain with integer: "You have gained 1 Agility"
  const attrGainMatch = line.match(/You have gained (\d+) (\w+)$/);
  if (attrGainMatch) {
    return { category: 'skill', type: 'ATTRIBUTE_GAIN', data: { amount: parseInt(attrGainMatch[1]), attribute: attrGainMatch[2] } };
  }

  const attrImproveMatch = line.match(/Your (\w+) has improved by ([\d.]+)/);
  if (attrImproveMatch) {
    return { category: 'skill', type: 'ATTRIBUTE_IMPROVE', data: { attribute: attrImproveMatch[1], amount: parseFloat(attrImproveMatch[2]) } };
  }

  return null;
}

// Mining parser
function parseMiningEvent(line: string): Partial<ParsedEvent> | null {
  const claimMatch = line.match(/You have claimed a resource! \((.+)\)/);
  if (claimMatch) return { category: 'mining', type: 'CLAIM', data: { resource: claimMatch[1] } };

  if (line.includes('This resource is depleted')) return { category: 'mining', type: 'DEPLETED', data: {} };
  if (line.includes('No resources found')) return { category: 'mining', type: 'NO_FIND', data: {} };

  return null;
}

// Healing parser
function parseHealingEvent(line: string): Partial<ParsedEvent> | null {
  const selfHealMatch = line.match(/You healed yourself ([\d.]+) points/);
  if (selfHealMatch) return { category: 'healing', type: 'SELF_HEAL', data: { amount: parseFloat(selfHealMatch[1]) } };

  const healOtherMatch = line.match(/You healed (.+) with ([\d.]+) points/);
  if (healOtherMatch) return { category: 'healing', type: 'HEAL_OTHER', data: { target: healOtherMatch[1], amount: parseFloat(healOtherMatch[2]) } };

  const healedByMatch = line.match(/You were healed ([\d.]+) points by (.+)/);
  if (healedByMatch) return { category: 'healing', type: 'HEALED_BY', data: { amount: parseFloat(healedByMatch[1]), healer: healedByMatch[2] } };

  if (line.includes('Healing is diminished while moving')) return { category: 'healing', type: 'HEAL_DIMINISHED', data: {} };

  return null;
}

// Effect parser
function parseEffectEvent(line: string): Partial<ParsedEvent> | null {
  const effectMatch = line.match(/Received Effect Over Time: (.+)/);
  if (effectMatch) {
    const effectName = effectMatch[1];
    const isDebuff = ['Cold Damage', 'Electric Damage', 'Impact Damage', 'Slowed', 'Decreased Critical Damage', 'Decreased Healing', 'Decreased Reload Speed'].includes(effectName);
    return { category: 'effect', type: isDebuff ? 'DEBUFF' : 'BUFF', data: { effect: effectName } };
  }
  return null;
}

// Equipment parser
function parseEquipmentEvent(line: string): Partial<ParsedEvent> | null {
  const tierMatch = line.match(/Your (.+) has reached tier ([\d.]+)/);
  if (tierMatch) return { category: 'equipment', type: 'TIER_UP', data: { item: tierMatch[1], tier: parseFloat(tierMatch[2]) } };

  const lowCondLMatch = line.match(/Your (.+) is close to reaching minimum condition, note that limited/);
  if (lowCondLMatch) return { category: 'equipment', type: 'LOW_CONDITION_LIMITED', data: { item: lowCondLMatch[1] } };

  const lowCondMatch = line.match(/Your (.+) is close to reaching minimum condition, consider repairing/);
  if (lowCondMatch) return { category: 'equipment', type: 'LOW_CONDITION', data: { item: lowCondMatch[1] } };

  const enhancerMatch = line.match(/Your enhancer (.+) on your (.+) broke\. You have (\d+) enhancers remaining.*You received ([\d.]+) PED Shrapnel/);
  if (enhancerMatch) return { category: 'equipment', type: 'ENHANCER_BROKE', data: { enhancer: enhancerMatch[1], item: enhancerMatch[2], remaining: parseInt(enhancerMatch[3]), shrapnel: parseFloat(enhancerMatch[4]) } };

  if (line.includes('Item(s) repaired successfully')) return { category: 'equipment', type: 'REPAIRED', data: {} };

  return null;
}

// Global parser
function parseGlobalEvent(line: string): Partial<ParsedEvent> | null {
  const killGlobalMatch = line.match(/(.+) killed a creature \((.+?)\) with a value of (\d+) PED/);
  if (killGlobalMatch) {
    const isHoF = line.includes('Hall of Fame');
    return { category: 'global', type: isHoF ? 'GLOBAL_HOF' : 'GLOBAL_KILL', data: { player: killGlobalMatch[1].trim(), creature: killGlobalMatch[2], value: parseInt(killGlobalMatch[3]), hof: isHoF } };
  }

  const miningGlobalMatch = line.match(/(.+) found a deposit \((.+?)\) with a value of (\d+) PED/);
  if (miningGlobalMatch) {
    const isHoF = line.includes('Hall of Fame');
    const locationMatch = line.match(/at (.+?)!/);
    return { category: 'global', type: isHoF ? 'GLOBAL_MINING_HOF' : 'GLOBAL_MINING', data: { player: miningGlobalMatch[1].trim(), resource: miningGlobalMatch[2], value: parseInt(miningGlobalMatch[3]), location: locationMatch ? locationMatch[1] : null, hof: isHoF } };
  }

  const craftGlobalMatch = line.match(/(.+) constructed an item \((.+?)\) worth (\d+) PED/);
  if (craftGlobalMatch) return { category: 'global', type: 'GLOBAL_CRAFT', data: { player: craftGlobalMatch[1].trim(), item: craftGlobalMatch[2], value: parseInt(craftGlobalMatch[3]) } };

  return null;
}

// Vehicle parser
function parseVehicleEvent(line: string): Partial<ParsedEvent> | null {
  const vehDmgMatch = line.match(/Vehicle took ([\d.]+) points of damage/);
  if (vehDmgMatch) return { category: 'vehicle', type: 'VEHICLE_DAMAGE', data: { damage: parseFloat(vehDmgMatch[1]) } };

  const vehReturnMatch = line.match(/The vehicle \((.+?)\) is returned to your Inventory/);
  if (vehReturnMatch) return { category: 'vehicle', type: 'VEHICLE_RETURNED', data: { vehicle: vehReturnMatch[1] } };

  const vehRepairMatch = line.match(/(?:vehicle's Structural Integrity restored|You restored the vehicle's Structural Integrity) by ([\d.]+)/);
  if (vehRepairMatch) return { category: 'vehicle', type: 'VEHICLE_REPAIRED', data: { amount: parseFloat(vehRepairMatch[1]) } };

  if (line.includes('vehicle is overloaded!')) return { category: 'vehicle', type: 'VEHICLE_OVERLOADED', data: {} };
  if (line.includes('vehicle is no longer overloaded')) return { category: 'vehicle', type: 'VEHICLE_NOT_OVERLOADED', data: {} };

  return null;
}

// Position parser
function parsePositionEvent(line: string): Partial<ParsedEvent> | null {
  // Old format: [position:123$(Planet)$x,y,z$Label]
  const posMatch = line.match(/\[position:(\d+)\$\(([^)]+)\)\$(\d+),(\d+),(-?\d+)\$([^\]]*)\]/);
  if (posMatch) return { category: 'position', type: 'POSITION', data: { x: parseInt(posMatch[3]), y: parseInt(posMatch[4]), z: parseInt(posMatch[5]), planet: posMatch[2], label: posMatch[6] || null } };

  // Location button format: [System] [] [Location, X, Y, Z, Label]
  // Example: 2025-12-15 03:15:09 [System] [] [Space, 59021, 68442, -822, Waypoint]
  const chatPosMatch = line.match(/\[System\] \[\] \[([^,]+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+)(?:,\s*([^\]]*))?\]/);
  if (chatPosMatch) {
    console.log('[Main] Position match found:', chatPosMatch[1], chatPosMatch[2], chatPosMatch[3], chatPosMatch[4], chatPosMatch[5]);
    return { 
      category: 'position', 
      type: 'POSITION', 
      data: { 
        x: parseInt(chatPosMatch[2]), 
        y: parseInt(chatPosMatch[3]), 
        z: parseInt(chatPosMatch[4]), 
        planet: chatPosMatch[1].trim(), 
        label: chatPosMatch[5]?.trim() || null 
      } 
    };
  }

  if (line.includes('Added waypoint to map')) return { category: 'position', type: 'WAYPOINT_ADDED', data: {} };
  if (line.includes('Removed waypoint from map') || line.includes('Reached waypoint was removed')) return { category: 'position', type: 'WAYPOINT_REMOVED', data: {} };

  return null;
}

// Social parser
function parseSocialEvent(line: string): Partial<ParsedEvent> | null {
  const loginMatch = line.match(/(.+) has logged in$/);
  if (loginMatch) return { category: 'social', type: 'PLAYER_LOGIN', data: { player: loginMatch[1] } };

  const logoutMatch = line.match(/(.+) has logged out$/);
  if (logoutMatch) return { category: 'social', type: 'PLAYER_LOGOUT', data: { player: logoutMatch[1] } };

  const friendMatch = line.match(/You have added (.+) as a friend/);
  if (friendMatch) return { category: 'social', type: 'FRIEND_ADDED', data: { player: friendMatch[1] } };

  const tradeMatch = line.match(/You have successfully traded with (.+)/);
  if (tradeMatch) return { category: 'social', type: 'TRADE_COMPLETE', data: { player: tradeMatch[1] } };

  return null;
}

// Transaction parser
function parseTransactionEvent(line: string): Partial<ParsedEvent> | null {
  const transferMatch = line.match(/Transfer complete! ([\d.]+) PED was transferred/);
  if (transferMatch) return { category: 'transaction', type: 'PED_TRANSFER', data: { amount: parseFloat(transferMatch[1]) } };

  const buyMatch = line.match(/You have bought the item: (.+?)\. ([\d.]+) PED has been withdrawn/);
  if (buyMatch) return { category: 'transaction', type: 'ITEM_BOUGHT', data: { item: buyMatch[1], cost: parseFloat(buyMatch[2]) } };

  if (line.includes('transaction was completed successfully')) return { category: 'transaction', type: 'TRANSACTION_COMPLETE', data: {} };

  return null;
}

// System parser
function parseSystemEvent(line: string): Partial<ParsedEvent> | null {
  const sessionMatch = line.match(/Session time: (\d+):(\d+):(\d+)/);
  if (sessionMatch) {
    const hours = parseInt(sessionMatch[1]), minutes = parseInt(sessionMatch[2]), seconds = parseInt(sessionMatch[3]);
    return { category: 'system', type: 'SESSION_TIME', data: { hours, minutes, seconds, totalSeconds: hours * 3600 + minutes * 60 + seconds } };
  }

  if (line.includes('You are now away from keyboard')) return { category: 'system', type: 'AFK_ON', data: {} };
  if (line.includes('You are no longer away from keyboard')) return { category: 'system', type: 'AFK_OFF', data: {} };
  if (line.includes('Robot forces have launched an attack')) return { category: 'system', type: 'ROBOT_ATTACK', data: {} };
  if (line.includes('creature is in a condition where it cannot be damaged')) return { category: 'system', type: 'CREATURE_IMMUNE', data: {} };

  return null;
}

// Main parser
function parseLine(line: string): ParsedEvent | null {
  const timestamp = extractTimestamp(line);

  // Try globals channel first
  if (isGlobalsMessage(line)) {
    const globalEvent = parseGlobalEvent(line);
    if (globalEvent) return { timestamp, raw: line, ...globalEvent } as ParsedEvent;
  }

  // Skip non-system messages
  if (!isSystemMessage(line)) return null;

  // Try each parser in priority order
  const parsers = [
    parseCombatEvent, parseDeathEvent, parseLootEvent, parseSkillEvent,
    parseMiningEvent, parseHealingEvent, parseEffectEvent, parseEquipmentEvent,
    parseVehicleEvent, parsePositionEvent, parseSocialEvent, parseTransactionEvent,
    parseSystemEvent,
  ];

  for (const parser of parsers) {
    const result = parser(line);
    if (result) return { timestamp, raw: line, ...result } as ParsedEvent;
  }

  return { timestamp, raw: line, category: 'system', type: 'UNKNOWN', data: {} };
}

// ==================== Log Watching ====================

let pollInterval: NodeJS.Timeout | null = null;

function readNewLines(logPath: string) {
  try {
    const stats = fs.statSync(logPath);
    
    // File was truncated (game restart)
    if (stats.size < lastPosition) {
      console.log('[Main] Log file truncated, resetting position');
      lastPosition = 0;
    }

    // Read new content
    if (stats.size > lastPosition) {
      const buffer = Buffer.alloc(stats.size - lastPosition);
      const fd = fs.openSync(logPath, 'r');
      fs.readSync(fd, buffer, 0, buffer.length, lastPosition);
      fs.closeSync(fd);
      
      lastPosition = stats.size;
      
      const newContent = buffer.toString('utf-8');
      const lines = newContent.split('\n').filter(l => l.trim());
      
      for (const line of lines) {
        const parsed = parseLine(line);
        if (parsed) {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('log-event', parsed);
          }
          // Forward position and loot events to popout window for asteroid tracking
          if (popoutWindow && !popoutWindow.isDestroyed()) {
            if (parsed.category === 'position' || parsed.category === 'loot') {
              console.log('[Main] Forwarding to popout:', parsed.type, parsed.data);
              popoutWindow.webContents.send('asteroid-event', parsed);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[Main] Error reading log:', err);
  }
}

function startWatching(logPath: string) {
  if (logWatcher) {
    logWatcher.close();
  }
  if (pollInterval) {
    clearInterval(pollInterval);
  }

  // Get initial file size
  try {
    const stats = fs.statSync(logPath);
    lastPosition = stats.size;
    console.log('[Main] Starting watch at position:', lastPosition);
  } catch (err) {
    console.error('[Main] Failed to stat log file:', err);
    return;
  }

  // Watch for changes with debounce to catch batched writes
  let debounceTimer: NodeJS.Timeout | null = null;
  
  logWatcher = fs.watch(logPath, (eventType) => {
    if (eventType !== 'change') return;
    
    // Debounce: wait 100ms for any additional writes to complete
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => readNewLines(logPath), 100);
  });

  // Also poll every 500ms in case fs.watch misses changes (like v2 does)
  pollInterval = setInterval(() => readNewLines(logPath), 500);

  console.log('[Main] Log watcher started (with 500ms polling backup)');
}

// ==================== Window Creation ====================

// Helper: platform-specific icon path (build/icon.* expected)
function getIconPath(): string {
  const base = path.join(__dirname, '..', 'build');
  if (process.platform === 'darwin') return path.join(base, 'icon.icns');
  if (process.platform === 'win32') return path.join(base, 'icon.ico');
  return path.join(base, 'icon.png');
}


function createWindow() {
  const iconPath = getIconPath();
  const windowIcon = fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : undefined;

  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    backgroundColor: '#0f172a',
    icon: windowIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Load app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Diagnostic: log the renderer webContents id so we can correlate IPC calls
  try {
    console.log('[Main] Main window webContents id:', mainWindow.webContents.id);
  } catch (e) {
    console.warn('[Main] Failed to log mainWindow.webContents id:', e);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    // Close popout when main window closes
    if (popoutWindow && !popoutWindow.isDestroyed()) {
      popoutWindow.close();
    }
  });
}

// ==================== Popout Window ====================

function createPopoutWindow() {
  if (popoutWindow && !popoutWindow.isDestroyed()) {
    popoutWindow.focus();
    return;
  }

  const iconPath = getIconPath();
  const windowIcon = fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : undefined;

  popoutWindow = new BrowserWindow({
    width: 220,
    height: 200,
    minWidth: 180,
    minHeight: 24, // Allow fully-collapsed top-bar mode (matches UI collapsed height)
    backgroundColor: '#090d13',
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    icon: windowIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Load popout page
  if (process.env.VITE_DEV_SERVER_URL) {
    popoutWindow.loadURL(process.env.VITE_DEV_SERVER_URL + '/popout.html');
    // Open DevTools automatically in development for easier debugging
    popoutWindow.webContents.openDevTools();
  } else {
    popoutWindow.loadFile(path.join(__dirname, '../dist/popout.html'));
  }

  popoutWindow.on('closed', () => {
    popoutWindow = null;
    // Inform main window that popout closed
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('popout:closed');
    }
  });

  console.log('[Main] Popout window created');
  try {
    console.log('[Main] Popout window webContents id:', popoutWindow?.webContents?.id);
  } catch (e) {
    console.warn('[Main] Failed to log popout webContents id:', e);
  }

  // Keep the popout always on top and visible over fullscreen applications/games
  try {
    if (popoutWindow) {
      // Highest z-order level - works on Windows/macOS to appear above fullscreen apps
      popoutWindow.setAlwaysOnTop(true, 'screen-saver');

      // Make visible on all workspaces and over fullscreen (where supported)
      if (typeof popoutWindow.setVisibleOnAllWorkspaces === 'function') {
        // @ts-ignore - Electron typings may differ by version
        popoutWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      }

      // Re-assert topmost on common window events (move/blur/focus)
      popoutWindow.on('move', () => {
        try { popoutWindow.setAlwaysOnTop(true, 'screen-saver'); } catch (e) {}
      });
      popoutWindow.on('blur', () => {
        try { popoutWindow.setAlwaysOnTop(true, 'screen-saver'); } catch (e) {}
      });
      popoutWindow.on('focus', () => {
        try { popoutWindow.setAlwaysOnTop(true, 'screen-saver'); } catch (e) {}
      });
    }
  } catch (err) {
    console.warn('[Main] Popout topmost enforcement failed:', err);
  }
}


// ==================== Asteroid Data Storage ====================

function getAsteroidsPath(): string {
  const dataDir = path.join(app.getPath('userData'), 'asteroids');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'asteroids.json');
}

// ==================== IPC Handlers ====================

ipcMain.handle('log:start', (event: any, manualPath?: string) => {
  // Diagnostic: log the caller's webContents id to help find which window invoked start
  try {
    const senderId = event?.sender?.id || (event?.sender?.webContents?.id ?? 'unknown');
    console.log('[Main] IPC log:start invoked by webContents id:', senderId, 'manualPath:', manualPath);
  } catch (e) {
    console.log('[Main] IPC log:start invoked (failed to read sender id)');
  }

  let logPath = manualPath;
  
  if (!logPath) {
    logPath = detectLogPath();
  }
  
  if (logPath && fs.existsSync(logPath)) {
    startWatching(logPath);
    return { success: true, path: logPath };
  }
  return { success: false, error: manualPath ? 'Specified log file not found' : 'chat.log not found' };
});

ipcMain.handle('log:select-file', async (event: any) => {
  try {
    const senderId = event?.sender?.id || (event?.sender?.webContents?.id ?? 'unknown');
    console.log('[Main] IPC log:select-file invoked by webContents id:', senderId);
  } catch (_) {}

  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'Select Entropia Universe chat.log file',
    properties: ['openFile'],
    filters: [
      { name: 'Log Files', extensions: ['log'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0];
    return { success: true, path: selectedPath };
  }
  
  return { success: false, error: 'No file selected' };
});

ipcMain.handle('log:stop', (event: any) => {
  try {
    const senderId = event?.sender?.id || (event?.sender?.webContents?.id ?? 'unknown');
    console.log('[Main] IPC log:stop invoked by webContents id:', senderId);
    console.log('[Main] Stack trace (caller):', new Error().stack?.split('\n').slice(2,6).join('\n'));
  } catch (_) {}

  if (logWatcher) {
    logWatcher.close();
    logWatcher = null;
    console.log('[Main] Log watcher stopped');
  }

  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    console.log('[Main] Polling interval cleared');
  }

  // Reset read position so future starts resume from beginning
  lastPosition = 0;

  return { success: true };
});

ipcMain.handle('log:status', () => {
  return { 
    watching: logWatcher !== null,
    position: lastPosition,
  };
});

// Diagnostic probe: return detected path and file stats (exists/size)
ipcMain.handle('log:probe', () => {
  const detected = detectLogPath();
  if (!detected) return { path: null, exists: false };

  try {
    const stats = fs.statSync(detected);
    return { path: detected, exists: true, size: stats.size, mtime: stats.mtime };
  } catch (e) {
    return { path: detected, exists: false };
  }
});

// ==================== Equipment Data Loading ====================

function loadEquipmentData(type: string): unknown[] {
  // Try writable userData directory first (for updated data)
  const userDataDir = getDataDir();
  const userDataPath = path.join(userDataDir, `${type}.json`);

  try {
    if (fs.existsSync(userDataPath)) {
      const content = fs.readFileSync(userDataPath, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data) && data.length > 0) {
        console.log(`[Main] Loaded ${type} from userData (${data.length} items)`);
        return data;
      }
    }
  } catch (err) {
    console.error(`[Main] Failed to load ${type} from userData:`, err);
  }

  // Fallback to bundled data (from ASAR or dev folder)
  const bundledPath = path.join(__dirname, '..', 'data', `${type}.json`);

  try {
    if (fs.existsSync(bundledPath)) {
      const content = fs.readFileSync(bundledPath, 'utf-8');
      const data = JSON.parse(content);
      console.log(`[Main] Loaded ${type} from bundled data (${Array.isArray(data) ? data.length : 0} items)`);
      return Array.isArray(data) ? data : [];
    }
    console.log(`[Main] Equipment file not found: ${bundledPath}`);
    return [];
  } catch (err) {
    console.error(`[Main] Failed to load ${type} from bundled data:`, err);
    return [];
  }
}

ipcMain.handle('equipment:load', (_event: unknown, type: string) => {
  const validTypes = ['weapons', 'amps', 'scopes', 'sights', 'armor-sets', 'armor-enhancers', 'armor-plates'];
  if (!validTypes.includes(type)) {
    return [];
  }
  return loadEquipmentData(type);
});

// ==================== Equipment Database Updater ====================

function getDataDir(): string {
  if (process.env.VITE_DEV_SERVER_URL) {
    // Development: use local data folder
    return path.join(__dirname, '..', 'data');
  } else {
    // Production: use writable userData directory
    const userDataPath = app.getPath('userData');
    const dataDir = path.join(userDataPath, 'equipment-data');

    // Ensure directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    return dataDir;
  }
}

ipcMain.handle('equipment:check-updates', async () => {
  try {
    const dataDir = getDataDir();
    const updateAvailable = await checkForUpdates(dataDir);
    return { success: true, updateAvailable };
  } catch (error) {
    return { success: false, error: String(error), updateAvailable: false };
  }
});

ipcMain.handle('equipment:update', async () => {
  try {
    const dataDir = getDataDir();
    const result = await updateEquipmentDatabase(dataDir, false);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// ==================== Session Storage ====================

const SESSIONS_DIR = 'sessions';

function getSessionsDir(): string {
  const userDataPath = app.getPath('userData');
  const sessionsPath = path.join(userDataPath, SESSIONS_DIR);
  
  if (!fs.existsSync(sessionsPath)) {
    fs.mkdirSync(sessionsPath, { recursive: true });
  }
  
  return sessionsPath;
}

function getSessionPath(sessionId: string): string {
  return path.join(getSessionsDir(), `${sessionId}.json`);
}

ipcMain.handle('session:save', (_event: unknown, session: unknown) => {
  try {
    const sessionObj = session as { id: string };
    const filePath = getSessionPath(sessionObj.id);
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    console.error('[Main] Failed to save session:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('session:load', (_event: unknown, sessionId: string) => {
  try {
    const filePath = getSessionPath(sessionId);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const json = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(json);
  } catch (error) {
    console.error('[Main] Failed to load session:', error);
    return null;
  }
});

ipcMain.handle('session:delete', (_event: unknown, sessionId: string) => {
  try {
    const filePath = getSessionPath(sessionId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return { success: true };
  } catch (error) {
    console.error('[Main] Failed to delete session:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('session:list', () => {
  try {
    const sessionsDir = getSessionsDir();
    const files = fs.readdirSync(sessionsDir).filter((f: string) => f.endsWith('.json'));
    
    const sessions = files.map((file: string) => {
      const filePath = path.join(sessionsDir, file);
      const json = fs.readFileSync(filePath, 'utf8');
      const session = JSON.parse(json);
      
      return {
        id: session.id,
        name: session.name,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        eventCount: session.events?.length ?? 0,
      };
    });
    
    return sessions.sort((a: { startedAt: string }, b: { startedAt: string }) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  } catch (error) {
    console.error('[Main] Failed to list sessions:', error);
    return [];
  }
});

ipcMain.handle('session:export', (_event: unknown, sessionId: string, exportPath: string) => {
  try {
    const filePath = getSessionPath(sessionId);
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'Session not found' };
    }
    const json = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(exportPath, json, 'utf8');
    return { success: true };
  } catch (error) {
    console.error('[Main] Failed to export session:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('session:import', (_event: unknown, importPath: string) => {
  try {
    if (!fs.existsSync(importPath)) {
      return { success: false, error: 'File not found' };
    }
    const json = fs.readFileSync(importPath, 'utf8');
    const session = JSON.parse(json);
    
    // Generate new ID to avoid conflicts
    session.id = `session-${Date.now()}-imported`;
    
    const filePath = getSessionPath(session.id);
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf8');
    
    return { success: true, session };
  } catch (error) {
    console.error('[Main] Failed to import session:', error);
    return { success: false, error: String(error) };
  }
});

// ==================== Popout IPC ====================

ipcMain.handle('popout:open', () => {
  createPopoutWindow();
  return { success: true };
});

ipcMain.handle('popout:close', () => {
  if (popoutWindow && !popoutWindow.isDestroyed()) {
    popoutWindow.close();
  }
  return { success: true };
});

// Status (one-time handler)
ipcMain.handle('popout:status', () => {
  return { open: popoutWindow !== null && !popoutWindow.isDestroyed() };
});

// Main window sends stats to popout
ipcMain.on('popout:stats', (_event: unknown, stats: unknown) => {
  if (popoutWindow && !popoutWindow.isDestroyed()) {
    popoutWindow.webContents.send('popout:stats-update', stats);
  }
});

// Popout requests stats from main window
ipcMain.on('popout:request-stats', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('popout:stats-requested');
  }
});

// Popout requests session start
ipcMain.on('popout:session-start', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('popout:session-start-requested');
  }
});

// Popout requests session stop
ipcMain.on('popout:session-stop', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('popout:session-stop-requested');
  }
});

// Main window sends session status to popout
ipcMain.on('popout:session-status', (_event: unknown, isActive: boolean) => {
  if (popoutWindow && !popoutWindow.isDestroyed()) {
    popoutWindow.webContents.send('popout:session-status', isActive);
  }
});

// Popout requests session status from main window
ipcMain.on('popout:request-session-status', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('popout:session-status-requested');
  }
});

// ==================== Asteroid IPC ====================

ipcMain.handle('asteroid:save', (_event: unknown, asteroids: unknown[]) => {
  try {
    const filePath = getAsteroidsPath();
    fs.writeFileSync(filePath, JSON.stringify(asteroids, null, 2), 'utf8');
    console.log('[Main] Asteroids saved:', asteroids.length);
    return { success: true };
  } catch (error) {
    console.error('[Main] Failed to save asteroids:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('asteroid:load', () => {
  try {
    const filePath = getAsteroidsPath();
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[Main] Failed to load asteroids:', error);
    return [];
  }
});

// ==================== Auto-Updater ====================

let autoUpdater: any;
let updaterLog: any;

try {
  // Require at runtime and handle package shape differences
  const _updater = require('electron-updater');
  autoUpdater = _updater && (_updater.autoUpdater || _updater);
  updaterLog = require('electron-log');
  if (updaterLog && updaterLog.transports?.file) updaterLog.transports.file.level = 'info';
  if (autoUpdater && updaterLog) autoUpdater.logger = updaterLog;
  // auto download updates (change to false if you want to prompt to download)
  if (autoUpdater) autoUpdater.autoDownload = true;
  if (autoUpdater) autoUpdater.allowPrerelease = false;
} catch (err: unknown) {
  // If packages are not installed in dev, provide no-op fallbacks to avoid crashing the build/runtime
  const msg = err && typeof err === 'object' && 'message' in err ? (err as any).message : String(err);
  console.warn('[Main] electron-updater or electron-log not available; auto-update disabled', msg);
  updaterLog = { info: () => {}, error: () => {}, warn: () => {} };
  autoUpdater = {
    on: (_: any) => {},
    checkForUpdates: async () => ({}),
    checkForUpdatesAndNotify: async () => ({}),
    quitAndInstall: () => {},
    autoDownload: false,
    allowPrerelease: false,
  };
}

function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    updaterLog.info('[AutoUpdater] Checking for update...');
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update:checking');
  });

  autoUpdater.on('update-available', (info: any) => {
    updaterLog.info('[AutoUpdater] Update available:', info?.version);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update:available', info);
  });

  autoUpdater.on('update-not-available', (info: any) => {
    updaterLog.info('[AutoUpdater] Update not available');
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update:not-available');
  });

  autoUpdater.on('error', (err: any) => {
    updaterLog.error('[AutoUpdater] Error:', err);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update:error', String(err));
  });

  autoUpdater.on('download-progress', (progress: any) => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update:progress', progress);
  });

  autoUpdater.on('update-downloaded', (info: any) => {
    updaterLog.info('[AutoUpdater] Update downloaded');
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update:downloaded', info);
  });
}

// Expose IPC for manual update actions
ipcMain.handle('update:check', async () => {
  try {
    await autoUpdater.checkForUpdates();
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('update:install', () => {
  try {
    autoUpdater.quitAndInstall();
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

// ==================== App Lifecycle ====================

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    const icns = getIconPath();
    if (fs.existsSync(icns)) {
      try {
        // app.dock.setIcon accepts nativeImage or path
        app.dock.setIcon(icns);
        console.log('[Main] Dock icon set:', icns);
      } catch (e) {
        console.warn('[Main] Failed to set dock icon:', e);
      }
    }
  }

  createWindow();

  // Initialize equipment database if needed
  try {
    const dataDir = getDataDir();
    if (needsInitialization(dataDir)) {
      console.log('[Main] Equipment data missing or empty, fetching from API...');
      updateEquipmentDatabase(dataDir, true).then((result) => {
        console.log('[Main] Equipment database initialized:', result);
      }).catch((err) => {
        console.error('[Main] Failed to initialize equipment database:', err);
      });
    } else {
      console.log('[Main] Equipment database already initialized');
    }
  } catch (e) {
    console.warn('[Main] Equipment database initialization check failed:', e);
  }

  // Initialize and check for updates
  try {
    setupAutoUpdater();
    // Check for updates and notify (downloads automatically by default)
    autoUpdater.checkForUpdatesAndNotify();
  } catch (e) {
    console.warn('[Main] AutoUpdater setup failed:', e);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (logWatcher) {
    logWatcher.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
