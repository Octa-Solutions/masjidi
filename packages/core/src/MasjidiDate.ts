import { DateUtils, DeepPartial, DeepReadonly, Hijri } from "@masjidi/common";

/**
 * Interface representing a date in the Masjidi application.
 * It includes time, Gregorian date, and Hijri date components.
 */
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
    readonly weekOfMonth: number;
    readonly month: number;
    readonly year: number;
  };
  readonly hijri: {
    readonly dayOfMonth: number;
    readonly dayOfWeek: number;
    readonly weekOfMonth: number;
    readonly month: number;
    readonly year: number;
  };
}

/**
 * Type representing a condition for matching a `MasjidiDate`.
 * It allows partial matching of time, Gregorian, and Hijri components.
 */
export type MasjidiDateCondition = DeepPartial<
  DeepReadonly<{
    time: {
      hours: number;

      minutes: number;
      minuteOfDay: number;

      seconds: number;
      secondOfDay: number;
    };
    gregorian: {
      dayOfMonth: number;
      dayOfWeek: number;
      weekOfMonth: number;
      month: number;
      year: number;
    };
    hijri: {
      dayOfMonth: number;
      dayOfWeek: number;
      weekOfMonth: number;
      month: number;
      year: number;
    };
  }>
>;

/**
 * Type representing a multi-condition for matching a `MasjidiDate`.
 * It can be a range (start/end) or a single point (when).
 */
export type MasjidiMultiDateCondition =
  | {
      start: MasjidiDateCondition;
      end: MasjidiDateCondition;
    }
  | {
      when: MasjidiDateCondition;
    };

/**
 * Namespace containing utility functions for `MasjidiDate`.
 */
export namespace MasjidiDate {
  /**
   * Creates a `MasjidiDate` from a Gregorian date.
   *
   * @param gregorian - The Gregorian date.
   * @param hijriDayAdjustment - The adjustment for the Hijri date in days. Defaults to 0.
   * @returns A new `MasjidiDate` object.
   */
  export function factory(
    gregorian: Date,
    hijriDayAdjustment: number = 0,
  ): MasjidiDate {
    let hijri = Hijri.fromGregorian(gregorian);

    if (hijriDayAdjustment !== 0) {
      hijri = Hijri.adjust(hijri, hijriDayAdjustment);
    }

    const hours = gregorian.getHours();
    return {
      time: {
        hours: hours,
        hours12: hours === 12 || hours === 0 ? 12 : hours % 12,
        meridiem: hours < 12 ? "am" : "pm",
        minutes: gregorian.getMinutes(),
        minuteOfDay: gregorian.getMinutes() + hours * 60,
        seconds: gregorian.getSeconds(),
        secondOfDay:
          gregorian.getSeconds() +
          gregorian.getMinutes() * 60 +
          hours * 60 * 60,
      },
      gregorian: {
        dayOfMonth: gregorian.getDate(),
        dayOfWeek: gregorian.getDay() + 1,
        weekOfMonth: DateUtils.getWeekOfMonth(gregorian),
        month: gregorian.getMonth() + 1,
        year: gregorian.getFullYear(),
      },
      hijri: {
        dayOfMonth: hijri[0],
        dayOfWeek: gregorian.getDay() + 1,
        weekOfMonth: Hijri.getWeekOfMonth(hijri),
        month: hijri[1],
        year: hijri[2],
      },
    } as const;
  }

  /**
   * Checks if a `MasjidiDate` matches a given condition.
   *
   * @param date - The date to check.
   * @param test - The condition to match against.
   * @returns `true` if the date matches the condition, `false` otherwise.
   */
  export function matches(date: MasjidiDate, test: MasjidiDateCondition) {
    return MasjidiDate.multiConditionMet({ when: test }, date);
  }

  /**
   * Checks if a `MasjidiDate` matches a multi-condition (range or single point).
   *
   * @param condition - The multi-condition to check.
   * @param date - The date to check.
   * @returns `true` if the date matches the condition, `false` otherwise.
   */
  export function multiConditionMet(
    condition: MasjidiMultiDateCondition,
    date: MasjidiDate,
  ) {
    const start = "when" in condition ? condition.when : condition.start;
    const end = "when" in condition ? condition.when : condition.end;

    const props = {
      time: ["hours", "minutes", "minuteOfDay", "seconds", "secondOfDay"],
      gregorian: ["dayOfMonth", "dayOfWeek", "weekOfMonth", "month", "year"],
      hijri: ["dayOfMonth", "dayOfWeek", "weekOfMonth", "month", "year"],
    } as const;

    for (const prop in props) {
      const propCondition = props[prop as keyof typeof props];
      for (const conditionProp of propCondition) {
        // @ts-ignore
        const startValue = start[prop]?.[conditionProp];
        // @ts-ignore
        const endValue = end[prop]?.[conditionProp];
        // @ts-ignore
        const dateValue = date[prop]?.[conditionProp];

        if (startValue === undefined || endValue === undefined) continue;
        if (dateValue === undefined) return false;
        if (startValue <= endValue) {
          if (dateValue < startValue || dateValue > endValue) return false;
        } else {
          if (dateValue < startValue && dateValue > endValue) return false;
        }
      }
    }

    return true;
  }
}
