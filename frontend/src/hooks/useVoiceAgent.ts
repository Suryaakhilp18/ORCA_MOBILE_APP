import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Linking, Platform } from "react-native";
import {
  AudioPlayer,
  RecordingPresets,
  createAudioPlayer,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { File, Paths } from "expo-file-system";

import { api } from "@/src/api";
import { Lang } from "@/src/context/AppContext";

export type VoiceState = "idle" | "recording" | "transcribing" | "speaking" | "error";

const MAX_RECORDING_MS = 30000;

const BROWSER_LANG_MAP: Record<Lang, string> = {
  en: "en-IN",
  te: "te-IN",
  ta: "ta-IN",
  ml: "ml-IN",
  kn: "kn-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  bn: "bn-IN",
  or: "hi-IN",
  hi: "hi-IN",
};

export function useVoiceAgent(lang: Lang) {
  const [state, setState] = useState<VoiceState>("idle");
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const isWeb = Platform.OS === "web";
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const webRecognitionRef = useRef<any>(null);
  const webTranscriptRef = useRef<string>("");

  useEffect(() => {
    if (!isWeb) {
      setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
    } else {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        // Pre-warm voices on web load
        window.speechSynthesis.getVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
          };
        }
      }
    }
    return () => {
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      if (!isWeb) {
        playerRef.current?.remove?.();
      } else {
        if (typeof window !== "undefined" && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      }
    };
  }, [isWeb]);

  const showSettingsPrompt = useCallback(() => {
    Alert.alert(
      "Microphone access needed",
      "Enable microphone access in Settings to ask ORCA questions by voice.",
      [
        { text: "Not now", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ],
    );
  }, []);

  const ensurePermission = useCallback(async (): Promise<boolean> => {
    if (isWeb) return true;
    let status = await getRecordingPermissionsAsync();
    if (status.granted) return true;
    if (!status.canAskAgain) {
      showSettingsPrompt();
      return false;
    }
    status = await requestRecordingPermissionsAsync();
    if (status.granted) return true;
    if (!status.canAskAgain) showSettingsPrompt();
    return false;
  }, [isWeb, showSettingsPrompt]);

  const startRecording = useCallback(async () => {
    setLiveTranscript("");
    webTranscriptRef.current = "";

    if (isWeb) {
      if (typeof window === "undefined") return;
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = BROWSER_LANG_MAP[lang] || "en-IN";
          rec.maxAlternatives = 1;

          rec.onresult = (event: any) => {
            let finalStr = "";
            let interimStr = "";
            for (let i = 0; i < event.results.length; i++) {
              const item = event.results[i];
              if (item.isFinal) {
                finalStr += item[0].transcript + " ";
              } else {
                interimStr += item[0].transcript;
              }
            }
            const full = (finalStr + interimStr).trim();
            webTranscriptRef.current = full;
            setLiveTranscript(full);
          };

          rec.onerror = (event: any) => {
            if (event.error !== "no-speech") {
              setState("error");
              setTimeout(() => setState("idle"), 1500);
            }
          };

          rec.start();
          webRecognitionRef.current = rec;
          setState("recording");

          autoStopRef.current = setTimeout(() => {
            stopRecording();
          }, MAX_RECORDING_MS);
          return;
        } catch {
          // fallback to simple prompt if browser speech API throws
        }
      }
      
      // Fallback for browsers without Web Speech API
      const userSpoken = window.prompt("Voice Input (Simulated) — Speak or type your query:");
      if (userSpoken && userSpoken.trim()) {
        webTranscriptRef.current = userSpoken.trim();
        setLiveTranscript(userSpoken.trim());
      }
      return;
    }

    const ok = await ensurePermission();
    if (!ok) return;
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setState("recording");
      autoStopRef.current = setTimeout(() => {
        stopRecording();
      }, MAX_RECORDING_MS);
    } catch {
      setState("error");
    }
  }, [ensurePermission, isWeb, lang, recorder]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }

    if (isWeb) {
      if (webRecognitionRef.current) {
        try {
          webRecognitionRef.current.stop();
        } catch {}
        webRecognitionRef.current = null;
      }
      setState("transcribing");
      await new Promise((r) => setTimeout(r, 200));
      const text = webTranscriptRef.current?.trim() || null;
      setState("idle");
      setLiveTranscript("");
      return text;
    }

    if (!recorder.isRecording) return null;
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const uri = recorder.uri;
      if (!uri) {
        setState("idle");
        return null;
      }
      setState("transcribing");
      const { text } = await api.voiceTranscribe(uri, lang);
      setState("idle");
      return text?.trim() || null;
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 1500);
      return null;
    }
  }, [isWeb, recorder, lang]);

  const speak = useCallback(async (text: string, language: Lang) => {
    if (!text || !text.trim()) return;

    if (isWeb && typeof window !== "undefined") {
      if (window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
          // Clean text of markdown, icons, asterisks for natural spoken delivery
          let cleanText = text
            .replace(/[*#_~`•]/g, " ")
            .replace(/⛔|⚠️|✓|★|➔|->/g, " ")
            .replace(/kts|knots|kn\b/gi, language === "te" ? " నాట్లు " : language === "hi" ? " नॉट " : " knots ")
            .replace(/km\b/gi, language === "te" ? " కిలోమీటర్లు " : language === "hi" ? " किलोमीटर " : " km ")
            .replace(/°C/g, language === "te" ? " డిగ్రీల సెల్సియస్ " : language === "hi" ? " डिग्री सेल्सियस " : " degrees ")
            .replace(/\s+/g, " ")
            .trim();

          const utterance = new SpeechSynthesisUtterance(cleanText);
          const targetLang = BROWSER_LANG_MAP[language] || "en-IN";
          const langPrefix = language.toLowerCase();
          
          // Match the most authentic native voice
          const voices = window.speechSynthesis.getVoices() || [];
          let matchedVoice: any = voices.find(
            (v: any) => v.lang && v.lang.replace("_", "-").toLowerCase() === targetLang.toLowerCase()
          );
          if (!matchedVoice) {
            matchedVoice = voices.find((v: any) => v.lang && v.lang.toLowerCase().startsWith(langPrefix));
          }
          if (!matchedVoice) {
            const names: Record<string, string[]> = {
              te: ["telugu", "తెలుగు"],
              hi: ["hindi", "हिन्दी", "हिंदी"],
              ta: ["tamil", "தமிழ்"],
              kn: ["kannada", "ಕನ್ನಡ"],
              ml: ["malayalam", "മലയാളം"],
              mr: ["marathi", "मराठी"],
              bn: ["bengali", "বাংলা"],
              gu: ["gujarati", "ગુજરાતી"],
              or: ["odia", "oriya", "ଓଡ଼ିଆ"],
            };
            const aliases = names[langPrefix] || [];
            matchedVoice = voices.find((v: any) => aliases.some((a) => (v.name || "").toLowerCase().includes(a)));
          }
          if (!matchedVoice) {
            matchedVoice = voices.find((v: any) => (v.lang || "").toLowerCase().includes("en-in") || (v.name || "").toLowerCase().includes("india"));
          }

          if (matchedVoice) {
            utterance.voice = matchedVoice;
            utterance.lang = matchedVoice.lang;
          } else {
            utterance.lang = targetLang;
          }

          utterance.rate = 0.96;
          utterance.pitch = 1.0;
          utterance.onstart = () => setState("speaking");
          utterance.onend = () => setState("idle");
          utterance.onerror = (e) => {
            console.warn("speechSynthesis error:", e);
            setState("idle");
          };
          window.speechSynthesis.speak(utterance);
          setState("speaking");
          return;
        } catch (err) {
          console.warn("speechSynthesis exception:", err);
        }
      }
    }

    try {
      const buf = await api.voiceSpeak(text, language);
      if (!isWeb) {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        const file = new File(Paths.cache, `orca-speak-${Date.now()}.mp3`);
        file.write(new Uint8Array(buf));
        const player = createAudioPlayer(file.uri);
        playerRef.current = player;
        const sub = player.addListener("playbackStatusUpdate", (status) => {
          if (status.didJustFinish) {
            sub.remove();
            player.remove();
            if (playerRef.current === player) playerRef.current = null;
            setState((s) => (s === "speaking" ? "idle" : s));
          }
        });
        player.play();
        setState("speaking");
      }
    } catch {
      setState("idle");
    }
  }, [isWeb]);

  const stopSpeaking = useCallback(() => {
    if (isWeb && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (!isWeb) {
      playerRef.current?.pause?.();
    }
    setState((s) => (s === "speaking" ? "idle" : s));
  }, [isWeb]);

  return { state, liveTranscript, startRecording, stopRecording, speak, stopSpeaking };
}
