import { StorageAPI, StorageAPIItem } from "@/utils/storage/StorageAPI";

/**
 * A storage implementation that uses a native `Storage` object (e.g., `localStorage` or `sessionStorage`).
 */
export class NativeStorageAPI extends StorageAPI {
  /**
   * Creates a new instance of `NativeStorageAPI`.
   *
   * @param nativeStorage - The native storage object to use.
   */
  constructor(readonly nativeStorage: Storage) {
    super();
  }

  /**
   * Retrieves multiple items from storage.
   *
   * @param keys - The keys of the items to retrieve.
   * @returns A promise that resolves to an object containing the retrieved items.
   */
  async getAll<T extends Record<string, StorageAPIItem>>(
    keys: (keyof T)[],
  ): Promise<{
    [P in keyof T]: T[P] | undefined;
  }> {
    // @ts-ignore
    return Object.fromEntries(
      keys.map((key) => {
        const raw = this.nativeStorage.getItem(key as string);
        const value = raw === null ? undefined : JSON.parse(raw);
        return [key, value];
      }),
    );
  }

  /**
   * Sets multiple items in storage.
   *
   * @param records - An object containing the items to set.
   * @returns A promise that resolves when the items are set.
   */
  async setAll<T extends Record<string, StorageAPIItem>>(
    records: T,
  ): Promise<void> {
    for (const key in records) {
      this.nativeStorage.setItem(key, JSON.stringify(records[key]));
    }
  }

  /**
   * Removes multiple items from storage.
   *
   * @param keys - The keys of the items to remove.
   * @returns A promise that resolves when the items are removed.
   */
  async removeAll(keys: string[]): Promise<void> {
    for (const key of keys) {
      this.nativeStorage.removeItem(key);
    }
  }
}
