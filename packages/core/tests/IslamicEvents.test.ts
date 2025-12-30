import { DeepPartial } from "@masjidi/common";
import {
  islamicEvents,
  MasjidiDate,
  MasjidiMultiDateCondition,
} from "@masjidi/core";
import { describe, expect, test } from "vitest";

describe("Islamic Events Range Tests", () => {
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

  const checkEvent = (
    condition: MasjidiMultiDateCondition,
    date: MasjidiDate,
  ) => {
    if (Array.isArray(condition)) {
      return condition.some((c) => MasjidiDate.multiConditionMet(c, date));
    }
    return MasjidiDate.multiConditionMet(condition, date);
  };

  test("WHITE_DAYS matches 13, 14, 15 of any month", () => {
    const event = islamicEvents.WHITE_DAYS;
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 1, dayOfMonth: 13 } }),
      ),
    ).toBe(true);
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 5, dayOfMonth: 14 } }),
      ),
    ).toBe(true);
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 12, dayOfMonth: 15 } }),
      ),
    ).toBe(true);
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 1, dayOfMonth: 12 } }),
      ),
    ).toBe(false);
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 1, dayOfMonth: 16 } }),
      ),
    ).toBe(false);
  });

  test("LAST_10_DAYS_RAMADAN matches 20-30 of month 9", () => {
    const event = islamicEvents.LAST_10_DAYS_RAMADAN;
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 9, dayOfMonth: 20 } }),
      ),
    ).toBe(true);
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 9, dayOfMonth: 25 } }),
      ),
    ).toBe(true);
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 9, dayOfMonth: 30 } }),
      ),
    ).toBe(true);
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 9, dayOfMonth: 19 } }),
      ),
    ).toBe(false);
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 8, dayOfMonth: 25 } }),
      ),
    ).toBe(false);
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 10, dayOfMonth: 1 } }),
      ),
    ).toBe(false);
  });

  test("EID_FITR matches 1-3 of month 10", () => {
    const event = islamicEvents.EID_FITR;
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 10, dayOfMonth: 1 } }),
      ),
    ).toBe(true);
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 10, dayOfMonth: 2 } }),
      ),
    ).toBe(true);
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 10, dayOfMonth: 3 } }),
      ),
    ).toBe(true);
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 10, dayOfMonth: 4 } }),
      ),
    ).toBe(false);
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 9, dayOfMonth: 30 } }),
      ),
    ).toBe(false);
  });

  test("EID_ADHA matches 10-13 of month 12", () => {
    const event = islamicEvents.EID_ADHA;
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 12, dayOfMonth: 10 } }),
      ),
    ).toBe(true);
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 12, dayOfMonth: 12 } }),
      ),
    ).toBe(true);
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 12, dayOfMonth: 13 } }),
      ),
    ).toBe(true);
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 12, dayOfMonth: 9 } }),
      ),
    ).toBe(false);
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 12, dayOfMonth: 14 } }),
      ),
    ).toBe(false);
  });

  test("ASHURA matches 10 of month 1", () => {
    const event = islamicEvents.ASHURA;
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 1, dayOfMonth: 10 } }),
      ),
    ).toBe(true);
    expect(
      checkEvent(event, createTestDate({ hijri: { month: 1, dayOfMonth: 9 } })),
    ).toBe(false);
    expect(
      checkEvent(
        event,
        createTestDate({ hijri: { month: 2, dayOfMonth: 10 } }),
      ),
    ).toBe(false);
  });
});
