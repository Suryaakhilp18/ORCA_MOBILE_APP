import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Lang, t, useApp } from "@/src/context/AppContext";
import { colors, fonts, radius, severityColor, spacing, type } from "@/src/theme";

const CONFIG: Record<
  string,
  { bg: string; fg: string; icon: any }
> = {
  cyclone: { bg: "#EF4444", fg: "#FFFFFF", icon: "thunderstorm" },
  lightning: { bg: "#F59E0B", fg: "#111417", icon: "flash" },
  geofence: { bg: "#EF4444", fg: "#FFFFFF", icon: "warning" },
  hazard: { bg: "#F59E0B", fg: "#111417", icon: "alert" },
};

// Backend alert severity ("high"/"moderate") -> the 3-tier Alerts-tab
// severity vocabulary (Critical/Warning/Advisory).
const SEVERITY_TIER: Record<string, "critical" | "warning" | "advisory"> = {
  high: "critical",
  moderate: "warning",
};
const SEVERITY_KEY: Record<string, string> = {
  critical: "severityCritical",
  warning: "severityWarning",
  advisory: "severityAdvisory",
};

export type AlertItem = {
  type?: string;
  severity?: string;
  title: string;
  body: string;
  source?: string;
  issued_at?: string;
  created_at?: string;
  location_name?: string;
};

export default function AlertCard({ item, lang = "en" }: { item: AlertItem; lang?: Lang }) {
  const { colors, isDark } = useApp();
  const cfg = CONFIG[item.type || ""] || {
    bg: colors.surfaceInverse,
    fg: colors.onSurfaceInverse,
    icon: "information-circle",
  };
  const tier = SEVERITY_TIER[item.severity || ""] || "advisory";
  const sc = severityColor(tier, isDark);
  const ts = item.issued_at || item.created_at;
  return (
    <View
      testID={`alert-card-${item.type}`}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "rgba(24, 28, 32, 0.88)" : "rgba(255, 255, 255, 0.95)",
          borderColor: isDark ? "rgba(31, 166, 160, 0.25)" : "rgba(13, 148, 136, 0.16)",
          shadowColor: sc.bg,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.25 : 0.06,
          shadowRadius: 10,
          elevation: 2,
        },
      ]}
    >
      <View style={[styles.iconStrip, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon} size={20} color={cfg.fg} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.onSurface }]}>{item.title}</Text>
          <View style={[styles.sevBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.sevBadgeText, { color: sc.fg }]}>
              {t(SEVERITY_KEY[tier], lang)}
            </Text>
          </View>
        </View>
        <Text style={[styles.text, { color: colors.onSurfaceSecondary }]}>{item.body}</Text>
        <View style={styles.metaRow}>
          {!!item.source && (
            <Text style={[styles.meta, { color: colors.muted }]}>
              {t("source", lang)}: {item.source}
            </Text>
          )}
          {!!ts && (
            <Text style={[styles.meta, { color: colors.muted }]}>
              {(() => {
                try {
                  const d = new Date(ts);
                  return isNaN(d.getTime()) ? ts : d.toLocaleString();
                } catch {
                  return ts;
                }
              })()}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  iconStrip: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, padding: spacing.md },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: type.base,
    fontWeight: "800",
    color: colors.onSurface,
  },
  sevBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  sevBadgeText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  text: {
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  meta: { fontFamily: fonts.mono, fontSize: 10, color: colors.muted },
});
