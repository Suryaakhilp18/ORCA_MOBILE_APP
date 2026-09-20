import { Ionicons } from "@expo/vector-icons";
import { memo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { ChatMessage } from "@/src/api";
import ChartWidget from "@/src/components/ChartWidget";
import MapWidget from "@/src/components/MapWidget";
import ReasoningTrace from "@/src/components/ReasoningTrace";
import VerdictBadge from "@/src/components/VerdictBadge";
import { useVoiceAgent } from "@/src/hooks/useVoiceAgent";
import { Lang, t, trackingFor, useApp } from "@/src/context/AppContext";
import { colors, fonts, radius, spacing, type } from "@/src/theme";

// Render **bold** markdown spans as bold Text, everything else plain.
function renderRich(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <Text key={i} style={{ fontWeight: "800" }}>
        {p.slice(2, -2)}
      </Text>
    ) : (
      <Text key={i}>{p}</Text>
    ),
  );
}

function MessageBubble({ msg, lang }: { msg: ChatMessage; lang: Lang }) {
  const { colors, isDark } = useApp();
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <View testID="msg-user" style={styles.userWrap}>
        <View style={[styles.userBubble, { backgroundColor: colors.brand }]}>
          <Text style={[styles.userText, { color: colors.onBrand }]}>{msg.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View testID="msg-assistant" style={styles.aiWrap}>
      <View style={styles.aiHeaderRow}>
        <View style={[styles.aiHeader, { backgroundColor: isDark ? "rgba(31, 166, 160, 0.12)" : "rgba(13, 148, 136, 0.1)" }]}>
          <View style={[styles.aiDot, { backgroundColor: colors.brand }]} />
          <Text style={[styles.aiTag, { color: colors.brand }]}>ORCA</Text>
        </View>
        <ListenButton text={msg.content} lang={lang} colors={colors} isDark={isDark} />
      </View>
      <View
        style={[
          styles.aiBubble,
          {
            backgroundColor: isDark ? "#181C20" : "#FFFFFF",
            borderColor: isDark ? "rgba(31, 166, 160, 0.22)" : "rgba(13, 148, 136, 0.18)",
            shadowColor: isDark ? "#000000" : "#0F171A",
          },
        ]}
      >
        <VerdictBadge verdict={msg.verdict} lang={lang} />
        <Text style={[styles.aiText, { color: colors.onSurface }]}>{renderRich(msg.content)}</Text>

        {(msg.widgets || []).map((w, i) =>
          w.type === "map" ? (
            <MapWidget key={i} widget={w} />
          ) : (
            <ChartWidget key={i} widget={w} />
          ),
        )}

        {!!msg.citations?.length && (
          <View style={[styles.sources, { borderTopColor: colors.border }]}>
            <Text style={[styles.sourcesTitle, { color: colors.brand, letterSpacing: trackingFor(lang, 1) }]}>
              {t("sources", lang)}
            </Text>
            {msg.citations.map((c, i) => (
              <Text key={i} style={[styles.sourceItem, { color: colors.onSurfaceSecondary }]}>
                • {c}
              </Text>
            ))}
          </View>
        )}

        <ReasoningTrace
          trace={msg.reasoning_trace || []}
          label={t("reasoning", lang)}
          lang={lang}
        />
      </View>
    </View>
  );
}

// Manual "listen" replay control shown on every assistant reply — lets the
// user hear ANY answer aloud (Marine Copilot TTS), not just voice-initiated
// ones, which auto-play from the chat screen already.
function ListenButton({ text, lang, colors, isDark }: { text: string; lang: Lang; colors: any; isDark: boolean }) {
  const voice = useVoiceAgent(lang);
  const [pressed, setPressed] = useState(false);
  const speaking = voice.state === "speaking";
  return (
    <Pressable
      testID="listen-button"
      onPress={() => {
        if (speaking) {
          voice.stopSpeaking();
        } else {
          setPressed(true);
          voice.speak(text, lang).finally(() => setPressed(false));
        }
      }}
      style={[
        styles.listenBtn,
        {
          backgroundColor: isDark ? "rgba(24, 28, 32, 0.85)" : "#FFFFFF",
          borderColor: colors.borderStrong,
        },
      ]}
    >
      {pressed && !speaking ? (
        <ActivityIndicator size="small" color={colors.brand} />
      ) : (
        <Ionicons
          name={speaking ? "pause" : "volume-medium-outline"}
          size={14}
          color={speaking ? colors.brand : colors.muted}
        />
      )}
    </Pressable>
  );
}

export default memo(MessageBubble);

const styles = StyleSheet.create({
  userWrap: { alignItems: "flex-end", marginBottom: spacing.lg },
  userBubble: {
    maxWidth: "85%",
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    borderBottomRightRadius: radius.sm,
    padding: spacing.md,
  },
  userText: { color: colors.onBrand, fontSize: type.base, lineHeight: 20 },

  aiWrap: { alignItems: "flex-start", marginBottom: spacing.lg, width: "100%" },
  aiHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 6,
  },
  aiHeader: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(31, 166, 160, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(31, 166, 160, 0.3)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  listenBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(31, 166, 160, 0.25)",
    backgroundColor: "rgba(24, 28, 32, 0.85)",
  },
  aiTag: {
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    color: colors.brand,
  },
  aiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand,
    marginRight: spacing.xs,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  aiBubble: {
    width: "100%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(31, 166, 160, 0.22)",
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  aiText: { color: colors.onSurface, fontSize: type.base, lineHeight: 22 },

  sources: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.divider,
    paddingTop: spacing.sm,
  },
  sourcesTitle: {
    fontFamily: fonts.mono,
    fontSize: type.sm,
    fontWeight: "700",
    letterSpacing: 1,
    color: colors.brand,
    marginBottom: spacing.xs,
  },
  sourceItem: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.onSurfaceSecondary,
    lineHeight: 17,
  },
});
