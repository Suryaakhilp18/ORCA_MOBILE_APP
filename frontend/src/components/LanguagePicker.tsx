import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { LANGUAGES, Lang, t, trackingFor, useApp } from "@/src/context/AppContext";
import { colors, fonts, radius, spacing, type } from "@/src/theme";

// Full-app language picker (English / Telugu / Hindi). Selecting a language
// here updates the entire UI (via STRINGS/t()) AND the language ORCA's AI
// agents reply in — not just the chatbot.
export default function LanguagePicker({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { lang, setLang, colors, isDark } = useApp();

  const pick = (code: Lang) => {
    setLang(code);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[
          styles.overlay,
          {
            backgroundColor: isDark ? "rgba(0, 0, 0, 0.7)" : "rgba(15, 23, 42, 0.45)",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.card,
            {
              width: "92%",
              maxWidth: 420,
              alignSelf: "center",
              backgroundColor: isDark ? "#181C20" : "#FFFFFF",
              borderColor: colors.borderStrong,
              shadowColor: isDark ? "#000000" : "#0F3D3E",
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.onSurface, letterSpacing: trackingFor(lang, 1) }]}>
              {t("selectLanguage", lang)}
            </Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.muted} />
            </Pressable>
          </View>

          {LANGUAGES.map((l) => (
            <Pressable
              key={l.code}
              testID={`lang-option-${l.code}`}
              style={[
                styles.row,
                {
                  backgroundColor: l.code === lang ? (isDark ? "rgba(31,166,160,0.18)" : "rgba(13,148,136,0.12)") : colors.surfaceTertiary,
                  borderColor: l.code === lang ? colors.brand : colors.border,
                },
              ]}
              onPress={() => pick(l.code)}
            >
              <Text style={[styles.native, { color: colors.onSurface }]}>{l.native}</Text>
              <Text style={[styles.label, { color: colors.muted }]}>{l.label}</Text>
              {l.code === lang && (
                <Ionicons name="checkmark-circle" size={18} color={colors.brand} />
              )}
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "85%",
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    fontFamily: fonts.mono,
    fontSize: type.sm,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  native: {
    fontSize: type.base,
    fontWeight: "800",
    minWidth: 84,
  },
  label: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: 11,
  },
});
