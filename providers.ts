import { MasjidiAlAdhanAPIPrayerTimesStrategy } from "@/core/MasjidiPrayerTimesStrategies/MasjidiAlAdhanAPIPrayerTimesStrategy";
import { MasjidiTableAPIPrayerTimesStrategy } from "@/core/MasjidiPrayerTimesStrategies/MasjidiTableAPIPrayerTimesStrategy";
import { CachedFetcher } from "@/core/utils/fetch/CachedFetcher";
import { DomFetcher } from "@/core/utils/fetch/DomFetcher";
import { SavedFetcher } from "@/core/utils/fetch/SavedFetcher";
import { NativeStorageAPI } from "@/core/utils/storage/NativeStorageAPI";
import { NoopStorageAPI } from "@/core/utils/storage/NoopStorageAPI";
import { StorageAPI } from "@/core/utils/storage/StorageAPI";

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

export const provideNativeStorage = (storage: Storage): StorageAPI =>
  new NativeStorageAPI(storage);

export const provideLocalStorageStorage = (): StorageAPI =>
  provideNativeStorage(localStorage);

export const provideSessionStorageStorage = (): StorageAPI =>
  provideNativeStorage(sessionStorage);

export const provideNoopStorage = (): StorageAPI => new NoopStorageAPI();

// ! ||--------------------------------------------------------------------------------||
// ! ||                        Prayer Times Strategies Providers                       ||
// ! ||--------------------------------------------------------------------------------||

export const provideMasjidiAlAdhanAPIPrayerTimesStrategy = (
  ...params: ConstructorParameters<typeof MasjidiAlAdhanAPIPrayerTimesStrategy>
) => new MasjidiAlAdhanAPIPrayerTimesStrategy(...params);

export const provideMasjidiTableAPIPrayerTimesStrategy = (
  ...params: ConstructorParameters<typeof MasjidiTableAPIPrayerTimesStrategy>
) => new MasjidiTableAPIPrayerTimesStrategy(...params);
