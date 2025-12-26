import { MasjidiAlAdhanAPIPrayerTimesStrategy } from "@/MasjidiPrayerTimesStrategies/MasjidiAlAdhanAPIPrayerTimesStrategy";
import { MasjidiTableAPIPrayerTimesStrategy } from "@/MasjidiPrayerTimesStrategies/MasjidiTableAPIPrayerTimesStrategy";

// ! ||--------------------------------------------------------------------------------||
// ! ||                        Prayer Times Strategies Providers                       ||
// ! ||--------------------------------------------------------------------------------||

export const provideMasjidiAlAdhanAPIPrayerTimesStrategy = (
  ...params: ConstructorParameters<typeof MasjidiAlAdhanAPIPrayerTimesStrategy>
) => new MasjidiAlAdhanAPIPrayerTimesStrategy(...params);

export const provideMasjidiTableAPIPrayerTimesStrategy = (
  ...params: ConstructorParameters<typeof MasjidiTableAPIPrayerTimesStrategy>
) => new MasjidiTableAPIPrayerTimesStrategy(...params);
