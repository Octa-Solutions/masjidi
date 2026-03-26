import {
  IColorExtractor,
  IColorExtractorOptions,
} from "@/ColorExtractor/IColorExtractor";
import { Color } from "@/utils/Color";

export class HTMLImageColorExtractor implements IColorExtractor {
  readonly canvas = document.createElement("canvas");
  readonly ctx = this.canvas.getContext("2d", { willReadFrequently: true });

  async *allColors(
    url: string,
    options?: IColorExtractorOptions,
  ): AsyncGenerator<Color> {
    if (!this.ctx) return;

    const img = new Image();
    img.crossOrigin = "Anonymous";

    await new Promise((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });

    this.canvas.width = 100;
    this.canvas.height = (img.height / img.width) * 100;
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);

    const data = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    ).data;

    const accuracy = options?.accuracy || 1;

    for (let i = 0; i < data.length; i += 4 * accuracy) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      const isSemiTransparent = a < 200;
      if (isSemiTransparent) continue;

      const roundTo = 1;
      const treatedR = Math.round(r / roundTo) * roundTo;
      const treatedG = Math.round(g / roundTo) * roundTo;
      const treatedB = Math.round(b / roundTo) * roundTo;

      const color = new Color(treatedR, treatedG, treatedB);

      yield color;
    }
  }
}
