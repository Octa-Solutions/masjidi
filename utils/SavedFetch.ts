import { StorageAPI } from "@/core/utils/StorageAPI";

export class SavedFetch {
  constructor(readonly dependencies: { storage: StorageAPI }) {}

  async fetch(
    key: string,
    {
      input,
      init,
      state = null,
    }: { input: RequestInfo | URL; init?: RequestInit; state?: any }
  ) {
    const dataKey = `@saved-fetch/data/${key}`;
    const stateKey = `@saved-fetch/state/${key}`;

    const { [stateKey]: savedState, [dataKey]: savedData } =
      await this.dependencies.storage.getAll([stateKey, dataKey]);

    const stateString = JSON.stringify(state);
    const isStateChanged = savedState !== stateString;

    if (!isStateChanged && savedData) {
      return savedData;
    }

    try {
      const data = await fetch(input, init).then((e) => e.text());
      await this.dependencies.storage.setAll({
        [dataKey]: data,
        [stateKey]: stateString,
      });

      return data;
    } catch (e) {
      if (savedData === null) throw e;

      console.warn(`Fetch failed for ${key}, using cached data.`, e);

      return savedData;
    }
  }
}

export const provideSavedFetch = (
  ...params: ConstructorParameters<typeof SavedFetch>
) => new SavedFetch(...params);
