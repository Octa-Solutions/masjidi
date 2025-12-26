import {
  IStringFetcher,
  IStringFetcherOptions,
} from "@/utils/fetch/IStringFetcher";

/**
 * A fetcher implementation that uses the browser's `fetch` API.
 */
export class DomFetcher implements IStringFetcher {
  /**
   * Fetches a resource using the browser's `fetch` API.
   *
   * @param options - The options for the fetch request.
   * @returns A promise that resolves to the fetched string content.
   */
  async fetch(options: IStringFetcherOptions): Promise<string> {
    return await fetch(options.url, options).then((e) => e.text());
  }
}
