import { MasjidiPrayerTimesStrategy } from "@/core/MasjidiPrayerTimesStrategy";
import { SavedFetch } from "@/core/utils/SavedFetch";

type Protocol = "http" | "https";
type AutoProtocol = Protocol | "auto";
type AlAdhanCalendarAPIResponse = {
  [MONTH in string]: { timings: Record<string, string> }[];
};

export class MasjidiAlAdhanAPIPrayerTimesStrategy extends MasjidiPrayerTimesStrategy {
  readonly isDayLightSaved = true;
  private scopeKey: string = "";

  constructor(
    readonly dependencies: { savedFetch: SavedFetch },
    readonly apiOptions: Record<string, string>,
    readonly protocol: AutoProtocol = "auto"
  ) {
    super();
  }

  withScopedKey(key: string) {
    this.scopeKey = key;
    return this;
  }

  private getProtocol() {
    if (this.protocol === "auto") {
      // @ts-ignore depending on environment
      const location = globalThis.location;

      if (!location) return "https";

      const protocol = location.protocol.substring(
        0,
        location.protocol.length - 1
      );

      if (protocol !== "http" && protocol !== "https") return "https";

      return protocol;
    }

    return this.protocol;
  }
  async getCalendar() {
    // Fixed leap year for 366 days
    const aladhanAPIUrl = new URL(
      `${this.getProtocol()}://api.aladhan.com/v1/calendar/2024`
    );
    for (const key in this.apiOptions) {
      aladhanAPIUrl.searchParams.set(key, this.apiOptions[key]);
    }

    const mainKey = "masjidi-al-adhan-api-prayer-times-strategy-data";

    return await this.dependencies.savedFetch
      .fetch(this.scopeKey ? `${mainKey}/${this.scopeKey}` : mainKey, {
        input: aladhanAPIUrl,
        init: { method: "GET" },
        state: { api: this.apiOptions },
      })
      .then((e) => {
        return Object.values(
          JSON.parse(e as string).data as AlAdhanCalendarAPIResponse
        )
          .reduce((acc, currentArr) => acc.concat(currentArr), [])
          .map((day) =>
            Object.fromEntries(
              Object.entries(day.timings).map(([k, v]) => [
                k,
                v
                  .split(" ")[0]
                  .split(":")
                  .map((x: string) => +x) as [number, number],
              ])
            )
          );
      });
  }
}
