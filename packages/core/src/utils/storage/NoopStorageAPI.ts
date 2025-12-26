import { StorageAPI, StorageAPIItem } from "@/utils/storage/StorageAPI";

export class NoopStorageAPI extends StorageAPI {
  async getAll<T extends Record<string, StorageAPIItem>>(
    keys: (keyof T)[],
  ): Promise<{
    [P in keyof T]: T[P] | undefined;
  }> {
    // @ts-ignore
    return Object.fromEntries(keys.map((key) => [key, undefined] as const));
  }

  async setAll<T extends Record<string, StorageAPIItem>>(
    records: T,
  ): Promise<void> {}

  async removeAll(keys: string[]): Promise<void> {}
}
