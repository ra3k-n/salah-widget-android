export type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export type PrayerTime = {
  key: PrayerKey;
  name: string;
  date: Date;
};

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

const PRAYERS: Array<{ key: PrayerKey; name: string }> = [
  { key: "fajr", name: "الفجر" },
  { key: "dhuhr", name: "الظهر" },
  { key: "asr", name: "العصر" },
  { key: "maghrib", name: "المغرب" },
  { key: "isha", name: "العشاء" },
];

function sin(value: number) {
  return Math.sin(value * DEG);
}

function cos(value: number) {
  return Math.cos(value * DEG);
}

function tan(value: number) {
  return Math.tan(value * DEG);
}

function asin(value: number) {
  return Math.asin(value) * RAD;
}

function acos(value: number) {
  return Math.acos(value) * RAD;
}

function atan(value: number) {
  return Math.atan(value) * RAD;
}

function fixAngle(value: number) {
  return value - 360 * Math.floor(value / 360);
}

function fixHour(value: number) {
  return value - 24 * Math.floor(value / 24);
}

function julian(year: number, month: number, day: number) {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day - 1524.5
  );
}

function sunPosition(julianDay: number) {
  const d = julianDay - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * d);
  const q = fixAngle(280.459 + 0.98564736 * d);
  const l = fixAngle(q + 1.915 * sin(g) + 0.02 * sin(2 * g));
  const e = 23.439 - 0.00000036 * d;
  const ra = atan2(cos(e) * sin(l), cos(l)) / 15;
  const equation = q / 15 - fixHour(ra);
  const declination = asin(sin(e) * sin(l));
  return { declination, equation };
}

function atan2(y: number, x: number) {
  return Math.atan2(y, x) * RAD;
}

function hourAngle(elevation: number, latitude: number, declination: number) {
  const numerator = sin(elevation) - sin(latitude) * sin(declination);
  const denominator = cos(latitude) * cos(declination);
  const cosine = numerator / denominator;
  if (cosine <= -1) return 12;
  if (cosine >= 1) return 0;
  return acos(cosine) / 15;
}

function asrElevation(latitude: number, declination: number, factor = 1) {
  return atan(1 / (factor + tan(Math.abs(latitude - declination))));
}

function decimalToDate(baseDate: Date, decimalHour: number) {
  const result = new Date(baseDate);
  result.setHours(0, 0, 0, 0);
  result.setMinutes(Math.round(decimalHour * 60));
  return result;
}

/**
 * Calculates the five daily prayers using the solar-position method.
 * Default angles follow Muslim World League conventions: Fajr 18°, Isha 17°.
 * The device's timezone is used so displayed times follow the local clock.
 */
export function calculatePrayerTimes(
  date: Date,
  latitude: number,
  longitude: number,
  timezoneOffsetMinutes: number,
): PrayerTime[] {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const timezone = timezoneOffsetMinutes / 60;
  const baseJulian = julian(year, month, day) - longitude / (15 * 24);
  const sampleHours = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, sunset: 18, isha: 18 };
  const baseDate = new Date(year, month - 1, day);
  const calculated: Record<PrayerKey, number> = {
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  };

  for (let iteration = 0; iteration < 2; iteration += 1) {
    const sun = sunPosition(baseJulian + sampleHours.dhuhr / 24);
    const midday = fixHour(12 - sun.equation);
    const fajr = midday - hourAngle(-18, latitude, sun.declination);
    const dhuhr = midday;
    const asr = midday + hourAngle(asrElevation(latitude, sun.declination), latitude, sun.declination);
    const maghrib = midday + hourAngle(-0.833, latitude, sun.declination);
    const isha = midday + hourAngle(-17, latitude, sun.declination);
    const correction = timezone;

    calculated.fajr = fixHour(fajr + correction);
    calculated.dhuhr = fixHour(dhuhr + correction);
    calculated.asr = fixHour(asr + correction);
    calculated.maghrib = fixHour(maghrib + correction);
    calculated.isha = fixHour(isha + correction);
  }

  return PRAYERS.map(({ key, name }) => ({
    key,
    name,
    date: decimalToDate(baseDate, calculated[key]),
  }));
}

export function formatPrayerTime(date: Date) {
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes}`;
}

export function formatCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return `${hours > 0 ? `${hours}:` : ""}${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export function formatHijri(date: Date) {
  try {
    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura-nu-latn", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }
}

export function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("ar-SA", { weekday: "long" }).format(date);
}

export function getNextPrayer(
  prayers: PrayerTime[],
  now: Date,
  latitude: number,
  longitude: number,
) {
  const next = prayers.find((prayer) => prayer.date.getTime() > now.getTime());
  if (next) return { prayer: next, targetDate: next.date };

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowPrayers = calculatePrayerTimes(
    tomorrow,
    latitude,
    longitude,
    -now.getTimezoneOffset(),
  );
  return { prayer: tomorrowPrayers[0], targetDate: tomorrowPrayers[0].date };
}
