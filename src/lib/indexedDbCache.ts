/**
 * IndexedDB Cache Utility for Holospin Studio.
 * Provides durable offline/fallback storage for user-generated presets and media references
 * when the server filesystem or native Capacitor storage is unavailable.
 */

const DB_NAME = "HolospinCacheDB";
const DB_VERSION = 1;

export interface CachedPreset {
  id: string;
  data: any;
  updatedAt: number;
}

export interface CachedMedia {
  key: string;
  name: string;
  type: string;
  data: Blob | string; // Blob for modern browsers, base64/dataURL as fallback
  updatedAt: number;
}

/**
 * Initializes and returns a promise for the IndexedDB instance.
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB open error:", request.error);
      reject(request.error || new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = (event) => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Store for presets
      if (!db.objectStoreNames.contains("presets")) {
        db.createObjectStore("presets", { keyPath: "id" });
      }

      // Store for media files (logos, custom patterns, animations)
      if (!db.objectStoreNames.contains("media")) {
        db.createObjectStore("media", { keyPath: "key" });
      }
    };
  });
}

/**
 * Saves a preset slot to IndexedDB.
 */
export async function savePresetToDB(id: string, data: any): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("presets", "readwrite");
      const store = transaction.objectStore("presets");
      
      const record: CachedPreset = {
        id,
        data,
        updatedAt: Date.now(),
      };

      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error("Failed to save preset"));
    });
  } catch (err) {
    console.error("Error saving preset to IndexedDB:", err);
    throw err;
  }
}

/**
 * Loads a single preset slot from IndexedDB.
 */
export async function loadPresetFromDB(id: string): Promise<any | null> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("presets", "readonly");
      const store = transaction.objectStore("presets");
      const request = store.get(id);

      request.onsuccess = () => {
        const record = request.result as CachedPreset | undefined;
        resolve(record ? record.data : null);
      };
      request.onerror = () => reject(request.error || new Error("Failed to load preset"));
    });
  } catch (err) {
    console.error("Error loading preset from IndexedDB:", err);
    return null;
  }
}

/**
 * Loads all presets stored in IndexedDB.
 */
export async function loadAllPresetsFromDB(): Promise<Record<string, any>> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("presets", "readonly");
      const store = transaction.objectStore("presets");
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as CachedPreset[];
        const recordMap: Record<string, any> = {};
        results.forEach((item) => {
          recordMap[item.id] = item.data;
        });
        resolve(recordMap);
      };
      request.onerror = () => reject(request.error || new Error("Failed to load all presets"));
    });
  } catch (err) {
    console.error("Error loading all presets from IndexedDB:", err);
    return {};
  }
}

/**
 * Saves the entire presets map to IndexedDB.
 */
export async function saveAllPresetsToDB(presets: Record<string, any>): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction("presets", "readwrite");
    const store = transaction.objectStore("presets");

    const promises = Object.entries(presets).map(([id, data]) => {
      return new Promise<void>((resolve, reject) => {
        const record: CachedPreset = {
          id,
          data,
          updatedAt: Date.now(),
        };
        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error || new Error(`Failed to save preset ${id}`));
      });
    });

    await Promise.all(promises);
  } catch (err) {
    console.error("Error saving all presets to IndexedDB:", err);
    throw err;
  }
}

/**
 * Clears all presets from IndexedDB.
 */
export async function clearAllPresetsInDB(): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("presets", "readwrite");
      const store = transaction.objectStore("presets");
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error("Failed to clear presets"));
    });
  } catch (err) {
    console.error("Error clearing presets from IndexedDB:", err);
    throw err;
  }
}

/**
 * Saves a custom media reference (e.g. uploaded logo/image) to IndexedDB.
 * Can take a File, Blob, or a data URL (base64 string).
 */
export async function saveMediaToDB(key: string, fileOrBlob: File | Blob | string, name: string): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("media", "readwrite");
      const store = transaction.objectStore("media");

      const record: CachedMedia = {
        key,
        name,
        type: typeof fileOrBlob === "string" ? "dataUrl" : fileOrBlob.type,
        data: fileOrBlob,
        updatedAt: Date.now(),
      };

      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error("Failed to save media"));
    });
  } catch (err) {
    console.error("Error saving media to IndexedDB:", err);
    throw err;
  }
}

/**
 * Loads cached media from IndexedDB. If a Blob is retrieved,
 * it returns a temporary local object URL (using URL.createObjectURL).
 */
export async function loadMediaFromDB(key: string): Promise<{ url: string; name: string; type: string } | null> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("media", "readonly");
      const store = transaction.objectStore("media");
      const request = store.get(key);

      request.onsuccess = () => {
        const record = request.result as CachedMedia | undefined;
        if (!record) {
          resolve(null);
          return;
        }

        let url = "";
        if (record.data instanceof Blob) {
          try {
            url = URL.createObjectURL(record.data);
          } catch (e) {
            console.error("Failed to create object URL for cached blob:", e);
          }
        } else if (typeof record.data === "string") {
          url = record.data;
        }

        if (url) {
          resolve({ url, name: record.name, type: record.type });
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error || new Error("Failed to load media"));
    });
  } catch (err) {
    console.error("Error loading media from IndexedDB:", err);
    return null;
  }
}

/**
 * Loads all cached media objects.
 */
export async function loadAllMediaFromDB(): Promise<Array<{ key: string; url: string; name: string; type: string }>> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("media", "readonly");
      const store = transaction.objectStore("media");
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as CachedMedia[];
        const mediaList: Array<{ key: string; url: string; name: string; type: string }> = [];
        
        results.forEach((record) => {
          let url = "";
          if (record.data instanceof Blob) {
            try {
              url = URL.createObjectURL(record.data);
            } catch (e) {
              console.error(`Failed to create object URL for cached blob ${record.key}:`, e);
            }
          } else if (typeof record.data === "string") {
            url = record.data;
          }

          if (url) {
            mediaList.push({
              key: record.key,
              url,
              name: record.name,
              type: record.type,
            });
          }
        });

        resolve(mediaList);
      };

      request.onerror = () => reject(request.error || new Error("Failed to load all media"));
    });
  } catch (err) {
    console.error("Error loading all media from IndexedDB:", err);
    return [];
  }
}

/**
 * Deletes a media item from IndexedDB.
 */
export async function deleteMediaFromDB(key: string): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("media", "readwrite");
      const store = transaction.objectStore("media");
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error("Failed to delete media"));
    });
  } catch (err) {
    console.error("Error deleting media from IndexedDB:", err);
    throw err;
  }
}

/**
 * Clears all media cache from IndexedDB.
 */
export async function clearAllMediaInDB(): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("media", "readwrite");
      const store = transaction.objectStore("media");
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error("Failed to clear media"));
    });
  } catch (err) {
    console.error("Error clearing media from IndexedDB:", err);
    throw err;
  }
}

/**
 * Prunes media older than the specified number of days (default 30).
 * Returns the count of deleted items.
 */
export async function pruneOldMediaFromDB(days: number = 30): Promise<number> {
  try {
    const db = await initDB();
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("media", "readwrite");
      const store = transaction.objectStore("media");
      const request = store.openCursor();
      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const record = cursor.value as CachedMedia;
          if (record.updatedAt < cutoff) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
      
      request.onerror = () => reject(request.error || new Error("Failed to prune old media"));
    });
  } catch (err) {
    console.error("Error pruning old media from IndexedDB:", err);
    return 0;
  }
}
