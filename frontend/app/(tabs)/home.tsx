import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, Situation, MapWidgetT, Marker } from "@/src/api";
import LanguagePicker from "@/src/components/LanguagePicker";
import MapWidget, { MapWidgetRef } from "@/src/components/MapWidget";
import RadarCard from "@/src/components/RadarCard";
import RegionSwitcher from "@/src/components/RegionSwitcher";
import { Lang, t, trackingFor, useApp } from "@/src/context/AppContext";
import { fonts, radius, severityColor, spacing, type, verdictColor } from "@/src/theme";
import { PORTS_REGISTRY } from "@/src/utils/navigation";
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
  const [fleetModalVisible, setFleetModalVisible] = useState(false);
  const [fleetSearch, setFleetSearch] = useState("");
  const [locatingVessel, setLocatingVessel] = useState<string | null>(null);
  const mapRef = useRef<MapWidgetRef>(null);

  const handleLocateVessel = useCallback((name: string) => {
    setLocatingVessel(name);
    mapRef.current?.locateVessel(name);
    setTimeout(() => setLocatingVessel(null), 2500);
  }, []);

  const homeMapWidget: MapWidgetT = useMemo(() => {
    const activePort = PORTS_REGISTRY[region?.id] || {
      id: region?.id || "kakinada",
      name: region?.name || "Kakinada",
      state: region?.state || "Andhra Pradesh",
      lat: region?.center?.lat ?? 16.9891,
      lon: region?.center?.lon ?? 82.2475,
      sea: region?.sea || "Bay of Bengal",
      aliases: [],
    };

    const markers: Marker[] = [
      {
        lat: activePort.lat,
        lon: activePort.lon,
        name: `${activePort.name} Coastal Station`,
        label: `📍 BASE: ${activePort.name.toUpperCase()} HARBOUR`,
        kind: "user",
      },
      {
        lat: activePort.lat - 0.08,
        lon: activePort.lon + 0.12,
        name: `${activePort.name} Pilot Station`,
        label: `⚓ ${activePort.name} Pilot Station (VHF 16)`,
        kind: "fleet",
        speed_kn: 0,
        status: "Navigational Buoy",
      },
      {
        lat: activePort.lat + 0.06,
        lon: activePort.lon + 0.18,
        name: "MV Sagar Samrat",
        label: "⛵ MV Sagar Samrat (9.2 kn)",
        kind: "fleet",
        speed_kn: 9.2,
        status: "Active Trawling",
      },
      {
        lat: activePort.lat - 0.04,
        lon: activePort.lon + 0.25,
        name: "FV Matsya Prabha",
        label: "⛵ FV Matsya Prabha (7.8 kn)",
        kind: "fleet",
        speed_kn: 7.8,
        status: "Drift Netting",
      },
      {
        lat: activePort.lat + 0.15,
        lon: activePort.lon + 0.35,
        name: "High Biomass Zone",
        label: "★ PFZ: High Pelagic Biomass (SST 28.4°C)",
        kind: "pfz_recommended",
        confidence: 88,
      },
    ];

    return {
      type: "map",
      center: { lat: activePort.lat, lon: activePort.lon },
      markers,
      layers: [],
      fleet_info: {
        sector: activePort.name,
        total_vessels: 4,
      },
    };
  }, [region]);

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

        {/* Module 7: Fisherman Quick Action & Direct Voice Bar */}
        <View style={[styles.fishermanBar, { backgroundColor: isDark ? "rgba(24, 28, 32, 0.95)" : "#FFFFFF", borderColor: isDark ? "rgba(31, 166, 160, 0.35)" : "rgba(13, 148, 136, 0.25)" }]}>
          <Pressable
            testID="fisherman-voice-mic-btn"
            style={[styles.bigMicButton, { backgroundColor: colors.brand }]}
            onPress={() => router.push("/(tabs)")}
          >
            <Ionicons name="mic" size={24} color="#FFFFFF" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "800", letterSpacing: 0.5 }}>
                {lang === "te" ? "ఓర్కా వాయిస్ అసిస్టెంట్‌తో మాట్లాడండి" : lang === "hi" ? "ओर्का वॉइस असिस्टेंट से बात करें" : "TAP TO SPEAK WITH ORCA"}
              </Text>
              <Text style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: 10, marginTop: 2 }}>
                {lang === "te" ? "తెలుగు, हिन्दी లేదా English లో సమాధానం" : lang === "hi" ? "हिन्दी, తెలుగు या English में बोलें" : "Supports Telugu, Hindi & English natively"}
              </Text>
            </View>
            <View style={styles.micChevron}>
              <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            </View>
          </Pressable>

          {/* Quick Action Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 10 }}>
            <Pressable
              onPress={() => router.push({ pathname: "/(tabs)", params: { q: "Route me to nearest PFZ from Kakinada Port" } })}
              style={[styles.quickPill, { backgroundColor: isDark ? "rgba(31, 166, 160, 0.15)" : "rgba(13, 148, 136, 0.12)", borderColor: colors.brand }]}
            >
              <Text style={{ fontSize: 14 }}>🐟</Text>
              <Text style={[styles.quickPillText, { color: colors.brand }]}>
                {lang === "te" ? "చేపల వేట జోన్లు (PFZ)" : lang === "hi" ? "मत्स्य क्षेत्र (PFZ)" : "Best Catch (PFZ)"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push({ pathname: "/(tabs)", params: { q: "Is it safe to go fishing today?" } })}
              style={[styles.quickPill, { backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.12)", borderColor: "#10B981" }]}
            >
              <Text style={{ fontSize: 14 }}>🌊</Text>
              <Text style={[styles.quickPillText, { color: "#10B981" }]}>
                {lang === "te" ? "సముద్ర భద్రత (Safety)" : lang === "hi" ? "समुद्र सुरक्षा" : "Sea Safety"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(tabs)/alerts")}
              style={[styles.quickPill, { backgroundColor: isDark ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.12)", borderColor: colors.warning }]}
            >
              <Text style={{ fontSize: 14 }}>⚠️</Text>
              <Text style={[styles.quickPillText, { color: colors.warning }]}>
                {lang === "te" ? "తుఫాను హెచ్చరికలు" : lang === "hi" ? "मौसम चेतावनी" : "Marine Alerts"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setRegionModalVisible(true)}
              style={[styles.quickPill, { backgroundColor: isDark ? "rgba(56, 189, 248, 0.15)" : "rgba(2, 132, 199, 0.12)", borderColor: colors.dataBlue }]}
            >
              <Text style={{ fontSize: 14 }}>⚓</Text>
              <Text style={[styles.quickPillText, { color: colors.dataBlue }]}>
                {lang === "te" ? "పోర్టు మార్చండి" : lang === "hi" ? "बंदरगाह बदलें" : "Change Port"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>

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

        {/* Module 4: Fleet Operations Command Center (With Structured Seed Data & Working Locate) */}
        <View style={styles.radarSection}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="boat" size={18} color="#10B981" />
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.onSurface, letterSpacing: trackingFor(lang, 1.2) }]}>
                    {lang === "te" ? "ఫ్లీట్ కార్యకలాపాలు (FLEET OPERATIONS)" : lang === "hi" ? "फ्लीट ऑपरेशन्स (FLEET OPERATIONS)" : "FLEET OPERATIONS"}
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
                    3 Craft Monitored • 2 Active Trawlers • 1 Pilot Station
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setFleetModalVisible(true)}
                style={[styles.viewAllBtn, { backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)", borderColor: "#10B981" }]}
              >
                <Text style={{ color: "#10B981", fontSize: 11, fontWeight: "700" }}>View All Fleet</Text>
                <Ionicons name="chevron-forward" size={13} color="#10B981" />
              </Pressable>
            </View>
          </View>

          {/* Seed Fleet Cards */}
          <View style={{ gap: 10 }}>
            {/* Vessel 1: MV Sagar Samrat */}
            <View style={[styles.fleetSeedCard, { backgroundColor: isDark ? "rgba(24, 28, 32, 0.88)" : "#FFFFFF", borderColor: isDark ? "rgba(16, 185, 129, 0.35)" : colors.borderStrong }]}>
              <View style={styles.fleetCardTop}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 18 }}>⛵</Text>
                  <View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[styles.fleetVesselTitle, { color: colors.onSurface }]}>MV Sagar Samrat</Text>
                      <View style={[styles.demoBadge, { backgroundColor: "rgba(245, 158, 11, 0.2)", borderColor: colors.warning }]}>
                        <Text style={[styles.demoBadgeText, { color: colors.warning }]}>DEMO DATA</Text>
                      </View>
                    </View>
                    <Text style={[styles.fleetVesselSub, { color: colors.muted }]}>Deep Sea Trawler • Active Trawling</Text>
                  </View>
                </View>
                <View style={[styles.speedTag, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
                  <Text style={{ color: "#10B981", fontSize: 11, fontWeight: "800" }}>9.2 kts</Text>
                </View>
              </View>

              <View style={styles.fleetCardBottom}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Text style={[styles.fleetMetaText, { color: colors.muted }]}>📻 VHF Ch 16</Text>
                  <Text style={[styles.fleetMetaText, { color: colors.dataBlue }]}>📍 17.0491°N, 82.4275°E</Text>
                </View>
                <Pressable
                  onPress={() => handleLocateVessel("MV Sagar Samrat")}
                  style={[styles.fleetLocateAction, locatingVessel === "MV Sagar Samrat" && { backgroundColor: "rgba(31, 166, 160, 0.3)" }]}
                >
                  <Ionicons name={locatingVessel === "MV Sagar Samrat" ? "sync" : "locate"} size={14} color={colors.brand} />
                  <Text style={{ color: colors.brand, fontSize: 11, fontWeight: "800" }}>
                    {locatingVessel === "MV Sagar Samrat" ? "Locating..." : "Locate"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Vessel 2: FV Matsya Prabha */}
            <View style={[styles.fleetSeedCard, { backgroundColor: isDark ? "rgba(24, 28, 32, 0.88)" : "#FFFFFF", borderColor: isDark ? "rgba(16, 185, 129, 0.35)" : colors.borderStrong }]}>
              <View style={styles.fleetCardTop}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 18 }}>⛵</Text>
                  <View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[styles.fleetVesselTitle, { color: colors.onSurface }]}>FV Matsya Prabha</Text>
                      <View style={[styles.demoBadge, { backgroundColor: "rgba(245, 158, 11, 0.2)", borderColor: colors.warning }]}>
                        <Text style={[styles.demoBadgeText, { color: colors.warning }]}>DEMO DATA</Text>
                      </View>
                    </View>
                    <Text style={[styles.fleetVesselSub, { color: colors.muted }]}>Mechanized Gillnetter • Drift Netting</Text>
                  </View>
                </View>
                <View style={[styles.speedTag, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
                  <Text style={{ color: "#10B981", fontSize: 11, fontWeight: "800" }}>7.8 kts</Text>
                </View>
              </View>

              <View style={styles.fleetCardBottom}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Text style={[styles.fleetMetaText, { color: colors.muted }]}>📻 VHF Ch 16</Text>
                  <Text style={[styles.fleetMetaText, { color: colors.dataBlue }]}>📍 16.9491°N, 82.4975°E</Text>
                </View>
                <Pressable
                  onPress={() => handleLocateVessel("FV Matsya Prabha")}
                  style={[styles.fleetLocateAction, locatingVessel === "FV Matsya Prabha" && { backgroundColor: "rgba(31, 166, 160, 0.3)" }]}
                >
                  <Ionicons name={locatingVessel === "FV Matsya Prabha" ? "sync" : "locate"} size={14} color={colors.brand} />
                  <Text style={{ color: colors.brand, fontSize: 11, fontWeight: "800" }}>
                    {locatingVessel === "FV Matsya Prabha" ? "Locating..." : "Locate"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Vessel 3: Kakinada Pilot Station */}
            <View style={[styles.fleetSeedCard, { backgroundColor: isDark ? "rgba(24, 28, 32, 0.88)" : "#FFFFFF", borderColor: isDark ? "rgba(16, 185, 129, 0.35)" : colors.borderStrong }]}>
              <View style={styles.fleetCardTop}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 18 }}>⚓</Text>
                  <View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[styles.fleetVesselTitle, { color: colors.onSurface }]}>Kakinada Pilot Station</Text>
                      <View style={[styles.demoBadge, { backgroundColor: "rgba(245, 158, 11, 0.2)", borderColor: colors.warning }]}>
                        <Text style={[styles.demoBadgeText, { color: colors.warning }]}>DEMO DATA</Text>
                      </View>
                    </View>
                    <Text style={[styles.fleetVesselSub, { color: colors.muted }]}>Pilot & Port Support • Harbour Watch</Text>
                  </View>
                </View>
                <View style={[styles.speedTag, { backgroundColor: "rgba(56, 189, 248, 0.15)" }]}>
                  <Text style={{ color: colors.dataBlue, fontSize: 11, fontWeight: "800" }}>0 kts</Text>
                </View>
              </View>

              <View style={styles.fleetCardBottom}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Text style={[styles.fleetMetaText, { color: colors.muted }]}>📻 VHF Ch 16</Text>
                  <Text style={[styles.fleetMetaText, { color: colors.dataBlue }]}>📍 16.9091°N, 82.3675°E</Text>
                </View>
                <Pressable
                  onPress={() => handleLocateVessel("Kakinada Pilot Station")}
                  style={[styles.fleetLocateAction, locatingVessel === "Kakinada Pilot Station" && { backgroundColor: "rgba(31, 166, 160, 0.3)" }]}
                >
                  <Ionicons name={locatingVessel === "Kakinada Pilot Station" ? "sync" : "locate"} size={14} color={colors.brand} />
                  <Text style={{ color: colors.brand, fontSize: 11, fontWeight: "800" }}>
                    {locatingVessel === "Kakinada Pilot Station" ? "Locating..." : "Locate"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Interactive Tactical ECDIS Plotter (Module 4.1) */}
        <View style={styles.radarSection}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="map" size={16} color={colors.brand} />
              <Text style={[styles.sectionTitle, { color: colors.onSurface, letterSpacing: trackingFor(lang, 1.5) }]}>
                {lang === "te" ? "వ్యూహాత్మక ECDIS ప్లాటర్" : lang === "hi" ? "रणनीतिक ECDIS नौवहन नक्शा" : "TACTICAL ECDIS PLOTTER"}
              </Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
              {region.name} {t("sector", lang)} • AIS Fleet & Fairway Station
            </Text>
          </View>
          <MapWidget ref={mapRef} widget={homeMapWidget} />
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

      {/* View All Fleet Operations Modal (Module 4.4) */}
      <Modal visible={fleetModalVisible} animationType="slide" transparent onRequestClose={() => setFleetModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: isDark ? "#181C20" : "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "80%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: "900", color: colors.onSurface }}>ACTIVE FLEET ROSTER</Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>3 Tracked Craft • Kakinada Roadstead Sector</Text>
              </View>
              <Pressable onPress={() => setFleetModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={colors.onSurface} />
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: isDark ? "#111417" : "#F1F5F9", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14, borderWidth: 1, borderColor: colors.border }}>
              <Ionicons name="search" size={16} color={colors.muted} />
              <TextInput
                value={fleetSearch}
                onChangeText={setFleetSearch}
                placeholder="Search by vessel name or callsign..."
                placeholderTextColor={colors.muted}
                style={{ flex: 1, marginLeft: 8, color: colors.onSurface, fontSize: 13 }}
              />
            </View>

            <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
              {[
                { name: "MV Sagar Samrat", type: "Deep Sea Trawler", status: "Active Trawling", speed: "9.2 kn", vhf: "Ch 16", lat: 17.0491, lon: 82.4275 },
                { name: "FV Matsya Prabha", type: "Mechanized Gillnetter", status: "Active Drift Netting", speed: "7.8 kn", vhf: "Ch 16", lat: 16.9491, lon: 82.4975 },
                { name: "Kakinada Pilot Station", type: "Pilot & Harbour Watch", status: "Available", speed: "0 kn", vhf: "Ch 16", lat: 16.9091, lon: 82.3675 },
              ]
                .filter(v => !fleetSearch || v.name.toLowerCase().includes(fleetSearch.toLowerCase()))
                .map((v, i) => (
                  <View key={i} style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: isDark ? "#1E2428" : "#F8FAFC" }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ fontWeight: "800", fontSize: 14, color: colors.onSurface }}>⛵ {v.name}</Text>
                      <View style={[styles.demoBadge, { backgroundColor: "rgba(245, 158, 11, 0.2)", borderColor: colors.warning }]}>
                        <Text style={[styles.demoBadgeText, { color: colors.warning }]}>DEMO DATA</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{v.type} • {v.status} • {v.speed}</Text>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <Text style={{ fontSize: 11, color: colors.brand }}>📻 {v.vhf} • {v.lat.toFixed(4)}°N, {v.lon.toFixed(4)}°E</Text>
                      <Pressable
                        onPress={() => {
                          setFleetModalVisible(false);
                          handleLocateVessel(v.name);
                        }}
                        style={[styles.fleetLocateAction, { backgroundColor: "rgba(31, 166, 160, 0.15)" }]}
                      >
                        <Ionicons name="locate" size={13} color={colors.brand} />
                        <Text style={{ color: colors.brand, fontSize: 11, fontWeight: "800" }}>Locate on Map</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  fleetSeedCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: 10,
  },
  fleetCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fleetVesselTitle: {
    fontSize: type.base,
    fontWeight: "800",
  },
  fleetVesselSub: {
    fontSize: 11,
    marginTop: 2,
  },
  demoBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  demoBadgeText: {
    fontFamily: fonts.mono,
    fontSize: 8.5,
    fontWeight: "900",
  },
  speedTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  fleetCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    paddingTop: 8,
  },
  fleetMetaText: {
    fontFamily: fonts.mono,
    fontSize: 10.5,
    fontWeight: "600",
  },
  fleetLocateAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: "rgba(31, 166, 160, 0.12)",
  },


  fishermanBar: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  bigMicButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
  },
  micChevron: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  quickPillText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: "700",
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
