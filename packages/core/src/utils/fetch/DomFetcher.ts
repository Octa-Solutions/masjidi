import {
  IStringFetcher,
  IStringFetcherOptions,
} from "@/utils/fetch/IStringFetcher";

export class DomFetcher implements IStringFetcher {
  async fetch(options: IStringFetcherOptions): Promise<string> {
    return await fetch(options.url, options).then((e) => e.text());
  }
}
