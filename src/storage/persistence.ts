import { PlayerSaveData, UserSettings } from '../types/game';

const STORAGE_KEY = 'qionghua_xinghai_save_v1';
const DB_NAME = 'qionghua_xinghai_db';
const STORE_NAME = 'player_state';
const RECORD_KEY = 'main';

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'night',
  bgmEnabled: true,
  sfxEnabled: true,
  vibrateEnabled: true,
  hasSeenWelcome: false,
};

export const DEFAULT_SAVE_DATA: PlayerSaveData = {
  highestUnlockedLevel: 1,
  levels: {},
  unlockedPostcards: [],
  totalPlaySeconds: 0,
  settings: { ...DEFAULT_SETTINGS },
};

function openDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function mergeSaveData(raw: Partial<PlayerSaveData> | null | undefined): PlayerSaveData {
  if (!raw || typeof raw !== 'object') {
    return {
      ...DEFAULT_SAVE_DATA,
      settings: { ...DEFAULT_SETTINGS },
    };
  }
  return {
    highestUnlockedLevel: Math.max(1, raw.highestUnlockedLevel ?? 1),
    levels: raw.levels ?? {},
    unlockedPostcards: Array.isArray(raw.unlockedPostcards) ? raw.unlockedPostcards : [],
    totalPlaySeconds: raw.totalPlaySeconds ?? 0,
    settings: {
      ...DEFAULT_SETTINGS,
      ...(raw.settings ?? {}),
    },
  };
}

export function loadSaveSync(): PlayerSaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return mergeSaveData(null);
    return mergeSaveData(JSON.parse(raw) as Partial<PlayerSaveData>);
  } catch {
    return mergeSaveData(null);
  }
}

export async function loadSaveAsync(): Promise<PlayerSaveData> {
  const localData = loadSaveSync();
  const db = await openDB();
  if (!db) return localData;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(RECORD_KEY);
      req.onsuccess = () => {
        if (req.result) {
          resolve(mergeSaveData(req.result as Partial<PlayerSaveData>));
        } else {
          resolve(localData);
        }
      };
      req.onerror = () => resolve(localData);
    } catch {
      resolve(localData);
    }
  });
}

export async function persistSave(data: PlayerSaveData): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors in restricted webviews
  }

  const db = await openDB();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(data, RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}
