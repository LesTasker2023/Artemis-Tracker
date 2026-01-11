/**
 * Equipment Database Updater
 * Checks and updates equipment data from EntropiaNexus API
 */

import fs from 'fs';
import path from 'path';
import https from 'https';

const API_BASE = 'https://api.entropianexus.com';
const ENDPOINTS = {
  weapons: '/weapons',
  amps: '/amps',
  scopes: '/weaponvisionattachments?type=scope',
  sights: '/weaponvisionattachments?type=sight',
  // armor: '/armor', // Uncomment when armor is re-enabled
} as const;

interface UpdateResult {
  updated: string[];
  failed: string[];
  skipped: string[];
  total: number;
}

/**
 * Fetch data from API endpoint
 */
async function fetchFromAPI(endpoint: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    https.get(`${API_BASE}${endpoint}`, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(Array.isArray(parsed) ? parsed : []);
        } catch (err) {
          reject(new Error(`Failed to parse JSON: ${err}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Compare two data sets to see if update is needed
 */
function needsUpdate(localData: unknown[], remoteData: unknown[]): boolean {
  if (localData.length !== remoteData.length) {
    return true;
  }

  // Simple hash comparison - if JSON serialization differs, update
  const localHash = JSON.stringify(localData);
  const remoteHash = JSON.stringify(remoteData);

  return localHash !== remoteHash;
}

/**
 * Check if all equipment files exist
 */
function checkFilesExist(dataDir: string): boolean {
  const requiredFiles = Object.keys(ENDPOINTS).map(key => `${key}.json`);
  return requiredFiles.every(file =>
    fs.existsSync(path.join(dataDir, file))
  );
}

/**
 * Update equipment database from API
 */
export async function updateEquipmentDatabase(
  dataDir: string,
  forceUpdate = false
): Promise<UpdateResult> {
  const result: UpdateResult = {
    updated: [],
    failed: [],
    skipped: [],
    total: Object.keys(ENDPOINTS).length,
  };

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Check if files exist
  const filesExist = checkFilesExist(dataDir);

  for (const [name, endpoint] of Object.entries(ENDPOINTS)) {
    const filePath = path.join(dataDir, `${name}.json`);

    try {
      // Fetch from API
      const remoteData = await fetchFromAPI(endpoint);

      // Load local data if exists
      let shouldUpdate = forceUpdate || !filesExist;

      if (!shouldUpdate && fs.existsSync(filePath)) {
        try {
          const localData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          shouldUpdate = needsUpdate(localData, remoteData);
        } catch {
          // If local file is corrupted, update
          shouldUpdate = true;
        }
      }

      if (shouldUpdate) {
        // Write updated data
        fs.writeFileSync(
          filePath,
          JSON.stringify(remoteData, null, 2),
          'utf-8'
        );
        result.updated.push(name);
      } else {
        result.skipped.push(name);
      }
    } catch (err) {
      result.failed.push(name);
      console.error(`[Updater] Failed to update ${name}:`, err);
    }
  }

  return result;
}

/**
 * Check if update is available (without downloading)
 */
export async function checkForUpdates(dataDir: string): Promise<boolean> {
  if (!checkFilesExist(dataDir)) {
    return true; // Files missing, update needed
  }

  try {
    // Check first endpoint as a sample
    const [name, endpoint] = Object.entries(ENDPOINTS)[0];
    const filePath = path.join(dataDir, `${name}.json`);

    const remoteData = await fetchFromAPI(endpoint);
    const localData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    return needsUpdate(localData, remoteData);
  } catch {
    return true; // On error, assume update needed
  }
}
