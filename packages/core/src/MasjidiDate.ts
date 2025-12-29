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

    const hierarchicalGroups = [
      {
        prop: "time",
        fields: ["hours", "minutes", "seconds"],
        multipliers: [3600, 60, 1],
      },
      {
        prop: "gregorian",
        fields: ["year", "month", "dayOfMonth"],
        multipliers: [10000, 100, 1],
      },
      {
        prop: "hijri",
        fields: ["year", "month", "dayOfMonth"],
        multipliers: [10000, 100, 1],
      },
    ] as const;

    const independentProps = {
      time: ["minuteOfDay", "secondOfDay"],
      gregorian: ["dayOfWeek", "weekOfMonth"],
      hijri: ["dayOfWeek", "weekOfMonth"],
    } as const;

    for (const group of hierarchicalGroups) {
      let startVal = 0;
      let endVal = 0;
      let dateVal = 0;
      let hasCondition = false;

      for (let i = 0; i < group.fields.length; i++) {
        const field = group.fields[i];
        // @ts-ignore
        const s = start[group.prop]?.[field];
        // @ts-ignore
        const e = end[group.prop]?.[field];
        // @ts-ignore
        const d = date[group.prop]?.[field];

        if (s !== undefined && e !== undefined) {
          startVal += s * group.multipliers[i];
          endVal += e * group.multipliers[i];
          dateVal += d * group.multipliers[i];
          hasCondition = true;
        } else if (s !== undefined || e !== undefined) {
          // If only one is defined, we can't do a hierarchical range check easily
          // but the current logic requires both to be defined to act as a range.
          // If they are different, we ignore them for hierarchical check and they might be checked independently if added to independentProps.
          // However, for year/month/day, they should usually be used together.
        }
      }

      if (hasCondition) {
        if (startVal <= endVal) {
          if (dateVal < startVal || dateVal > endVal) return false;
        } else {
          // Wrapped range
          if (dateVal < startVal && dateVal > endVal) return false;
        }
      }
    }

    for (const prop in independentProps) {
      const fields = independentProps[prop as keyof typeof independentProps];
      for (const field of fields) {
        // @ts-ignore
        const s = start[prop]?.[field];
        // @ts-ignore
        const e = end[prop]?.[field];
        // @ts-ignore
        const d = date[prop]?.[field];

        if (s === undefined || e === undefined) continue;
        if (d === undefined) return false;

        if (s <= e) {
          if (d < s || d > e) return false;
        } else {
          if (d < s && d > e) return false;
        }
      }
    }

    return true;
  }
}
