"""ORCA Voice Agent ("Marine Copilot") — speech-to-text (STT) and
text-to-speech (TTS) glue, with a resilient two-provider fallback chain
that mirrors the existing Gemini -> Emergent Universal Key pattern used
for chat.

Design notes (read before touching):
- STT/TTS are a thin VOICE LAYER only. The actual answer text still comes
  from the existing 7-agent orchestrator (orchestrator/agents.py) via
  /api/chat — this module never invents an answer, it only converts
  speech<->text.
- PRIMARY provider: ElevenLabs (`eleven_v3` for TTS — required for Telugu,
  since `eleven_multilingual_v2` does NOT support it — and `scribe_v1` for
  STT). Native-accent quality in EN/HI/TE.
- FALLBACK provider: OpenAI Whisper (`whisper-1`) / TTS (`tts-1`) via the
  Emergent Universal Key, used ONLY when ElevenLabs fails for any reason
  (quota exhausted, invalid/restricted key, network error, etc.) — exactly
  like the chat orchestrator falls back from the user's Gemini key to the
  Emergent key on RESOURCE_EXHAUSTED. OpenAI's TTS voices are English-
  accented for non-English text (a provider limitation, not a bug) — an
  accented reply beats a dead voice feature.
- Every call is wrapped so voice failures NEVER crash the chat flow — the
  frontend always has a text-only fallback path.
"""
import io
import logging
import os
import httpx

from dotenv import load_dotenv
try:
    from elevenlabs import ElevenLabs
except ImportError:
    ElevenLabs = None
try:
    from emergentintegrations.llm.openai import OpenAISpeechToText, OpenAITextToSpeech
except Exception:
    OpenAISpeechToText = None
    OpenAITextToSpeech = None

load_dotenv()

logger = logging.getLogger("orca.voice")

_ELEVEN_KEY = os.environ.get("ELEVENLABS_API_KEY")
_EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
_eleven_client = None

# "Adam" — a friendly, neutral premade voice available on all ElevenLabs
# plans (Rachel's ID is blocked for free-tier API access — "library
# voices" restriction — Adam works fine and is cross-lingual with eleven_v3).
DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB"
FALLBACK_OPENAI_VOICE = "echo"  # calm, smooth — fits a marine copilot tone

STT_MODEL = "scribe_v1"
TTS_MODEL_PRIMARY = "eleven_v3"
TTS_MODEL_FALLBACK = "eleven_multilingual_v2"  # no Telugu support


class VoiceUnavailable(Exception):
    """Raised whenever NEITHER provider is configured or a call fails on
    both — callers should degrade to text-only, never 500 the whole chat
    flow."""


def _get_eleven_key() -> str:
    return os.environ.get("ELEVENLABS_API_KEY") or _ELEVEN_KEY or ""


def _get_eleven_client() -> ElevenLabs:
    global _eleven_client
    key = _get_eleven_key()
    if not key:
        raise VoiceUnavailable("ELEVENLABS_API_KEY not configured")
    if ElevenLabs is None:
        raise VoiceUnavailable("ElevenLabs SDK not installed, using REST fallback")
    if _eleven_client is None:
        _eleven_client = ElevenLabs(api_key=key)
    return _eleven_client


async def _elevenlabs_rest_tts(text: str, model_id: str, voice_id: str, language_code: str = "en") -> bytes:
    key = _get_eleven_key()
    if not key:
        raise VoiceUnavailable("ELEVENLABS_API_KEY not configured")
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    body = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}
    }
    # ElevenLabs supports language_code only for certain ISO codes. For Telugu and other Indic languages,
    # omitting language_code allows eleven_multilingual_v2 / eleven_v3 to automatically synthesize from native script.
    if language_code and language_code.lower() in ("en", "hi", "es", "fr", "de", "it", "pt", "pl"):
        body["language_code"] = language_code.lower()
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            url,
            headers={
                "xi-api-key": key,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg"
            },
            json=body
        )
        if resp.status_code == 200:
            return resp.content
        raise VoiceUnavailable(f"ElevenLabs REST HTTP {resp.status_code}: {resp.text}")


async def transcribe_audio(audio_bytes: bytes, filename: str = "voice.m4a",
                            language_code: str | None = None) -> str:
    """Speech -> text. Tries ElevenLabs Scribe first, falls back to
    OpenAI Whisper (Emergent key) if ElevenLabs fails for any reason.
    language_code is one of en/hi/te (ISO 639-1)."""
    try:
        client = _get_eleven_client()
        resp = client.speech_to_text.convert(
            file=io.BytesIO(audio_bytes),
            model_id=STT_MODEL,
            language_code=language_code,
        )
        text = getattr(resp, "text", None) or str(resp)
        return text.strip()
    except Exception as e:  # noqa: BLE001
        logger.warning("ElevenLabs STT failed (%s), falling back to Whisper", e)

    if not _EMERGENT_KEY or OpenAISpeechToText is None:
        raise VoiceUnavailable("STT failed and no Emergent fallback key or provider available")
    try:
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = filename if "." in filename else f"{filename}.m4a"
        stt = OpenAISpeechToText(api_key=_EMERGENT_KEY)
        resp = await stt.transcribe(file=audio_file, model="whisper-1",
                                     language=language_code)
        text = getattr(resp, "text", None) or (resp.get("text") if isinstance(resp, dict) else None)
        return (text or "").strip()
    except Exception as e2:  # noqa: BLE001
        logger.error("Whisper STT fallback also failed: %s", e2)
        raise VoiceUnavailable(f"transcription failed on both providers: {e2}") from e2


async def synthesize_speech(text: str, language_code: str = "en",
                             voice_id: str = DEFAULT_VOICE_ID) -> bytes:
    """Text -> speech (mp3 bytes). Tries ElevenLabs SDK first, falls back to direct REST."""
    clean_lang = language_code.lower() if (language_code and language_code.lower() in ("en", "hi", "es", "fr", "de", "it", "pt", "pl")) else None
    key = _get_eleven_key()
    if key:
        # 1. Try ElevenLabs SDK if installed
        if ElevenLabs is not None:
            try:
                client = _get_eleven_client()
                chunks = client.text_to_speech.convert(
                    voice_id=voice_id, text=text, model_id=TTS_MODEL_PRIMARY,
                    language_code=clean_lang, output_format="mp3_44100_128",
                )
                return b"".join(chunks)
            except Exception as e:
                logger.warning("ElevenLabs SDK TTS failed (%s), trying REST fallback", e)

        # 2. Try ElevenLabs REST API
        try:
            return await _elevenlabs_rest_tts(text, TTS_MODEL_FALLBACK, voice_id, clean_lang)
        except Exception as e:
            logger.warning("ElevenLabs REST TTS fallback failed: %s", e)

    if not _EMERGENT_KEY or OpenAITextToSpeech is None:
        raise VoiceUnavailable("TTS failed and no Emergent fallback key or provider available")
    try:
        tts = OpenAITextToSpeech(api_key=_EMERGENT_KEY)
        return await tts.generate_speech(text=text, model="tts-1",
                                          voice=FALLBACK_OPENAI_VOICE)
    except Exception as e3:  # noqa: BLE001
        logger.error("OpenAI TTS fallback also failed: %s", e3)
        raise VoiceUnavailable(f"TTS failed on both providers: {e3}") from e3
