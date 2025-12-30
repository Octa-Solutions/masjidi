import * as index from "@masjidi/core";
import { PRAYERS, prayersListFactory } from "@masjidi/core";
import * as providers from "@masjidi/core/providers";
import { describe, expect, test } from "vitest";

describe("Misc", () => {
  test("prayersListFactory", () => {
    const config = {
      Fajr: { name: "Test Fajr", duration: 20 },
      Dhuhr: { name: "Test Dhuhr" },
      Asr: {}, // missing everything
    };
    const list = prayersListFactory(config as any);
    expect(list.length).toBe(3);
    expect(list[0].name).toBe("Test Fajr");
    expect(list[0].duration).toBe(20);
    expect(list[1].name).toBe("Test Dhuhr");
    expect(list[2].name).toBe(""); // default
    expect(list[2].duration).toBe(0); // default
    expect(list[2].iqamaWaitDuration).toBe(0);
    expect(list[2].azkarDuration).toBe(0);
    expect(list[2].timeOffset).toBe(0);
    expect(list[2].dateOverrides).toEqual([]);
    expect(list[2].upcoming).toBe(null);
  });

  test("index exports defined", () => {
    expect(index.Masjidi).toBeDefined();
    expect(index.MasjidiController).toBeDefined();
    expect(index.Prayer).toBeDefined();
    expect(index.PRAYERS).toBeDefined();
    expect(index.prayersListFactory).toBeDefined();
  });

  test("providers exports defined", () => {
    expect(providers.provideMasjidiAlAdhanAPIPrayerTimesStrategy).toBeDefined();
    expect(providers.provideMasjidiTableAPIPrayerTimesStrategy).toBeDefined();
  });

  test("PRAYERS constant", () => {
    expect(PRAYERS).toContain("Fajr");
    expect(PRAYERS).toContain("Isha");
  });
});
