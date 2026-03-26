function warpNumber(value: number, min: number, max: number) {
  const range = max - min + 1;
  return ((((value - min) % range) + range) % range) + min;
}

export class Color {
  constructor(
    readonly r: number,
    readonly g: number,
    readonly b: number,
  ) {}

  toHex() {
    const rHex = this.r.toString(16).padStart(2, "0");
    const gHex = this.g.toString(16).padStart(2, "0");
    const bHex = this.b.toString(16).padStart(2, "0");
    return `#${rHex}${gHex}${bHex}`;
  }

  packRGB() {
    return (this.r << 16) | (this.g << 8) | this.b;
  }

  private _toLinearRGB(c: number) {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }
  toLinearRGB() {
    return new Color(
      this._toLinearRGB(this.r),
      this._toLinearRGB(this.g),
      this._toLinearRGB(this.b),
    );
  }

  toHSL() {
    const max = Math.max(this.r, this.g, this.b);
    const min = Math.min(this.r, this.g, this.b);
    const chroma = max - min;

    const l = (max + min) / 2 / 255;
    const s = chroma === 0 ? 0 : chroma / 255 / (1 - Math.abs(2 * l - 1));

    let h;
    switch (max) {
      case min:
        h = 0;
        break;
      case this.r:
        h = ((this.g - this.b) / chroma) * 60;
        break;
      case this.g:
        h = (2 + (this.b - this.r) / chroma) * 60;
        break;
      case this.b:
        h = (4 + (this.r - this.g) / chroma) * 60;
        break;
      default:
        h = 0;
        break;
    }
    h = warpNumber(h, 0, 360);

    return { h, s, l };
  }

  toCartesian(mode: "rgb" | "hsl" | "oklab" | "oklch"): {
    x: number;
    y: number;
    z: number;
  } {
    switch (mode) {
      case "rgb":
        return { x: this.r, y: this.g, z: this.b };
      case "hsl":
        const { h, s, l } = this.toHSL();
        const hRad = (h * Math.PI) / 180;
        return {
          x: s * Math.cos(hRad),
          y: s * Math.sin(hRad),
          z: l,
        };
      case "oklab":
        const { L, a, b } = this.toOKLAB();
        return { x: L, y: a, z: b };
      case "oklch":
        const { L: L2, C, h: h2 } = this.toOKLCH();
        const h2Rad = (h2 * Math.PI) / 180;

        return {
          x: C * Math.cos(h2Rad),
          y: C * Math.sin(h2Rad),
          z: L2,
        };
    }
  }

  toOKLAB() {
    const linear = this.toLinearRGB();
    const { r: lr, g: lg, b: lb } = linear;

    const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
    const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
    const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

    const l_ = Math.cbrt(l);
    const m_ = Math.cbrt(m);
    const s_ = Math.cbrt(s);

    const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
    const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
    const b2 = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

    return { L, a, b: b2 };
  }
  toOKLCH() {
    const { L, a, b } = this.toOKLAB();
    const C = Math.hypot(a, b);
    const h = (Math.atan2(b, a) * 180) / Math.PI;
    return { L, C, h: (h + 360) % 360 };
  }

  getLuminance() {
    return (this.r * 299 + this.g * 587 + this.b * 114) / 255000;
  }

  getRelativeLuminance(): number {
    const [rs, gs, bs] = [this.r, this.g, this.b].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  getHue() {
    return this.toHSL().h;
  }
  getLightness() {
    return this.toHSL().l;
  }
  getSaturation() {
    return this.toHSL().s;
  }

  getColorfulness() {
    const { C, L } = this.toOKLCH();
    const Cmax = 0.322 * (1 - Math.abs(2 * L - 1));

    if (Cmax <= 0) return 1;

    const normalizedChroma = Math.min(C / Cmax, 1);

    return normalizedChroma;
  }

  getIdealForegroundColor(): Color {
    return this.getRelativeLuminance() > 0.75 ? Color.black : Color.white;
  }

  contrastRatioWith(other: Color): number {
    const L1 = this.getRelativeLuminance();
    const L2 = other.getRelativeLuminance();
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  }

  isVibrant(threshold: number = 0.1): boolean {
    return this.getColorfulness() > threshold;
  }

  hasHigherLuminance(other: Color): boolean {
    return this.getLuminance() > other.getLuminance();
  }

  hasHigherSaturation(other: Color): boolean {
    return this.getSaturation() > other.getSaturation();
  }

  hasHigherColorfulness(other: Color): boolean {
    return this.getColorfulness() > other.getColorfulness();
  }

  interpolateRGB(to: Color, t: number): Color {
    const r = Math.round(this.r + (to.r - this.r) * t);
    const g = Math.round(this.g + (to.g - this.g) * t);
    const b = Math.round(this.b + (to.b - this.b) * t);

    return new Color(r, g, b);
  }
  interpolateOKLCH(to: Color, t: number, longArc = false) {
    const { L: L1, C: C1, h: h1 } = this.toOKLCH();
    const { L: L2, C: C2, h: h2 } = to.toOKLCH();

    const L = L1 + (L2 - L1) * t;
    const C = C1 + (C2 - C1) * t;

    const isGray1 = C1 < 1e-4 || L1 <= 0.01 || L1 >= 0.99;
    const isGray2 = C2 < 1e-4 || L2 <= 0.01 || L2 >= 0.99;

    let h: number;
    if (isGray1 && isGray2) {
      h = h1;
    } else if (isGray1) {
      h = h2;
    } else if (isGray2) {
      h = h1;
    } else {
      let deltaH = h2 - h1;
      if (!longArc) {
        if (deltaH > 180) deltaH -= 360;
        else if (deltaH < -180) deltaH += 360;
      } else {
        if (deltaH > 0 && deltaH < 360) deltaH -= 360;
        else if (deltaH <= 0 && deltaH > -360) deltaH += 360;
      }
      h = h1 + deltaH * t;
    }

    return Color.fromOKLCH(L, C, h);
  }

  distanceRGBTo(other: Color): number {
    const dr = this.r - other.r;
    const dg = this.g - other.g;
    const db = this.b - other.b;
    return Math.hypot(dr, dg, db) / Math.hypot(255, 255, 255);
  }

  distanceLCHHueTo(other: Color) {
    const h1 = this.toOKLCH().h;
    const h2 = other.toOKLCH().h;

    return Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2)) / 180;
  }

  distanceCartesianTo(
    other: Color,
    mode: "rgb" | "hsl" | "oklab" | "oklch",
  ): number {
    const c1 = this.toCartesian(mode);
    const c2 = other.toCartesian(mode);

    return Math.hypot(c1.x - c2.x, c1.y - c2.y, c1.z - c2.z);
  }

  withModifiedOKLCH(cb: (oklch: { L: number; C: number; h: number }) => void) {
    const oklch = this.toOKLCH();
    cb(oklch);

    return Color.fromOKLCH(oklch.L, oklch.C, oklch.h);
  }

  equals(other: Color): boolean {
    return this.r === other.r && this.g === other.g && this.b === other.b;
  }

  static unpackRGB(packed: number): Color {
    const r = (packed >> 16) & 0xff;
    const g = (packed >> 8) & 0xff;
    const b = packed & 0xff;
    return new Color(r, g, b);
  }
  static fromHex(hex: string): Color {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return new Color(r, g, b);
  }
  static fromHSL(h: number, s: number, l: number): Color {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hPrime = h / 60;
    const x = c * (1 - Math.abs((hPrime % 2) - 1));

    let r1 = 0,
      g1 = 0,
      b1 = 0;
    if (hPrime >= 0 && hPrime < 1) {
      r1 = c;
      g1 = x;
      b1 = 0;
    } else if (hPrime >= 1 && hPrime < 2) {
      r1 = x;
      g1 = c;
      b1 = 0;
    } else if (hPrime >= 2 && hPrime < 3) {
      r1 = 0;
      g1 = c;
      b1 = x;
    } else if (hPrime >= 3 && hPrime < 4) {
      r1 = 0;
      g1 = x;
      b1 = c;
    } else if (hPrime >= 4 && hPrime < 5) {
      r1 = x;
      g1 = 0;
      b1 = c;
    } else if (hPrime >= 5 && hPrime < 6) {
      r1 = c;
      g1 = 0;
      b1 = x;
    } else {
      r1 = 0;
      g1 = 0;
      b1 = 0;
    }

    const m = l - c / 2;
    const r = Math.round((r1 + m) * 255);
    const g = Math.round((g1 + m) * 255);
    const b = Math.round((b1 + m) * 255);
    return new Color(r, g, b);
  }
  static fromOKLAB(L: number, a: number, b: number): Color {
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

    const revGamma = (c: number) => {
      const abs = Math.abs(c);
      const res =
        abs <= 0.0031308 ? 12.92 * abs : 1.055 * Math.pow(abs, 1 / 2.4) - 0.055;
      return c < 0 ? -res : res;
    };

    return new Color(
      Math.round(Math.max(0, Math.min(1, revGamma(lr))) * 255),
      Math.round(Math.max(0, Math.min(1, revGamma(lg))) * 255),
      Math.round(Math.max(0, Math.min(1, revGamma(lb))) * 255),
    );
  }
  static fromOKLCH(L: number, C: number, h: number): Color {
    const hRad = (h * Math.PI) / 180;
    const a = C * Math.cos(hRad);
    const b = C * Math.sin(hRad);
    return this.fromOKLAB(L, a, b);
  }

  static readonly white = new Color(255, 255, 255);
  static readonly black = new Color(0, 0, 0);

  static readonly red = new Color(255, 0, 0);
  static readonly green = new Color(0, 255, 0);
  static readonly blue = new Color(0, 0, 255);

  static readonly yellow = new Color(255, 255, 0);
  static readonly cyan = new Color(0, 255, 255);
  static readonly magenta = new Color(255, 0, 255);
}
