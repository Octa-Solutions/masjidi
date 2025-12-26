/**
 * An interface for fetching string content from a URL.
 */
export interface IStringFetcher {
  /**
   * Fetches content from a URL.
   *
   * @param options - The options for the fetch request.
   * @returns A promise that resolves to the fetched string content.
   */
  fetch(options: IStringFetcherOptions): Promise<string>;
}

/**
 * Options for fetching string content.
 */
export interface IStringFetcherOptions {
  /**
   * The URL to fetch content from.
   */
  url: string;

  /**
   * Optional headers to include in the request.
   */
  headers?: Record<string, string> | Headers;

  /**
   * Optional body to include in the request.
   */
  body?: URLSearchParams | null;

  /**
   * Optional AbortSignal to cancel the request.
   */
  signal?: AbortSignal;
}
