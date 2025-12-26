/**
 * Supported types for storage items.
 */
export type StorageAPIItem =
  | null
  | boolean
  | number
  | string
  | StorageAPIItem[]
  | Record<string, StorageAPIItem[]>;

// TODO: Improve code readability and cleanse dirtiness

/**
 * An abstract base class for storage implementations.
 * It defines the interface for getting, setting, and removing items from storage.
 */
export abstract class StorageAPI {
  /**
   * Retrieves multiple items from storage.
   *
   * @param keys - The keys of the items to retrieve.
   * @returns A promise that resolves to an object containing the retrieved items.
   */
  abstract getAll<T extends Record<string, StorageAPIItem>>(
    keys: (keyof T)[],
  ): Promise<{
    [P in keyof T]: T[P] | undefined;
  }>;

  /**
   * Sets multiple items in storage.
   *
   * @param records - An object containing the items to set.
   * @returns A promise that resolves when the items are set.
   */
  abstract setAll<T extends Record<string, StorageAPIItem>>(
    records: T,
  ): Promise<void>;

  /**
   * Removes multiple items from storage.
   *
   * @param keys - The keys of the items to remove.
   * @returns A promise that resolves when the items are removed.
   */
  abstract removeAll(keys: string[]): Promise<void>;

  /**
   * Retrieves a single item from storage.
   *
   * @param key - The key of the item to retrieve.
   * @returns A promise that resolves to the retrieved item, or undefined if not found.
   */
  async get<T extends StorageAPIItem = StorageAPIItem>(key: string) {
    return (await this.getAll<{ [_ in typeof key]: T }>([key]))[key];
  }

  /**
   * Sets a single item in storage.
   *
   * @param key - The key of the item to set.
   * @param value - The value to set.
   * @returns A promise that resolves when the item is set.
   */
  async set<T extends StorageAPIItem = StorageAPIItem>(key: string, value: T) {
    await this.setAll({ [key]: value });
  }

  /**
   * Removes a single item from storage.
   *
   * @param key - The key of the item to remove.
   * @returns A promise that resolves when the item is removed.
   */
  async remove(key: string) {
    await this.removeAll([key]);
  }
}
