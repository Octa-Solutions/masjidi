import { MasjidiAlAdhanAPIPrayerTimesStrategy } from "@/MasjidiPrayerTimesStrategies/MasjidiAlAdhanAPIPrayerTimesStrategy";
import { MasjidiTableAPIPrayerTimesStrategy } from "@/MasjidiPrayerTimesStrategies/MasjidiTableAPIPrayerTimesStrategy";

// ! ||--------------------------------------------------------------------------------||
// ! ||                        Prayer Times Strategies Providers                       ||
// ! ||--------------------------------------------------------------------------------||

/**
 * Provides a new instance of `MasjidiAlAdhanAPIPrayerTimesStrategy`.
 *
 * @param params - The constructor parameters for `MasjidiAlAdhanAPIPrayerTimesStrategy`.
 * @returns A new `MasjidiAlAdhanAPIPrayerTimesStrategy` instance.
 */
export const provideMasjidiAlAdhanAPIPrayerTimesStrategy = (
  ...params: ConstructorParameters<typeof MasjidiAlAdhanAPIPrayerTimesStrategy>
) => new MasjidiAlAdhanAPIPrayerTimesStrategy(...params);

/**
 * Provides a new instance of `MasjidiTableAPIPrayerTimesStrategy`.
 *
 * @param params - The constructor parameters for `MasjidiTableAPIPrayerTimesStrategy`.
 * @returns A new `MasjidiTableAPIPrayerTimesStrategy` instance.
 */
export const provideMasjidiTableAPIPrayerTimesStrategy = (
  ...params: ConstructorParameters<typeof MasjidiTableAPIPrayerTimesStrategy>
) => new MasjidiTableAPIPrayerTimesStrategy(...params);
