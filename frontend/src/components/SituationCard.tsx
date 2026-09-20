import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Situation } from "@/src/api";
import { Lang, t, useApp } from "@/src/context/AppContext";
import { colors, fonts, radius, severityColor, spacing, type } from "@/src/theme";

const SEVERITY_KEY: Record<string, string> = {
  critical: "severityCritical",
  warning: "severityWarning",
  advisory: "severityAdvisory",
};

// Top-of-tab overview card for the "Marine Situation & Alert Intelligence
// Center". Severity + verdict + reasons are all rule-computed on the
// backend (never LLM-guessed) — this card only renders them.
export default function SituationCard({
  situation,
  lang,
}: {
  situation: Situation;
  lang: Lang;
}) {
  const { colors, isDark } = useApp();
  const sc = severityColor(situation.severity);
  const today = situation.weather_today;
  const nextTide = situation.tide?.[0];

  return (
    <View testID="situation-card" style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.borderGlass }]}>
      <View style={styles.topRow}>
        <Text style={[styles.title, { color: colors.muted }]}>{t("situationSummary", lang)}</Text>
        <View style={[styles.badge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.badgeText, { color: sc.fg }]}>
            {t(SEVERITY_KEY[situation.severity] || "severityAdvisory", lang)}
          </Text>
        </View>
      </View>
      <Text style={[styles.region, { color: colors.onSurface }]}>{situation.region}</Text>

      {today.cyclone && (
        <View style={[styles.cycloneBanner, { backgroundColor: colors.error }]}>
          <Ionicons name="thunderstorm" size={16} color={colors.onError} />
          <Text style={[styles.cycloneText, { color: colors.onError }]} numberOfLines={2}>
            {t("cycloneActiveLabel", lang)}: {today.cyclone}
          </Text>
        </View>
      )}

      <View style={styles.metricsRow}>
        <Metric label={t("windLabel", lang)} value={`${today.wind_kn} kn`} colors={colors} />
        <Metric label={t("waveLabel", lang)} value={`${today.wave_m} m`} colors={colors} />
        <Metric label={t("lightningLabel", lang)} value={`${today.lightning_pct}%`} colors={colors} />
      </View>

      {situation.reasons?.length > 0 && (
        <View style={styles.reasonsBox}>
          {situation.reasons.map((r, i) => (
            <View key={i} style={styles.reasonRow}>
              <View style={[styles.reasonDot, { backgroundColor: sc.bg }]} />
              <Text style={[styles.reasonText, { color: colors.onSurfaceSecondary }]}>{r}</Text>
            </View>
          ))}
        </View>
      )}

      {nextTide && (
        <Text style={[styles.tideText, { color: colors.brand }]}>
          {t("nextTide", lang)}: {nextTide.type === "HIGH TIDE" ? t("highTide", lang) : nextTide.type === "LOW TIDE" ? t("lowTide", lang) : nextTide.type} · {nextTide.time} ({nextTide.height_m} m)
        </Text>
      )}
    </View>
  );
}

function Metric({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={[styles.metric, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}>
      <Text style={[styles.metricLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: colors.brand }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: colors.muted,
  },
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  region: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onSurface,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  cycloneBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  cycloneText: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.onError,
    fontWeight: "700",
  },
  metricsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metric: {
    flex: 1,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: "center",
  },
  metricLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.muted,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontFamily: fonts.mono,
    fontSize: 14,
    fontWeight: "700",
    color: colors.data,
    marginTop: 2,
  },
  reasonsBox: { gap: 4, marginBottom: spacing.sm },
  reasonRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  reasonDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  reasonText: {
    flex: 1,
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
    lineHeight: 18,
  },
  tideText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.dataBlue,
  },
});
