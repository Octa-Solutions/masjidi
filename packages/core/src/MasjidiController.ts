import { Masjidi, MasjidiContextualStatus, MasjidiHadith } from "@/Masjidi";
import {
  MasjidiPrayerTimesStrategy,
  MasjidiPrayerTimings,
} from "@/MasjidiPrayerTimesStrategy";
import { Prayer } from "@/Prayer";
import { DateUtils, EventListener, wrapNumber } from "@masjidi/common";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Enum-like object for daylight saving time (DST) modes.
 */
export const DaylightSavingMode = {
  /**
   * Never apply DST. No offset is added, regardless of date or timezone.
   */
  NONE: "none",

  /**
   * Use the system or provided timezone's DST rules. The offset is determined by
   * DateUtils.getDaylightSavingTimeOffset(now), which typically reflects the environment's timezone.
   */
  FROM_TIMEZONE: "from-timezone",

  /**
   * If the prayer times strategy (timesStrategy) provides DST-adjusted times (isDayLightSaved === true),
   * no additional offset is applied. Otherwise, fallback to the system/provided timezone's DST offset.
   * This is useful for supporting both DST-aware and raw strategies.
   */
  STRATEGY_OR_TIMEZONE: "strategy-or-timezone",

  /**
   * Apply a custom DST rule. The offset (in minutes) is applied between the given start and end Date objects
   * (which should specify month, day, hour, and minute). If the current date is within the range, the offset is applied;
   * otherwise, no offset is applied. Handles southern hemisphere by comparing start and end.
   */
  CUSTOM: "custom",
} as const;

export type DaylightSavingModeType =
  (typeof DaylightSavingMode)[keyof typeof DaylightSavingMode];

export type DaylightSavingOption =
  | { mode: typeof DaylightSavingMode.NONE }
  | { mode: typeof DaylightSavingMode.FROM_TIMEZONE }
  | { mode: typeof DaylightSavingMode.STRATEGY_OR_TIMEZONE }
  | {
      mode: typeof DaylightSavingMode.CUSTOM;
      start: { month: number; day: number; hours: number; minutes: number };
      end: { month: number; day: number; hours: number; minutes: number };
      offsetMinutes: number;
    };

/**
 * Controller class for the Masjidi application.
 * It handles the main loop, event dispatching, and interaction with the `Masjidi` instance.
 */
export class MasjidiController extends EventListener<{
  // Tick Events
  init: [];
  tick: [first: boolean];
  day: [previous: Date | null, current: Date];

  // State Events
  state: [MasjidiContextualStatus];

  // Hadith Events
  hadith: [hadith: MasjidiHadith];

  // Prayer-Related Events
  adhan: [prayer: Prayer, offset: () => number];
  iqama: [prayer: Prayer];
}> {
  /**
   * Creates a new instance of `MasjidiController`.
   *
   * @param masjidi - The `Masjidi` instance to control.
   * @param options - Configuration options for the controller.
   * @param options.timesStrategy - The strategy for calculating prayer times.
   * @param options.hadithInterval - The interval in milliseconds for rotating Hadiths.
   */
  constructor(
    private masjidi: Masjidi,
    private options: {
      timesStrategy: MasjidiPrayerTimesStrategy;
      hadithInterval?: number;
      daylightSaving?: DaylightSavingOption;
    },
  ) {
    super();
  }

  private startTime: number | null = null;
  private timingsPromise: Promise<MasjidiPrayerTimings> | null = null;
  private timings: MasjidiPrayerTimings | null = null;
  private tickInterval: any | null = null;
  private hadithInterval: any | null = null;
  private previousState: MasjidiContextualStatus | null = null;
  private previousAdhanPrayer: Prayer | null = null;
  private previousIqamaPrayer: Prayer | null | undefined = undefined;
  private previousDate: Date | null = null;

  private tick(first: boolean) {
    console.assert(this.startTime !== null, "Controller has not started");
    console.assert(this.timings !== null, "Controller has not loaded timings");
    console.assert(this.timings?.length === 366, "Timings are invalid");
    if (
      this.startTime === null ||
      this.timings === null ||
      this.timings.length !== 366
    ) {
      return;
    }

    const now = new Date(
      this.masjidi.initialNow.getTime() - this.startTime + Date.now(),
    );

    let daylightSavingTimeOffset: number;
    const daylightSaving = this.options.daylightSaving ?? {
      mode: DaylightSavingMode.STRATEGY_OR_TIMEZONE,
    };
    switch (daylightSaving.mode) {
      case DaylightSavingMode.NONE:
        daylightSavingTimeOffset = 0;
        break;
      case DaylightSavingMode.FROM_TIMEZONE:
        daylightSavingTimeOffset = DateUtils.getDaylightSavingTimeOffset(now);
        break;
      case DaylightSavingMode.STRATEGY_OR_TIMEZONE: {
        daylightSavingTimeOffset = this.options.timesStrategy.isDayLightSaved
          ? 0
          : DateUtils.getDaylightSavingTimeOffset(now);
        break;
      }
      case DaylightSavingMode.CUSTOM: {
        const { start, end } = daylightSaving;
        const startDate = new Date(
          now.getFullYear(),
          start.month - 1,
          start.day,
          start.hours,
          start.minutes,
        );
        const endDate = new Date(
          now.getFullYear(),
          end.month - 1,
          end.day,
          end.hours,
          end.minutes,
        );

        if (startDate < endDate) {
          daylightSavingTimeOffset =
            now >= startDate && now < endDate
              ? daylightSaving.offsetMinutes
              : 0;
        } else {
          daylightSavingTimeOffset =
            now >= startDate || now < endDate
              ? daylightSaving.offsetMinutes
              : 0;
        }

        break;
      }
    }

    this.masjidi.setNow(now);

    const previousDateDaysSinceEpoch =
      this.previousDate === null
        ? null
        : Math.floor(this.previousDate.getTime() / ONE_DAY_MS);
    const currentDateDaysSinceEpoch = Math.floor(now.getTime() / ONE_DAY_MS);

    if (
      previousDateDaysSinceEpoch === null ||
      previousDateDaysSinceEpoch !== currentDateDaysSinceEpoch
    ) {
      this.dispatch("day", this.previousDate, now);
    }

    const dayIndex = DateUtils.getDayIndex(now);
    const timing = this.timings[dayIndex];
    for (const prayer of this.masjidi.prayers) {
      console.assert(prayer.key in timing, "prayer not found in timings");

      const [hour, minute] = timing[prayer.key];
      let time = +hour * 60 + +minute;

      time += daylightSavingTimeOffset;

      prayer.time = wrapNumber(time, 0, 24 * 60);
    }

    this.dispatch("tick", first);

    // Not using getCurrentInIqamaWaitPrayer() in order to play adhan
    // even if the prayer starts instantly
    const adhanPrayer = this.masjidi.getCurrentPrayer();

    const iqamaPrayer = this.masjidi.getCurrentInPrayerPrayer();
    const status = this.masjidi.getStatus();

    const adhanPrayerChanged = adhanPrayer !== this.previousAdhanPrayer;

    const iqamaPrayerChanged =
      this.previousIqamaPrayer !== undefined &&
      iqamaPrayer !== this.previousIqamaPrayer;

    const statusChanged =
      this.previousState === null ||
      status.status !== this.previousState.status ||
      status.prayer !== this.previousState.prayer;

    this.previousState = status;
    this.previousAdhanPrayer = adhanPrayer;
    this.previousIqamaPrayer = iqamaPrayer;

    if (statusChanged) {
      this.dispatch("state", status);
    }

    if (adhanPrayerChanged && adhanPrayer) {
      const offset = () =>
        this.masjidi.getNow().time.secondOfDay -
        adhanPrayer.getOffsettedTime() * 60;

      this.dispatch("adhan", adhanPrayer, offset);
    }
    if (iqamaPrayerChanged && iqamaPrayer) {
      this.dispatch("iqama", iqamaPrayer);
    }

    this.previousDate = now;
  }

  private hadith() {
    const hadith = this.masjidi.nextHadith();
    this.dispatch("hadith", hadith);
  }

  /**
   * Fetches the prayer timings using the configured strategy.
   *
   * @returns A promise that resolves to the `MasjidiPrayerTimings`.
   */
  fetch() {
    if (this.timingsPromise !== null) {
      return this.timingsPromise;
    }

    this.timingsPromise = this.options.timesStrategy
      .getCalendar()
      .then((timings) => {
        this.timings = timings;
        return timings;
      });

    return this.timingsPromise;
  }

  /**
   * Starts the controller loop.
   * It fetches timings, sets up intervals for ticks and Hadith rotation, and dispatches initial events.
   */
  async start() {
    await this.fetch();

    if (this.tickInterval !== null) {
      clearInterval(this.tickInterval);
    }
    if (this.hadithInterval !== null) {
      clearInterval(this.hadithInterval);
    }

    this.previousState = null;
    this.previousAdhanPrayer = null;
    this.previousIqamaPrayer = undefined;
    this.startTime = Date.now();
    this.tickInterval = setInterval(() => this.tick(false), 1000);

    if (this.options.hadithInterval !== undefined) {
      this.hadithInterval = setInterval(
        () => this.hadith(),
        this.options.hadithInterval,
      );
    }

    this.tick(true);
    this.hadith();
  }

  /**
   * Stops the controller loop and clears all intervals and listeners.
   */
  destroy() {
    if (this.tickInterval !== null) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    if (this.hadithInterval !== null) {
      clearInterval(this.hadithInterval);
      this.hadithInterval = null;
    }

    this.removeAllListeners();
  }
}
