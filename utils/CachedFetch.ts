import { PromiseDebounceBase } from "@/core/utils/decorators";

type ParseType =
  | "text"
  | "json"
  | "blob"
  | "arrayBuffer"
  | "bytes"
  | "formData";

export class CachedFetch {
  private readonly globalFiles: Record<string, string>;
  private readonly globalCache = new Map<string, any>();
  private readonly globalDebounceFns = new Map<string, () => Promise<any>>();

  public constructor(options: { globalFiles?: Record<string, string> } = {}) {
    this.globalFiles = options.globalFiles ?? {};
  }

  public async fetch(parseType: ParseType, src: string) {
    return this.getDebouncedFetch(src, parseType, src)();
  }
  public async preload(name: string, parseType: ParseType, src: string) {
    await this.getDebouncedFetch(`preload://${name}`, parseType, src)();
  }

  private getDebouncedFetch(name: string, parseType: ParseType, src: string) {
    if (this.globalDebounceFns.has(name))
      return this.globalDebounceFns.get(name)!;

    const debounceFn = PromiseDebounceBase(async () => {
      if (this.globalCache.has(name)) return this.globalCache.get(name);

      if (this.globalFiles[src]) {
        if (parseType === "text") return this.globalFiles[src];
        if (parseType === "json") return JSON.parse(this.globalFiles[src]);
      }

      const response = await fetch(src);
      if (!response.ok) throw new Error(`Failed to fetch ${src}`);

      const result = await response[parseType]();

      this.globalCache.set(name, result);
      return result;
    });

    this.globalDebounceFns.set(name, debounceFn);
    return debounceFn;
  }
}

export const provideCachedFetch = (
  ...params: ConstructorParameters<typeof CachedFetch>
) => new CachedFetch(...params);
