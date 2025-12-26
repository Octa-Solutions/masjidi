import { PromiseDebounceBase } from "@/utils/decorators";
import {
  IStringFetcher,
  IStringFetcherOptions,
} from "@/utils/fetch/IStringFetcher";

export class CachedFetcher implements IStringFetcher {
  private readonly globalCache = new Map<string, string>();
  private readonly globalDebounceFns = new Map<string, () => Promise<string>>();

  public constructor(
    readonly dependencies: {
      readonly fetcher: IStringFetcher;
      readonly globalFiles?: Record<string, string>;
    },
  ) {}

  async fetch(options: IStringFetcherOptions): Promise<string> {
    return this.getDebouncedFetch(options.url, options)();
  }

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
