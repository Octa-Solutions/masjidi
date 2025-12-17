import { StorageAPI } from "@/core/utils/StorageAPI";
import {
  IStringFetcher,
  IStringFetcherOptions,
} from "@/core/utils/fetch/IStringFetcher";

export interface ISavedStringFetcherOptions extends IStringFetcherOptions {
  key: string;
  state?: any;
}

export interface ISavedStringFetcher extends IStringFetcher {
  fetch(options: ISavedStringFetcherOptions): Promise<string>;
}

export class SavedFetcher implements ISavedStringFetcher {
  constructor(
    readonly dependencies: {
      readonly fetcher: IStringFetcher;
      readonly storage: StorageAPI;

      readonly formatDataKey?: (key: string) => string;
      readonly formatStateKey?: (key: string) => string;
    }
  ) {}

  async fetch(options: ISavedStringFetcherOptions): Promise<string> {
    const { key, state = null } = options;

    const dataKeyFormatter =
      this.dependencies.formatDataKey ?? ((key) => `@saved-fetch/data/${key}`);
    const stateKeyFormatter =
      this.dependencies.formatStateKey ??
      ((key) => `@saved-fetch/state/${key}`);

    const dataKey = dataKeyFormatter(key);
    const stateKey = stateKeyFormatter(key);

    const { [stateKey]: savedState, [dataKey]: savedData } =
      await this.dependencies.storage.getAll([stateKey, dataKey]);

    const stateString = JSON.stringify(state);
    const isStateChanged = savedState !== stateString;

    if (!isStateChanged && savedData) {
      return savedData as string;
    }

    try {
      const data = await this.dependencies.fetcher.fetch(options);
      await this.dependencies.storage.setAll({
        [dataKey]: data,
        [stateKey]: stateString,
      });

      return data;
    } catch (e) {
      if (savedData === null) throw e;

      console.warn(`Fetch failed for ${key}, using cached data.`, e);

      return savedData as string;
    }
  }
}
