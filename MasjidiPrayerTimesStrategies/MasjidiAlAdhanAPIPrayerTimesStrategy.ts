import { MasjidiPrayerTimesStrategy } from "@/core/MasjidiPrayerTimesStrategy";
import { SavedFetch } from "@/utils/SavedFetch";

export class MasjidiAlAdhanAPIPrayerTimesStrategy extends MasjidiPrayerTimesStrategy {
  readonly isDayLightSaved = true;
  private scopeKey: string = "";

  constructor(readonly apiOptions: Record<string, string>) {
    super();
  }

  withScopedKey(key: string) {
    this.scopeKey = key;
    return this;
  }

  async getCalendar() {
    // Fixed leap year for 366 days
    const aladhanAPIUrl = new URL(
      `${location.protocol}//api.aladhan.com/v1/calendar/2024`
    );
    for (const key in this.apiOptions) {
      aladhanAPIUrl.searchParams.set(key, this.apiOptions[key]);
    }

    const mainKey = "masjidi-al-adhan-api-prayer-times-strategy-data";

    return await SavedFetch.fetch(
      this.scopeKey ? `${mainKey}/${this.scopeKey}` : mainKey,
      {
        input: aladhanAPIUrl,
        init: { method: "GET" },
        state: { api: this.apiOptions },
      }
    ).then((e) =>
      Object.values(JSON.parse(e).data).flatMap((e: any) =>
        e.flatMap((e: any) =>
          Object.fromEntries(
            Object.entries(e.timings).map(([k, v]: [string, any]) => [
              k,
              v
                .split(" ")[0]
                .split(":")
                .map((x: string) => +x),
            ])
          )
        )
      )
    );
  }
}
