import { GlobalAudioPool } from "@/utils/GlobalAudioPool";
import { MasjidiDate } from "./MasjidiDate";
import { wrapNumber } from "@/utils";

export type PrayerUpcomingSettings = {
  activeOnlyWhenInOffset?: boolean;
  name?: string;
  offset?: number;
};
type PrayerOverridable = {
  name: string;
  iqamaWaitDuration: number;
  duration: number;
  upcoming: null | PrayerUpcomingSettings;
};

export type PrayerDateOverride = Prettify<
  {
    date: DeepPartial<MasjidiDate>;
  } & Partial<PrayerOverridable>
>;

export type IPrayer = Prettify<
  {
    time: number;
    readonly key: string;
    readonly adhanAudioPath: string | null;
    readonly adhanAudioVolume: number;
    readonly iqamaAudioPath: string | null;
    readonly azkarDuration: number;
    readonly timeOffset: number;
    readonly dateOverrides: PrayerDateOverride[];
  } & Readonly<PrayerOverridable>
>;
export type IUninitializedPrayer = Omit<IPrayer, "time">;

export class Prayer implements IPrayer {
  readonly adhanAudio: HTMLAudioElement | null;
  readonly adhanAudioPromise: Promise<void> | null;
  readonly iqamaAudio: HTMLAudioElement | null;
  readonly iqamaAudioPromise: Promise<void> | null;

  constructor(
    readonly key: string,
    readonly name: string,
    readonly adhanAudioPath: string | null,
    readonly adhanAudioVolume: number,
    readonly iqamaAudioPath: string | null,
    readonly duration: number,
    readonly iqamaWaitDuration: number,
    readonly azkarDuration: number,
    readonly timeOffset: number,
    readonly upcoming: null | PrayerUpcomingSettings = null,
    readonly dateOverrides: PrayerDateOverride[],
    public time: number
  ) {
    [this.adhanAudio, this.adhanAudioPromise] = this.adhanAudioPath
      ? GlobalAudioPool.get(this.adhanAudioPath)
      : [null, null];
    [this.iqamaAudio, this.iqamaAudioPromise] = this.iqamaAudioPath
      ? GlobalAudioPool.get(this.iqamaAudioPath)
      : [null, null];
  }

  getOffsettedTime() {
    return wrapNumber(this.time + this.timeOffset, 0, 24 * 60);
  }

  iqamaTime(date: MasjidiDate) {
    return (
      this.getOffsettedTime() +
      this.getOverriddenSettings(date).iqamaWaitDuration
    );
  }
  finishTime(date: MasjidiDate) {
    return this.iqamaTime(date) + this.getOverriddenSettings(date).duration;
  }

  azkarFinishTime(date: MasjidiDate) {
    return this.finishTime(date) + this.azkarDuration;
  }

  isBefore(date: MasjidiDate) {
    return this.getOffsettedTime() < date.time.minuteOfDay;
  }
  isAfter(date: MasjidiDate, offset: number = 0) {
    return this.getOffsettedTime() + offset > date.time.minuteOfDay;
  }
  isBeforeOrEqual(date: MasjidiDate) {
    return this.getOffsettedTime() <= date.time.minuteOfDay;
  }
  isAfterOrEqual(date: MasjidiDate) {
    return this.getOffsettedTime() >= date.time.minuteOfDay;
  }
  isEqual(date: MasjidiDate) {
    return this.getOffsettedTime() === date.time.minuteOfDay;
  }

  isInIqamaWait(date: MasjidiDate) {
    return (
      date.time.minuteOfDay >= this.getOffsettedTime() &&
      date.time.minuteOfDay < this.iqamaTime(date)
    );
  }
  isInPrayer(date: MasjidiDate) {
    return (
      date.time.minuteOfDay >= this.iqamaTime(date) &&
      date.time.minuteOfDay < this.finishTime(date)
    );
  }
  isInAzkar(date: MasjidiDate) {
    return (
      date.time.minuteOfDay >= this.finishTime(date) &&
      date.time.minuteOfDay < this.azkarFinishTime(date)
    );
  }

  getTimeLeftForIqamaWait(date: MasjidiDate) {
    return this.getOffsettedTime() * 60 - date.time.secondOfDay;
  }
  getTimeLeftForIqama(date: MasjidiDate) {
    return this.iqamaTime(date) * 60 - date.time.secondOfDay;
  }
  getTimeLeftForPrayer(date: MasjidiDate) {
    return this.finishTime(date) * 60 - date.time.secondOfDay;
  }
  getTimeLeftForAzkar(date: MasjidiDate) {
    return this.azkarFinishTime(date) * 60 - date.time.secondOfDay;
  }

  getOverriddenSettings(date: MasjidiDate) {
    const currentDateOverride = this.dateOverrides.find((e) =>
      MasjidiDate.matches(date, e.date)
    );

    const upcomingActive = (
      upcoming: PrayerUpcomingSettings | null | undefined
    ) =>
      upcoming
        ? upcoming.activeOnlyWhenInOffset && upcoming.offset
          ? this.getOffsettedTime() + upcoming.offset - date.time.minuteOfDay <=
            upcoming.offset
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

  static factory(prayer: IPrayer) {
    return new Prayer(
      prayer.key,
      prayer.name,
      prayer.adhanAudioPath,
      prayer.adhanAudioVolume,
      prayer.iqamaAudioPath,
      prayer.duration,
      prayer.iqamaWaitDuration,
      prayer.azkarDuration,
      prayer.timeOffset,
      prayer.upcoming,
      prayer.dateOverrides,
      prayer.time
    );
  }
}
