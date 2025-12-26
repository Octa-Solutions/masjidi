import { PromiseDebounceBase } from "@/utils/decorators";
import {
  IStringFetcher,
  IStringFetcherOptions,
} from "@/utils/fetch/IStringFetcher";

/**
 * A fetcher implementation that caches results to avoid redundant network requests.
 * It uses a debounce mechanism to prevent multiple simultaneous requests for the same resource.
 */
export class CachedFetcher implements IStringFetcher {
  private readonly globalCache = new Map<string, string>();
  private readonly globalDebounceFns = new Map<string, () => Promise<string>>();

  /**
   * Creates a new instance of `CachedFetcher`.
   *
   * @param dependencies - The dependencies required by the fetcher.
   * @param dependencies.fetcher - The underlying fetcher to use for making requests.
   * @param dependencies.globalFiles - An optional record of pre-loaded files to serve from cache.
   */
  public constructor(
    readonly dependencies: {
      readonly fetcher: IStringFetcher;
      readonly globalFiles?: Record<string, string>;
    },
  ) {}

  /**
   * Fetches a resource from the cache or the underlying fetcher.
   *
   * @param options - The options for the fetch request.
   * @returns A promise that resolves to the fetched string content.
   */
  async fetch(options: IStringFetcherOptions): Promise<string> {
    return this.getDebouncedFetch(options.url, options)();
  }

  /**
   * Preloads a resource into the cache.
   *
   * @param name - The name to associate with the preloaded resource.
   * @param options - The options for the fetch request.
   */
  public async preload(name: string, options: IStringFetcherOptions) {
    await this.getDebouncedFetch(`preload://${name}`, options)();
  }

  private getDebouncedFetch(name: string, options: IStringFetcherOptions) {
    if (this.globalDebounceFns.has(name))
      return this.globalDebounceFns.get(name)!;

    const debounceFn = PromiseDebounceBase(async () => {
      if (this.globalCache.has(name)) return this.globalCache.get(name)!;

      if (
        this.dependencies.globalFiles &&
        this.dependencies.globalFiles[options.url]
      )
        return this.dependencies.globalFiles[options.url];

      const result = await this.dependencies.fetcher.fetch(options);

      this.globalCache.set(name, result);
      return result;
    });

    this.globalDebounceFns.set(name, debounceFn);
    return debounceFn;
  }
}
