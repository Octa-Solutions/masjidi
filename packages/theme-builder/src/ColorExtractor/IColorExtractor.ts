import { Color } from "@/utils/Color";

export interface IColorExtractorOptions {
  accuracy?: number;
}

export interface IColorExtractor {
  allColors(
    url: string,
    options?: IColorExtractorOptions,
  ): AsyncGenerator<Color>;
}
