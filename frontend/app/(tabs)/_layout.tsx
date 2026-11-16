import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp, t, trackingFor } from "@/src/context/AppContext";
import { colors, fonts } from "@/src/theme";

// Brutalist custom tab bar (0 radius, hard 2pt top border, no glass/blur) — a
// deliberate choice over iOS liquid-glass NativeTabs to match the command-center
// aesthetic and low-end Android target defined in the design guidelines.
export default function TabsLayout() {
  const { lang, colors, isDark } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(15, 23, 42, 0.45)",
        tabBarStyle: {
          backgroundColor: isDark ? "rgba(24, 28, 32, 0.94)" : "rgba(255, 255, 255, 0.96)",
          borderTopWidth: 1,
          borderTopColor: isDark ? "rgba(31, 166, 160, 0.25)" : "rgba(13, 148, 136, 0.16)",
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 8,
          height: Platform.OS === "web" ? 68 : 64 + insets.bottom,
          ...(Platform.OS === "web"
            ? {
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: isDark ? "0 -8px 24px rgba(0, 0, 0, 0.4)" : "0 -4px 20px rgba(0, 0, 0, 0.05)",
            }
            : {}),
        },
        tabBarItemStyle: { alignSelf: "center", paddingVertical: 2 },
        tabBarLabelStyle: {
          fontFamily: fonts.mono,
          fontSize: 10,
          fontWeight: "800",
          letterSpacing: trackingFor(lang, 0.8),
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("home", lang),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="boat" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t("chat", lang),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: t("alerts", lang),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="warning" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: t("saved", lang),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}