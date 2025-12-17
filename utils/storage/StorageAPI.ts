export type StorageAPIItem =
  | null
  | boolean
  | number
  | string
  | StorageAPIItem[]
  | Record<string, StorageAPIItem[]>;

// TODO: Improve code readability and cleanse dirtiness

export abstract class StorageAPI {
  abstract getAll<T extends Record<string, StorageAPIItem>>(
    keys: (keyof T)[]
  ): Promise<{
    [P in keyof T]: T[P] | undefined;
  }>;

  abstract setAll<T extends Record<string, StorageAPIItem>>(
    records: T
  ): Promise<void>;

  abstract removeAll(keys: string[]): Promise<void>;

  async get<T extends StorageAPIItem = StorageAPIItem>(key: string) {
    return (await this.getAll<{ [_ in typeof key]: T }>([key]))[key];
  }

  async set<T extends StorageAPIItem = StorageAPIItem>(key: string, value: T) {
    await this.setAll({ [key]: value });
  }
  async remove(key: string) {
    await this.removeAll([key]);
  }
}
