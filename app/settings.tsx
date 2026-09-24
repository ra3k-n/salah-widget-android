import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import {
  ASR_SCHOOLS,
  CALCULATION_METHODS,
  DEFAULT_PRAYER_SETTINGS,
  loadPrayerSettings,
  savePrayerSettings,
  type AsrSchool,
  type CalculationMethod,
  type PrayerSettings,
} from "@/lib/prayer-settings";

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
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}>
      <View style={styles.optionCopy}>
        <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<PrayerSettings>(DEFAULT_PRAYER_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void loadPrayerSettings().then(setSettings);
  }, []);

  const updateSettings = async (next: PrayerSettings) => {
    setSettings(next);
    setSaved(false);
    await savePrayerSettings(next);
    setSaved(true);
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#211c23]">
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Text style={styles.backText}>رجوع</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>تخصيص التطبيق</Text>
            <Text style={styles.title}>إعدادات المواقيت</Text>
            <Text style={styles.subtitle}>اختر الطريقة الأقرب لما تتبعه، وستتغير الأوقات مباشرة في الشاشة الرئيسية.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>طريقة حساب الفجر والعشاء</Text>
        <View style={styles.optionsGroup}>
          {CALCULATION_METHODS.map((method) => (
            <OptionRow
              key={method.key}
              title={method.title}
              subtitle={method.subtitle}
              selected={settings.calculationMethod === method.key}
              onPress={() => void updateSettings({ ...settings, calculationMethod: method.key as CalculationMethod })}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>المذهب الفقهي للعصر</Text>
        <View style={styles.optionsGroup}>
          {ASR_SCHOOLS.map((school) => (
            <OptionRow
              key={school.key}
              title={school.title}
              subtitle={school.subtitle}
              selected={settings.asrSchool === school.key}
              onPress={() => void updateSettings({ ...settings, asrSchool: school.key as AsrSchool })}
            />
          ))}
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>ملاحظة الدقة</Text>
          <Text style={styles.noteText}>يتم الحساب من موقع الهاتف الدقيق والتوقيت المحلي، بدون الاعتماد على أوقات تجريبية.</Text>
        </View>
        {saved ? <Text style={styles.savedText}>تم حفظ الإعدادات على الهاتف</Text> : null}
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
  sectionTitle: { color: "#f5c59a", fontSize: 16, fontWeight: "800", textAlign: "right", marginBottom: 12, marginTop: 4 },
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
  noteBox: { borderRadius: 18, padding: 16, backgroundColor: "rgba(74, 61, 68, 0.72)", borderWidth: 1, borderColor: "rgba(255,250,244,0.10)" },
  noteTitle: { color: "#f5c59a", fontSize: 13, fontWeight: "800", textAlign: "right", marginBottom: 6 },
  noteText: { color: "rgba(255,250,244,0.65)", fontSize: 12, lineHeight: 20, textAlign: "right" },
  savedText: { color: "#a9d4b5", fontSize: 12, fontWeight: "700", textAlign: "center", marginTop: 16 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
