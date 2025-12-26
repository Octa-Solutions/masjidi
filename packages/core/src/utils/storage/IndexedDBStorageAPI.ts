import { StorageAPI, StorageAPIItem } from "@/utils/storage/StorageAPI";

export interface IndexedDBConfig {
  dbName: string;
  storeName: string;
  version?: number;
}

export class IndexedDBStorageAPI extends StorageAPI {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(private config: IndexedDBConfig) {
    super();
  }

  private async ensureInit(): Promise<void> {
    if (this.db) return;
    if (!this.initPromise) {
      this.initPromise = this.openDB();
    }
    await this.initPromise;
  }

  private openDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(
        this.config.dbName,
        this.config.version || 1,
      );

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          db.createObjectStore(this.config.storeName);
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  async getAll<T extends Record<string, StorageAPIItem>>(
    keys: (keyof T)[],
  ): Promise<{ [P in keyof T]: T[P] | undefined }> {
    await this.ensureInit();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not initialized"));

      const transaction = this.db.transaction(
        [this.config.storeName],
        "readonly",
      );
      const store = transaction.objectStore(this.config.storeName);
      const results: Partial<T> = {};
      let completed = 0;

      if (keys.length === 0) {
        resolve(results as { [P in keyof T]: T[P] | undefined });
        return;
      }

      keys.forEach((key) => {
        const request = store.get(key as string);
        request.onsuccess = () => {
          results[key] = request.result;
          completed++;
          if (completed === keys.length) {
            resolve(results as { [P in keyof T]: T[P] | undefined });
          }
        };
        request.onerror = () => {
          // If one fails, we could reject or just treat as undefined.
          // Treating as undefined/failure for that key.
          completed++;
          if (completed === keys.length) {
            resolve(results as { [P in keyof T]: T[P] | undefined });
          }
        };
      });
    });
  }

  async setAll<T extends Record<string, StorageAPIItem>>(
    records: T,
  ): Promise<void> {
    await this.ensureInit();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not initialized"));

      const transaction = this.db.transaction(
        [this.config.storeName],
        "readwrite",
      );
      const store = transaction.objectStore(this.config.storeName);

      Object.entries(records).forEach(([key, value]) => {
        store.put(value, key);
      });

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = (event) => {
        reject((event.target as IDBTransaction).error);
      };
    });
  }

  async removeAll(keys: string[]): Promise<void> {
    await this.ensureInit();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not initialized"));

      const transaction = this.db.transaction(
        [this.config.storeName],
        "readwrite",
      );
      const store = transaction.objectStore(this.config.storeName);

      keys.forEach((key) => {
        store.delete(key);
      });

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = (event) => {
        reject((event.target as IDBTransaction).error);
      };
    });
  }
}
