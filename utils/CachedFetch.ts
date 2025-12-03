import { PromiseDebounceBase } from "@/core/utils/decorators";

const globalCache = new Map<string, any>();
const globalDebounceFns = new Map<string, () => Promise<any>>();

type ParseType =
  | "text"
  | "json"
  | "blob"
  | "arrayBuffer"
  | "bytes"
  | "formData";

const getDebouncedFetch = (name: string, parseType: ParseType, src: string) => {
  if (globalDebounceFns.has(name)) {
    return globalDebounceFns.get(name)!;
  }

  const debounceFn = PromiseDebounceBase(async () => {
    if (globalCache.has(name)) {
      return globalCache.get(name);
    }

    if (GLOBAL_FILES[src]) {
      if (parseType === "text") {
        return GLOBAL_FILES[src];
      }
      if (parseType === "json") {
        return JSON.parse(GLOBAL_FILES[src]);
      }
    }

    const response = await fetch(src);
    if (!response.ok) throw new Error(`Failed to fetch ${src}`);

    const result = await response[parseType]();

    globalCache.set(name, result);
    return result;
  });

  globalDebounceFns.set(name, debounceFn);
  return debounceFn;
};

export class CachedFetch {
  static async fetch(parseType: ParseType, src: string) {
    return getDebouncedFetch(src, parseType, src)();
  }
  static async preload(name: string, parseType: ParseType, src: string) {
    await getDebouncedFetch(`preload://${name}`, parseType, src)();
  }
}
