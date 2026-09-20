import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, ChatMessage } from "@/src/api";
import MessageBubble from "@/src/components/MessageBubble";
import RadarCard from "@/src/components/RadarCard";
import RegionSwitcher from "@/src/components/RegionSwitcher";
import LanguagePicker from "@/src/components/LanguagePicker";
import { useVoiceAgent } from "@/src/hooks/useVoiceAgent";
import { useApp, t, trackingFor, Lang } from "@/src/context/AppContext";
import { colors, fonts, radius, spacing, type } from "@/src/theme";

const SUGGESTIONS: { en: string; te: string; hi: string }[] = [
  {
    en: "Is it safe to venture into the sea tomorrow morning?",
    te: "రేపు ఉదయం సముద్రంలోకి వెళ్లడం సురక్షితమేనా?",
    hi: "क्या कल सुबह समुद्र में जाना सुरक्षित है?",
  },
  {
    en: "Where is the nearest Potential Fishing Zone today?",
    te: "ఈ రోజు దగ్గరి ఫిషింగ్ జోన్ ఎక్కడ ఉంది?",
    hi: "आज सबसे नज़दीकी फिशिंग ज़ोन कहाँ है?",
  },
  {
    en: "Which regions show high chlorophyll and favourable SST?",
    te: "ఏ ప్రాంతాల్లో అధిక క్లోరోఫిల్ మరియు అనుకూల SST ఉంది?",
    hi: "किन क्षेत्रों में क्लोरोफिल अधिक और SST अनुकूल है?",
  },
  {
    en: "Are there any lightning or cyclone alerts in my area?",
    te: "నా ప్రాంతంలో పిడుగు లేదా తుఫాను హెచ్చరికలు ఉన్నాయా?",
    hi: "मेरे क्षेत्र में बिजली या चक्रवात की चेतावनी है क्या?",
  },
];

const SAFE_DEFAULT: Partial<Record<Lang, string>> & { en: string } = {
  en: "Could not verify current conditions (offline). Do not assume it is safe — check local advisories.",
  te: "ప్రస్తుత పరిస్థితులను ధృవీకరించలేకపోయాం (ఆఫ్‌లైన్). సురక్షితమని భావించవద్దు — స్థానిక సలహాలను చూడండి.",
  hi: "मौजूदा हालात की पुष्टि नहीं हो सकी (ऑफ़लाइन)। इसे सुरक्षित न मानें — स्थानीय सलाह ज़रूर देखें।",
};

export default function ChatScreen() {
  const { lang, sessionId, newSession, userId, region, colors, isDark, toggleTheme } = useApp();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const params = useLocalSearchParams<{
    q?: string;
    lat?: string;
    lon?: string;
    locName?: string;
  }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const [showRegionSwitcher, setShowRegionSwitcher] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [activeLoc, setActiveLoc] = useState<{
    name?: string;
    lat: number;
    lon: number;
  } | null>(null);
  const listRef = useRef<FlatList>(null);
  const sentParam = useRef<string | null>(null);
  const voice = useVoiceAgent(lang);

  const scrollEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);
  }, []);

  // Load stored conversation for this session
  useEffect(() => {
    if (sessionId === "boot") return;
    (async () => {
      try {
        const convo = await api.getConversation(sessionId);
        if (convo?.messages?.length) {
          setMessages(convo.messages);
          scrollEnd();
        }
      } catch {
        /* offline: start empty */
      }
    })();
  }, [sessionId, scrollEnd]);

  const send = useCallback(
    async (text: string, loc?: any, viaVoice = false, queryLang?: Lang) => {
      const clean = text.trim();
      if (!clean || loading) return;
      setInput("");
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: clean,
        created_at: new Date().toISOString(),
      };
      setMessages((p) => [...p, userMsg]);
      setLoading(true);
      setOffline(false);
      scrollEnd();
      const effectiveLoc = loc ?? activeLoc ?? {
        name: `${region.name}, ${region.state}`,
        lat: region.center.lat,
        lon: region.center.lon,
      };
      // Determine effective language: if spoken query was detected as native script, use that
      const isTe = /[\u0C00-\u0C7F]/.test(clean);
      const isHi = /[\u0900-\u097F]/.test(clean);
      const isTa = /[\u0B80-\u0BFF]/.test(clean);
      const effectiveLang: Lang = queryLang || (isTe ? "te" : isHi ? "hi" : isTa ? "ta" : lang);

      try {
        const resp = await api.chat({
          message: clean,
          session_id: sessionId,
          language: effectiveLang,
          location: effectiveLoc,
          region_id: region.id,
          user_id: userId,
        });
        setMessages((p) => [...p, resp.assistant_message]);
        if (viaVoice && resp.assistant_message?.content) {
          voice.speak(resp.assistant_message.content, effectiveLang);
        }
      } catch {
        setOffline(true);
        setMessages((p) => [
          ...p,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: SAFE_DEFAULT[effectiveLang] ?? SAFE_DEFAULT.en,
            created_at: new Date().toISOString(),
            verdict: null,
          },
        ]);
      } finally {
        setLoading(false);
        scrollEnd();
      }
    },
    [loading, sessionId, lang, activeLoc, region, userId, scrollEnd, voice],
  );

  // Handle deep-link / param from Saved screen
  useEffect(() => {
    if (sessionId === "boot") return;
    if (params.q && sentParam.current !== params.q) {
      sentParam.current = params.q;
      const loc =
        params.lat && params.lon
          ? {
              name: params.locName,
              lat: parseFloat(params.lat),
              lon: parseFloat(params.lon),
            }
          : null;
      if (loc) setActiveLoc(loc);
      const isTe = /[\u0C00-\u0C7F]/.test(params.q);
      const isHi = /[\u0900-\u097F]/.test(params.q);
      const isTa = /[\u0B80-\u0BFF]/.test(params.q);
      const detectedLang: Lang = isTe ? "te" : isHi ? "hi" : isTa ? "ta" : lang;
      send(params.q, loc, true, detectedLang);
    }
  }, [params.q, params.lat, params.lon, params.locName, sessionId, send, lang]);

  const onMicPress = useCallback(async () => {
    if (voice.state === "recording") {
      const text = await voice.stopRecording();
      if (text) {
        const isTe = /[\u0C00-\u0C7F]/.test(text);
        const isHi = /[\u0900-\u097F]/.test(text);
        const isTa = /[\u0B80-\u0BFF]/.test(text);
        const detectedLang: Lang = isTe ? "te" : isHi ? "hi" : isTa ? "ta" : lang;
        send(text, undefined, true, detectedLang);
      }
    } else if (voice.state === "speaking") {
      voice.stopSpeaking();
    } else if (voice.state === "idle") {
      await voice.startRecording();
    }
  }, [voice, send, lang]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceSecondary, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? "#181C20" : "#FFFFFF", borderColor: colors.border }]}>
        <Pressable
          testID="region-selector-trigger"
          style={{ flex: 1 }}
          onPress={() => setShowRegionSwitcher(true)}
        >
          <Text style={[styles.title, { color: colors.onSurface }]}>ORCA</Text>
          <View style={styles.subtitleRow}>
            <Ionicons name="location" size={11} color={colors.brand} />
            <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={1}>
              {activeLoc?.name || `${region.name}, ${region.state}`} ·{" "}
              {t("marineIntelligence", lang)}
            </Text>
            <Ionicons name="chevron-down" size={12} color={colors.muted} />
          </View>
        </Pressable>

        <Pressable
          testID="theme-toggle-chat"
          onPress={toggleTheme}
          style={[styles.iconBtn, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}
        >
          <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={16} color={colors.brand} />
        </Pressable>

        <Pressable
          testID="lang-toggle"
          onPress={() => setShowLangPicker(true)}
          style={[styles.langBtn, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}
        >
          <Text style={[styles.langText, { color: colors.brand }]}>
            {lang.toUpperCase()}
          </Text>
        </Pressable>
        <Pressable
          testID="new-session"
          onPress={() => {
            newSession();
            setMessages([]);
          }}
          style={[styles.iconBtn, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}
        >
          <Ionicons name="create-outline" size={18} color={colors.onSurface} />
        </Pressable>
      </View>

      <LanguagePicker
        visible={showLangPicker}
        onClose={() => setShowLangPicker(false)}
      />
      <RegionSwitcher
        visible={showRegionSwitcher}
        onClose={() => setShowRegionSwitcher(false)}
        onPickLocation={(loc) => setActiveLoc(loc)}
      />

      {offline && (
        <View style={styles.offlineBar}>
          <Ionicons name="cloud-offline" size={14} color={colors.onWarning} />
          <Text style={styles.offlineText}>{t("offline", lang)}</Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={tabBarHeight}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble msg={item} lang={lang} />}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollEnd}
          ListEmptyComponent={
            <EmptyState
              lang={lang}
              region={region}
              onPick={(q) => send(q)}
              onVoice={onMicPress}
              colors={colors}
              isDark={isDark}
            />
          }
          ListFooterComponent={
            loading ? (
              <View testID="typing-indicator" style={styles.typing}>
                <ActivityIndicator size="small" color={colors.brand} />
                <Text style={[styles.typingText, { color: colors.muted }]}>{t("thinking", lang)}</Text>
              </View>
            ) : null
          }
        />

        {/* Voice status banner */}
        {(voice.state === "recording" || voice.state === "transcribing" || voice.state === "speaking") && (
          <View testID="voice-status-bar" style={[styles.voiceBar, { backgroundColor: isDark ? "rgba(24, 28, 32, 0.95)" : "rgba(255, 255, 255, 0.95)", borderColor: colors.border }]}>
            {voice.state === "recording" && <View style={styles.recDot} />}
            {voice.state !== "recording" && (
              <ActivityIndicator size="small" color={colors.brand} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.voiceBarText, { color: colors.onSurface }]} numberOfLines={2}>
                {voice.state === "recording"
                  ? voice.liveTranscript
                    ? `🎙️ "${voice.liveTranscript}"`
                    : t("voiceListening", lang)
                  : voice.state === "transcribing"
                  ? t("voiceTranscribing", lang)
                  : t("voiceSpeaking", lang)}
              </Text>
            </View>
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputBar, { backgroundColor: isDark ? "#181C20" : "#FFFFFF", borderColor: colors.border }]}>
          <Pressable
            testID="mic-button"
            onPress={onMicPress}
            disabled={voice.state === "transcribing"}
            style={[
              styles.micBtn,
              voice.state === "recording" && styles.micBtnRecording,
              voice.state === "transcribing" && styles.micBtnTranscribing,
              voice.state === "speaking" && styles.micBtnSpeaking,
            ]}
            accessibilityLabel={
              voice.state === "recording"
                ? t("voiceListening", lang)
                : voice.state === "transcribing"
                ? t("voiceTranscribing", lang)
                : voice.state === "speaking"
                ? t("voiceSpeaking", lang)
                : "Tap to speak"
            }
          >
            <Ionicons
              name={
                voice.state === "recording"
                  ? "stop"
                  : voice.state === "speaking"
                  ? "volume-high"
                  : voice.state === "transcribing"
                  ? "ellipsis-horizontal"
                  : "mic"
              }
              size={20}
              color={colors.onBrand}
            />
          </Pressable>
          <TextInput
            testID="chat-input"
            value={input}
            onChangeText={setInput}
            placeholder={t("askPlaceholder", lang)}
            placeholderTextColor={colors.muted}
            style={[styles.input, { backgroundColor: colors.surfaceTertiary, color: colors.onSurface, borderColor: colors.border }]}
            multiline
            onSubmitEditing={() => send(input)}
            onKeyPress={(e: any) => {
              if (Platform.OS === "web" && e.nativeEvent?.key === "Enter" && !e.nativeEvent?.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
          />
          <Pressable
            testID="send-button"
            onPress={() => send(input)}
            disabled={!input.trim() || loading}
            style={[
              styles.sendBtn,
              {
                backgroundColor: !input.trim() || loading
                  ? (isDark ? colors.surfaceTertiary : "rgba(13, 148, 136, 0.15)")
                  : colors.brand,
                shadowOpacity: !input.trim() || loading ? 0 : 0.3,
              },
            ]}
          >
            <Ionicons
              name="arrow-up"
              size={20}
              color={!input.trim() || loading ? (isDark ? colors.muted : "#94A3B8") : colors.onBrand}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function EmptyState({
  lang,
  region,
  onPick,
  onVoice,
  colors,
  isDark,
}: {
  lang: Lang;
  region: { name: string; state: string; center: { lat: number; lon: number }; sea?: string };
  onPick: (q: string) => void;
  onVoice: () => void;
  colors: any;
  isDark: boolean;
}) {
  return (
    <View testID="chat-empty" style={styles.empty}>
      <RadarCard region={region} />
      <Text style={[styles.emptyTitle, { color: colors.onSurface, letterSpacing: trackingFor(lang, 1) }]}>
        {t("emptyTitle", lang)}
      </Text>
      <Text style={[styles.emptySub, { color: colors.muted }]}>{t("emptySub", lang)}</Text>

      {/* Voice Prompt Action Banner */}
      <Pressable style={[styles.voicePromptCard, { backgroundColor: isDark ? colors.surfaceTertiary : "#FFFFFF", borderColor: colors.border }]} onPress={onVoice} testID="voice-prompt-action">
        <View style={styles.voicePromptMic}>
          <Ionicons name="mic" size={18} color={colors.onBrand} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.voicePromptTitle, { color: colors.onSurface }]}>
            {t("voicePromptTitle", lang)}
          </Text>
          <Text style={[styles.voicePromptSub, { color: colors.muted }]}>
            {t("voicePromptSub", lang)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.brand} />
      </Pressable>

      <View style={styles.suggestions}>
        {(["suggestion1", "suggestion2", "suggestion3", "suggestion4"] as const).map((key, i) => (
          <Pressable
            key={i}
            testID={`suggestion-${i}`}
            style={[styles.suggestion, { backgroundColor: isDark ? colors.surfaceTertiary : "#FFFFFF", borderColor: colors.border }]}
            onPress={() => onPick(t(key, lang))}
          >
            <Ionicons
              name="arrow-forward"
              size={14}
              color={colors.brand}
            />
            <Text style={[styles.suggestionText, { color: colors.onSurface }]}>{t(key, lang)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  title: {
    fontSize: type.xxl,
    fontWeight: "900",
    letterSpacing: 2,
    color: colors.onSurface,
  },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.muted,
    flexShrink: 1,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  langBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 44,
    alignItems: "center",
  },
  langText: {
    fontFamily: fonts.mono,
    fontWeight: "700",
    color: colors.brand,
    fontSize: type.sm,
  },
  iconBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  telemetryBar: {
    backgroundColor: colors.surfaceInverse,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
  },
  telemetryScroll: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  telemetryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(31, 166, 160, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(31, 166, 160, 0.35)",
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 4,
  },
  telemetryDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.brand,
    marginRight: 5,
  },
  telemetryBadgeText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: 1,
  },
  telemetryItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  telemetryLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  telemetryVal: {
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: "800",
    color: colors.data,
  },
  telemetryDivider: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.divider,
    marginHorizontal: 2,
  },
  offlineBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  offlineText: {
    fontFamily: fonts.mono,
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.onWarning,
  },
  listContent: { padding: spacing.lg, paddingBottom: spacing.xl * 2, flexGrow: 1 },
  typing: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  typingText: { fontFamily: fonts.mono, fontSize: type.sm, color: colors.muted },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  micBtnRecording: {
    backgroundColor: colors.error,
  },
  micBtnTranscribing: {
    backgroundColor: colors.warning,
  },
  micBtnSpeaking: {
    backgroundColor: colors.success,
  },
  voiceBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceTertiary,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  voiceBarText: {
    fontFamily: fonts.mono,
    fontSize: type.sm,
    color: colors.onSurface,
    fontWeight: "700",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: type.base,
    color: colors.onSurface,
    backgroundColor: colors.surfaceTertiary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sendBtnDisabled: { backgroundColor: colors.surfaceTertiary, shadowOpacity: 0 },
  empty: { flex: 1, justifyContent: "center", paddingVertical: spacing.xl },
  radar: {
    width: 84,
    height: 84,
    borderWidth: 2,
    borderColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: type.lg,
    fontWeight: "900",
    letterSpacing: 1,
    color: colors.onSurface,
    textAlign: "center",
  },
  emptySub: {
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
  voicePromptCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.brand,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  voicePromptMic: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  voicePromptTitle: {
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: 1,
  },
  voicePromptSub: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
    marginTop: 2,
  },
  suggestions: { width: "100%", gap: spacing.sm },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  suggestionText: {
    flex: 1,
    fontSize: type.sm,
    color: colors.onSurface,
    fontWeight: "600",
  },
});
