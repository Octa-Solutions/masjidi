import {
  Masjidi,
  MasjidiContextualStatus,
  MasjidiHadith,
} from "@/core/Masjidi";
import { Prayer } from "@/core/Prayer";
import { wrapNumber } from "@/utils";
import { DateUtils } from "@/utils/DateUtils";
import { EventListener } from "@/utils/EventListener";

type MasjidiControllerTiming = {
  [P in string]: string;
};
type MasjidiControllerTimings = MasjidiControllerTiming[];

export class MasjidiController extends EventListener<{
  // Tick Events
  init: [];
  tick: [first: boolean];

  // State Events
  state: [MasjidiContextualStatus];

  // Hadith Events
  hadith: [hadith: MasjidiHadith];

  // Prayer-Related Events
  adhan: [prayer: Prayer, offset: number];
  iqama: [prayer: Prayer];
}> {
  constructor(
    private masjidi: Masjidi,
    private options: { timingsURL: string; hadithInterval: number }
  ) {
    super();
  }

  private startTime: number | null = null;
  private timingsPromise: Promise<MasjidiControllerTimings> | null = null;
  private timings: MasjidiControllerTimings | null = null;
  private tickInterval: number | null = null;
  private hadithInterval: number | null = null;
  private previousState: MasjidiContextualStatus | null = null;
  private previousAdhanPrayer: Prayer | null = null;
  private previousIqamaPrayer: Prayer | null | undefined = undefined;

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
    const daylightSavingTimeOffset = DateUtils.getDaylightSavingTimeOffset(now);

    this.masjidi.setNow(now);

    const dayIndex = DateUtils.getDayIndex(now);
    const timing = this.timings[dayIndex];
    for (const prayer of this.masjidi.prayers) {
      console.assert(prayer.key in timing, "prayer not found in timings");

      const timeString = timing[prayer.key];
      const [hour, minute] = timeString.split(":");
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
      const offset =
        this.masjidi.getNow().time.secondOfDay -
        adhanPrayer.getOffsettedTime() * 60;

      if (adhanPrayer.adhanAudio) {
        adhanPrayer.adhanAudioPromise!.then(() => {
          if (offset >= 0 && offset < adhanPrayer.adhanAudio!.duration) {
            this.dispatch("adhan", adhanPrayer, offset);
          }
        });
      } else {
        this.dispatch("adhan", adhanPrayer, offset);
      }
    }
    if (iqamaPrayerChanged && iqamaPrayer) {
      this.dispatch("iqama", iqamaPrayer);
    }
  }

  private hadith() {
    const hadith = this.masjidi.nextHadith();
    this.dispatch("hadith", hadith);
  }

  fetch() {
    if (this.timingsPromise !== null) {
      return this.timingsPromise;
    }

    this.timingsPromise = fetch(this.options.timingsURL)
      .then((response) => response.json())
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
    this.hadithInterval = setInterval(
      () => this.hadith(),
      this.options.hadithInterval
    );
    this.tick(true);
    this.hadith();
  }
}
