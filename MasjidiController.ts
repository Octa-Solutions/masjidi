import {
  Masjidi,
  MasjidiContextualStatus,
  MasjidiHadith,
} from "@/core/Masjidi";
import {
  MasjidiPrayerTimesStrategy,
  MasjidiPrayerTimings,
} from "@/core/MasjidiPrayerTimesStrategy";
import { Prayer } from "@/core/Prayer";
import { DateUtils } from "@/core/utils/date/DateUtils";
import { EventListener } from "@/core/utils/EventListener";
import { wrapNumber } from "@/core/utils/math";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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
  constructor(
    private masjidi: Masjidi,
    private options: {
      timesStrategy: MasjidiPrayerTimesStrategy;
      hadithInterval?: number;
    }
  ) {
    super();
  }

  private startTime: number | null = null;
  private timingsPromise: Promise<MasjidiPrayerTimings> | null = null;
  private timings: MasjidiPrayerTimings | null = null;
  private tickInterval: number | null = null;
  private hadithInterval: number | null = null;
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
      this.masjidi.initialNow.getTime() - this.startTime + Date.now()
    );
    const daylightSavingTimeOffset = this.options.timesStrategy.isDayLightSaved
      ? 0
      : DateUtils.getDaylightSavingTimeOffset(now);

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
        this.options.hadithInterval
      );
    }

    this.tick(true);
    this.hadith();
  }
}
