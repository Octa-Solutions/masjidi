export type MasjidiPrayerTiming = {
  [P in string]: [hours: number, minutes: number];
};
export type MasjidiPrayerTimings = MasjidiPrayerTiming[];

export abstract class MasjidiPrayerTimesStrategy {
  abstract readonly isDayLightSaved: boolean;

  abstract getCalendar(): Promise<MasjidiPrayerTimings>;
}
