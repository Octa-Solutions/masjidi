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

export class NativeStorageAPI extends StorageAPI {
  constructor(readonly nativeStorage: Storage) {
    super();
  }

  async getAll<T extends Record<string, StorageAPIItem>>(
    keys: (keyof T)[]
  ): Promise<{ [P in keyof T]: T[P] | undefined }> {
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
export class NoopStorageAPI extends StorageAPI {
  async getAll<T extends Record<string, StorageAPIItem>>(
    keys: (keyof T)[]
  ): Promise<{ [P in keyof T]: T[P] | undefined }> {
    // @ts-ignore
    return Object.fromEntries(keys.map((key) => [key, undefined] as const));
  }

  async setAll<T extends Record<string, StorageAPIItem>>(
    records: T
  ): Promise<void> {}

  async removeAll(keys: string[]): Promise<void> {}
}
