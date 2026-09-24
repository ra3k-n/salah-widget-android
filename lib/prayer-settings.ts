import AsyncStorage from "@react-native-async-storage/async-storage";

export type CalculationMethod = "mwl" | "egyptian" | "ummAlQura" | "karachi" | "isna";
export type AsrSchool = "shafii" | "hanafi";

export type PrayerSettings = {
  calculationMethod: CalculationMethod;
  asrSchool: AsrSchool;
};

export const DEFAULT_PRAYER_SETTINGS: PrayerSettings = {
  calculationMethod: "mwl",
  asrSchool: "shafii",
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
    const calculationMethod = CALCULATION_METHODS.some((item) => item.key === parsed.calculationMethod)
      ? parsed.calculationMethod
      : DEFAULT_PRAYER_SETTINGS.calculationMethod;
    const asrSchool = ASR_SCHOOLS.some((item) => item.key === parsed.asrSchool)
      ? parsed.asrSchool
      : DEFAULT_PRAYER_SETTINGS.asrSchool;
    return { calculationMethod, asrSchool } as PrayerSettings;
  } catch {
    return DEFAULT_PRAYER_SETTINGS;
  }
}

export async function savePrayerSettings(settings: PrayerSettings) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
