import { MasjidiPrayerTimesStrategy } from "@/MasjidiPrayerTimesStrategy";
import {
  ISavedStringFetcher,
  IStringFetcher,
  IStringFetcherOptions,
} from "@masjidi/common";

/**
 * A prayer times strategy that fetches data from a table-based API (e.g., a JSON file).
 */
export class MasjidiTableAPIPrayerTimesStrategy extends MasjidiPrayerTimesStrategy {
  readonly isDayLightSaved = false;

  /**
   * Creates a new instance of `MasjidiTableAPIPrayerTimesStrategy`.
   *
   * @param dependencies - The dependencies required for the strategy.
   * @param dependencies.fetcher - The fetcher to use for making requests.
   * @param dependencies.fetchOptions - The options for the fetch request.
   * @param dependencies.savedKey - The key to use for saving/caching the data.
   */
  constructor(
    readonly dependencies: {
      readonly fetcher: ISavedStringFetcher | IStringFetcher;
      readonly fetchOptions: IStringFetcherOptions;

      readonly savedKey?: string;
    },
  ) {
    super();
  }

  /**
   * Retrieves the prayer timings from the table API.
   *
   * @returns A promise that resolves to `MasjidiPrayerTimings`.
   */
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
