import { WebGlobalAudioPool } from "@/utils/audio/WebGlobalAudioPool";
import { CachedFetcher } from "@/utils/fetch/CachedFetcher";
import { DomFetcher } from "@/utils/fetch/DomFetcher";
import { SavedFetcher } from "@/utils/fetch/SavedFetcher";
import {
  IndexedDBConfig,
  IndexedDBStorageAPI,
} from "@/utils/storage/IndexedDBStorageAPI";
import { NativeStorageAPI } from "@/utils/storage/NativeStorageAPI";
import { NoopStorageAPI } from "@/utils/storage/NoopStorageAPI";

// ! ||--------------------------------------------------------------------------------||
// ! ||                                 Fetch Providers                                ||
// ! ||--------------------------------------------------------------------------------||

/**
 * Provides a new instance of `DomFetcher`.
 *
 * @param params - The constructor parameters for `DomFetcher`.
 * @returns A new `DomFetcher` instance.
 */
export const provideDomFetcher = (
  ...params: ConstructorParameters<typeof DomFetcher>
) => new DomFetcher(...params);

/**
 * Provides a new instance of `CachedFetcher`.
 *
 * @param params - The constructor parameters for `CachedFetcher`.
 * @returns A new `CachedFetcher` instance.
 */
export const provideCachedFetcher = (
  ...params: ConstructorParameters<typeof CachedFetcher>
) => new CachedFetcher(...params);

/**
 * Provides a new instance of `SavedFetcher`.
 *
 * @param params - The constructor parameters for `SavedFetcher`.
 * @returns A new `SavedFetcher` instance.
 */
export const provideSavedFetcher = (
  ...params: ConstructorParameters<typeof SavedFetcher>
) => new SavedFetcher(...params);

// ! ||--------------------------------------------------------------------------------||
// ! ||                                Storage Providers                               ||
// ! ||--------------------------------------------------------------------------------||

/**
 * Provides a new instance of `NativeStorageAPI` using the specified storage mechanism.
 *
 * @param storage - The storage mechanism to use (e.g., localStorage, sessionStorage).
 * @returns A new `NativeStorageAPI` instance.
 */
export const provideNativeStorage = (storage: Storage) =>
  new NativeStorageAPI(storage);

/**
 * Provides a new instance of `NativeStorageAPI` using `localStorage`.
 *
 * @returns A new `NativeStorageAPI` instance backed by `localStorage`.
 */
export const provideLocalStorageStorage = () =>
  provideNativeStorage(localStorage);

/**
 * Provides a new instance of `NativeStorageAPI` using `sessionStorage`.
 *
 * @returns A new `NativeStorageAPI` instance backed by `sessionStorage`.
 */
export const provideSessionStorageStorage = () =>
  provideNativeStorage(sessionStorage);

/**
 * Provides a new instance of `NoopStorageAPI`.
 * This storage implementation does nothing and is useful for testing or when storage is disabled.
 *
 * @returns A new `NoopStorageAPI` instance.
 */
export const provideNoopStorage = () => new NoopStorageAPI();

/**
 * Provides a new instance of `IndexedDBStorageAPI`.
 *
 * @param config - The configuration for the IndexedDB.
 * @returns A new `IndexedDBStorageAPI` instance.
 */
export const provideIndexedDBStorage = (config: IndexedDBConfig) =>
  new IndexedDBStorageAPI(config);

// ! ||--------------------------------------------------------------------------------||
// ! ||                                Audio Providers                                 ||
// ! ||--------------------------------------------------------------------------------||

/**
 * Provides a new instance of `WebGlobalAudioPool`.
 *
 * @returns A new `WebGlobalAudioPool` instance.
 */
export const provideWebGlobalAudioPool = () => new WebGlobalAudioPool();
