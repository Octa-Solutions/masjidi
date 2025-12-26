import { IPrayer, Prayer } from "@/Prayer";

/**
 * A list of standard prayer keys.
 */
export const PRAYERS = [
  "Fajr",
  "Sunrise",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
] as const;

/**
 * Type representing a valid prayer key.
 */
export type PrayerKey = (typeof PRAYERS)[number];

/**
 * Factory function to create a list of `Prayer` objects from a configuration object.
 *
 * @param config - A partial record mapping prayer keys to their configuration.
 * @returns An array of `Prayer` objects.
 */
export const prayersListFactory = (
  config: Partial<Record<PrayerKey, Partial<Omit<IPrayer, "key">>>>,
) => {
  return Object.entries(config).map(([key, value]) =>
    Prayer.factory({
      key: key,
      name: value.name ?? "",
      duration: value.duration ?? 0,
      iqamaWaitDuration: value.iqamaWaitDuration ?? 0,
      azkarDuration: value.azkarDuration ?? 0,
      timeOffset: value.timeOffset ?? 0,
      dateOverrides: value.dateOverrides ?? [],
      upcoming: value.upcoming ?? null,
      time: NaN,
    }),
  );
};
