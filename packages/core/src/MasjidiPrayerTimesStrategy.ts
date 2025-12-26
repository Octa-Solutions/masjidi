/**
 * Type representing prayer timings for a single day.
 * It maps prayer keys to a tuple of [hours, minutes].
 */
export type MasjidiPrayerTiming = {
  [P in string]: [hours: number, minutes: number];
};

/**
 * Type representing prayer timings for a full year (or a sequence of days).
 */
export type MasjidiPrayerTimings = MasjidiPrayerTiming[];

/**
 * Abstract base class for prayer times strategies.
 * A strategy defines how prayer times are calculated or retrieved.
 */
export abstract class MasjidiPrayerTimesStrategy {
  /**
   * Indicates whether the strategy accounts for daylight saving time.
   */
  abstract readonly isDayLightSaved: boolean;

  /**
   * Retrieves the prayer timings for the calendar.
   *
   * @returns A promise that resolves to `MasjidiPrayerTimings`.
   */
  abstract getCalendar(): Promise<MasjidiPrayerTimings>;
}
