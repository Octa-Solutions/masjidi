import { DeepPartial } from "@masjidi/common";
import { MasjidiDate, MasjidiMultiDateCondition } from "@masjidi/core";
import { describe, expect, test } from "vitest";

describe("MasjidiDate.multiConditionMet", () => {
  const createTestDate = (
    overrides: DeepPartial<MasjidiDate>,
  ): MasjidiDate => ({
    time: {
      hours: 0,
      hours12: 0,
      meridiem: "am",
      minutes: 0,
      minuteOfDay: 0,
      seconds: 0,
      secondOfDay: 0,
      ...overrides.time,
    },
    gregorian: {
      dayOfMonth: 1,
      dayOfWeek: 1,
      weekOfMonth: 1,
      month: 1,
      year: 2023,
      ...overrides.gregorian,
    },
    hijri: {
      dayOfMonth: 1,
      dayOfWeek: 1,
      weekOfMonth: 1,
      month: 1,
      year: 1445,
      ...overrides.hijri,
    },
  });

  test('returns true when all specified properties in "when" condition match', () => {
    const date = createTestDate({ time: { hours: 10 } });
    const condition: MasjidiMultiDateCondition = {
      when: { time: { hours: 10 } },
    };
    expect(MasjidiDate.multiConditionMet(condition, date)).toBe(true);
  });

  test('returns false when any property in "when" condition does not match', () => {
    const date = createTestDate({ time: { hours: 11 } });
    const condition: MasjidiMultiDateCondition = {
      when: { time: { hours: 10 } },
    };
    expect(MasjidiDate.multiConditionMet(condition, date)).toBe(false);
  });

  test("returns true when date is within start-end range for all properties", () => {
    const date = createTestDate({ time: { hours: 10 } });
    const condition: MasjidiMultiDateCondition = {
      start: { time: { hours: 9 } },
      end: { time: { hours: 17 } },
    };
    expect(MasjidiDate.multiConditionMet(condition, date)).toBe(true);
  });

  test("returns false when date is outside start-end range for any property", () => {
    const date = createTestDate({ time: { hours: 8 } });
    const condition: MasjidiMultiDateCondition = {
      start: { time: { hours: 9 } },
      end: { time: { hours: 17 } },
    };
    expect(MasjidiDate.multiConditionMet(condition, date)).toBe(false);
  });

  test("handles wrapped ranges correctly (time across midnight)", () => {
    const validDate = createTestDate({ time: { hours: 23 } });
    const invalidDate = createTestDate({ time: { hours: 3 } });
    const condition: MasjidiMultiDateCondition = {
      start: { time: { hours: 22 } },
      end: { time: { hours: 2 } },
    };
    expect(MasjidiDate.multiConditionMet(condition, validDate)).toBe(true);
    expect(MasjidiDate.multiConditionMet(condition, invalidDate)).toBe(false);
  });

  test("ignores properties not defined in both start and end", () => {
    const date = createTestDate({ time: { hours: 8 } });
    const condition: MasjidiMultiDateCondition = {
      start: { time: { hours: 9 } },
      end: {},
    };
    expect(MasjidiDate.multiConditionMet(condition, date)).toBe(true);
  });

  test("validates multiple properties across time, gregorian, and hijri", () => {
    const validDate = createTestDate({
      time: { hours: 10 },
      gregorian: { month: 4 },
      hijri: { dayOfMonth: 15 },
    });
    const invalidDate = createTestDate({
      time: { hours: 10 },
      gregorian: { month: 6 },
    });
    const condition: MasjidiMultiDateCondition = {
      start: {
        time: { hours: 9 },
        gregorian: { month: 3 },
        hijri: { dayOfMonth: 10 },
      },
      end: {
        time: { hours: 17 },
        gregorian: { month: 5 },
        hijri: { dayOfMonth: 20 },
      },
    };
    expect(MasjidiDate.multiConditionMet(condition, validDate)).toBe(true);
    expect(MasjidiDate.multiConditionMet(condition, invalidDate)).toBe(false);
  });

  test("handles exact matches via start-end with same value", () => {
    const date = createTestDate({ time: { hours: 10 } });
    const condition: MasjidiMultiDateCondition = {
      start: { time: { hours: 10 } },
      end: { time: { hours: 10 } },
    };
    expect(MasjidiDate.multiConditionMet(condition, date)).toBe(true);
  });

  test("handles independent props (minuteOfDay)", () => {
    const date = createTestDate({ time: { minuteOfDay: 600 } }); // 10:00
    const condition: MasjidiMultiDateCondition = {
      start: { time: { minuteOfDay: 500 } },
      end: { time: { minuteOfDay: 700 } },
    };
    expect(MasjidiDate.multiConditionMet(condition, date)).toBe(true);

    const invalidDate = createTestDate({ time: { minuteOfDay: 800 } });
    expect(MasjidiDate.multiConditionMet(condition, invalidDate)).toBe(false);
  });

  test("handles wrapped independent props", () => {
    const date = createTestDate({ time: { minuteOfDay: 1400 } });
    const condition: MasjidiMultiDateCondition = {
      start: { time: { minuteOfDay: 1300 } },
      end: { time: { minuteOfDay: 100 } },
    };
    expect(MasjidiDate.multiConditionMet(condition, date)).toBe(true);

    const matchDate = createTestDate({ time: { minuteOfDay: 50 } });
    expect(MasjidiDate.multiConditionMet(condition, matchDate)).toBe(true);

    const noMatchDate = createTestDate({ time: { minuteOfDay: 500 } });
    expect(MasjidiDate.multiConditionMet(condition, noMatchDate)).toBe(false);
  });

  test("returns false if independent prop is missing in date but present in condition", () => {
    // @ts-ignore
    const date: MasjidiDate = { time: {}, gregorian: {}, hijri: {} };
    const condition: MasjidiMultiDateCondition = {
      when: { time: { minuteOfDay: 10 } },
    };
    expect(MasjidiDate.multiConditionMet(condition, date)).toBe(false);
  });

  test("factory method handles hijriDayAdjustment", () => {
    const date = new Date("2023-01-01");
    const mDate = MasjidiDate.factory(date, 1);
    const mDate2 = MasjidiDate.factory(date, 0);
    expect(mDate.hijri.dayOfMonth).not.toBe(mDate2.hijri.dayOfMonth);
  });
});
