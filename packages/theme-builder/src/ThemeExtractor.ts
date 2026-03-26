import { DominantColorExtractor } from "@/DominantColorExtractor";
import { Color } from "@/utils/Color";

export interface IThemeExtractorOptions {
  colors: Color[];
  theme: "light" | "dark";
}

export interface Theme {
  ui: Color;
  text: Color;
  darkerText: Color;
  brightText: Color;
  border: Color;
  subtle: Color;
  background: Color;
  pattern: Color;
}
export interface ThemeResult {
  theme: Theme;
  dominantColors: Color[];
  colors: Color[];
}

export const DEFAULT_THEMES = {
  light: {
    ui: Color.fromHex("#ffffff"),
    text: Color.fromHex("#5b5b5b"),
    darkerText: Color.fromHex("#2d5eeb"),
    brightText: Color.fromHex("#ffffff"),
    border: Color.fromHex("#2d5eeb"),
    subtle: Color.fromHex("#e6e6e6"),
    background: Color.fromHex("#ffffff"),
    pattern: Color.fromHex("#cbd7fa"),
  },
  dark: {
    ui: Color.fromHex("#14192b"),
    text: Color.fromHex("#a9b2c0"),
    darkerText: Color.fromHex("#2d5eeb"),
    brightText: Color.fromHex("#ffffff"),
    border: Color.fromHex("#2d5eeb"),
    subtle: Color.fromHex("#5C81EF"),
    background: Color.fromHex("#0F1320"),
    pattern: Color.fromHex("#0F1320"),
  },
} satisfies Record<"light" | "dark", Theme>;

export class ThemeExtractor {
  constructor(readonly dominantColorExtractor: DominantColorExtractor) {}

  themeFromSimpleColors(
    theme: "light" | "dark",
    primary: Color,
    secondary: Color,
    ui: Color,
    border: Color,
  ): Theme {
    const themeSign = theme === "light" ? 1 : -1;

    // TODO: Add color hint
    const brightText = primary.getIdealForegroundColor();

    const background =
      theme === "light"
        ? Color.white.interpolateOKLCH(secondary, 0.1)
        : Color.black.interpolateOKLCH(secondary, 0.1);

    const pattern = (
      theme === "light" ? Color.fromHex("#c7a04d") : Color.fromHex("#433a28")
    ).interpolateOKLCH(secondary, 0.5);

    const subtle = ui.withModifiedOKLCH((oklch) => {
      oklch.L -= themeSign * 0.1;
      oklch.L = Math.min(1, Math.max(0, oklch.L));
    });

    return {
      ui,
      text: secondary,
      darkerText: primary,
      brightText,
      border,
      subtle,
      background,
      pattern,
    };
  }

  themeFromPrimaryAndSecondary(
    primary: Color,
    secondary: Color,
    theme: "light" | "dark",
  ): Theme {
    const themeSign = theme === "light" ? 1 : -1;

    const ui =
      theme === "light"
        ? Color.white.interpolateOKLCH(primary, 0.05)
        : Color.black.interpolateOKLCH(primary, 0.25);

    const stretchColorLightnessContrast = (color: Color) =>
      color.withModifiedOKLCH((oklch) => {
        const weight = Math.E ** (-7.5 * (color.contrastRatioWith(ui) / 21));

        oklch.L *= 1 - 0.5 * weight * themeSign;
      });

    const primaryAdjusted = stretchColorLightnessContrast(primary);
    const secondaryAdjusted = stretchColorLightnessContrast(secondary);

    const border = primaryAdjusted.hasHigherColorfulness(secondaryAdjusted)
      ? primaryAdjusted
      : secondaryAdjusted;

    const { background, pattern, subtle, brightText } =
      this.themeFromSimpleColors(
        theme,
        primaryAdjusted,
        secondaryAdjusted,
        ui,
        border,
      );

    return {
      ui,
      text: secondaryAdjusted,
      darkerText: primaryAdjusted,
      brightText,
      border,
      subtle,
      background,
      pattern,
    };
  }

  themeFromPrimary(primary: Color, theme: "light" | "dark"): Theme {
    const secondary = this.computeSecondaryFromPrimary(primary, theme);

    return this.themeFromPrimaryAndSecondary(primary, secondary, theme);
  }

  private computeDarkSecondaryFromPrimary(primary: Color) {
    return Color.white.interpolateOKLCH(primary, 0.25);
  }

  private computeSecondaryFromPrimary(
    primary: Color,
    theme: "light" | "dark",
  ): Color {
    if (theme === "dark") return this.computeDarkSecondaryFromPrimary(primary);

    const secondary = primary.withModifiedOKLCH((oklch) => {
      oklch.L *= 0.9;
      oklch.C *= 0.9;
      oklch.h += 180;
    });

    return secondary;
  }

  private determinePrimaryColor(
    theme: "light" | "dark",
    colorA: Color,
    colorB: Color,
  ) {
    const colorAIsVibrant = colorA.isVibrant(0.1);
    const colorBIsGray = !colorB.isVibrant(0.1);

    if (colorAIsVibrant && colorBIsGray) return theme === "light" ? "A" : "B";

    return colorA.hasHigherLuminance(colorB)
      ? theme === "light"
        ? "A"
        : "B"
      : theme === "light"
        ? "B"
        : "A";
  }

  async extractTheme(
    options: IThemeExtractorOptions,
  ): Promise<ThemeResult | undefined> {
    const colors = options.colors.filter((color) =>
      options.theme === "light"
        ? color.getLuminance() >= 0.05 &&
          color.getLuminance() <= 0.75 &&
          color.getSaturation() >= 0.0
        : color.getLuminance() >= 0.25 && color.getLuminance() <= 0.95,
    );

    if (colors.length === 0) {
      return {
        theme: DEFAULT_THEMES[options.theme],
        dominantColors: [],
        colors: [],
      };
    }

    const dominantColorsResult =
      await this.dominantColorExtractor.getDominantColors(colors);

    const dominantColors = dominantColorsResult.map((e) => e.color);

    if (dominantColorsResult.length === 0) {
      return {
        theme: DEFAULT_THEMES[options.theme],
        dominantColors: [],
        colors: [],
      };
    }

    if (dominantColorsResult.length === 1) {
      const primary = dominantColors[0];

      return {
        theme: this.themeFromPrimary(primary, options.theme),
        dominantColors,
        colors,
      };
    }

    const firstComprehensiveVibrantColor = dominantColorsResult.find((c) =>
      c.color.isVibrant(0.1),
    );
    const firstDominantComprehensiveColor = firstComprehensiveVibrantColor!;
    const firstDominantColor = firstDominantComprehensiveColor!.color;

    const possibleSecondDominantComprehensiveColors =
      dominantColorsResult.filter((c) => c !== firstDominantComprehensiveColor);

    const secondDominantColor = possibleSecondDominantComprehensiveColors
      .map(
        (e) =>
          [
            Math.log(1 + e.score / 100) *
              firstDominantColor.distanceLCHHueTo(e.color),
            e.color,
          ] as const,
      )
      .sort((a, b) => b[0] - a[0])[0][1];

    const determinedPrimaryColor = this.determinePrimaryColor(
      options.theme,
      firstDominantColor,
      secondDominantColor,
    );

    const primary =
      determinedPrimaryColor === "A" ? firstDominantColor : secondDominantColor;

    const secondary =
      options.theme === "dark"
        ? this.computeDarkSecondaryFromPrimary(primary)
        : determinedPrimaryColor === "A"
          ? secondDominantColor
          : firstDominantColor;

    const theme = this.themeFromPrimaryAndSecondary(
      primary,
      secondary,
      options.theme,
    );

    return {
      theme,
      dominantColors,
      colors,
    };
  }
}
