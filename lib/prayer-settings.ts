import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PrayerKey } from "@/lib/prayer-times";
import type { AppLanguage } from "@/lib/i18n";

export type CalculationMethod = "mwl" | "egyptian" | "ummAlQura" | "karachi" | "isna";
export type AsrSchool = "shafii" | "hanafi";

export type PrayerSettings = {
  calculationMethod: CalculationMethod;
  asrSchool: AsrSchool;
  adjustments: Record<PrayerKey, number>;
  language: AppLanguage;
  batterySaver: boolean;
};

export const PRAYER_ADJUSTMENT_KEYS: Array<{ key: PrayerKey; title: string }> = [
  { key: "fajr", title: "الفجر" },
  { key: "dhuhr", title: "الظهر" },
  { key: "asr", title: "العصر" },
  { key: "maghrib", title: "المغرب" },
  { key: "isha", title: "العشاء" },
];

export const DEFAULT_ADJUSTMENTS: Record<PrayerKey, number> = {
  fajr: 0,
  dhuhr: 0,
  asr: 0,
  maghrib: 0,
  isha: 0,
};

export const DEFAULT_PRAYER_SETTINGS: PrayerSettings = {
  calculationMethod: "mwl",
  asrSchool: "shafii",
  adjustments: DEFAULT_ADJUSTMENTS,
  language: "ar",
  batterySaver: false,
};

export const CALCULATION_METHODS: Array<{
  key: CalculationMethod;
  title: string;
  subtitle: string;
}> = [
  { key: "mwl", title: "رابطة العالم الإسلامي", subtitle: "الفجر 18° · العشاء 17°" },
  { key: "egyptian", title: "الهيئة المصرية العامة للمساحة", subtitle: "الفجر 19.5° · العشاء 17.5°" },
  { key: "ummAlQura", title: "أم القرى", subtitle: "الفجر 18.5° · العشاء بعد المغرب بـ 90 دقيقة" },
  { key: "karachi", title: "جامعة العلوم الإسلامية – كراتشي", subtitle: "الفجر 18° · العشاء 18°" },
  { key: "isna", title: "الجمعية الإسلامية لأمريكا الشمالية", subtitle: "الفجر 15° · العشاء 15°" },
];

export const ASR_SCHOOLS: Array<{
  key: AsrSchool;
  title: string;
  subtitle: string;
}> = [
  { key: "shafii", title: "الشافعي / المالكي / الحنبلي", subtitle: "العصر عند ظلّ المثل" },
  { key: "hanafi", title: "الحنفي", subtitle: "العصر عند ظلّ المثلين" },
];

const STORAGE_KEY = "salah-widget.prayer-settings.v1";

export async function loadPrayerSettings(): Promise<PrayerSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRAYER_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<PrayerSettings>;
    const selectedMethod = CALCULATION_METHODS.some((item) => item.key === parsed.calculationMethod)
      ? parsed.calculationMethod
      : undefined;
    const calculationMethod: CalculationMethod = selectedMethod ?? DEFAULT_PRAYER_SETTINGS.calculationMethod;
    const selectedSchool = ASR_SCHOOLS.some((item) => item.key === parsed.asrSchool)
      ? parsed.asrSchool
      : undefined;
    const asrSchool: AsrSchool = selectedSchool ?? DEFAULT_PRAYER_SETTINGS.asrSchool;
    const adjustments = PRAYER_ADJUSTMENT_KEYS.reduce((result, { key }) => {
      const value = parsed.adjustments?.[key];
      result[key] = typeof value === "number" && Number.isFinite(value)
        ? Math.max(-120, Math.min(120, Math.round(value)))
        : 0;
      return result;
    }, { ...DEFAULT_ADJUSTMENTS });
    return {
      calculationMethod,
      asrSchool,
      adjustments,
      language: parsed.language === "en" ? "en" : "ar",
      batterySaver: parsed.batterySaver === true,
    };
  } catch {
    return DEFAULT_PRAYER_SETTINGS;
  }
}

export async function savePrayerSettings(settings: PrayerSettings) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
