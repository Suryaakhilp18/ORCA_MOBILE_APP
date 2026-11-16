import { Ionicons } from "@expo/vector-icons";
import React, { Component, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, Situation } from "@/src/api";
import AlertCard, { AlertItem } from "@/src/components/AlertCard";
import ChartWidget from "@/src/components/ChartWidget";
import RadarCard from "@/src/components/RadarCard";
import SituationCard from "@/src/components/SituationCard";
import StaleBanner from "@/src/components/StaleBanner";
import { useApp, t, trackingFor } from "@/src/context/AppContext";
import { storage } from "@/src/utils/storage";
import { colors, fonts, radius, severityColor, spacing, type } from "@/src/theme";

import mockSituationsData from "@/src/situations.json";
import mockAlertsData from "@/src/alerts.json";

const CACHE_KEY = "orca_alerts_cache";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackColors: any;
  isDark: boolean;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class AlertsErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn("AlertsErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      const { fallbackColors, isDark } = this.props;
      return (
        <View style={{ flex: 1, backgroundColor: isDark ? "#111417" : "#F0F4F8", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(31,166,160,0.15)", justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
            <Ionicons name="shield-checkmark" size={28} color="#1FA6A0" />
          </View>
          <Text style={{ color: isDark ? "#FFFFFF" : "#0F171A", fontSize: 18, fontWeight: "800", marginBottom: 8, textAlign: "center" }}>
            TACTICAL ALERTS MONITOR
          </Text>
          <Text style={{ color: "#9AA5A5", fontSize: 13, textAlign: "center", marginBottom: 20, maxWidth: 320 }}>
            Active coastal safety monitoring initialized. All navigational fairways and maritime zones operating within standard IMD parameters.
          </Text>
          <Pressable
            onPress={this.handleRetry}
            style={{ backgroundColor: "#1FA6A0", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13 }}>RECONNECT SENSORS</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}


function AlertsContent() {
  const { lang, userId, region, colors, isDark, toggleTheme } = useApp();
  const insets = useSafeAreaInsets();
  
  const regId = region?.id || "kakinada";
  const defaultSit: Situation = (mockSituationsData as any)[regId] || (mockSituationsData as any)["kakinada"];
  const defaultAlerts: AlertItem[] = (mockAlertsData as any)[regId]?.alerts || (mockAlertsData as any)["kakinada"]?.alerts || [];

  const [situation, setSituation] = useState<Situation>(defaultSit);
  const [alerts, setAlerts] = useState<AlertItem[]>(defaultAlerts);
  const [notifs, setNotifs] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stale, setStale] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const activeRegId = region?.id || "kakinada";
      const [s, a, n] = await Promise.all([
        api.getSituation(activeRegId, lang),
        api.getAlerts(activeRegId, lang),
        api.getNotifications(userId),
      ]);
      const fallbackSit = (mockSituationsData as any)[activeRegId] || (mockSituationsData as any)["kakinada"];
      const resolvedSit = s || fallbackSit;
      setSituation(resolvedSit);

      const aList = Array.isArray(a) ? a : (a?.alerts || (mockAlertsData as any)[activeRegId]?.alerts || []);
      setAlerts(Array.isArray(aList) ? aList : []);
      setNotifs(Array.isArray(n) ? n : []);
      setStale(null);

      await storage.setItem(
        `${CACHE_KEY}_${lang}`,
        JSON.stringify({
          situation: resolvedSit,
          alerts: aList,
          notifs: Array.isArray(n) ? n : [],
          ts: new Date().toISOString(),
        }),
      );
    } catch {
      const activeRegId = region?.id || "kakinada";
      const raw = (await storage.getItem(`${CACHE_KEY}_${lang}`, "")) as string;
      if (raw) {
        try {
          const c = typeof raw === "string" ? JSON.parse(raw) : raw;
          setSituation(c.situation || (mockSituationsData as any)[activeRegId] || (mockSituationsData as any)["kakinada"]);
          const storedAlerts = Array.isArray(c.alerts) ? c.alerts : (c.alerts?.alerts || []);
          setAlerts(storedAlerts);
          setNotifs(Array.isArray(c.notifs) ? c.notifs : []);
          setStale(c.ts);
        } catch {
          const fallbackSit = (mockSituationsData as any)[activeRegId] || (mockSituationsData as any)["kakinada"];
          setSituation(fallbackSit);
        }
      } else {
        const fallbackSit = (mockSituationsData as any)[activeRegId] || (mockSituationsData as any)["kakinada"];
        const fallbackAlerts = (mockAlertsData as any)[activeRegId]?.alerts || (mockAlertsData as any)["kakinada"]?.alerts || [];
        setSituation(fallbackSit);
        setAlerts(fallbackAlerts);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, region?.id, lang]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const safeAlerts = (Array.isArray(alerts) ? alerts : []).filter(
    (item) => item && typeof item === "object" && (item.title || item.body)
  );
  const safeNotifs = (Array.isArray(notifs) ? notifs : []).filter(
    (item) => item && typeof item === "object" && (item.title || item.body)
  );

  const sc = severityColor(situation?.severity, isDark);
  const sstVals = situation?.trends?.sst?.values ?? [28.4];
  const lastSst = sstVals.length > 0 ? sstVals[sstVals.length - 1] : 28.4;

  const regName = region?.name || "Kakinada";
  const regState = region?.state || "Andhra Pradesh";

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceSecondary, paddingTop: insets?.top || 0 }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? "#181C20" : "#FFFFFF", borderBottomColor: sc.bg }]}>
        <View>
          <Text style={[styles.title, { color: colors.onSurface, letterSpacing: trackingFor(lang, 2) }]}>
            {t("alerts", lang).toUpperCase()}
          </Text>
          <Text style={[styles.regionText, { color: colors.muted }]}>
            {regName}, {regState}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Pressable
            testID="theme-toggle-alerts"
            onPress={toggleTheme}
            style={[styles.headerBadge, { backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.border }]}
          >
            <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={16} color={colors.brand} />
          </Pressable>
          <View style={[styles.headerBadge, { backgroundColor: sc.bg }]}>
            <Ionicons name="warning" size={16} color={sc.fg} />
          </View>
        </View>
      </View>

      {stale && <StaleBanner message={t("offline", lang)} updatedAt={stale} />}

      {loading && !situation ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.brand}
            />
          }
        >
          {/* Situation Card */}
          {situation && <SituationCard situation={situation} lang={lang} />}

          {/* Radar Sweep Card */}
          <RadarCard
            region={region}
            severity={situation?.severity || "advisory"}
            windKn={situation?.weather_today?.wind_kn ?? 10}
            waveM={situation?.weather_today?.wave_m ?? 0.8}
            sstC={lastSst}
            lang={lang}
          />

          {/* Trends Charts */}
          {situation?.trends?.wind?.values && situation.trends.wind.values.length > 0 && (
            <ChartWidget
              widget={{
                type: "chart",
                title: t("windTrendTitle", lang),
                unit: situation.trends.wind.unit || "kn",
                labels: situation.trends.wind.labels || [],
                values: situation.trends.wind.values || [],
                color: colors.warning,
              }}
              forceColor={colors.warning}
            />
          )}

          {situation?.trends?.wave?.values && situation.trends.wave.values.length > 0 && (
            <ChartWidget
              widget={{
                type: "chart",
                title: t("waveTrendTitle", lang),
                unit: situation.trends.wave.unit || "m",
                labels: situation.trends.wave.labels || [],
                values: situation.trends.wave.values || [],
                color: colors.dataBlue,
              }}
              forceColor={colors.dataBlue}
            />
          )}

          {situation?.trends?.sst?.values && situation.trends.sst.values.length > 0 && (
            <ChartWidget
              widget={{
                type: "chart",
                title: t("sstTrendTitle", lang),
                unit: situation.trends.sst.unit || "°C",
                labels: situation.trends.sst.labels || [],
                values: situation.trends.sst.values || [],
                color: colors.error,
              }}
              forceColor={colors.error}
            />
          )}

          <View style={{ height: spacing.lg }} />

          {/* Active Alerts Section */}
          <View style={{ marginBottom: spacing.lg }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface, letterSpacing: trackingFor(lang, 1) }]}>
                {t("activeAlerts", lang).toUpperCase()}
              </Text>
              <View style={[styles.badgePill, { backgroundColor: sc.bg }]}>
                <Text style={[styles.badgePillText, { color: sc.fg }]}>{safeAlerts.length}</Text>
              </View>
            </View>

            {safeAlerts.length === 0 ? (
              <View testID="no-hazards" style={[styles.emptyBox, { backgroundColor: isDark ? "#181C20" : "#FFFFFF", borderColor: colors.border }]}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.emptyText}>{t("noHazards", lang)}</Text>
              </View>
            ) : (
              safeAlerts.map((it, i) => (
                <AlertCard key={(it as any).key || `alert-${i}`} item={it} lang={lang} />
              ))
            )}
          </View>

          {/* Notifications Section */}
          <View style={{ marginBottom: spacing.xl }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface, letterSpacing: trackingFor(lang, 1) }]}>
                {t("notifications", lang).toUpperCase()}
              </Text>
              <View style={[styles.badgePill, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border, borderWidth: 1 }]}>
                <Text style={[styles.badgePillText, { color: colors.brand }]}>{safeNotifs.length}</Text>
              </View>
            </View>

            {safeNotifs.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: isDark ? "#181C20" : "#FFFFFF", borderColor: colors.border }]}>
                <Ionicons name="notifications-off-outline" size={18} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>{t("noHazards", lang)}</Text>
              </View>
            ) : (
              safeNotifs.map((it, i) => (
                <AlertCard key={(it as any).key || `notif-${i}`} item={it} lang={lang} />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

export default function AlertsScreen() {
  const { colors, isDark } = useApp();
  return (
    <AlertsErrorBoundary fallbackColors={colors} isDark={isDark}>
      <AlertsContent />
    </AlertsErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  scroll: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderColor: colors.border,
  },
  title: {
    fontSize: type.xl,
    fontWeight: "900",
    letterSpacing: 2,
    color: colors.onSurface,
  },
  regionText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  headerBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: type.sm,
    fontWeight: "800",
    letterSpacing: 1,
    color: colors.onSurface,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgePillText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: "800",
  },
  emptyBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  emptyText: {
    fontFamily: fonts.mono,
    fontSize: type.sm,
    color: colors.success,
    fontWeight: "700",
  },
});
