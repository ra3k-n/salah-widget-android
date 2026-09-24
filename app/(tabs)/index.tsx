import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import {
  calculatePrayerTimes,
  formatCountdown,
  formatHijri,
  formatPrayerTime,
  formatWeekday,
  type PrayerTime,
} from "@/lib/prayer-times";

type PermissionState = "checking" | "requesting" | "ready" | "denied" | "disabled" | "error";

type DeviceLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  label: string;
};

const FALLBACK_LABEL = "الموقع الحالي";

function formatAccuracy(accuracy: number | null) {
  if (!accuracy || !Number.isFinite(accuracy)) return "دقة الموقع غير متاحة";
  return `دقة تقريبية ${Math.round(accuracy)} م`;
}

function getRemainingSeconds(target: Date, now: Date) {
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 1000));
}

export default function HomeScreen() {
  const [permissionState, setPermissionState] = useState<PermissionState>("checking");
  const [location, setLocation] = useState<DeviceLocation | null>(null);
  const [locationError, setLocationError] = useState("");
  const [now, setNow] = useState(() => new Date());

  const requestLocation = async () => {
    setPermissionState("requesting");
    setLocationError("");

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setPermissionState("disabled");
        setLocationError("فعّل خدمة الموقع من إعدادات الهاتف ثم حاول مرة أخرى.");
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setPermissionState("denied");
        setLocationError("نحتاج الموقع الدقيق لحساب المواقيت حسب مكانك.");
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: true,
      });

      let label = FALLBACK_LABEL;
      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
        const place = places[0];
        label = [place?.city, place?.district, place?.country]
          .filter(Boolean)
          .slice(0, 2)
          .join("، ") || FALLBACK_LABEL;
      } catch {
        // Reverse geocoding is optional; coordinates remain sufficient for the calculation.
      }

      setLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        accuracy: current.coords.accuracy,
        label,
      });
      setPermissionState("ready");
    } catch {
      setPermissionState("error");
      setLocationError("تعذر قراءة الموقع الآن. تحقق من أذونات الهاتف ثم أعد المحاولة.");
    }
  };

  useEffect(() => {
    void requestLocation();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!location || permissionState !== "ready") return;
    let subscription: Location.LocationSubscription | null = null;

    void Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 60_000,
        distanceInterval: 100,
      },
      (updated) => {
        setLocation((current) =>
          current
            ? {
                ...current,
                latitude: updated.coords.latitude,
                longitude: updated.coords.longitude,
                accuracy: updated.coords.accuracy,
              }
            : current,
        );
      },
    ).then((result) => {
      subscription = result;
    });

    return () => subscription?.remove();
  }, [location?.latitude, location?.longitude, permissionState]);

  const prayers = useMemo<PrayerTime[]>(() => {
    if (!location) return [];
    return calculatePrayerTimes(now, location.latitude, location.longitude, -now.getTimezoneOffset());
  }, [location, now]);

  const nextPrayer = useMemo(() => {
    if (!location || prayers.length === 0) return null;
    const current = prayers.find((prayer) => prayer.date.getTime() > now.getTime());
    if (current) return current;

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return calculatePrayerTimes(tomorrow, location.latitude, location.longitude, -now.getTimezoneOffset())[0];
  }, [location, now, prayers]);

  const countdown = nextPrayer ? getRemainingSeconds(nextPrayer.date, now) : 0;
  const currentPrayerIndex = prayers.reduce(
    (index, prayer, prayerIndex) => (prayer.date.getTime() <= now.getTime() ? prayerIndex : index),
    -1,
  );

  if (permissionState !== "ready" || !location) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#211c23]">
        <StatusBar style="light" />
        <View style={styles.permissionScreen}>
          <View style={styles.permissionGlowOne} />
          <View style={styles.permissionGlowTwo} />
          <View style={styles.permissionContent}>
            <View style={styles.locationMark}>
              <Text style={styles.locationMarkText}>⌖</Text>
            </View>
            <Text style={styles.permissionEyebrow}>مواقيت الصلاة</Text>
            <Text style={styles.permissionTitle}>نحدد المواقيت حسب موقعك</Text>
            <Text style={styles.permissionBody}>
              نستخدم موقعك الدقيق مرة واحدة لحساب أوقات الصلاة المحلية، ثم نحدّث العدّاد كل ثانية.
            </Text>
            {permissionState === "checking" || permissionState === "requesting" ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#f5c59a" />
                <Text style={styles.loadingText}>
                  {permissionState === "checking" ? "جاري التحقق من الإذن" : "جاري طلب الموقع الدقيق"}
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.permissionError}>{locationError}</Text>
                <Pressable
                  onPress={() => {
                    if (permissionState === "denied") {
                      void Linking.openSettings();
                    } else {
                      void requestLocation();
                    }
                  }}
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                >
                  <Text style={styles.primaryButtonText}>
                    {permissionState === "denied" ? "فتح إعدادات الموقع" : "المحاولة مرة أخرى"}
                  </Text>
                </Pressable>
              </>
            )}
            <Text style={styles.privacyNote}>لا نعرض مواقيت تجريبية؛ الموقع مطلوب قبل الدخول.</Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#332a31]">
      <StatusBar style="light" />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={styles.wallpaperGlowLeft} />
        <View style={styles.wallpaperGlowCenter} />
        <View style={styles.wallpaperGlowRight} />
        <View style={styles.wallpaperShade} />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.topRow}>
          <View style={styles.dateBlock}>
            <Text style={styles.weekday}>{formatWeekday(now)}</Text>
            <Text style={styles.hijri}>{formatHijri(now)}</Text>
          </View>
          <View style={styles.nextBlock}>
            <Text style={styles.nextEyebrow}>باقي على {nextPrayer?.name ?? "الصلاة"}</Text>
            <Text style={styles.countdown}>{formatCountdown(countdown)}</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <Text style={styles.locationText}>{location.label}</Text>
          <Text style={styles.locationAccuracy}>{formatAccuracy(location.accuracy)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.prayersRow}>
          {prayers.map((prayer, index) => {
            const isNext = prayer.date.getTime() === nextPrayer?.date.getTime();
            const isCurrent = index === currentPrayerIndex && !isNext;
            return (
              <View key={prayer.key} style={[styles.prayerItem, isNext && styles.nextPrayerItem]}>
                <View style={[styles.prayerDot, isNext && styles.nextPrayerDot, isCurrent && styles.currentPrayerDot]} />
                <Text style={[styles.prayerName, isNext && styles.nextPrayerText]}>{prayer.name}</Text>
                <Text style={[styles.prayerTime, isNext && styles.nextPrayerText]}>{formatPrayerTime(prayer.date)}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>المواقيت حسب الموقع الدقيق</Text>
          <Text style={styles.footerSeparator}>•</Text>
          <Text style={styles.footerText}>تتجدد تلقائيًا</Text>
        </View>

        <Pressable
          onPress={requestLocation}
          style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}
        >
          <Text style={styles.refreshButtonText}>تحديث الموقع</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  permissionScreen: {
    flex: 1,
    overflow: "hidden",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#211c23",
  },
  permissionGlowOne: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(189, 116, 69, 0.26)",
    top: -70,
    left: -130,
  },
  permissionGlowTwo: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(99, 132, 145, 0.18)",
    bottom: -70,
    right: -120,
  },
  permissionContent: {
    alignItems: "flex-end",
  },
  locationMark: {
    width: 58,
    height: 58,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(245,197,154,0.34)",
    backgroundColor: "rgba(245,197,154,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  locationMarkText: {
    color: "#f5c59a",
    fontSize: 32,
    lineHeight: 36,
  },
  permissionEyebrow: {
    width: "100%",
    color: "#e4ab7e",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "right",
    marginBottom: 10,
  },
  permissionTitle: {
    width: "100%",
    color: "#fffaf4",
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 42,
    textAlign: "right",
    marginBottom: 12,
  },
  permissionBody: {
    width: "100%",
    color: "rgba(255,250,244,0.72)",
    fontSize: 16,
    lineHeight: 27,
    textAlign: "right",
    marginBottom: 26,
  },
  loadingBox: {
    width: "100%",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  loadingText: {
    color: "#fffaf4",
    fontSize: 14,
  },
  permissionError: {
    width: "100%",
    color: "#f4c9a7",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "right",
    marginBottom: 18,
  },
  primaryButton: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "#e3a572",
  },
  primaryButtonText: {
    color: "#2b2020",
    fontSize: 16,
    fontWeight: "800",
  },
  privacyNote: {
    width: "100%",
    color: "rgba(255,250,244,0.45)",
    fontSize: 12,
    textAlign: "right",
    marginTop: 18,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 20 : 12,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    minHeight: 126,
  },
  dateBlock: {
    alignItems: "flex-start",
    flex: 1,
    paddingTop: 8,
  },
  weekday: {
    color: "#fffaf4",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "left",
    marginBottom: 10,
  },
  hijri: {
    color: "rgba(255,250,244,0.9)",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "left",
  },
  nextBlock: {
    alignItems: "flex-end",
    flex: 1.1,
  },
  nextEyebrow: {
    color: "#fffaf4",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "right",
    marginBottom: 8,
  },
  countdown: {
    color: "#fffaf4",
    fontSize: 42,
    lineHeight: 50,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "right",
  },
  locationRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 10,
  },
  locationText: {
    color: "rgba(255,250,244,0.66)",
    fontSize: 13,
    fontWeight: "600",
  },
  locationAccuracy: {
    color: "rgba(255,250,244,0.42)",
    fontSize: 11,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,250,244,0.18)",
    marginTop: 22,
    marginBottom: 28,
  },
  prayersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 4,
  },
  prayerItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 18,
  },
  nextPrayerItem: {
    backgroundColor: "rgba(255,250,244,0.10)",
  },
  prayerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(245,197,154,0.72)",
    marginBottom: 12,
  },
  nextPrayerDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#f5c59a",
    shadowColor: "#f5c59a",
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  currentPrayerDot: {
    backgroundColor: "rgba(255,250,244,0.42)",
  },
  prayerName: {
    color: "#fffaf4",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  prayerTime: {
    color: "#fffaf4",
    fontSize: 18,
    fontWeight: "800",
  },
  nextPrayerText: {
    color: "#f8cda7",
  },
  footerRow: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 36,
  },
  footerText: {
    color: "rgba(255,250,244,0.62)",
    fontSize: 13,
  },
  footerSeparator: {
    color: "rgba(255,250,244,0.46)",
    fontSize: 14,
  },
  refreshButton: {
    alignSelf: "center",
    marginTop: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,250,244,0.18)",
    backgroundColor: "rgba(255,250,244,0.05)",
  },
  refreshButtonText: {
    color: "rgba(255,250,244,0.76)",
    fontSize: 12,
    fontWeight: "700",
  },
  wallpaperGlowLeft: {
    position: "absolute",
    width: 370,
    height: 370,
    borderRadius: 185,
    backgroundColor: "rgba(201, 132, 76, 0.45)",
    top: 160,
    left: -150,
  },
  wallpaperGlowCenter: {
    position: "absolute",
    width: 290,
    height: 440,
    borderRadius: 180,
    backgroundColor: "rgba(66, 83, 82, 0.34)",
    top: 250,
    left: 120,
    transform: [{ rotate: "18deg" }],
  },
  wallpaperGlowRight: {
    position: "absolute",
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: "rgba(214, 145, 92, 0.35)",
    bottom: -80,
    right: -120,
  },
  wallpaperShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(28, 24, 29, 0.34)",
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
