import { StorageAPI, StorageAPIItem } from "@/utils/storage/StorageAPI";

/**
 * A no-operation storage implementation.
 * This is useful for testing or when storage is disabled.
 * It does not persist any data and always returns `undefined` for retrievals.
 */
export class NoopStorageAPI extends StorageAPI {
  /**
   * Retrieves multiple items from storage (always returns undefined).
   *
   * @param keys - The keys of the items to retrieve.
   * @returns A promise that resolves to an object with undefined values.
   */
  async getAll<T extends Record<string, StorageAPIItem>>(
    keys: (keyof T)[],
  ): Promise<{
    [P in keyof T]: T[P] | undefined;
  }> {
    // @ts-ignore
    return Object.fromEntries(keys.map((key) => [key, undefined] as const));
  }

  /**
   * Sets multiple items in storage (does nothing).
   *
   * @param records - An object containing the items to set.
   * @returns A promise that resolves immediately.
   */
  async setAll<T extends Record<string, StorageAPIItem>>(
    records: T,
  ): Promise<void> {}

  /**
   * Removes multiple items from storage (does nothing).
   *
   * @param keys - The keys of the items to remove.
   * @returns A promise that resolves immediately.
   */
  async removeAll(keys: string[]): Promise<void> {}
}
