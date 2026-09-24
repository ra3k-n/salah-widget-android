import { describe, expect, it } from "vitest";

import {
  calculatePrayerTimes,
  formatCountdown,
  formatPrayerTime,
} from "../lib/prayer-times";

describe("prayer time calculation", () => {
  it("returns exactly the five displayed prayers for a valid location", () => {
    const date = new Date(2026, 8, 24, 12, 0, 0);
    const prayers = calculatePrayerTimes(date, 24.7136, 46.6753, 180);

    expect(prayers.map((prayer) => prayer.key)).toEqual([
      "fajr",
      "dhuhr",
      "asr",
      "maghrib",
      "isha",
    ]);
    expect(prayers.every((prayer) => prayer.date instanceof Date)).toBe(true);
    expect(prayers[0].date.getHours()).toBeGreaterThanOrEqual(0);
    expect(prayers[4].date.getHours()).toBeLessThan(24);
  });

  it("produces ordered times during the day in Riyadh", () => {
    const date = new Date(2026, 8, 24, 12, 0, 0);
    const prayers = calculatePrayerTimes(date, 24.7136, 46.6753, 180);

    for (let index = 1; index < prayers.length; index += 1) {
      expect(prayers[index].date.getTime()).toBeGreaterThan(prayers[index - 1].date.getTime());
    }
  });
});

describe("display formatting", () => {
  it("keeps minutes and seconds visible in the countdown", () => {
    expect(formatCountdown(1726)).toBe("28:46");
    expect(formatCountdown(3726)).toBe("1:02:06");
  });

  it("formats a prayer time using a compact 12-hour clock", () => {
    expect(formatPrayerTime(new Date(2026, 8, 24, 15, 0, 0))).toBe("3:00");
  });
});
