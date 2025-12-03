import { MasjidiPrayerTimesStrategy } from "@/core/MasjidiPrayerTimesStrategy";
import { CachedFetch } from "@/core/utils/CachedFetch";

export class MasjidiTableAPIPrayerTimesStrategy extends MasjidiPrayerTimesStrategy {
  readonly isDayLightSaved = false;

  constructor(
    readonly dependencies: { cachedFetch: CachedFetch },
    readonly url: string
  ) {
    super();
  }

  async getCalendar() {
    return await this.dependencies.cachedFetch
      .fetch("json", this.url)
      .then((e) =>
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
