import { gregorianToHijri } from "@tabby_ai/hijri-converter";

const minGregorian = new Date("1924-08-01 00:00:00");
const maxGregorian = new Date("2077-11-16 23:59:59");

const reusableDate = { day: NaN, month: NaN, year: NaN };
export class Hijri {
  static fromGregorian(date: Date): [number, number, number] {
    if (date >= minGregorian && date <= maxGregorian) {
      reusableDate.day = date.getDate();
      reusableDate.month = date.getMonth() + 1;
      reusableDate.year = date.getFullYear();

      const { day, month, year } = gregorianToHijri(reusableDate);
      return [day, month, year];
    }

    // By 2077, toLocaleDateString should be supported by all browsers
    const formattedHijri = date
      .toLocaleDateString("en-SA-u-ca-islamic-umalqura")
      .match(/(\d+)\/(\d+)\/(\-?\d+)/);

    if (!formattedHijri) {
      throw new Error("Cannot convert date to Hijri");
    }

    const [_, month, day, year] = formattedHijri;
    return [+day, +month, +year];
  }

  static adjust(
    [hijriDay, hijriMonth, hijriYear]: [number, number, number],
    daysOffset: number,
  ): [number, number, number] {
    const DAYS_IN_MONTH = 30;
    const MONTHS_IN_YEAR = 12;
    hijriDay = hijriDay + daysOffset;

    if (hijriDay > DAYS_IN_MONTH) {
      // Adjust it and increase the month
      hijriDay = hijriDay - DAYS_IN_MONTH;
      hijriMonth = hijriMonth + 1;
    }

    if (hijriDay < 1) {
      hijriDay = hijriDay + DAYS_IN_MONTH;
      hijriMonth = hijriMonth - 1;
    }

    if (hijriMonth > 12) {
      // Adjust it and increase the year
      hijriMonth = hijriMonth - MONTHS_IN_YEAR;
      hijriYear = hijriYear + 1;
    }

    if (hijriMonth < 1) {
      // Adjust it and increase the year
      hijriMonth = hijriMonth + MONTHS_IN_YEAR;
      hijriYear = hijriYear - 1;
    }
    return [hijriDay, hijriMonth, hijriYear];
  }

  static getWeekOfMonth(date: readonly [number, number, number]) {
    const day = date[0];

    const dayOfWeek = date[0] - day + (day === 0 ? -6 : 1);
    return Math.floor((dayOfWeek + 10) / 7);
  }
}
