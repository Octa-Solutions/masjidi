import { Hijri } from "@/utils/Hijri";

export interface MasjidiDate {
  readonly time: {
    readonly hours: number;
    readonly hours12: number;
    readonly meridiem: "am" | "pm";

    readonly minutes: number;
    readonly minuteOfDay: number;

    readonly seconds: number;
    readonly secondOfDay: number;
  };
  readonly gregorian: {
    readonly dayOfMonth: number;
    readonly dayOfWeek: number;
    readonly month: number;
    readonly year: number;
  };
  readonly hijri: {
    readonly dayOfMonth: number;
    readonly dayOfWeek: number;
    readonly month: number;
    readonly year: number;
  };
}

export namespace MasjidiDate {
  export function factory(gregorian: Date): MasjidiDate {
    const hijri = Hijri.fromGregorian(gregorian);
    return {
      time: {
        hours: gregorian.getHours(),
        hours12: gregorian.getHours() % 12,
        meridiem: gregorian.getHours() < 12 ? "am" : "pm",
        minutes: gregorian.getMinutes(),
        minuteOfDay: gregorian.getMinutes() + gregorian.getHours() * 60,
        seconds: gregorian.getSeconds(),
        secondOfDay:
          gregorian.getSeconds() +
          gregorian.getMinutes() * 60 +
          gregorian.getHours() * 60 * 60,
      },
      gregorian: {
        dayOfMonth: gregorian.getDate(),
        dayOfWeek: gregorian.getDay() + 1,
        month: gregorian.getMonth() + 1,
        year: gregorian.getFullYear(),
      },
      hijri: {
        dayOfMonth: hijri[0],
        dayOfWeek: gregorian.getDay() + 1,
        month: hijri[1],
        year: hijri[2],
      },
    } as const;
  }
  export function matches(date: MasjidiDate, test: DeepPartial<MasjidiDate>) {
    // prettier-ignore
    return (
      (test.time?.minutes         === undefined || date.time.minutes === test.time.minutes) &&
      (test.time?.minuteOfDay     === undefined || date.time.minuteOfDay === test.time.minuteOfDay) &&
      (test.time?.seconds         === undefined || date.time.seconds === test.time.seconds) &&
      (test.time?.secondOfDay     === undefined || date.time.secondOfDay === test.time.secondOfDay) &&
      (test.gregorian?.dayOfMonth === undefined || date.gregorian.dayOfMonth === test.gregorian.dayOfMonth) &&
      (test.gregorian?.dayOfWeek  === undefined || date.gregorian.dayOfWeek === test.gregorian.dayOfWeek) &&
      (test.gregorian?.month      === undefined || date.gregorian.month === test.gregorian.month) &&
      (test.gregorian?.year       === undefined || date.gregorian.year === test.gregorian.year) &&
      (test.hijri?.dayOfMonth     === undefined || date.hijri.dayOfMonth === test.hijri.dayOfMonth) &&
      (test.hijri?.dayOfWeek      === undefined || date.hijri.dayOfWeek === test.hijri.dayOfWeek) &&
      (test.hijri?.month          === undefined || date.hijri.month === test.hijri.month) &&
      (test.hijri?.year           === undefined || date.hijri.year === test.hijri.year)
    );
  }
}
