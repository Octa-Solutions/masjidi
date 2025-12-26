import { MasjidiPrayerTimesStrategy } from "@/MasjidiPrayerTimesStrategy";
import {
  IStringFetcher,
  IStringFetcherOptions,
} from "@/utils/fetch/IStringFetcher";
import { ISavedStringFetcher } from "@/utils/fetch/SavedFetcher";

export class MasjidiTableAPIPrayerTimesStrategy extends MasjidiPrayerTimesStrategy {
  readonly isDayLightSaved = false;

  constructor(
    readonly dependencies: {
      readonly fetcher: ISavedStringFetcher | IStringFetcher;
      readonly fetchOptions: IStringFetcherOptions;

      readonly savedKey?: string;
    },
  ) {
    super();
  }

  async getCalendar() {
    return await this.dependencies.fetcher
      .fetch(
        Object.assign(this.dependencies.fetchOptions, {
          key: this.dependencies.savedKey! /* TODO: type assert */,

          state: this.dependencies.fetchOptions.body
            ? Array.from(this.dependencies.fetchOptions.body.entries())
            : null,
        }),
      )
      .then((e) => JSON.parse(e))
      .then((e) =>
        e.map((e: any) =>
          Object.fromEntries(
            Object.entries(e).map(([k, v]: [string, any]) => [
              k,
              v.split(":").map((x: string) => +x),
            ]),
          ),
        ),
      );
  }
}
