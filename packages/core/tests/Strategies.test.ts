import {
  MasjidiAlAdhanAPIPrayerTimesStrategy,
  MasjidiTableAPIPrayerTimesStrategy,
} from "@masjidi/core";
import {
  provideMasjidiAlAdhanAPIPrayerTimesStrategy,
  provideMasjidiTableAPIPrayerTimesStrategy,
} from "@masjidi/core/providers";
import { describe, expect, test, vi } from "vitest";

describe("Strategies", () => {
  test("providers", () => {
    const aladhan = provideMasjidiAlAdhanAPIPrayerTimesStrategy({
      fetcher: {} as any,
      apiOptions: {},
    });
    expect(aladhan).toBeInstanceOf(MasjidiAlAdhanAPIPrayerTimesStrategy);

    const table = provideMasjidiTableAPIPrayerTimesStrategy({
      fetcher: {} as any,
      fetchOptions: { url: "test" },
    });
    expect(table).toBeInstanceOf(MasjidiTableAPIPrayerTimesStrategy);
  });

  describe("MasjidiTableAPIPrayerTimesStrategy", () => {
    test("fetches and parses timings", async () => {
      const mockData = [{ fajr: "05:00", dhuhr: "12:00" }];
      const fetcher = {
        fetch: vi.fn().mockResolvedValue(JSON.stringify(mockData)),
      };

      const strategy = new MasjidiTableAPIPrayerTimesStrategy({
        fetcher: fetcher as any,
        fetchOptions: { url: "test" },
        savedKey: "key",
      });

      const result = await strategy.getCalendar();
      expect(result[0].fajr).toEqual([5, 0]);
      expect(result[0].dhuhr).toEqual([12, 0]);
      expect(fetcher.fetch).toHaveBeenCalled();
    });

    test("handles body in fetchOptions", async () => {
      const body = new Map([["a", "b"]]);
      const fetcher = {
        fetch: vi.fn().mockResolvedValue(JSON.stringify([])),
      };
      const strategy = new MasjidiTableAPIPrayerTimesStrategy({
        fetcher: fetcher as any,
        fetchOptions: { url: "test", body } as any,
        savedKey: "key",
      });
      await strategy.getCalendar();
      expect(fetcher.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          state: [["a", "b"]],
        }),
      );
    });

    test("handles no body in fetchOptions", async () => {
      const fetcher = {
        fetch: vi.fn().mockResolvedValue(JSON.stringify([])),
      };
      const strategy = new MasjidiTableAPIPrayerTimesStrategy({
        fetcher: fetcher as any,
        fetchOptions: { url: "test" },
        savedKey: "key",
      });
      await strategy.getCalendar();
      expect(fetcher.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          state: null,
        }),
      );
    });
  });

  describe("MasjidiAlAdhanAPIPrayerTimesStrategy", () => {
    test("fetches and parses timings from AlAdhan API", async () => {
      const mockData = {
        data: {
          "1": [{ timings: { Fajr: "05:00 (UTC)", Dhuhr: "12:00 (UTC)" } }],
        },
      };
      const fetcher = {
        fetch: vi.fn().mockResolvedValue(JSON.stringify(mockData)),
      };

      const strategy = new MasjidiAlAdhanAPIPrayerTimesStrategy({
        fetcher: fetcher as any,
        apiOptions: { latitude: 1, longitude: 1, tune: { Fajr: 5 } },
        protocol: "https",
        savedKey: "key",
      });

      const result = await strategy.getCalendar();
      expect(result[0].Fajr).toEqual([5, 0]);
      expect(fetcher.fetch).toHaveBeenCalled();

      const callUrl = new URL(fetcher.fetch.mock.calls[0][0].url);
      expect(callUrl.searchParams.get("latitude")).toBe("1");
      expect(callUrl.searchParams.get("tune")).toContain("5");
    });

    test("handles auto protocol", async () => {
      const fetcher = {
        fetch: vi.fn().mockResolvedValue(JSON.stringify({ data: {} })),
      };

      // Mock globalThis.location
      const originalLocation = globalThis.location;
      (globalThis as any).location = { protocol: "http:" };

      const strategy = new MasjidiAlAdhanAPIPrayerTimesStrategy({
        fetcher: fetcher as any,
        apiOptions: {},
        protocol: "auto",
        savedKey: "key",
      });

      await strategy.getCalendar();
      const callUrl = fetcher.fetch.mock.calls[0][0].url;
      expect(callUrl).toContain("http://api.aladhan.com");

      (globalThis as any).location = { protocol: "ftp:" };
      expect(await (strategy as any).getProtocol()).toBe("https");

      (globalThis as any).location = originalLocation;
    });

    test("defaults to https if no location", async () => {
      const fetcher = {
        fetch: vi.fn().mockResolvedValue(JSON.stringify({ data: {} })),
      };

      const originalLocation = globalThis.location;
      (globalThis as any).location = undefined;

      const strategy = new MasjidiAlAdhanAPIPrayerTimesStrategy({
        fetcher: fetcher as any,
        apiOptions: {},
        protocol: "auto",
        savedKey: "key",
      });

      await strategy.getCalendar();
      const callUrl = fetcher.fetch.mock.calls[0][0].url;
      expect(callUrl).toContain("https://api.aladhan.com");

      (globalThis as any).location = originalLocation;
    });

    test("explicit protocol and partial options", async () => {
      const fetcher = {
        fetch: vi.fn().mockResolvedValue(JSON.stringify({ data: {} })),
      };
      const strategy = new MasjidiAlAdhanAPIPrayerTimesStrategy({
        fetcher: fetcher as any,
        apiOptions: {
          latitude: 1,
          longitude: undefined, // hit line 78
          tune: { Imsak: 5 },
        } as any,
        protocol: "http", // hit line 40 (provided)
        savedKey: "key",
      });

      await strategy.getCalendar();
      const callUrl = fetcher.fetch.mock.calls[0][0].url;
      expect(callUrl).toContain("http://api.aladhan.com");
      expect(callUrl).toContain("tune=5%2C0%2C0%2C0%2C0%2C0%2C0%2C0%2C0"); // Imsak is 5, others 0
    });

    test("all tune values coverage", async () => {
      const fetcher = {
        fetch: vi.fn().mockResolvedValue(JSON.stringify({ data: {} })),
      };
      const strategy = new MasjidiAlAdhanAPIPrayerTimesStrategy({
        fetcher: fetcher as any,
        apiOptions: {
          tune: {
            Imsak: 1,
            Fajr: 2,
            Sunrise: 3,
            Dhuhr: 4,
            Asr: 5,
            Maghrib: 6,
            Sunset: 7,
            Isha: 8,
            Midnight: 9,
          },
        } as any,
        savedKey: "key",
      });

      await strategy.getCalendar();
      const callUrl = fetcher.fetch.mock.calls[0][0].url;
      expect(callUrl).toContain("tune=1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9");
    });
  });
});
