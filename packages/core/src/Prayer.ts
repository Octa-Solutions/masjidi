import { MasjidiDate } from "@/MasjidiDate";
import { DeepPartial, Prettify, wrapNumber } from "@masjidi/common";

/**
 * Settings for upcoming prayer notifications.
 */
export type PrayerUpcomingSettings = {
  activeOnlyWhenInOffset?: boolean;
  name?: string;
  offset?: number;
};

/**
 * Properties of a prayer that can be overridden based on date.
 */
type PrayerOverridable = {
  name: string;
  iqamaWaitDuration: number;
  duration: number;
  upcoming: null | PrayerUpcomingSettings;
};

/**
 * Type representing a date-specific override for prayer settings.
 */
export type PrayerDateOverride = Prettify<
  {
    date: DeepPartial<MasjidiDate>;
  } & Partial<PrayerOverridable>
>;

/**
 * Interface representing a Prayer object.
 */
export type IPrayer = Prettify<
  {
    time: number;
    readonly key: string;
    readonly azkarDuration: number;
    readonly timeOffset: number;
    readonly dateOverrides: PrayerDateOverride[];
  } & Readonly<PrayerOverridable>
>;

/**
 * Interface representing an uninitialized Prayer object (without time).
 */
export type IUninitializedPrayer = Omit<IPrayer, "time">;

/**
 * Class representing a Prayer.
 * It handles prayer times, Iqama times, Azkar times, and date-specific overrides.
 */
export class Prayer implements IPrayer {
  /**
   * Creates a new instance of `Prayer`.
   *
   * @param key - The unique key for the prayer.
   * @param name - The display name of the prayer.
   * @param duration - The duration of the prayer in minutes.
   * @param iqamaWaitDuration - The duration to wait for Iqama in minutes.
   * @param azkarDuration - The duration of Azkar in minutes.
   * @param timeOffset - The offset in minutes to add to the prayer time.
   * @param upcoming - Settings for upcoming prayer notifications.
   * @param dateOverrides - An array of date-specific overrides.
   * @param time - The time of the prayer in minutes from the start of the day.
   */
  constructor(
    readonly key: string,
    readonly name: string,
    readonly duration: number,
    readonly iqamaWaitDuration: number,
    readonly azkarDuration: number,
    readonly timeOffset: number,
    readonly upcoming: null | PrayerUpcomingSettings = null,
    readonly dateOverrides: PrayerDateOverride[],
    public time: number,
  ) {}

  /**
   * Gets the prayer time with the offset applied.
   *
   * @returns The offsetted prayer time in minutes from the start of the day.
   */
  getOffsettedTime() {
    return wrapNumber(this.time + this.timeOffset, 0, 24 * 60);
  }

  /**
   * Calculates the Iqama time for a given date.
   *
   * @param date - The date to calculate Iqama time for.
   * @returns The Iqama time in minutes from the start of the day.
   */
  iqamaTime(date: MasjidiDate) {
    return (
      this.getOffsettedTime() +
      this.getOverriddenSettings(date).iqamaWaitDuration
    );
  }

  /**
   * Calculates the finish time of the prayer for a given date.
   *
   * @param date - The date to calculate finish time for.
   * @returns The finish time in minutes from the start of the day.
   */
  finishTime(date: MasjidiDate) {
    return this.iqamaTime(date) + this.getOverriddenSettings(date).duration;
  }

  /**
   * Calculates the finish time of the Azkar for a given date.
   *
   * @param date - The date to calculate Azkar finish time for.
   * @returns The Azkar finish time in minutes from the start of the day.
   */
  azkarFinishTime(date: MasjidiDate) {
    return this.finishTime(date) + this.azkarDuration;
  }

  /**
   * Checks if the prayer is before the given date's time.
   *
   * @param date - The date to check against.
   * @returns `true` if the prayer is before the date's time, `false` otherwise.
   */
  isBefore(date: MasjidiDate) {
    return this.getOffsettedTime() < date.time.minuteOfDay;
  }

  /**
   * Checks if the prayer is after the given date's time, optionally with an offset.
   *
   * @param date - The date to check against.
   * @param offset - An optional offset in minutes.
   * @returns `true` if the prayer is after the date's time, `false` otherwise.
   */
  isAfter(date: MasjidiDate, offset: number = 0) {
    return this.getOffsettedTime() + offset > date.time.minuteOfDay;
  }

  /**
   * Checks if the prayer is before or equal to the given date's time.
   *
   * @param date - The date to check against.
   * @returns `true` if the prayer is before or equal to the date's time, `false` otherwise.
   */
  isBeforeOrEqual(date: MasjidiDate) {
    return this.getOffsettedTime() <= date.time.minuteOfDay;
  }

  /**
   * Checks if the prayer is after or equal to the given date's time.
   *
   * @param date - The date to check against.
   * @returns `true` if the prayer is after or equal to the date's time, `false` otherwise.
   */
  isAfterOrEqual(date: MasjidiDate) {
    return this.getOffsettedTime() >= date.time.minuteOfDay;
  }

  /**
   * Checks if the prayer time is equal to the given date's time.
   *
   * @param date - The date to check against.
   * @returns `true` if the prayer time is equal to the date's time, `false` otherwise.
   */
  isEqual(date: MasjidiDate) {
    return this.getOffsettedTime() === date.time.minuteOfDay;
  }

  /**
   * Checks if the current time is within the Iqama wait period for this prayer.
   *
   * @param date - The current date and time.
   * @returns `true` if within the Iqama wait period, `false` otherwise.
   */
  isInIqamaWait(date: MasjidiDate) {
    return (
      date.time.minuteOfDay >= this.getOffsettedTime() &&
      date.time.minuteOfDay < this.iqamaTime(date)
    );
  }

  /**
   * Checks if the current time is within the prayer duration for this prayer.
   *
   * @param date - The current date and time.
   * @returns `true` if within the prayer duration, `false` otherwise.
   */
  isInPrayer(date: MasjidiDate) {
    return (
      date.time.minuteOfDay >= this.iqamaTime(date) &&
      date.time.minuteOfDay < this.finishTime(date)
    );
  }

  /**
   * Checks if the current time is within the Azkar duration for this prayer.
   *
   * @param date - The current date and time.
   * @returns `true` if within the Azkar duration, `false` otherwise.
   */
  isInAzkar(date: MasjidiDate) {
    return (
      date.time.minuteOfDay >= this.finishTime(date) &&
      date.time.minuteOfDay < this.azkarFinishTime(date)
    );
  }

  /**
   * Calculates the time left until the Iqama wait period ends (i.e., when Iqama starts).
   * Note: This seems to calculate time left until prayer time starts based on implementation?
   * Actually, `getOffsettedTime() * 60 - date.time.secondOfDay` is time until Adhan.
   * Let's correct the description based on code: It returns time left until Adhan/Prayer start.
   * Wait, the method name is `getTimeLeftForIqamaWait`.
   * If it returns positive, it means we are before the prayer time.
   *
   * @param date - The current date and time.
   * @returns The time left in seconds.
   */
  getTimeLeftForIqamaWait(date: MasjidiDate) {
    return this.getOffsettedTime() * 60 - date.time.secondOfDay;
  }

  /**
   * Calculates the time left until Iqama.
   *
   * @param date - The current date and time.
   * @returns The time left in seconds.
   */
  getTimeLeftForIqama(date: MasjidiDate) {
    return this.iqamaTime(date) * 60 - date.time.secondOfDay;
  }

  /**
   * Calculates the time left until the prayer finishes.
   *
   * @param date - The current date and time.
   * @returns The time left in seconds.
   */
  getTimeLeftForPrayer(date: MasjidiDate) {
    return this.finishTime(date) * 60 - date.time.secondOfDay;
  }

  /**
   * Calculates the time left until Azkar finishes.
   *
   * @param date - The current date and time.
   * @returns The time left in seconds.
   */
  getTimeLeftForAzkar(date: MasjidiDate) {
    return this.azkarFinishTime(date) * 60 - date.time.secondOfDay;
  }

  /**
   * Retrieves the settings for this prayer, applying any date-specific overrides.
   *
   * @param date - The date to retrieve settings for.
   * @returns The effective settings for the prayer.
   */
  getOverriddenSettings(date: MasjidiDate) {
    const currentDateOverride = this.dateOverrides.find((e) =>
      MasjidiDate.matches(date, e.date),
    );

    const upcomingActive = (
      upcoming: PrayerUpcomingSettings | null | undefined,
    ) =>
      upcoming
        ? upcoming.activeOnlyWhenInOffset && upcoming.offset
          ? date.time.minuteOfDay >= this.getOffsettedTime()
            ? upcoming
            : null
          : upcoming
        : null;

    return {
      name: currentDateOverride?.name ?? this.name,
      iqamaWaitDuration:
        currentDateOverride?.iqamaWaitDuration ?? this.iqamaWaitDuration,
      duration: currentDateOverride?.duration ?? this.duration,
      upcoming: {
        name:
          upcomingActive(currentDateOverride?.upcoming)?.name ??
          currentDateOverride?.name ??
          upcomingActive(this.upcoming)?.name ??
          this.name,
        offset:
          upcomingActive(currentDateOverride?.upcoming)?.offset ??
          upcomingActive(this.upcoming)?.offset ??
          0,
      },
    } as const;
  }

  /**
   * Factory method to create a new `Prayer` instance from an `IPrayer` object.
   *
   * @param prayer - The `IPrayer` object containing initialization data.
   * @returns A new `Prayer` instance.
   */
  static factory(prayer: IPrayer) {
    return new Prayer(
      prayer.key,
      prayer.name,
      prayer.duration,
      prayer.iqamaWaitDuration,
      prayer.azkarDuration,
      prayer.timeOffset,
      prayer.upcoming,
      prayer.dateOverrides,
      prayer.time,
    );
  }
}
