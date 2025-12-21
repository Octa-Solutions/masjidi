import { MasjidiDate } from "@/core/MasjidiDate";
import { IPrayer, Prayer } from "@/core/Prayer";
import { describe, expect, it } from "vitest";

const mPrayer = (
  rest: Pick<
    IPrayer,
    "time" | "duration" | "iqamaWaitDuration" | "azkarDuration"
  > &
    Partial<IPrayer>
) =>
  ({
    key: "unknown",
    name: "Prayer",
    timeOffset: 0,
    upcoming: null,
    dateOverrides: [],
    ...rest,
  } satisfies IPrayer);

const mDate = (time: string, dayOffset = 0) =>
  MasjidiDate.factory(
    new Date(`2025-01-${(dayOffset + 1).toString().padStart(2, "0")}T${time}`),
    dayOffset
  );

const mTime = (hours: number, minutes: number) => hours * 60 + minutes;

describe("Prayer", () => {
  describe("time calculations", () => {
    const prayer = Prayer.factory(
      mPrayer({
        time: mTime(5, 0),
        duration: 30,
        iqamaWaitDuration: 15,
        azkarDuration: 10,
      })
    );
    const date = mDate("05:05:00");

    it("stamps", () => {
      expect(prayer.iqamaTime(date)).toBe(mTime(5, 15));
      expect(prayer.finishTime(date)).toBe(mTime(5, 45));
      expect(prayer.azkarFinishTime(date)).toBe(mTime(5, 55));
    });

    it("durations", () => {
      expect(prayer.getTimeLeftForIqamaWait(date) / 60).toBe(-5);
      expect(prayer.getTimeLeftForIqama(date) / 60).toBe(10);
      expect(prayer.getTimeLeftForPrayer(date) / 60).toBe(40);
      expect(prayer.getTimeLeftForAzkar(date) / 60).toBe(50);
    });
  });

  describe("state checks", () => {
    const prayer = Prayer.factory(
      mPrayer({
        time: mTime(5, 0),
        duration: 30,
        iqamaWaitDuration: 15,
        azkarDuration: 10,
      })
    );

    it("should be in iqama wait", () => {
      expect(prayer.isInIqamaWait(mDate("04:59:59"))).toBe(false);
      expect(prayer.isInIqamaWait(mDate("05:00:00"))).toBe(true);

      expect(prayer.isInIqamaWait(mDate("05:10:00"))).toBe(true);

      expect(prayer.isInIqamaWait(mDate("05:14:59"))).toBe(true);
      expect(prayer.isInIqamaWait(mDate("05:15:00"))).toBe(false);
    });

    it("should be in prayer", () => {
      expect(prayer.isInPrayer(mDate("05:14:59"))).toBe(false);
      expect(prayer.isInPrayer(mDate("05:15:00"))).toBe(true);

      expect(prayer.isInPrayer(mDate("05:20:00"))).toBe(true);

      expect(prayer.isInPrayer(mDate("05:44:59"))).toBe(true);
      expect(prayer.isInPrayer(mDate("05:45:00"))).toBe(false);
    });

    it("should be in prayer", () => {
      expect(prayer.isInAzkar(mDate("05:44:59"))).toBe(false);
      expect(prayer.isInAzkar(mDate("05:45:00"))).toBe(true);

      expect(prayer.isInAzkar(mDate("05:50:00"))).toBe(true);

      expect(prayer.isInAzkar(mDate("05:54:59"))).toBe(true);
      expect(prayer.isInAzkar(mDate("05:55:00"))).toBe(false);
    });
  });

  describe("date overrides", () => {
    const prayer = Prayer.factory(
      mPrayer({
        time: mTime(5, 0),
        duration: 30,
        iqamaWaitDuration: 15,
        azkarDuration: 10,
        upcoming: {
          name: "Default Upcoming",
        },
        dateOverrides: [
          {
            date: { gregorian: { year: 2025, month: 1, dayOfMonth: 2 } },
            name: "Override Prayer",
            iqamaWaitDuration: 10,
            duration: 25,
            upcoming: { name: "Override Upcoming", offset: 5 },
          },
        ],
      })
    );
    it("should override values when doesn't match", () => {
      const date = mDate("05:00:00", 1);
      const overriddenSettings = prayer.getOverriddenSettings(date);

      expect(overriddenSettings.name).toBe("Override Prayer");
      expect(overriddenSettings.iqamaWaitDuration).toBe(10);
      expect(overriddenSettings.duration).toBe(25);
      expect(overriddenSettings.upcoming?.name).toBe("Override Upcoming");
      expect(overriddenSettings.upcoming?.offset).toBe(5);
    });

    it("should retain original values when does match", () => {
      const date = mDate("05:00:00", 0);
      const overriddenSettings = prayer.getOverriddenSettings(date);

      expect(overriddenSettings.name).toBe("Prayer");
      expect(overriddenSettings.iqamaWaitDuration).toBe(15);
      expect(overriddenSettings.duration).toBe(30);
      expect(overriddenSettings.upcoming?.name).toBe("Default Upcoming");
      expect(overriddenSettings.upcoming?.offset).toBe(0);
    });

    it("should partially override some properties", () => {
      const prayer = Prayer.factory(
        mPrayer({
          time: mTime(5, 0),
          duration: 30,
          iqamaWaitDuration: 15,
          azkarDuration: 10,
          upcoming: { name: "Default Upcoming", offset: 3 },
          dateOverrides: [
            {
              date: { gregorian: { year: 2025, month: 1, dayOfMonth: 2 } },
              duration: 25,
            },
          ],
        })
      );

      const date = mDate("05:00:00", 1);
      const overriddenSettings = prayer.getOverriddenSettings(date);

      expect(overriddenSettings.name).toBe("Prayer");
      expect(overriddenSettings.iqamaWaitDuration).toBe(15);
      expect(overriddenSettings.duration).toBe(25);
      expect(overriddenSettings.upcoming?.name).toBe("Default Upcoming");
      expect(overriddenSettings.upcoming?.offset).toBe(3);
    });
  });
});
