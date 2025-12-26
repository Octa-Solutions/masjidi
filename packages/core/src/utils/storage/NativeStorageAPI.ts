import { StorageAPI, StorageAPIItem } from "@/utils/storage/StorageAPI";

export class NativeStorageAPI extends StorageAPI {
  constructor(readonly nativeStorage: Storage) {
    super();
  }

  async getAll<T extends Record<string, StorageAPIItem>>(
    keys: (keyof T)[]
  ): Promise<{
    [P in keyof T]: T[P] | undefined;
  }> {
    // @ts-ignore
    return Object.fromEntries(
      keys.map((key) => {
        const raw = this.nativeStorage.getItem(key as string);
        const value = raw === null ? undefined : JSON.parse(raw);
        return [key, value];
      })
    );
  }

  async setAll<T extends Record<string, StorageAPIItem>>(
    records: T
  ): Promise<void> {
    for (const key in records) {
      this.nativeStorage.setItem(key, JSON.stringify(records[key]));
    }
  }

  async removeAll(keys: string[]): Promise<void> {
    for (const key of keys) {
      this.nativeStorage.removeItem(key);
    }
  }
}
