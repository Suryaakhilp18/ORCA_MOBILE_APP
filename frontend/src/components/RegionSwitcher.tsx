import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { api, GeoResult, Region } from "@/src/api";
import { useApp, t, trackingFor } from "@/src/context/AppContext";
import { colors, fonts, radius, spacing, type } from "@/src/theme";

// India-wide coastal region picker. Three ways in: GPS auto-detect, free-text
// search of ANY Indian location (geocoded, then snapped to the nearest
// supported region for data purposes), or a manual tap from the roster.
export default function RegionSwitcher({
  visible,
  onClose,
  onPickLocation,
}: {
  visible: boolean;
  onClose: () => void;
  onPickLocation?: (
    loc: { name: string; lat: number; lon: number },
    region: Region,
  ) => void;
}) {
  const { lang, region, regions, setRegion, showToast, colors, isDark } = useApp();
  const [locating, setLocating] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<GeoResult[] | null>(null);

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      let perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== "granted" && perm.canAskAgain) {
        perm = await Location.requestForegroundPermissionsAsync();
      }
      if (perm.status !== "granted") {
        showToast("Location permission needed. Open settings.", "error");
        Linking.openSettings();
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { region: nearest, distance_km } = await api.detectRegion(
        pos.coords.latitude,
        pos.coords.longitude,
      );
      setRegion(nearest);
      onPickLocation?.(
        {
          name: "My location",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        },
        nearest,
      );
      showToast(
        `Detected ${nearest.name}, ${nearest.state} (~${distance_km} km)`,
        "success",
      );
      onClose();
    } catch {
      showToast("Could not detect location", "error");
    } finally {
      setLocating(false);
    }
  };

  const runSearch = async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    try {
      const res = await api.geocode(q);
      if (!res.results?.length) {
        showToast("No matching location found", "error");
        setResults([]);
      } else {
        setResults(res.results.slice(0, 5));
      }
    } catch {
      showToast("Search unavailable (offline)", "error");
    } finally {
      setSearching(false);
    }
  };

  const pickSearchResult = async (r: GeoResult) => {
    try {
      const { region: nearest } = await api.detectRegion(r.lat, r.lon);
      setRegion(nearest);
      onPickLocation?.({ name: r.display_name, lat: r.lat, lon: r.lon }, nearest);
      showToast(`Now showing data near ${r.display_name}`, "success");
    } catch {
      showToast("Could not resolve region (offline)", "error");
    } finally {
      resetSearch();
      onClose();
    }
  };

  const resetSearch = () => {
    setQuery("");
    setResults(null);
  };

  const pickRegion = (r: Region) => {
    setRegion(r);
    onPickLocation?.(
      { name: `${r.name}, ${r.state}`, lat: r.center.lat, lon: r.center.lon },
      r,
    );
    onClose();
  };

  const filteredRegions = regions.filter((r) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      r.name.toLowerCase().includes(q) ||
      r.state.toLowerCase().includes(q) ||
      (r.sea && r.sea.toLowerCase().includes(q))
    );
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={[
          styles.overlay,
          { backgroundColor: isDark ? "rgba(0, 0, 0, 0.7)" : "rgba(15, 23, 42, 0.45)" },
        ]}
      >
        <View
          style={[
            styles.card,
            {
              width: "92%",
              maxWidth: 440,
              alignSelf: "center",
              backgroundColor: isDark ? "#181C20" : "#FFFFFF",
              borderColor: colors.borderStrong,
              shadowColor: isDark ? "#000000" : "#0F3D3E",
            },
          ]}
          testID="region-switcher"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.onSurface, letterSpacing: trackingFor(lang, 1) }]}>
              {t("selectRegion", lang)}
            </Text>
            <Pressable testID="close-region-switcher" onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.onSurface} />
            </Pressable>
          </View>

          <Pressable
            testID="use-current-location-region"
            onPress={useCurrentLocation}
            style={[styles.gpsBtn, { backgroundColor: colors.brand }]}
          >
            {locating ? (
              <ActivityIndicator size="small" color={colors.onBrand} />
            ) : (
              <Ionicons name="locate" size={16} color={colors.onBrand} />
            )}
            <Text style={[styles.gpsText, { color: colors.onBrand, letterSpacing: trackingFor(lang, 1) }]}>
              {t("useCurrentLocation", lang)}
            </Text>
          </Pressable>

          <View style={styles.searchRow}>
            <TextInput
              testID="region-search-input"
              value={query}
              onChangeText={(v) => {
                setQuery(v);
                if (!v) resetSearch();
              }}
              placeholder={t("searchAnyLocation", lang)}
              placeholderTextColor={colors.muted}
              style={[
                styles.searchInput,
                {
                  backgroundColor: colors.surfaceTertiary,
                  borderColor: colors.border,
                  color: colors.onSurface,
                },
              ]}
              onSubmitEditing={runSearch}
              returnKeyType="search"
            />
            <Pressable
              testID="region-search-btn"
              onPress={runSearch}
              style={[styles.searchBtn, { backgroundColor: colors.brand }]}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator size="small" color={colors.onBrand} />
              ) : (
                <Ionicons name="search" size={18} color={colors.onBrand} />
              )}
            </Pressable>
          </View>

          {results !== null ? (
            <FlatList
              data={results}
              keyExtractor={(_, i) => String(i)}
              style={styles.list}
              ListHeaderComponent={
                <Pressable onPress={resetSearch} style={styles.backRow}>
                  <Ionicons name="arrow-back" size={16} color={colors.brand} />
                  <Text style={[styles.backText, { color: colors.brand }]}>{t("backToRegionList", lang)}</Text>
                </Pressable>
              }
              ListEmptyComponent={
                <Text style={{ color: colors.muted, padding: spacing.md }}>
                  {t("noResultsFound", lang)}
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.row,
                    {
                      backgroundColor: colors.surfaceTertiary,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => pickSearchResult(item)}
                >
                  <Ionicons name="location" size={16} color={colors.brand} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowName, { color: colors.onSurface }]} numberOfLines={2}>
                      {item.display_name}
                    </Text>
                    <Text style={[styles.rowCoords, { color: colors.muted }]}>
                      {item.lat.toFixed(4)}, {item.lon.toFixed(4)}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          ) : (
            <FlatList
              data={filteredRegions}
              keyExtractor={(r) => r.id}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  testID={`region-row-${item.id}`}
                  style={[
                    styles.row,
                    {
                      backgroundColor: item.id === region.id ? (isDark ? "rgba(31,166,160,0.18)" : "rgba(13,148,136,0.12)") : colors.surfaceTertiary,
                      borderColor: item.id === region.id ? colors.brand : colors.border,
                    },
                  ]}
                  onPress={() => pickRegion(item)}
                >
                  <Ionicons
                    name="water"
                    size={16}
                    color={item.id === region.id ? colors.brand : colors.muted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowName, { color: colors.onSurface }]}>
                      {item.name}, {item.state}
                    </Text>
                    <Text style={[styles.rowCoords, { color: colors.muted }]}>{item.sea}</Text>
                  </View>
                  {item.id === region.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={colors.brand}
                    />
                  )}
                </Pressable>
              )}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(9,9,11,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "82%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: type.lg,
    fontWeight: "900",
    letterSpacing: 1,
    color: colors.onSurface,
  },
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brand,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  gpsText: {
    fontFamily: fonts.mono,
    fontSize: type.sm,
    fontWeight: "700",
    letterSpacing: 1,
    color: colors.onBrand,
  },
  searchRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: type.base,
    color: colors.onSurface,
  },
  searchBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand,
    borderRadius: radius.sm,
  },
  list: { flexGrow: 0 },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  backText: {
    fontFamily: fonts.mono,
    fontSize: type.sm,
    color: colors.brand,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceTertiary,
  },
  rowActive: { borderColor: colors.brand },
  rowName: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.onSurface,
  },
  rowCoords: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },
});
