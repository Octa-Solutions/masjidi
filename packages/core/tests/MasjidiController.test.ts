import {
  Masjidi,
  MasjidiController,
  MasjidiPrayerTimesStrategy,
  Prayer,
} from "@masjidi/core";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

class MockStrategy extends MasjidiPrayerTimesStrategy {
  isDayLightSaved = false;
  async getCalendar() {
    const timings = Array.from({ length: 366 }, () => ({
      fajr: [5, 0] as [number, number],
      dhuhr: [12, 0] as [number, number],
      asr: [15, 0] as [number, number],
      maghrib: [18, 0] as [number, number],
      isha: [20, 0] as [number, number],
    }));
    return timings;
  }
}

const prayers = [
  new Prayer("fajr", "Fajr", 30, 15, 10, 0, null, [], 5 * 60),
  new Prayer("dhuhr", "Dhuhr", 40, 10, 15, 0, null, [], 12 * 60),
];

describe("MasjidiController", () => {
  let masjidi: Masjidi;
  let strategy: MockStrategy;
  let controller: MasjidiController;

  beforeEach(() => {
    vi.useFakeTimers();
    masjidi = new Masjidi(new Date("2025-01-01T04:00:00"), 0, [], prayers);
    strategy = new MockStrategy();
    controller = new MasjidiController(masjidi, {
      timesStrategy: strategy,
      hadithInterval: 10000,
    });
  });

  afterEach(() => {
    controller.destroy();
    vi.useRealTimers();
  });

  test("initialization and fetch", async () => {
    const timings = await controller.fetch();
    expect(timings.length).toBe(366);
    expect(controller.fetch()).toBe(controller.fetch()); // should return same promise
  });

  test("start and tick", async () => {
    const initSpy = vi.fn();
    const tickSpy = vi.fn();
    controller.on("init", initSpy);
    controller.on("tick", tickSpy);

    await controller.start();

    expect(tickSpy).toHaveBeenCalledWith(true);

    vi.advanceTimersByTime(1000);
    expect(tickSpy).toHaveBeenCalledWith(false);
  });

  test("hadith rotation", async () => {
    const ahadith = [
      { sanad: "S1", content: "C1", attribution: "A1" },
      { sanad: "S2", content: "C2", attribution: "A2" },
    ];
    masjidi = new Masjidi(new Date("2025-01-01T04:00:00"), 0, ahadith, prayers);
    controller = new MasjidiController(masjidi, {
      timesStrategy: strategy,
      hadithInterval: 1000,
    });

    const hadithSpy = vi.fn();
    controller.on("hadith", hadithSpy);

    await controller.start();
    expect(hadithSpy).toHaveBeenCalledWith(ahadith[0]);

    vi.advanceTimersByTime(1000);
    expect(hadithSpy).toHaveBeenCalledWith(ahadith[1]);
  });

  test("day change event", async () => {
    const daySpy = vi.fn();
    controller.on("day", daySpy);

    await controller.start();

    // Initial now is 04:00. Advance by 20 hours to reach 00:00 next day
    vi.advanceTimersByTime(20 * 60 * 60 * 1000);

    expect(daySpy).toHaveBeenCalled();
  });

  test("destroy clears intervals", async () => {
    await controller.start();
    const tickSpy = vi.fn();
    controller.on("tick", tickSpy);

    controller.destroy();
    vi.advanceTimersByTime(1000);
    expect(tickSpy).not.toHaveBeenCalled();
  });

  test("calling start twice clears existing intervals", async () => {
    await controller.start();
    const oldTickInterval = (controller as any).tickInterval;
    await controller.start();
    const newTickInterval = (controller as any).tickInterval;
    expect(newTickInterval).not.toBe(oldTickInterval);
  });

  test("adhan offset function", async () => {
    let adhanOffset: (() => number) | undefined;
    controller.on("adhan", (prayer, offset) => {
      adhanOffset = offset;
    });

    await controller.start();

    // Move to Fajr time (05:00)
    vi.advanceTimersByTime(60 * 60 * 1000 + 1000);
    expect(adhanOffset).toBeDefined();
    if (adhanOffset) {
      expect(adhanOffset()).toBe(1);
      vi.advanceTimersByTime(1000);
      expect(adhanOffset()).toBe(2);
    }
  });

  test("tick returns early if startTime or timings is null", async () => {
    // This is hard to trigger normally but we can try calling private tick
    (controller as any).startTime = null;
    expect((controller as any).tick(true)).toBeUndefined();
  });

  test("adhan and iqama events", async () => {
    const adhanSpy = vi.fn();
    const iqamaSpy = vi.fn();
    controller.on("adhan", adhanSpy);
    controller.on("iqama", iqamaSpy);

    await controller.start();

    // Move to Fajr time (05:00)
    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(adhanSpy).toHaveBeenCalled();

    // Move to Iqama time (05:15)
    vi.advanceTimersByTime(15 * 60 * 1000);
    expect(iqamaSpy).toHaveBeenCalled();
  });

  test("start without hadithInterval", async () => {
    const controllerNoHadith = new MasjidiController(masjidi, {
      timesStrategy: strategy,
    });
    await controllerNoHadith.start();
    expect((controllerNoHadith as any).hadithInterval).toBeNull();
    controllerNoHadith.destroy();
  });

  test("isDayLightSaved = true branch", async () => {
    const strategyDST = new MockStrategy();
    strategyDST.isDayLightSaved = true;
    const controllerDST = new MasjidiController(masjidi, {
      timesStrategy: strategyDST,
    });
    await controllerDST.start();
    // Just ensure it runs without error
    controllerDST.destroy();
  });
});
