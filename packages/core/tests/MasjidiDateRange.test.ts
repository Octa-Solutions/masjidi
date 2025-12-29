import { DeepPartial } from "@masjidi/common";
import { MasjidiDate, MasjidiMultiDateCondition } from "../src/MasjidiDate";
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

  test("returns true for date within multi-field range", () => {
    const condition: MasjidiMultiDateCondition = {
      start: {
        hijri: {
          month: 7,
          dayOfMonth: 1,
        },
      },
      end: {
        hijri: {
          month: 9,
          dayOfMonth: 1,
        },
      },
    };

    const date = createTestDate({
      hijri: {
        dayOfMonth: 9,
        month: 7,
        year: 1447,
      },
    });

    expect(MasjidiDate.multiConditionMet(condition, date)).toBe(true);
  });

  // TODO: Add more tests
});
