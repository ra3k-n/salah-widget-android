import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  ASR_SCHOOLS,
  CALCULATION_METHODS,
  DEFAULT_ADJUSTMENTS,
  DEFAULT_PRAYER_SETTINGS,
  loadPrayerSettings,
  PRAYER_ADJUSTMENT_KEYS,
  savePrayerSettings,
  type AsrSchool,
  type CalculationMethod,
  type PrayerSettings,
} from "@/lib/prayer-settings";
import type { PrayerKey } from "@/lib/prayer-times";
import { getHiOSTheme } from "@/lib/hios-theme";
import { copy, LANGUAGE_OPTIONS } from "@/lib/i18n";

const englishMethodTitles: Record<string, string> = {
  mwl: "Muslim World League",
  egyptian: "Egyptian General Authority",
  ummAlQura: "Umm al-Qura",
  karachi: "University of Islamic Sciences, Karachi",
  isna: "Islamic Society of North America",
};

const englishSchoolTitles: Record<string, string> = {
  shafii: "Shafii / Maliki / Hanbali",
  hanafi: "Hanafi",
};

function OptionRow({
  title,
  subtitle,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = getHiOSTheme(useColorScheme());
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.option, { backgroundColor: theme.surface, borderColor: theme.border }, selected && { backgroundColor: theme.accentSoft, borderColor: theme.accent }, pressed && styles.pressed]}>
      <View style={styles.optionCopy}>
        <Text style={[styles.optionTitle, { color: theme.foreground }, selected && { color: theme.accent }]}>{title}</Text>
        <Text style={[styles.optionSubtitle, { color: theme.faint }]}>{subtitle}</Text>
      </View>
      <View style={[styles.radio, { borderColor: theme.border }, selected && { borderColor: theme.accent }]}>
        {selected ? <View style={[styles.radioDot, { backgroundColor: theme.accent }]} /> : null}
      </View>
    </Pressable>
  );
}

function AdjustmentRow({
  title,
  value,
  unit,
  onChange,
}: {
  title: string;
  value: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  const theme = getHiOSTheme(useColorScheme());
  const label = value > 0 ? `+${value}` : `${value}`;
  return (
    <View style={[styles.adjustmentRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Pressable onPress={() => onChange(Math.max(-120, value - 1))} style={({ pressed }) => [styles.adjustmentButton, { backgroundColor: theme.accentSoft, borderColor: theme.accent }, pressed && styles.pressed]}>
        <Text style={[styles.adjustmentButtonText, { color: theme.accent }]}>−</Text>
      </Pressable>
      <View style={styles.adjustmentValueBox}>
        <Text style={[styles.adjustmentValue, { color: theme.accent }]}>{label}</Text>
        <Text style={[styles.adjustmentUnit, { color: theme.faint }]}>{unit}</Text>
      </View>
      <Pressable onPress={() => onChange(Math.min(120, value + 1))} style={({ pressed }) => [styles.adjustmentButton, { backgroundColor: theme.accentSoft, borderColor: theme.accent }, pressed && styles.pressed]}>
        <Text style={[styles.adjustmentButtonText, { color: theme.accent }]}>+</Text>
      </Pressable>
      <Text style={[styles.adjustmentTitle, { color: theme.foreground }]}>{title}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const theme = getHiOSTheme(useColorScheme());
  const [settings, setSettings] = useState<PrayerSettings>(DEFAULT_PRAYER_SETTINGS);
  const [saved, setSaved] = useState(false);
  const t = copy[settings.language];
  const isEnglish = settings.language === "en";

  useEffect(() => {
    void loadPrayerSettings().then(setSettings);
  }, []);

  const updateSettings = async (next: PrayerSettings) => {
    setSettings(next);
    setSaved(false);
    await savePrayerSettings(next);
    setSaved(true);
  };

  const updateAdjustment = (key: PrayerKey, value: number) => {
    void updateSettings({
      ...settings,
      adjustments: { ...settings.adjustments, [key]: value },
    });
  };

  const resetAdjustments = () => {
    void updateSettings({ ...settings, adjustments: { ...DEFAULT_ADJUSTMENTS } });
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName={theme.isDark ? "bg-[#211c23]" : "bg-[#f4eee8]"}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <ScrollView contentContainerStyle={[styles.content, { direction: isEnglish ? "ltr" : "rtl" }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Text style={[styles.backText, { color: theme.foreground }]}>{t.back}</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: theme.accent }]}>{t.customize}</Text>
            <Text style={[styles.title, { color: theme.foreground }]}>{t.settingsTitle}</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>{t.settingsBody}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.accent }]}>{t.calculationTitle}</Text>
        <View style={styles.optionsGroup}>
          {CALCULATION_METHODS.map((method) => (
            <OptionRow
              key={method.key}
              title={isEnglish ? englishMethodTitles[method.key] : method.title}
              subtitle={method.subtitle}
              selected={settings.calculationMethod === method.key}
              onPress={() => void updateSettings({ ...settings, calculationMethod: method.key as CalculationMethod })}
            />
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.accent }]}>{t.schoolTitle}</Text>
        <View style={styles.optionsGroup}>
          {ASR_SCHOOLS.map((school) => (
            <OptionRow
              key={school.key}
              title={isEnglish ? englishSchoolTitles[school.key] : school.title}
              subtitle={school.subtitle}
              selected={settings.asrSchool === school.key}
              onPress={() => void updateSettings({ ...settings, asrSchool: school.key as AsrSchool })}
            />
          ))}
        </View>

        <View style={styles.adjustmentHeader}>
          <Pressable onPress={resetAdjustments} style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>
            <Text style={[styles.resetButtonText, { color: theme.muted }]}>{t.reset}</Text>
          </Pressable>
          <View>
            <Text style={[styles.sectionTitle, { color: theme.accent }]}>{t.manualTitle}</Text>
            <Text style={[styles.adjustmentHint, { color: theme.faint }]}>{t.manualHint}</Text>
          </View>
        </View>
        <View style={styles.adjustmentsGroup}>
          {PRAYER_ADJUSTMENT_KEYS.map(({ key, title }) => (
            <AdjustmentRow key={key} title={isEnglish ? ({ fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha" } as Record<PrayerKey, string>)[key] : title} value={settings.adjustments[key]} unit={t.minute} onChange={(value) => updateAdjustment(key, value)} />
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.accent }]}>{t.languageTitle}</Text>
        <View style={styles.optionsGroup}>
          {LANGUAGE_OPTIONS.map((language) => (
            <OptionRow
              key={language.key}
              title={language.title}
              subtitle={language.subtitle}
              selected={settings.language === language.key}
              onPress={() => void updateSettings({ ...settings, language: language.key })}
            />
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.accent }]}>{t.energyTitle}</Text>
        <Pressable
          onPress={() => void updateSettings({ ...settings, batterySaver: !settings.batterySaver })}
          style={({ pressed }) => [styles.energyRow, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && styles.pressed]}
        >
          <View style={[styles.switchTrack, { backgroundColor: settings.batterySaver ? theme.accent : theme.faint }]}>
            <View style={[styles.switchThumb, { backgroundColor: theme.surfaceStrong, alignSelf: settings.batterySaver ? "flex-end" : "flex-start" }]} />
          </View>
          <View style={styles.optionCopy}>
            <Text style={[styles.optionTitle, { color: theme.foreground }]}>{settings.batterySaver ? t.energyOn : t.energyOff}</Text>
            <Text style={[styles.optionSubtitle, { color: theme.faint }]}>{t.energyBody}</Text>
          </View>
        </Pressable>

        <View style={[styles.noteBox, { backgroundColor: theme.surfaceStrong, borderColor: theme.border }]}>
          <Text style={[styles.noteTitle, { color: theme.accent }]}>{t.accuracyNote}</Text>
          <Text style={[styles.noteText, { color: theme.muted }]}>{t.accuracyBody}</Text>
        </View>
        {saved ? <Text style={[styles.savedText, { color: theme.success }]}>{t.saved}</Text> : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 18, paddingBottom: 34 },
  header: { flexDirection: "row-reverse", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 34 },
  headerCopy: { flex: 1, alignItems: "flex-end" },
  eyebrow: { color: "#e4ab7e", fontSize: 14, fontWeight: "700", marginBottom: 8, textAlign: "right" },
  title: { color: "#fffaf4", fontSize: 30, fontWeight: "900", lineHeight: 40, textAlign: "right" },
  subtitle: { color: "rgba(255,250,244,0.62)", fontSize: 14, lineHeight: 23, textAlign: "right", marginTop: 8 },
  backButton: { borderRadius: 13, borderWidth: 1, borderColor: "rgba(255,250,244,0.18)", paddingHorizontal: 13, paddingVertical: 9, backgroundColor: "rgba(255,250,244,0.06)" },
  backText: { color: "#fffaf4", fontSize: 13, fontWeight: "700" },
  sectionTitle: { color: "#f5c59a", fontSize: 16, fontWeight: "800", textAlign: "right", marginBottom: 5, marginTop: 4 },
  optionsGroup: { gap: 10, marginBottom: 28 },
  option: { flexDirection: "row-reverse", alignItems: "center", gap: 14, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,250,244,0.12)", backgroundColor: "rgba(255,250,244,0.055)" },
  optionSelected: { borderColor: "rgba(245,197,154,0.75)", backgroundColor: "rgba(245,197,154,0.13)" },
  optionCopy: { flex: 1, alignItems: "flex-end" },
  optionTitle: { color: "#fffaf4", fontSize: 15, fontWeight: "800", textAlign: "right" },
  optionTitleSelected: { color: "#f8cda7" },
  optionSubtitle: { color: "rgba(255,250,244,0.53)", fontSize: 12, lineHeight: 19, textAlign: "right", marginTop: 4 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: "rgba(255,250,244,0.36)", alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: "#f5c59a" },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: "#f5c59a" },
  adjustmentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  adjustmentHint: { color: "rgba(255,250,244,0.45)", fontSize: 11, textAlign: "right", marginTop: 2 },
  resetButton: { borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,250,244,0.16)", paddingHorizontal: 11, paddingVertical: 8 },
  resetButtonText: { color: "rgba(255,250,244,0.68)", fontSize: 11, fontWeight: "700" },
  adjustmentsGroup: { gap: 8, marginBottom: 28 },
  adjustmentRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,250,244,0.10)", backgroundColor: "rgba(255,250,244,0.045)" },
  adjustmentTitle: { flex: 1, color: "#fffaf4", fontSize: 15, fontWeight: "800", textAlign: "right" },
  adjustmentButton: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(245,197,154,0.16)", borderWidth: 1, borderColor: "rgba(245,197,154,0.30)" },
  adjustmentButtonText: { color: "#f5c59a", fontSize: 23, lineHeight: 26, fontWeight: "500" },
  adjustmentValueBox: { minWidth: 58, alignItems: "center" },
  adjustmentValue: { color: "#f8cda7", fontSize: 16, fontWeight: "900" },
  adjustmentUnit: { color: "rgba(255,250,244,0.44)", fontSize: 10, marginTop: 1 },
  energyRow: { flexDirection: "row-reverse", alignItems: "center", gap: 14, padding: 16, borderRadius: 18, borderWidth: 1 },
  switchTrack: { width: 48, height: 28, borderRadius: 14, padding: 3, justifyContent: "center" },
  switchThumb: { width: 22, height: 22, borderRadius: 11 },
  noteBox: { borderRadius: 18, padding: 16, backgroundColor: "rgba(74, 61, 68, 0.72)", borderWidth: 1, borderColor: "rgba(255,250,244,0.10)" },
  noteTitle: { color: "#f5c59a", fontSize: 13, fontWeight: "800", textAlign: "right", marginBottom: 6 },
  noteText: { color: "rgba(255,250,244,0.65)", fontSize: 12, lineHeight: 20, textAlign: "right" },
  savedText: { color: "#a9d4b5", fontSize: 12, fontWeight: "700", textAlign: "center", marginTop: 16 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
