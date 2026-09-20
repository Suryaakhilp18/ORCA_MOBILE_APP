import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { LogBox, Platform, View } from "react-native";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppProvider, useApp } from "@/src/context/AppContext";
import { colors } from "@/src/theme";

// Disable logbox errors in dev view
LogBox.ignoreAllLogs(true);

if (Platform.OS !== "web") {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

const FAILSAFE_MS = 1500;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [timedOut, setTimedOut] = useState(Platform.OS === "web");

  useEffect(() => {
    if (Platform.OS !== "web") {
      const timer = setTimeout(() => setTimedOut(true), FAILSAFE_MS);
      return () => clearTimeout(timer);
    }
  }, []);

  const ready = Platform.OS === "web" || fontsLoaded || !!fontError || timedOut;

  useEffect(() => {
    if (ready && Platform.OS !== "web") {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider style={{ flex: 1 }}>
        <AppProvider>
          <RootContent />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootContent() {
  const { isDark } = useApp();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={{ flex: 1, width: "100%", alignItems: "center", backgroundColor: isDark ? colors.bg : "#EEF2F6" }}>
        <View
          style={{
            flex: 1,
            width: "100%",
            maxWidth: Platform.OS === "web" ? 480 : "100%",
            backgroundColor: isDark ? colors.bg : "#F8FAFC",
            ...(Platform.OS === "web"
              ? {
                  height: "100%" as any,
                  borderLeftWidth: 1,
                  borderRightWidth: 1,
                  borderColor: isDark ? colors.border : "rgba(0,0,0,0.08)",
                  boxShadow: "0 0 40px rgba(0,0,0,0.15)",
                }
              : {}),
          }}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: isDark ? colors.bg : "#F8FAFC" },
            }}
          >
            <Stack.Screen name="(tabs)" />
          </Stack>
        </View>
      </View>
    </>
  );
}
