// App-wide state: language (EN/Telugu), chat session id, user id, selected
// coastal region (India-wide), and a Toast.
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, Region } from "@/src/api";
import { storage } from "@/src/utils/storage";
import { colors, darkColors, getTheme, fonts, radius, spacing, type } from "@/src/theme";

import { Lang, LANGUAGES, STRINGS, t, trackingFor } from "@/src/i18n";
export { Lang, LANGUAGES, STRINGS, t, trackingFor };
export type ThemeMode = "dark" | "light";

type ToastKind = "info" | "success" | "error";

const DEFAULT_REGIONS: Region[] = [
  { id: "kakinada", name: "Kakinada", state: "Andhra Pradesh", center: { lat: 16.9891, lon: 82.2475 }, sea: "Bay of Bengal" },
  { id: "visakhapatnam", name: "Visakhapatnam", state: "Andhra Pradesh", center: { lat: 17.6868, lon: 83.2185 }, sea: "Bay of Bengal" },
  { id: "machilipatnam", name: "Machilipatnam", state: "Andhra Pradesh", center: { lat: 16.1800, lon: 81.1300 }, sea: "Bay of Bengal" },
  { id: "chennai", name: "Chennai", state: "Tamil Nadu", center: { lat: 13.0827, lon: 80.2707 }, sea: "Bay of Bengal" },
  { id: "tuticorin", name: "Tuticorin (Thoothukudi)", state: "Tamil Nadu", center: { lat: 8.7642, lon: 78.1348 }, sea: "Gulf of Mannar" },
  { id: "rameswaram", name: "Rameswaram", state: "Tamil Nadu", center: { lat: 9.2876, lon: 79.3129 }, sea: "Palk Strait" },
  { id: "kanyakumari", name: "Kanyakumari", state: "Tamil Nadu", center: { lat: 8.0883, lon: 77.5385 }, sea: "Indian Ocean" },
  { id: "kochi", name: "Kochi", state: "Kerala", center: { lat: 9.9312, lon: 76.2673 }, sea: "Arabian Sea" },
  { id: "kozhikode", name: "Kozhikode (Calicut)", state: "Kerala", center: { lat: 11.2588, lon: 75.7804 }, sea: "Arabian Sea" },
  { id: "vizhinjam", name: "Vizhinjam (Trivandrum)", state: "Kerala", center: { lat: 8.3800, lon: 76.9900 }, sea: "Arabian Sea" },
  { id: "mangalore", name: "Mangalore", state: "Karnataka", center: { lat: 12.9141, lon: 74.8560 }, sea: "Arabian Sea" },
  { id: "karwar", name: "Karwar", state: "Karnataka", center: { lat: 14.8135, lon: 74.1298 }, sea: "Arabian Sea" },
  { id: "goa", name: "Goa (Mormugao)", state: "Goa", center: { lat: 15.4100, lon: 73.7800 }, sea: "Arabian Sea" },
  { id: "mumbai", name: "Mumbai", state: "Maharashtra", center: { lat: 18.9220, lon: 72.8347 }, sea: "Arabian Sea" },
  { id: "ratnagiri", name: "Ratnagiri", state: "Maharashtra", center: { lat: 16.9902, lon: 73.3120 }, sea: "Arabian Sea" },
  { id: "malvan", name: "Malvan", state: "Maharashtra", center: { lat: 16.0592, lon: 73.4682 }, sea: "Arabian Sea" },
  { id: "veraval", name: "Veraval", state: "Gujarat", center: { lat: 20.9159, lon: 70.3629 }, sea: "Arabian Sea" },
  { id: "porbandar", name: "Porbandar", state: "Gujarat", center: { lat: 21.6417, lon: 69.6293 }, sea: "Arabian Sea" },
  { id: "okha", name: "Okha", state: "Gujarat", center: { lat: 22.4638, lon: 69.0717 }, sea: "Arabian Sea" },
  { id: "kandla", name: "Kandla (Gulf of Kutch)", state: "Gujarat", center: { lat: 23.0033, lon: 70.2177 }, sea: "Gulf of Kutch" },
  { id: "paradip", name: "Paradip", state: "Odisha", center: { lat: 20.3167, lon: 86.6167 }, sea: "Bay of Bengal" },
  { id: "puri", name: "Puri", state: "Odisha", center: { lat: 19.8135, lon: 85.8312 }, sea: "Bay of Bengal" },
  { id: "gopalpur", name: "Gopalpur", state: "Odisha", center: { lat: 19.2600, lon: 84.9200 }, sea: "Bay of Bengal" },
  { id: "digha", name: "Digha", state: "West Bengal", center: { lat: 21.6266, lon: 87.5074 }, sea: "Bay of Bengal" },
  { id: "sundarbans", name: "Sundarbans (Canning)", state: "West Bengal", center: { lat: 21.8400, lon: 88.7000 }, sea: "Bay of Bengal" },
  { id: "portblair", name: "Port Blair", state: "Andaman & Nicobar", center: { lat: 11.6234, lon: 92.7265 }, sea: "Andaman Sea" },
  { id: "kavaratti", name: "Kavaratti", state: "Lakshadweep", center: { lat: 10.5667, lon: 72.6417 }, sea: "Arabian Sea" },
  { id: "puducherry", name: "Puducherry", state: "Puducherry", center: { lat: 11.9416, lon: 79.8083 }, sea: "Bay of Bengal" },
];

const DEFAULT_REGION: Region = DEFAULT_REGIONS[0];

type AppState = {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof darkColors;
  sessionId: string;
  newSession: () => void;
  userId: string;
  showToast: (msg: string, kind?: ToastKind) => void;
  region: Region;
  regions: Region[];
  setRegion: (r: Region) => void;
};

const Ctx = createContext<AppState | null>(null);

export const useApp = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be used within AppProvider");
  return c;
};

const rid = () =>
  `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [sessionId, setSessionId] = useState<string>(() => rid());
  const [region, setRegionState] = useState<Region>(DEFAULT_REGION);
  const [regions, setRegions] = useState<Region[]>(DEFAULT_REGIONS);
  const userId = "demo-user";

  const isDark = theme === "dark";
  const colors = getTheme(isDark);

  useEffect(() => {
    (async () => {
      const savedLang = (await storage.getItem("orca_lang", "en")) as Lang;
      const validLangs: Lang[] = ["en", "te", "ta", "ml", "kn", "mr", "gu", "bn", "or", "hi"];
      setLangState(validLangs.includes(savedLang) ? savedLang : "en");

      const savedTheme = (await storage.getItem("orca_theme", "dark")) as ThemeMode;
      if (savedTheme === "light" || savedTheme === "dark") {
        setThemeState(savedTheme);
      }

      let sid = (await storage.getItem("orca_session", "")) as string;
      if (!sid) {
        sid = sessionId;
        await storage.setItem("orca_session", sid);
      } else {
        setSessionId(sid);
      }

      // Load the India-wide region roster + last-selected region (offline
      // safe: falls back to the bundled default demo region on failure).
      try {
        const savedRegionRaw = (await storage.getItem(
          "orca_region",
          "",
        )) as string;
        if (savedRegionRaw) {
          setRegionState(JSON.parse(savedRegionRaw));
        }
      } catch {
        /* ignore corrupt cache */
      }
      try {
        const list = await api.listRegions();
        if (list?.regions?.length) setRegions(list.regions);
      } catch {
        /* offline: keep default single-region list */
      }
    })();
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      storage.setItem("orca_theme", next);
      return next;
    });
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    storage.setItem("orca_lang", l);
  }, []);

  const setRegion = useCallback((r: Region) => {
    setRegionState(r);
    storage.setItem("orca_region", JSON.stringify(r));
  }, []);

  const newSession = useCallback(() => {
    const sid = rid();
    setSessionId(sid);
    storage.setItem("orca_session", sid);
  }, []);

  // --- Toast ---
  const [toast, setToast] = useState<{ msg: string; kind: ToastKind } | null>(
    null,
  );
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const showToast = useCallback(
    (msg: string, kind: ToastKind = "info") => {
      setToast({ msg, kind });
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
      setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }).start(() => setToast(null));
      }, 2600);
    },
    [opacity],
  );

  const toastBg =
    toast?.kind === "error"
      ? colors.error
      : toast?.kind === "success"
        ? colors.success
        : colors.surfaceInverse;

  return (
    <Ctx.Provider
      value={{
        lang,
        setLang,
        theme,
        isDark,
        toggleTheme,
        colors,
        sessionId,
        newSession,
        userId,
        showToast,
        region,
        regions,
        setRegion,
      }}
    >
      {children}
      {toast && (
        <Animated.View
          testID="app-toast"
          pointerEvents="none"
          style={[
            styles.toast,
            {
              top: insets.top + spacing.md,
              backgroundColor: toastBg,
              borderColor: colors.border,
              opacity,
            },
          ]}
        >
          <Text style={[styles.toastText, { color: colors.onSurfaceInverse }]}>{toast.msg}</Text>
        </Animated.View>
      )}
    </Ctx.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toastText: {
    color: colors.onSurfaceInverse,
    fontFamily: fonts.mono,
    fontSize: type.sm,
  },
});
