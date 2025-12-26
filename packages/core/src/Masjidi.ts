import { IslamicEvent, islamicEvents } from "@/data/islamicEvents";
import { MasjidiDate } from "@/MasjidiDate";
import { Prayer } from "@/Prayer";
import { DateUtils, wrapNumber } from "@masjidi/common";

/**
 * Enum representing the different statuses of the Masjidi application.
 */
export enum MasjidiStatus {
  Clock = "clock",
  Prayer = "prayer",
  Azkar = "azkar",
}

/**
 * Type representing the contextual status of Masjidi, including the current prayer if applicable.
 */
export type MasjidiContextualStatus =
  | { status: MasjidiStatus.Clock; prayer: null }
  | { status: MasjidiStatus.Azkar | MasjidiStatus.Prayer; prayer: Prayer };

/**
 * Type representing the timing status of Masjidi, including time left for the next event.
 */
export type MasjidiTimingStatus = {
  prayer: Prayer;
  type: "upcoming" | "iqama" | "prayer";
  secondsLeft: number;
};

/**
 * Type representing a Hadith.
 */
export type MasjidiHadith = {
  sanad: string;
  content: string;
  attribution: string;
};

/**
 * Interface defining the properties required to initialize a Masjidi instance.
 */
export interface IMasjidi {
  readonly initialNow: Date;
  readonly hijriDayAdjustment: number;
  readonly ahadith: MasjidiHadith[];
  readonly prayers: Prayer[];
}

/**
 * The main class for the Masjidi application logic.
 * It manages the current time, prayer times, and application status.
 */
export class Masjidi implements IMasjidi {
  private now!: MasjidiDate;
  private hadithIndex = -1;

  /**
   * Creates a new instance of `Masjidi`.
   *
   * @param initialNow - The initial date and time.
   * @param hijriDayAdjustment - The adjustment for the Hijri date in days.
   * @param ahadith - An array of Hadiths to display.
   * @param prayers - An array of `Prayer` objects.
   */
  constructor(
    readonly initialNow: Date,
    readonly hijriDayAdjustment: number,
    readonly ahadith: MasjidiHadith[],
    readonly prayers: Prayer[],
  ) {
    console.assert(prayers.length > 0, "At least one prayer is required");

    this.setNow(initialNow);
  }

  /**
   * Sets the current date and time for the application.
   *
   * @param date - The new date and time.
   * @returns The `Masjidi` instance for chaining.
   */
  setNow(date: Date) {
    this.now = MasjidiDate.factory(date, this.hijriDayAdjustment);
    return this;
  }

  /**
   * Gets the current `MasjidiDate`.
   *
   * @returns The current `MasjidiDate`.
   */
  getNow() {
    return this.now;
  }

  /**
   * Gets the next upcoming prayer.
   *
   * @returns The upcoming `Prayer` object.
   */
  getUpcomingPrayer() {
    return (
      this.prayers.find((e) =>
        e.isAfter(this.now, e.getOverriddenSettings(this.now).upcoming.offset),
      ) ?? this.prayers[0]
    );
  }

  /**
   * Gets the previous prayer relative to the current time.
   *
   * @returns The previous `Prayer` object.
   */
  getPreviousPrayer() {
    for (let i = this.prayers.length - 1; i >= 0; i--) {
      const prayer = this.prayers[i];
      if (prayer.isBeforeOrEqual(this.now)) {
        return prayer;
      }
    }
    return this.prayers[this.prayers.length - 1];
  }

  /**
   * Gets the prayer currently in the Iqama wait period.
   *
   * @returns The `Prayer` object if in Iqama wait, otherwise `null`.
   */
  getCurrentInIqamaWaitPrayer() {
    return this.prayers.find((e) => e.isInIqamaWait(this.now)) ?? null;
  }

  /**
   * Gets the prayer currently being performed.
   *
   * @returns The `Prayer` object if in prayer time, otherwise `null`.
   */
  getCurrentInPrayerPrayer() {
    return this.prayers.find((e) => e.isInPrayer(this.now)) ?? null;
  }

  /**
   * Gets the prayer currently in the Azkar period.
   *
   * @returns The `Prayer` object if in Azkar time, otherwise `null`.
   */
  getCurrentInAzkarPrayer() {
    return this.prayers.find((e) => e.isInAzkar(this.now)) ?? null;
  }

  /**
   * Gets the current prayer, which is either in Iqama wait or in prayer time.
   *
   * @returns The `Prayer` object if active, otherwise `null`.
   */
  getCurrentPrayer() {
    return (
      this.prayers.find(
        (e) => e.isInIqamaWait(this.now) || e.isInPrayer(this.now),
      ) ?? null
    );
  }

  /**
   * Calculates the timing status, including the type of the next event and the time remaining.
   *
   * @returns The `MasjidiTimingStatus`.
   */
  getTimingStatus(): MasjidiTimingStatus {
    const currentIqamaWaitPrayer = this.getCurrentInIqamaWaitPrayer();

    if (currentIqamaWaitPrayer) {
      return {
        prayer: currentIqamaWaitPrayer,
        type: "iqama",
        secondsLeft: wrapNumber(
          currentIqamaWaitPrayer.getTimeLeftForIqama(this.now),
          0,
          DateUtils.DAY_IN_SECONDS,
        ),
      };
    }

    const currentInPrayerPrayer = this.getCurrentInPrayerPrayer();
    if (currentInPrayerPrayer) {
      return {
        prayer: currentInPrayerPrayer,
        type: "prayer",
        secondsLeft: wrapNumber(
          currentInPrayerPrayer.getTimeLeftForPrayer(this.now),
          0,
          DateUtils.DAY_IN_SECONDS,
        ),
      };
    }

    const upcomingPrayer = this.getUpcomingPrayer();

    return {
      prayer: upcomingPrayer,
      type: "upcoming",
      secondsLeft: wrapNumber(
        upcomingPrayer.getTimeLeftForIqamaWait(this.now) +
          upcomingPrayer.getOverriddenSettings(this.now).upcoming.offset * 60,
        0,
        DateUtils.DAY_IN_SECONDS,
      ),
    };
  }

  /**
   * Determines the current contextual status of the application (Clock, Prayer, or Azkar).
   *
   * @returns The `MasjidiContextualStatus`.
   */
  getStatus(): MasjidiContextualStatus {
    const inPrayer = this.getCurrentInPrayerPrayer();
    const inAzkar = this.getCurrentInAzkarPrayer();
    if (inAzkar) {
      return {
        status: MasjidiStatus.Azkar,
        prayer: inAzkar,
      } as const;
    }
    if (inPrayer) {
      return {
        status: MasjidiStatus.Prayer,
        prayer: inPrayer,
      } as const;
    }

    return {
      status: MasjidiStatus.Clock,
      prayer: null,
    } as const;
  }

  /**
   * Checks if a specific Islamic event is currently active.
   *
   * @param event - The Islamic event to check.
   * @returns `true` if the event is active, `false` otherwise.
   */
  isIslamicEvent(event: IslamicEvent) {
    const condition = islamicEvents[event as IslamicEvent];

    if (condition instanceof Array) {
      for (const subCondition of condition) {
        if (MasjidiDate.multiConditionMet(subCondition, this.now)) return true;
      }
      return false;
    }

    return MasjidiDate.multiConditionMet(condition, this.now);
  }

  /**
   * Retrieves a list of all currently active Islamic events.
   *
   * @returns An array of active `IslamicEvent`s.
   */
  getIslamicEvents(): IslamicEvent[] {
    const events: IslamicEvent[] = [];

    for (const event in islamicEvents) {
      if (this.isIslamicEvent(event as IslamicEvent)) {
        events.push(event as IslamicEvent);
      }
    }

    return events;
  }

  /**
   * Advances to the next Hadith in the list and returns it.
   *
   * @returns The next `MasjidiHadith`.
   */
  nextHadith() {
    this.hadithIndex = (this.hadithIndex + 1) % this.ahadith.length;
    return this.ahadith[this.hadithIndex];
  }

  /**
   * Factory method to create a new `Masjidi` instance from an `IMasjidi` object.
   *
   * @param masjidi - The `IMasjidi` object containing initialization data.
   * @returns A new `Masjidi` instance.
   */
  static factory(masjidi: IMasjidi) {
    return new Masjidi(
      masjidi.initialNow,
      masjidi.hijriDayAdjustment,
      masjidi.ahadith,
      masjidi.prayers,
    );
  }
}
