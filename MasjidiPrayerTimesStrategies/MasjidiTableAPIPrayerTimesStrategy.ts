import { MasjidiPrayerTimesStrategy } from "@/core/MasjidiPrayerTimesStrategy";
import { CachedFetch } from "@/utils/CachedFetch";

export class MasjidiTableAPIPrayerTimesStrategy extends MasjidiPrayerTimesStrategy {
  readonly isDayLightSaved = false;

  constructor(readonly url: string) {
    super();
  }

  async getCalendar() {
    return await CachedFetch.fetch("json", this.url).then((e) =>
      e.map((e: any) =>
        Object.fromEntries(
          Object.entries(e).map(([k, v]: [string, any]) => [
            k,
            v.split(":").map((x: string) => +x),
          ])
        )
      )
    );
  }
}
