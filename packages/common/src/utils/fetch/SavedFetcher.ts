import {
  IStringFetcher,
  IStringFetcherOptions,
} from "@/utils/fetch/IStringFetcher";
import { StorageAPI } from "@/utils/storage/StorageAPI";

/**
 * Options for `SavedFetcher` that include a key for storage and optional state for validation.
 */
export interface ISavedStringFetcherOptions extends IStringFetcherOptions {
  /**
   * The unique key to identify the saved data in storage.
   */
  key: string;

  /**
   * Optional state to validate if the cached data is still valid.
   */
  state?: any;
}

/**
 * An interface for a fetcher that supports saving and retrieving data from storage.
 */
export interface ISavedStringFetcher extends IStringFetcher {
  /**
   * Fetches content, potentially using cached data if available and valid.
   *
   * @param options - The options for the fetch request, including storage key and state.
   * @returns A promise that resolves to the fetched string content.
   */
  fetch(options: ISavedStringFetcherOptions): Promise<string>;
}

/**
 * A fetcher implementation that saves fetched data to storage and retrieves it if available and valid.
 * It uses a state comparison to determine if the cached data is stale.
 */
export class SavedFetcher implements ISavedStringFetcher {
  /**
   * Creates a new instance of `SavedFetcher`.
   *
   * @param dependencies - The dependencies required by the fetcher.
   * @param dependencies.fetcher - The underlying fetcher to use for making network requests.
   * @param dependencies.storage - The storage API to use for saving and retrieving data.
   * @param dependencies.formatDataKey - Optional function to format the storage key for data.
   * @param dependencies.formatStateKey - Optional function to format the storage key for state.
   */
  constructor(
    readonly dependencies: {
      readonly fetcher: IStringFetcher;
      readonly storage: StorageAPI;

      readonly formatDataKey?: (key: string) => string;
      readonly formatStateKey?: (key: string) => string;
    },
  ) {}

  /**
   * Fetches content, checking storage first.
   * If valid data exists in storage, it is returned.
   * Otherwise, a network request is made, and the result is saved to storage.
   *
   * @param options - The options for the fetch request.
   * @returns A promise that resolves to the fetched string content.
   */
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
