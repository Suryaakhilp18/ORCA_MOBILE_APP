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

/**
 * Transforms raw markdown / technical marine text into 100% pure, natural, conversational spoken language.
 * Completely eliminates robotic symbol reading, raw coordinates, and mixed English/Indic words.
 */
export function cleanTextForSpeech(text: string, lang: Lang): string {
  if (!text) return "";

  let cleaned = text;

  // 1. Remove citations and raw data tables/metadata
  cleaned = cleaned.replace(/(డేటా మూలం|విడుదల సమయం|Data Source|Advisory Timestamp|Published time|COORDS|STATUS|CREW|MMSI|CALLSIGN).*/gi, "");
  
  // 2. Remove raw geographical coordinates e.g. 17.0290°N, 82.3980°E
  cleaned = cleaned.replace(/\d+\.\d+°[NSEW],\s*\d+\.\d+°[NSEW]/gi, "");
  cleaned = cleaned.replace(/[\d.]+°[NSEW]/gi, "");

  // 3. Remove parenthetical acronyms and English technical labels
  cleaned = cleaned.replace(/\((Heading|ETA|SAFE|PFZ|SST|Chl|AIS|AIS Telemetrics|కోఆర్డినేట్స్|Coordinates|SOG|COG|Active Trawling|Drift Netting|Trawling Outer Shelf|Valid 24h|PFZ సమాచారం|UNSAFE\/CAUTION|CAUTION)\)/gi, "");

  if (lang === "te") {
    // English port names to authentic Telugu script
    cleaned = cleaned
      .replace(/\bKakinada\b/gi, "కాకినాడ")
      .replace(/\bVisakhapatnam\b|\bVizag\b/gi, "విశాఖపట్నం")
      .replace(/\bChennai\b/gi, "చెన్నై")
      .replace(/\bMumbai\b/gi, "ముంబై")
      .replace(/\bKochi\b/gi, "కొచ్చి")
      .replace(/\bKozhikode\b/gi, "కోజికోడ్")
      .replace(/\bMangalore\b/gi, "మంగళూరు")
      .replace(/\bGujarat\b/gi, "గుజరాత్")
      .replace(/\bMaharashtra\b/gi, "మహారాష్ట్ర")
      .replace(/\bMachilipatnam\b/gi, "మచిలీపట్నం")
      .replace(/\bTuticorin\b/gi, "తూత్తుకుడి")
      .replace(/\bRameswaram\b/gi, "రామేశ్వరం")
      .replace(/\bKanyakumari\b/gi, "కన్యాకుమారి")
      .replace(/\bParadip\b/gi, "పారాదీప్")
      .replace(/\bVeraval\b/gi, "వెరావల్")
      .replace(/\bPorbandar\b/gi, "పోర్‌బందర్");

    // English fish species to authentic Telugu names
    cleaned = cleaned
      .replace(/Indian Mackerel, Sardine, Tuna/gi, "కానగంతలు, కవళ్లు మరియు సూర చేపలు")
      .replace(/Indian Mackerel, Sardine/gi, "కానగంతలు మరియు కవళ్లు")
      .replace(/Yellowfin Tuna, Seer Fish/gi, "వంజరం మరియు ట్యూనా చేపలు")
      .replace(/Skipjack Tuna, Seer Fish, Barracuda/gi, "ట్యూనా, వంజరం మరియు చీలా చేపలు")
      .replace(/Silver Pomfret, Ribbonfish/gi, "చందమామ చేపలు మరియు సావళ్ళ చేపలు")
      .replace(/Pelagic Shoals/gi, "సముద్ర చేపలు");

    // Compass headings to Telugu
    cleaned = cleaned
      .replace(/\bENE\b/g, "ఈశాన్యం వైపు")
      .replace(/\bESE\b/g, "తూర్పు ఆగ్నేయం వైపు")
      .replace(/\bSSE\b/g, "దక్షిణ ఆగ్నేయం వైపు")
      .replace(/\bSSW\b/g, "దక్షిణ నైరుతి వైపు")
      .replace(/\bNNE\b/g, "ఉత్తర ఈశాన్యం వైపు")
      .replace(/\bNNW\b/g, "ఉత్తర వాయువ్యం వైపు")
      .replace(/\bNE\b/g, "ఈశాన్యం వైపు")
      .replace(/\bSE\b/g, "ఆగ్నేయం వైపు")
      .replace(/\bSW\b/g, "నైరుతి వైపు")
      .replace(/\bNW\b/g, "వాయువ్యం వైపు")
      .replace(/\bN\b/g, "ఉత్తరం వైపు")
      .replace(/\bS\b/g, "దక్షిణం వైపు")
      .replace(/\bE\b/g, "తూర్పు వైపు")
      .replace(/\bW\b/g, "పశ్చిమం వైపు");

    // Duration and speeds
    cleaned = cleaned
      .replace(/~?(\d+)\s*d(?:ays?)?\s*(\d+)\s*h(?:ours?|rs?)?/gi, "సుమారు $1 రోజు $2 గంటలు")
      .replace(/~?(\d+)\s*h(?:ours?|rs?)?\s*(\d+)\s*m(?:ins?|inutes?)?/gi, "సుమారు $1 గంటల $2 నిమిషాలు")
      .replace(/~?(\d+)\s*h(?:ours?|rs?)?/gi, "సుమారు $1 గంటలు")
      .replace(/~?(\d+)\s*m(?:ins?|inutes?)?/gi, "సుమారు $1 నిమిషాలు")
      .replace(/\bVHF\s*Ch(?:annel)?\s*16\b/gi, "వైర్‌లెస్ రేడియో ఛానల్ పదహారు")
      .replace(/\bVHF\s*Ch(?:annel)?\s*68\b/gi, "వైర్‌లెస్ రేడియో ఛానల్ అరవై ఎనిమిది")
      .replace(/\bVHF\s*Ch(?:annel)?\s*0?8\b/gi, "వైర్‌లెస్ రేడియో ఛానల్ ఎనిమిది")
      .replace(/\bVHF\s*Ch(?:annel)?\s*72\b/gi, "వైర్‌లెస్ రేడియో ఛానల్ డెబ్బై రెండు")
      .replace(/\bNM\b|\bNautical Miles\b/gi, " నాటికల్ మైళ్ళు ")
      .replace(/\bkts\b|\bknots\b|\bkn\b/gi, " నాట్లు ")
      .replace(/\bkm\b/gi, " కిలోమీటర్లు ")
      .replace(/°C/g, " డిగ్రీల సెల్సియస్ ")
      .replace(/mg\/m[3³]/gi, "")
      .replace(/~/g, "సుమారు ")
      .replace(/\(8\.5 నాట్ల బోటు వేగంతో\)/g, "గంటకు ఎనిమిదిన్నర నాట్ల వేగంతో")
      .replace(/Sagar Samrat/gi, "సాగర్ సామ్రాట్")
      .replace(/Matsya Prabha/gi, "మత్స్య ప్రభ")
      .replace(/Samudra Jyoti/gi, "సముద్ర జ్యోతి");
  } else if (lang === "hi") {
    // English port names to authentic Hindi Devanagari
    cleaned = cleaned
      .replace(/\bKakinada\b/gi, "काकीनाडा")
      .replace(/\bVisakhapatnam\b|\bVizag\b/gi, "विशाखापट्टनम")
      .replace(/\bChennai\b/gi, "चेन्नई")
      .replace(/\bMumbai\b/gi, "मुंबई")
      .replace(/\bKochi\b/gi, "कोच्चि")
      .replace(/\bKozhikode\b/gi, "कोझिकोड")
      .replace(/\bMangalore\b/gi, "मंगलौर")
      .replace(/\bGujarat\b/gi, "गुजरात")
      .replace(/\bMaharashtra\b/gi, "महाराष्ट्र")
      .replace(/\bMachilipatnam\b/gi, "मछलीपट्टनम")
      .replace(/\bTuticorin\b/gi, "तूतीकोरिन")
      .replace(/\bRameswaram\b/gi, "रामेश्वरम")
      .replace(/\bKanyakumari\b/gi, "कन्याकुमारी")
      .replace(/\bParadip\b/gi, "पारादीप")
      .replace(/\bVeraval\b/gi, "वेरावल")
      .replace(/\bPorbandar\b/gi, "पोरबंदर");

    cleaned = cleaned
      .replace(/Indian Mackerel, Sardine, Tuna/gi, "मैकेरल, सार्डिन और टूना")
      .replace(/Yellowfin Tuna, Seer Fish/gi, "सुरमई और टूना")
      .replace(/\bENE\b/g, "उत्तर-पूर्व")
      .replace(/\bESE\b/g, "पूर्व-दक्षिण-पूर्व")
      .replace(/\bSSE\b/g, "दक्षिण-पूर्व")
      .replace(/\bNE\b/g, "उत्तर-पूर्व")
      .replace(/\bSE\b/g, "दक्षिण-पूर्व")
      .replace(/\bSW\b/g, "दक्षिण-पश्चिम")
      .replace(/\bNW\b/g, "उत्तर-पश्चिम")
      .replace(/~?(\d+)\s*d(?:ays?)?\s*(\d+)\s*h(?:ours?|rs?)?/gi, "लगभग $1 दिन $2 घंटे")
      .replace(/~?(\d+)\s*h(?:ours?|rs?)?\s*(\d+)\s*m(?:ins?|inutes?)?/gi, "लगभग $1 घंटे $2 मिनट")
      .replace(/\bVHF\s*Ch(?:annel)?\s*16\b/gi, "रेडियो चैनल सोलह")
      .replace(/\bNM\b|\bNautical Miles\b/gi, " नॉटिकल मील ")
      .replace(/\bkts\b|\bknots\b|\bkn\b/gi, " नॉट ")
      .replace(/\bkm\b/gi, " किलोमीटर ")
      .replace(/°C/g, " डिग्री सेल्सियस ")
      .replace(/~/g, "लगभग ")
      .replace(/Sagar Samrat/gi, "सागर सम्राट")
      .replace(/Matsya Prabha/gi, "मत्स्य प्रभा")
      .replace(/Samudra Jyoti/gi, "समुद्र ज्योति");
  } else {
    // English
    cleaned = cleaned
      .replace(/\bNM\b/g, " nautical miles ")
      .replace(/\bkn\b/gi, " knots ")
      .replace(/°C/g, " degrees celsius ")
      .replace(/\bVHF\s*Ch\s*16\b/gi, "VHF channel sixteen ")
      .replace(/~/g, "approximately ");
  }

  // 4. Strip markdown, emojis, asterisks, brackets, chevrons
  cleaned = cleaned
    .replace(/[*#_~`•|()\[\]]/g, " ")
    .replace(/[🧭🐟⚓⛵🌊★✅⚠️💡📍✓➔\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

export function useVoiceAgent(lang: Lang) {
  const [state, setState] = useState<VoiceState>("idle");
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const isWeb = Platform.OS === "web";
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
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

  const startRecording = useCallback(async (overrideLang?: Lang) => {
    setLiveTranscript("");
    webTranscriptRef.current = "";

    const activeLang = overrideLang || lang;

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
          rec.lang = BROWSER_LANG_MAP[activeLang] || "en-IN";
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

  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch {}
      currentAudioRef.current = null;
    }
    if (isWeb && typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    if (!isWeb && playerRef.current) {
      try {
        playerRef.current.pause();
        playerRef.current.remove();
      } catch {}
      playerRef.current = null;
    }
    setState("idle");
  }, [isWeb]);

  const speak = useCallback(async (text: string, language?: Lang) => {
    if (!text || !text.trim()) return;

    // Immediately stop any existing speech / audio to prevent mixing and voice collision!
    stopSpeaking();

    // Determine target language: prioritizes explicit language selection
    let actualLang: Lang = language || lang;
    if (/[\u0C00-\u0C7F]/.test(text)) actualLang = "te";
    else if (/[\u0900-\u097F]/.test(text)) actualLang = "hi";
    else if (/[\u0B80-\u0BFF]/.test(text)) actualLang = "ta";
    else if (/[\u0D00-\u0D7F]/.test(text)) actualLang = "ml";
    else if (/[\u0C80-\u0CFF]/.test(text)) actualLang = "kn";
    else if (/[\u0A80-\u0AFF]/.test(text)) actualLang = "gu";
    else if (/[\u0980-\u09FF]/.test(text)) actualLang = "bn";
    else if (/[\u0B00-\u0B7F]/.test(text)) actualLang = "or";

    // Clean and localize text into pure conversational script (zero English mixing)
    const cleanSpeech = cleanTextForSpeech(text, actualLang);
    if (!cleanSpeech) return;

    // 1. PRIMARY FOR WEB: High-Fidelity Human Neural TTS (ElevenLabs Bella - ultra-natural human voice)
    if (isWeb && typeof window !== "undefined") {
      try {
        setState("speaking");
        const buf = await api.voiceSpeak(cleanSpeech, actualLang);
        const blob = new Blob([buf], { type: "audio/mpeg" });
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        audio.onplay = () => setState("speaking");
        audio.onended = () => {
          setState("idle");
          currentAudioRef.current = null;
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          setState("idle");
          currentAudioRef.current = null;
          URL.revokeObjectURL(audioUrl);
        };
        await audio.play();
        return;
      } catch (err) {
        console.warn("[ORCA Voice] Neural synthesis unavailable, attempting browser fallback:", err);
      }

      // 2. FALLBACK ONLY: Browser SpeechSynthesis if neural network API fails
      if (window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(cleanSpeech);
          const targetLang = BROWSER_LANG_MAP[actualLang] || "en-IN";
          const langPrefix = actualLang.toLowerCase();
          const voices = window.speechSynthesis.getVoices() || [];
          
          let matchedVoice: any = voices.find(
            (v: any) => v.lang && v.lang.replace("_", "-").toLowerCase() === targetLang.toLowerCase()
          );
          if (!matchedVoice) {
            matchedVoice = voices.find((v: any) => v.lang && v.lang.toLowerCase().startsWith(langPrefix));
          }
          if (matchedVoice) {
            utterance.voice = matchedVoice;
            utterance.lang = matchedVoice.lang;
            utterance.rate = 0.95;
            utterance.pitch = 1.0;
            utterance.onstart = () => setState("speaking");
            utterance.onend = () => setState("idle");
            utterance.onerror = () => setState("idle");
            window.speechSynthesis.speak(utterance);
            return;
          }
        } catch (synthErr) {
          console.warn("[ORCA Voice] Browser speech error:", synthErr);
        }
      }
      setState("idle");
      return;
    }

    // Native mobile app audio playback
    try {
      const buf = await api.voiceSpeak(cleanSpeech, actualLang);
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
  }, [isWeb, lang, stopSpeaking]);

  return { state, liveTranscript, startRecording, stopRecording, speak, stopSpeaking };
}
