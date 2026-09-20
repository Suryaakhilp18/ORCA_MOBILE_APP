import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, Situation } from "@/src/api";
import LanguagePicker from "@/src/components/LanguagePicker";
import RadarCard from "@/src/components/RadarCard";
import RegionSwitcher from "@/src/components/RegionSwitcher";
import { Lang, t, trackingFor, useApp } from "@/src/context/AppContext";
import { fonts, radius, severityColor, spacing, type, verdictColor } from "@/src/theme";
import { storage } from "@/src/utils/storage";

const HOME_CACHE_KEY = "orca_home_situation_cache";

export default function HomeScreen() {
  const { lang, region, theme, isDark, toggleTheme, colors } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [situation, setSituation] = useState<Situation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [regionModalVisible, setRegionModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const sit = await api.getSituation(region.id, lang);
      setSituation(sit);
      await storage.setItem(`${HOME_CACHE_KEY}_${lang}`, JSON.stringify(sit));
    } catch {
      const cached = (await storage.getItem(`${HOME_CACHE_KEY}_${lang}`, "")) as string;
      if (cached) {
        try {
          setSituation(JSON.parse(cached));
        } catch {
          /* ignore */
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [region.id, lang]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const today = situation?.weather_today;
  const nextTide = situation?.tide?.[0];
  const verdict = situation?.verdict || "SAFE";
  const vc = verdictColor(verdict, isDark);
  const sc = severityColor(situation?.severity, isDark);

  const glassCardStyle = {
    backgroundColor: isDark ? "rgba(24, 28, 32, 0.85)" : "rgba(255, 255, 255, 0.95)",
    borderColor: isDark ? "rgba(31, 166, 160, 0.28)" : "rgba(13, 148, 136, 0.16)",
    borderWidth: 1,
    borderRadius: radius.xl,
    shadowColor: isDark ? "#000000" : "#0F171A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.35 : 0.06,
    shadowRadius: 12,
    elevation: 3,
  };

  const pillButtonStyle = {
    backgroundColor: colors.brand,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.45 : 0.25,
    shadowRadius: 10,
    elevation: 4,
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surfaceSecondary, paddingTop: insets.top }]}>
      {/* Top Floating App Bar */}
      <View style={[styles.topBar, { backgroundColor: isDark ? "#181C20" : "#FFFFFF", borderColor: colors.border }]}>
        <View style={styles.brandRow}>
          <View style={[styles.brandEmblem, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}>
            <Ionicons name="boat" size={18} color={colors.brand} />
          </View>
          <View>
            <View style={styles.logoRow}>
              <Text style={[styles.logoText, { color: colors.onSurface }]}>ORCA</Text>
              <View style={[styles.modelBadge, { backgroundColor: isDark ? "rgba(31,166,160,0.18)" : "rgba(13,148,136,0.12)", borderColor: colors.brand }]}>
                <Text style={[styles.modelBadgeText, { color: colors.brand }]}>V2.4</Text>
              </View>
            </View>
            <Text style={[styles.logoSub, { color: colors.muted }]}>
              {t("marineIntelligence", lang).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Action controls: Region, Lang, Theme */}
        <View style={styles.topActions}>
          <Pressable
            testID="home-region-btn"
            style={[styles.chipButton, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}
            onPress={() => setRegionModalVisible(true)}
          >
            <Ionicons name="location-sharp" size={13} color={colors.brand} />
            <Text style={[styles.chipText, { color: colors.onSurface }]} numberOfLines={1}>
              {region.name}
            </Text>
          </Pressable>

          <Pressable
            testID="home-lang-btn"
            style={[styles.iconButton, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}
            onPress={() => setLangModalVisible(true)}
          >
            <Text style={[styles.langCode, { color: colors.brand }]}>{lang.toUpperCase()}</Text>
          </Pressable>

          <Pressable
            testID="home-theme-toggle"
            style={[styles.iconButton, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}
            onPress={toggleTheme}
          >
            <Ionicons
              name={isDark ? "sunny-outline" : "moon-outline"}
              size={16}
              color={colors.brand}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Editorial Hero Header */}
        <View style={styles.heroSection}>
          <View style={styles.heroPreHeader}>
            <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.liveLabel, { color: colors.brand }]}>
              {t("intelCommandDeck", lang)}
            </Text>
          </View>
          <Text style={[styles.heroEditorialMain, { color: colors.onSurface }]}>
            {t("navigateWith", lang)}
          </Text>
          <Text style={[styles.heroEditorialTeal, { color: colors.brand }]}>
            {t("unrivaledClarity", lang)}
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.muted }]}>
            {t("heroSub", lang)}
          </Text>
        </View>

        {/* Glassmorphic Roadstead Status & Live Advisory Card */}
        <View style={[styles.telemetryCard, glassCardStyle]}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, paddingRight: spacing.sm }}>
              <Text style={[styles.cardStationLabel, { color: colors.muted }]}>
                {t("currentPilotStation", lang)}
              </Text>
              <Text style={[styles.cardStationName, { color: colors.onSurface }]} numberOfLines={1}>
                {region.name.toUpperCase()} {t("sector", lang).toUpperCase()}
              </Text>
              <Text style={[styles.cardStationCoords, { color: colors.brand }]}>
                {region.center.lat.toFixed(2)}°N, {region.center.lon.toFixed(2)}°E • {region.sea || "Bay of Bengal"}
              </Text>
            </View>

            {/* Live Verdict Pill Badge */}
            <View style={[styles.verdictBadge, { backgroundColor: vc.bg }]}>
              <Ionicons
                name={verdict === "SAFE" ? "shield-checkmark" : "warning"}
                size={14}
                color={vc.fg}
              />
              <Text style={[styles.verdictBadgeText, { color: vc.fg }]}>
                {t(verdict === "SAFE" ? "verdictSafe" : verdict === "UNSAFE" ? "verdictUnsafe" : "verdictCaution", lang)}
              </Text>
            </View>
          </View>

          {/* Telemetry Spec Chips */}
          <View style={styles.specsGrid}>
            <View style={[styles.specChip, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}>
              <Ionicons name="water-outline" size={16} color={colors.brand} />
              <View style={styles.specContent}>
                <Text style={[styles.specLabel, { color: colors.muted }]}>{t("swellLabel", lang)}</Text>
                <Text style={[styles.specValue, { color: colors.onSurface }]}>
                  {today?.wave_m != null ? `${today.wave_m} m` : "1.2 m"}
                </Text>
              </View>
            </View>

            <View style={[styles.specChip, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}>
              <Ionicons name="navigate-outline" size={16} color={colors.brand} />
              <View style={styles.specContent}>
                <Text style={[styles.specLabel, { color: colors.muted }]}>{t("windVelocity", lang)}</Text>
                <Text style={[styles.specValue, { color: colors.onSurface }]}>
                  {today?.wind_kn != null ? `${today.wind_kn} kn` : "12 kn"}
                </Text>
              </View>
            </View>

            <View style={[styles.specChip, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}>
              <Ionicons name="flash-outline" size={16} color={colors.brand} />
              <View style={styles.specContent}>
                <Text style={[styles.specLabel, { color: colors.muted }]}>{t("lightningLabel", lang)}</Text>
                <Text style={[styles.specValue, { color: colors.onSurface }]}>
                  {today?.lightning_pct != null ? `${today.lightning_pct}%` : "0%"}
                </Text>
              </View>
            </View>

            <View style={[styles.specChip, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}>
              <Ionicons name="time-outline" size={16} color={colors.brand} />
              <View style={styles.specContent}>
                <Text style={[styles.specLabel, { color: colors.muted }]}>{t("nextTide", lang)}</Text>
                <Text style={[styles.specValue, { color: colors.onSurface }]}>
                  {nextTide ? `${nextTide.type === "HIGH TIDE" ? t("highTide", lang) : t("lowTide", lang)} ${nextTide.time}` : "--:--"}
                </Text>
              </View>
            </View>
          </View>

          {/* Cyclonic or Advisory Banner if active */}
          {today?.cyclone && (
            <View style={[styles.alertBanner, { backgroundColor: colors.error, borderRadius: radius.md }]}>
              <Ionicons name="thunderstorm" size={16} color={colors.onError} />
              <Text style={[styles.alertBannerText, { color: colors.onError }]}>
                {t("cycloneActiveLabel", lang)}: {today.cyclone}
              </Text>
            </View>
          )}

          {/* Primary CTA - Launch Copilot */}
          <Pressable
            testID="home-launch-copilot-cta"
            style={[styles.primaryPillCTA, pillButtonStyle]}
            onPress={() => router.push("/(tabs)")}
          >
            <View style={styles.ctaInner}>
              <Ionicons name="sparkles" size={17} color={colors.onBrand} />
              <Text style={[styles.primaryCtaText, { color: colors.onBrand }]}>
                {t("launchCopilot", lang)}
              </Text>
              <Ionicons name="arrow-forward" size={17} color={colors.onBrand} />
            </View>
          </Pressable>
        </View>

        {/* Tactical Modules Deck */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface, letterSpacing: trackingFor(lang, 1.5) }]}>
            {t("tacticalModules", lang)}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
            {t("tacticalSub", lang)}
          </Text>
        </View>

        <View style={styles.modulesGrid}>
          {/* Card 1: Copilot Chat */}
          <Pressable
            style={[styles.moduleCard, glassCardStyle]}
            onPress={() => router.push("/(tabs)")}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: isDark ? "rgba(31,166,160,0.15)" : "rgba(13,148,136,0.1)" }]}>
              <Ionicons name="chatbubbles" size={20} color={colors.brand} />
            </View>
            <Text style={[styles.moduleTitle, { color: colors.onSurface }]}>{t("copilotAdvisory", lang)}</Text>
            <Text style={[styles.moduleDesc, { color: colors.muted }]}>
              {t("copilotDesc", lang)}
            </Text>
            <View style={styles.moduleFooter}>
              <Text style={[styles.moduleActionLink, { color: colors.brand }]}>{t("queryAi", lang)}</Text>
            </View>
          </Pressable>

          {/* Card 2: Hazard Alerts */}
          <Pressable
            style={[styles.moduleCard, glassCardStyle]}
            onPress={() => router.push("/(tabs)/alerts")}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: isDark ? "rgba(245,158,11,0.15)" : "rgba(217,119,6,0.1)" }]}>
              <Ionicons name="warning" size={20} color={colors.warning} />
            </View>
            <Text style={[styles.moduleTitle, { color: colors.onSurface }]}>{t("hazardsAlerts", lang)}</Text>
            <Text style={[styles.moduleDesc, { color: colors.muted }]}>
              {t("hazardsDesc", lang)}
            </Text>
            <View style={styles.moduleFooter}>
              <Text style={[styles.moduleActionLink, { color: colors.warning }]}>{t("viewIntel", lang)}</Text>
            </View>
          </Pressable>

          {/* Card 3: Waypoints & Geofence */}
          <Pressable
            style={[styles.moduleCard, glassCardStyle]}
            onPress={() => router.push("/(tabs)/saved")}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: isDark ? "rgba(45,191,184,0.15)" : "rgba(20,184,166,0.1)" }]}>
              <Ionicons name="bookmark" size={20} color={colors.brandGlow} />
            </View>
            <Text style={[styles.moduleTitle, { color: colors.onSurface }]}>{t("savedWaypoints", lang)}</Text>
            <Text style={[styles.moduleDesc, { color: colors.muted }]}>
              {t("savedDesc", lang)}
            </Text>
            <View style={styles.moduleFooter}>
              <Text style={[styles.moduleActionLink, { color: colors.brandGlow }]}>{t("manage", lang)}</Text>
            </View>
          </Pressable>

          {/* Card 4: Switch Sector */}
          <Pressable
            style={[styles.moduleCard, glassCardStyle]}
            onPress={() => setRegionModalVisible(true)}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: isDark ? "rgba(56,189,248,0.15)" : "rgba(2,132,199,0.1)" }]}>
              <Ionicons name="compass" size={20} color={colors.dataBlue} />
            </View>
            <Text style={[styles.moduleTitle, { color: colors.onSurface }]}>{t("coastalSectors", lang)}</Text>
            <Text style={[styles.moduleDesc, { color: colors.muted }]}>
              {t("sectorsDesc", lang)}
            </Text>
            <View style={styles.moduleFooter}>
              <Text style={[styles.moduleActionLink, { color: colors.dataBlue }]}>{t("switchPort", lang)}</Text>
            </View>
          </Pressable>
        </View>

        {/* Live Sector Radar Widget */}
        <View style={styles.radarSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface, letterSpacing: trackingFor(lang, 1.5) }]}>
              {t("sectorRadar", lang)}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
              {t("radarSub", lang)} — {region.name}
            </Text>
          </View>
          <RadarCard />
        </View>

        {/* Evidence & Regulatory Attribution */}
        <View style={[styles.attributionBox, { borderColor: colors.border, backgroundColor: isDark ? "rgba(24, 28, 32, 0.7)" : "#FFFFFF" }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.brand} />
          <Text style={[styles.attributionText, { color: colors.muted }]}>
            INCOIS Marine Forecaster • IMD Severe Weather Services • Sentinel Constellations
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals for Region & Language switching */}
      <RegionSwitcher
        visible={regionModalVisible}
        onClose={() => setRegionModalVisible(false)}
      />
      <LanguagePicker
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  brandEmblem: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logoText: {
    fontFamily: fonts.mono,
    fontSize: type.lg,
    fontWeight: "900",
    letterSpacing: 2,
  },
  modelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  modelBadgeText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    fontWeight: "700",
  },
  logoSub: {
    fontFamily: fonts.mono,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    maxWidth: 120,
  },
  chipText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: "600",
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  langCode: {
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: "800",
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  heroSection: {
    marginBottom: spacing.lg,
  },
  heroPreHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.xs,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heroEditorialMain: {
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  heroEditorialTeal: {
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 32,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: type.xs,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  telemetryCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  cardStationLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardStationName: {
    fontSize: type.lg,
    fontWeight: "800",
  },
  cardStationCoords: {
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  verdictBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  verdictBadgeText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  specsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  specChip: {
    flex: 1,
    minWidth: "46%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  specContent: {
    flex: 1,
  },
  specLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  specValue: {
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  alertBannerText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
  },
  primaryPillCTA: {
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  ctaInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  primaryCtaText: {
    fontFamily: fonts.mono,
    fontSize: type.xs,
    fontWeight: "800",
    letterSpacing: 1,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: type.sm,
    fontWeight: "800",
  },
  sectionSubtitle: {
    fontSize: type.xs,
    marginTop: 2,
  },
  modulesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  moduleCard: {
    width: "48.5%",
    padding: spacing.md,
    minHeight: 140,
    justifyContent: "space-between",
  },
  moduleIconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  moduleTitle: {
    fontSize: type.sm,
    fontWeight: "800",
    marginBottom: 2,
  },
  moduleDesc: {
    fontSize: 10,
    lineHeight: 14,
    marginBottom: spacing.xs,
  },
  moduleFooter: {
    marginTop: "auto",
  },
  moduleActionLink: {
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: "700",
  },
  radarSection: {
    marginBottom: spacing.lg,
  },
  attributionBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  attributionText: {
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },
});
