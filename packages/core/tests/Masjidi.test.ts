import { Masjidi, MasjidiStatus } from "@/core/Masjidi";
import { MasjidiDate } from "@/core/MasjidiDate";
import { Prayer } from "@/core/Prayer";
import { describe, expect, test } from "vitest";

const createMasjidiDate = (time: string, dayOffset = 0) => {
  return MasjidiDate.factory(createDate(time, dayOffset));
};
const createDate = (time: string, dayOffset = 0) => {
  const date = new Date(`2025-01-0${1 + dayOffset}T${time}`);
  return date;
};

const prayers = [
  new Prayer("fajr", "Fajr", 30, 15, 10, 0, null, [], 5 * 60),
  Prayer.factory({
    key: "sunrise",
    name: "Sunrise",
    duration: 0,
    iqamaWaitDuration: 0,
    azkarDuration: 0,
    timeOffset: 0,
    upcoming: {
      offset: 30,
    },
    dateOverrides: [],
    time: 6 * 60,
  }),
  new Prayer("dhuhr", "Dhuhr", 40, 10, 15, 0, null, [], 12 * 60 + 30),
  new Prayer("isha", "Isha", 45, 20, 20, 0, null, [], 22 * 60),
];

describe("Masjidi", () => {
  describe("prayer detection", () => {
    test("getUpcomingPrayer", () => {
      const masjidi = new Masjidi(createDate("04:00"), 0, [], prayers);
      expect(masjidi.getUpcomingPrayer().key).toBe("fajr");

      masjidi.setNow(createDate("05:15"));
      expect(masjidi.getUpcomingPrayer().key).toBe("sunrise");

      // accounting for upcoming offset
      masjidi.setNow(createDate("06:29"));
      expect(masjidi.getUpcomingPrayer().key).toBe("sunrise");

      masjidi.setNow(createDate("07:15"));
      expect(masjidi.getUpcomingPrayer().key).toBe("dhuhr");

      masjidi.setNow(createDate("23:00"));
      expect(masjidi.getUpcomingPrayer().key).toBe("fajr");
    });

    test("getPreviousPrayer", () => {
      const masjidi = new Masjidi(createDate("04:00"), 0, [], prayers);

      expect(masjidi.getPreviousPrayer().key).toBe("isha");

      masjidi.setNow(createDate("05:15"));
      expect(masjidi.getPreviousPrayer().key).toBe("fajr");

      masjidi.setNow(createDate("23:00"));
      expect(masjidi.getPreviousPrayer().key).toBe("isha");
    });
  });

  describe("current prayer detection", () => {
    test("iqama wait period", () => {
      const masjidi = new Masjidi(createDate("05:10"), 0, [], prayers);
      expect(masjidi.getCurrentInIqamaWaitPrayer()?.key).toBe("fajr");
    });

    test("prayer period", () => {
      const masjidi = new Masjidi(createDate("05:20"), 0, [], prayers);
      expect(masjidi.getCurrentInPrayerPrayer()?.key).toBe("fajr");
    });

    test("azkar period", () => {
      const masjidi = new Masjidi(createDate("05:50"), 0, [], prayers);
      expect(masjidi.getCurrentInAzkarPrayer()?.key).toBe("fajr");
    });
  });

  describe("timing status", () => {
    test("iqama status", () => {
      const masjidi = new Masjidi(createDate("05:10"), 0, [], prayers);
      const status = masjidi.getTimingStatus();
      expect(status.type).toBe("iqama");
      expect(status.secondsLeft).toBe(15 * 60 - 10 * 60);
    });

    test("prayer status", () => {
      const masjidi = new Masjidi(createDate("05:20"), 0, [], prayers);
      const status = masjidi.getTimingStatus();
      expect(status.type).toBe("prayer");
      expect(status.secondsLeft).toBe((30 - 5) * 60);
    });

    test("upcoming status", () => {
      const masjidi = new Masjidi(createDate("12:00"), 0, [], prayers);
      const status = masjidi.getTimingStatus();
      expect(status.type).toBe("upcoming");
      expect(status.secondsLeft).toBe(30 * 60 + 0 * 60);
    });
  });

  test("status detection", () => {
    let masjidi = new Masjidi(createDate("05:10"), 0, [], prayers);
    expect(masjidi.getStatus().status).toBe(MasjidiStatus.Clock);

    masjidi.setNow(createDate("05:50"));
    expect(masjidi.getStatus().status).toBe(MasjidiStatus.Azkar);

    masjidi.setNow(createDate("05:15"));
    expect(masjidi.getStatus().status).toBe(MasjidiStatus.Prayer);
  });

  test("hadith cycling", () => {
    const ahadith = [
      { sanad: "S1", content: "C1", attribution: "A1" },
      { sanad: "S2", content: "C2", attribution: "A2" },
    ];
    const masjidi = new Masjidi(new Date(), 0, ahadith, prayers);

    expect(masjidi.nextHadith()).toBe(ahadith[0]);
    expect(masjidi.nextHadith()).toBe(ahadith[1]);
    expect(masjidi.nextHadith()).toBe(ahadith[0]);
  });
});

describe("Prayer", () => {
  const basePrayer = {
    key: "fajr",
    name: "Fajr",
    duration: 30,
    iqamaWaitDuration: 15,
    azkarDuration: 10,
    timeOffset: 0,
    upcoming: null,
    dateOverrides: [],
    time: 5 * 60,
  };

  describe("time calculations", () => {
    test("iqama time", () => {
      const prayer = Prayer.factory(basePrayer);
      const date = createMasjidiDate("05:00");
      expect(prayer.iqamaTime(date)).toBe(5 * 60 + 15);
    });

    test("finish time", () => {
      const prayer = Prayer.factory(basePrayer);
      const date = createMasjidiDate("05:00");
      expect(prayer.finishTime(date)).toBe(5 * 60 + 15 + 30);
    });
  });

  describe("state checks", () => {
    test("isInIqamaWait", () => {
      const prayer = Prayer.factory(basePrayer);
      expect(prayer.isInIqamaWait(createMasjidiDate("05:10"))).toBe(true);
      expect(prayer.isInIqamaWait(createMasjidiDate("05:16"))).toBe(false);
    });

    test("isInPrayer", () => {
      const prayer = Prayer.factory(basePrayer);
      expect(prayer.isInPrayer(createMasjidiDate("05:20"))).toBe(true);
      expect(prayer.isInPrayer(createMasjidiDate("05:50"))).toBe(false);
    });
  });

  describe("date overrides", () => {
    test("applying overrides", () => {
      const prayer = Prayer.factory({
        ...basePrayer,
        dateOverrides: [
          {
            date: { gregorian: { month: 1, dayOfMonth: 1 } },
            iqamaWaitDuration: 30,
          },
        ],
      });
      const matchingDate = MasjidiDate.factory(new Date("2025-01-01T05:00"));
      const nonMatchingDate = MasjidiDate.factory(new Date("2025-01-02T05:00"));

      expect(prayer.getOverriddenSettings(matchingDate).iqamaWaitDuration).toBe(
        30
      );
      expect(
        prayer.getOverriddenSettings(nonMatchingDate).iqamaWaitDuration
      ).toBe(15);
    });
  });

  test("time left calculations", () => {
    const prayer = Prayer.factory(basePrayer);
    const date = createMasjidiDate("05:10");
    expect(prayer.getTimeLeftForIqama(date)).toBe(
      (5 * 60 + 15) * 60 - (5 * 60 * 60 + 10 * 60)
    );
  });
});
