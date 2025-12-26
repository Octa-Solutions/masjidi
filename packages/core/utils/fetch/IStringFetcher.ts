export interface IStringFetcher {
  fetch(options: IStringFetcherOptions): Promise<string>;
}

export interface IStringFetcherOptions {
  url: string;
  headers?: Record<string, string> | Headers;
  body?: URLSearchParams | null;
  signal?: AbortSignal;
}
