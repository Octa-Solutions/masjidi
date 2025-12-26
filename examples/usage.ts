import { wrapNumber } from "@masjidi/common";
import {
  provideCachedFetcher,
  provideDomFetcher,
  provideNoopStorage,
  provideSavedFetcher,
} from "@masjidi/common/providers";
import {
  AlAdhanAPISchool,
  AlAdhanAPIShafaq,
  Masjidi,
  MasjidiController,
  prayersListFactory,
} from "@masjidi/core";
import {
  provideMasjidiAlAdhanAPIPrayerTimesStrategy,
  provideMasjidiTableAPIPrayerTimesStrategy,
} from "@masjidi/core/providers";

const prayers = prayersListFactory({
  Fajr: { name: "al-fajer", duration: 8, iqamaWaitDuration: 20 },
  Sunrise: { name: "as-shrouq", duration: 8, iqamaWaitDuration: 0 },
  Dhuhr: { name: "adh-dhuhr", duration: 8, iqamaWaitDuration: 15 },
  Asr: { name: "al-3aser", duration: 8, iqamaWaitDuration: 15 },
  Maghrib: { name: "al-maghrib", duration: 8, iqamaWaitDuration: 10 },
  Isha: { name: "al-3isha2", duration: 8, iqamaWaitDuration: 15 },
});

const masjidi = Masjidi.factory({
  initialNow: new Date(),
  hijriDayAdjustment: 0,
  ahadith: [],
  prayers: prayers,
});

const domFetcher = provideDomFetcher();
const cachedFetcher = provideCachedFetcher({ fetcher: domFetcher });
const savedFetcher = provideSavedFetcher({
  fetcher: domFetcher,
  storage: provideNoopStorage(),
});

const alAdhanAPIStrategy = provideMasjidiAlAdhanAPIPrayerTimesStrategy({
  fetcher: cachedFetcher,
  apiOptions: {
    latitude: 33.5617941,
    longitude: 35.3926971,
    school: AlAdhanAPISchool.STANDARD,
    shafaq: AlAdhanAPIShafaq.GENERAL,
  },
});
const tableAPIStrategy = provideMasjidiTableAPIPrayerTimesStrategy({
  fetcher: cachedFetcher,
  fetchOptions: {
    url: "https://tv.masjidi.app/upload/app_region/2024-03/app_region_file_1.json",
  },
});

const strategy =
  process.argv[2] === "table" ? tableAPIStrategy : alAdhanAPIStrategy;

const controller = new MasjidiController(masjidi, {
  timesStrategy: strategy,
});

function clearScreen() {
  process.stdout.write("\x1Bc");
}

function formatTime(seconds: number) {
  seconds = wrapNumber(seconds, 0, 86400);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

function formatClock(date: any) {
  const h = date.time.hours;
  const m = date.time.minutes;
  const s = date.time.seconds;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

controller.on("tick", () => {
  clearScreen();
  const now = masjidi.getNow();
  const status = masjidi.getTimingStatus();

  process.stdout.write(`Current Time: ${formatClock(now)}\n`);
  process.stdout.write("-----------------------------------\n");

  masjidi.prayers.forEach((p) => {
    const isNext = status.type === "upcoming" && status.prayer === p;
    const isIqamaWait = status.type === "iqama" && status.prayer === p;
    const isInPrayer = status.type === "prayer" && status.prayer === p;

    let prefix = "   ";
    let suffix = "";
    let color = "\x1b[0m"; // Reset

    if (isNext) {
      prefix = "-> ";
      color = "\x1b[36m"; // Cyan
      suffix = ` (Next in ${formatTime(status.secondsLeft)})`;
    } else if (isIqamaWait) {
      prefix = ">> ";
      color = "\x1b[33m"; // Yellow
      suffix = ` (Iqama in ${formatTime(status.secondsLeft)})`;
    } else if (isInPrayer) {
      prefix = "** ";
      color = "\x1b[32m"; // Green
      suffix = ` (Active, ends in ${formatTime(status.secondsLeft)})`;
    }

    suffix =
      ` (>${formatTime(p.getTimeLeftForIqamaWait(masjidi.getNow()))})` + suffix;

    const time = p.getOffsettedTime();
    const h = Math.floor(time / 60);
    const m = time % 60;
    const timeStr = `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}`;

    process.stdout.write(
      `${color}${prefix}${p.name.padEnd(10)} ${timeStr}${suffix}\x1b[0m\n`,
    );
  });
});

console.log("Starting Masjidi Terminal...");
controller.start();
