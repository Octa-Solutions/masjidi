import { MasjidiAlAdhanAPIPrayerTimesStrategy } from "@/core/MasjidiPrayerTimesStrategies/MasjidiAlAdhanAPIPrayerTimesStrategy";
import { MasjidiTableAPIPrayerTimesStrategy } from "@/core/MasjidiPrayerTimesStrategies/MasjidiTableAPIPrayerTimesStrategy";
import { WebGlobalAudioPool } from "@/core/utils/audio/WebGlobalAudioPool";
import { CachedFetcher } from "@/core/utils/fetch/CachedFetcher";
import { DomFetcher } from "@/core/utils/fetch/DomFetcher";
import { SavedFetcher } from "@/core/utils/fetch/SavedFetcher";
import {
  IndexedDBConfig,
  IndexedDBStorageAPI,
} from "@/core/utils/storage/IndexedDBStorageAPI";
import { NativeStorageAPI } from "@/core/utils/storage/NativeStorageAPI";
import { NoopStorageAPI } from "@/core/utils/storage/NoopStorageAPI";

// ! ||--------------------------------------------------------------------------------||
// ! ||                                 Fetch Providers                                ||
// ! ||--------------------------------------------------------------------------------||

export const provideDomFetcher = (
  ...params: ConstructorParameters<typeof DomFetcher>
) => new DomFetcher(...params);

export const provideCachedFetcher = (
  ...params: ConstructorParameters<typeof CachedFetcher>
) => new CachedFetcher(...params);

export const provideSavedFetcher = (
  ...params: ConstructorParameters<typeof SavedFetcher>
) => new SavedFetcher(...params);

// ! ||--------------------------------------------------------------------------------||
// ! ||                                Storage Providers                               ||
// ! ||--------------------------------------------------------------------------------||

export const provideNativeStorage = (storage: Storage) =>
  new NativeStorageAPI(storage);

export const provideLocalStorageStorage = () =>
  provideNativeStorage(localStorage);

export const provideSessionStorageStorage = () =>
  provideNativeStorage(sessionStorage);

export const provideNoopStorage = () => new NoopStorageAPI();

export const provideIndexedDBStorage = (config: IndexedDBConfig) =>
  new IndexedDBStorageAPI(config);

// ! ||--------------------------------------------------------------------------------||
// ! ||                        Prayer Times Strategies Providers                       ||
// ! ||--------------------------------------------------------------------------------||

export const provideMasjidiAlAdhanAPIPrayerTimesStrategy = (
  ...params: ConstructorParameters<typeof MasjidiAlAdhanAPIPrayerTimesStrategy>
) => new MasjidiAlAdhanAPIPrayerTimesStrategy(...params);

export const provideMasjidiTableAPIPrayerTimesStrategy = (
  ...params: ConstructorParameters<typeof MasjidiTableAPIPrayerTimesStrategy>
) => new MasjidiTableAPIPrayerTimesStrategy(...params);

// ! ||--------------------------------------------------------------------------------||
// ! ||                                Audio Providers                                 ||
// ! ||--------------------------------------------------------------------------------||

export const provideWebGlobalAudioPool = () => new WebGlobalAudioPool();
