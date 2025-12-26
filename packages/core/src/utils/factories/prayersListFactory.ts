import { IPrayer, Prayer } from "@/Prayer";

export const PRAYERS = [
  "Fajr",
  "Sunrise",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
] as const;

export type PrayerKey = (typeof PRAYERS)[number];

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
