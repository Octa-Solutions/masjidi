import { AlAdhanAPIOptions } from "@/core/MasjidiPrayerTimesStrategies/AlAdhanAPIOptions";
import { MasjidiPrayerTimesStrategy } from "@/core/MasjidiPrayerTimesStrategy";
import { IStringFetcher } from "@/core/utils/fetch/IStringFetcher";
import { ISavedStringFetcher } from "@/core/utils/fetch/SavedFetcher";

type Protocol = "http" | "https";
type AutoProtocol = Protocol | "auto";
type AlAdhanCalendarAPIResponse = {
  [MONTH in string]: { timings: Record<string, string> }[];
};

// TODO: Clean the code
export class MasjidiAlAdhanAPIPrayerTimesStrategy extends MasjidiPrayerTimesStrategy {
  readonly isDayLightSaved = true;

  constructor(
    readonly dependencies: {
      readonly fetcher: ISavedStringFetcher | IStringFetcher;
      readonly apiOptions: AlAdhanAPIOptions;
      readonly protocol?: AutoProtocol;

      readonly savedKey?: string;
    }
  ) {
    super();
  }

  private getProtocol() {
    const protocol = this.dependencies.protocol ?? "auto";

    if (protocol === "auto") {
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

    return protocol;
  }
  async getCalendar() {
    // Fixed leap year for 366 days
    const aladhanAPIUrl = new URL(
      `${this.getProtocol()}://api.aladhan.com/v1/calendar/2024`
    );

    const apiOptionsKeys = Object.keys(
      this.dependencies.apiOptions
    ) as (keyof AlAdhanAPIOptions)[];

    for (const key of apiOptionsKeys) {
      let value = this.dependencies.apiOptions[key];
      if (value === undefined) continue;

      if (key === "tune") {
        value = (value as AlAdhanAPIOptions["tune"])!;

        value = [
          value.Imsak ?? 0,
          value.Fajr ?? 0,
          value.Sunrise ?? 0,
          value.Dhuhr ?? 0,
          value.Asr ?? 0,
          value.Maghrib ?? 0,
          value.Sunset ?? 0,
          value.Isha ?? 0,
          value.Midnight ?? 0,
        ].join(",");
      }

      aladhanAPIUrl.searchParams.set(key, value + "");
    }

    return await this.dependencies.fetcher
      .fetch({
        key: this.dependencies.savedKey! /* TODO: type assert */,
        state: { api: this.dependencies.apiOptions },
        url: aladhanAPIUrl.toString(),
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
