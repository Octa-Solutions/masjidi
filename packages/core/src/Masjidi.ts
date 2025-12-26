import { IslamicEvent, islamicEvents } from "@/data/islamicEvents";
import { MasjidiDate } from "@/MasjidiDate";
import { Prayer } from "@/Prayer";
import { DateUtils } from "@/utils/date/DateUtils";
import { wrapNumber } from "@/utils/math";

export enum MasjidiStatus {
  Clock = "clock",
  Prayer = "prayer",
  Azkar = "azkar",
}
export type MasjidiContextualStatus =
  | { status: MasjidiStatus.Clock; prayer: null }
  | { status: MasjidiStatus.Azkar | MasjidiStatus.Prayer; prayer: Prayer };

export type MasjidiTimingStatus = {
  prayer: Prayer;
  type: "upcoming" | "iqama" | "prayer";
  secondsLeft: number;
};

export type MasjidiHadith = {
  sanad: string;
  content: string;
  attribution: string;
};

export interface IMasjidi {
  readonly initialNow: Date;
  readonly hijriDayAdjustment: number;
  readonly ahadith: MasjidiHadith[];
  readonly prayers: Prayer[];
}
export class Masjidi implements IMasjidi {
  private now!: MasjidiDate;
  private hadithIndex = -1;

  constructor(
    readonly initialNow: Date,
    readonly hijriDayAdjustment: number,
    readonly ahadith: MasjidiHadith[],
    readonly prayers: Prayer[]
  ) {
    console.assert(prayers.length > 0, "At least one prayer is required");

    this.setNow(initialNow);
  }

  setNow(date: Date) {
    this.now = MasjidiDate.factory(date, this.hijriDayAdjustment);
    return this;
  }
  getNow() {
    return this.now;
  }

  getUpcomingPrayer() {
    return (
      this.prayers.find((e) =>
        e.isAfter(this.now, e.getOverriddenSettings(this.now).upcoming.offset)
      ) ?? this.prayers[0]
    );
  }
  getPreviousPrayer() {
    for (let i = this.prayers.length - 1; i >= 0; i--) {
      const prayer = this.prayers[i];
      if (prayer.isBeforeOrEqual(this.now)) {
        return prayer;
      }
    }
    return this.prayers[this.prayers.length - 1];
  }

  getCurrentInIqamaWaitPrayer() {
    return this.prayers.find((e) => e.isInIqamaWait(this.now)) ?? null;
  }
  getCurrentInPrayerPrayer() {
    return this.prayers.find((e) => e.isInPrayer(this.now)) ?? null;
  }
  getCurrentInAzkarPrayer() {
    return this.prayers.find((e) => e.isInAzkar(this.now)) ?? null;
  }

  getCurrentPrayer() {
    return (
      this.prayers.find(
        (e) => e.isInIqamaWait(this.now) || e.isInPrayer(this.now)
      ) ?? null
    );
  }
  getTimingStatus(): MasjidiTimingStatus {
    const currentIqamaWaitPrayer = this.getCurrentInIqamaWaitPrayer();

    if (currentIqamaWaitPrayer) {
      return {
        prayer: currentIqamaWaitPrayer,
        type: "iqama",
        secondsLeft: wrapNumber(
          currentIqamaWaitPrayer.getTimeLeftForIqama(this.now),
          0,
          DateUtils.DAY_IN_SECONDS
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
          DateUtils.DAY_IN_SECONDS
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
        DateUtils.DAY_IN_SECONDS
      ),
    };
  }
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
  getIslamicEvents(): IslamicEvent[] {
    const events: IslamicEvent[] = [];

    for (const event in islamicEvents) {
      if (this.isIslamicEvent(event as IslamicEvent)) {
        events.push(event as IslamicEvent);
      }
    }

    return events;
  }
  nextHadith() {
    this.hadithIndex = (this.hadithIndex + 1) % this.ahadith.length;
    return this.ahadith[this.hadithIndex];
  }

  static factory(masjidi: IMasjidi) {
    return new Masjidi(
      masjidi.initialNow,
      masjidi.hijriDayAdjustment,
      masjidi.ahadith,
      masjidi.prayers
    );
  }
}
