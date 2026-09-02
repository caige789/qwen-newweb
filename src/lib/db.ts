/**
 * db.ts —— IndexedDB 统一封装（单机版数据层标准）
 * 业务代码不直接碰 IndexedDB；将来升级联网版，只改 api.ts。
 */

export interface StoredLetter {
  id: string;
  text: string;
  createdAt: number;
  openAt: number;
}

export interface StoredConstellation {
  id: string;
  name: string;
  color: string;
  pts: { x: number; y: number }[];
  edges: [number, number][];
  createdAt: number;
}

export interface StoredFortune {
  id: string;
  sign: string;
  poem: string;
  good: string;
  avoid: string;
  light: number;
  drawnAt: number;
}

export interface StoredSeed {
  id: string;
  kind: string;
  payload: unknown;
  updatedAt: number;
}

export interface StoredEnding {
  /** 结局标题作为 id，天然去重 */
  id: string;
  title: string;
  hue: string;
  unlockedAt: number;
}

export interface StoredDiscovery {
  /** 场景 key 作为 id，天然去重 */
  id: string;
  scene: string;
  visitedAt: number;
}

const DB_NAME = "guangyu";
const DB_VERSION = 3;

const STORES = ["letter", "constellation", "fortune", "seed", "story", "discovery"] as const;
export type StoreName = (typeof STORES)[number];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const s of STORES) {
        if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("open failed"));
  });
  return dbPromise;
}

export async function dbGet<T>(store: StoreName, key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readonly").objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function dbPut<T>(store: StoreName, value: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readwrite").objectStore(store).put(value as unknown as object);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function dbDelete(store: StoreName, key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readwrite").objectStore(store).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function dbAll<T>(store: StoreName): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readonly").objectStore(store).getAll();
    req.onsuccess = () => resolve((req.result as T[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

export async function dbClear(store: StoreName): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readwrite").objectStore(store).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
