"""OpenAI Audio STT and TTS shim."""
import logging

logger = logging.getLogger("orca.openai_audio")


class OpenAISpeechToText:
    def __init__(self, api_key: str = ""):
        self.api_key = api_key or ""

    async def transcribe(self, file, model="whisper-1", language=None):
        if not self.api_key:
            return {"text": ""}
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self.api_key)
            kwargs = {"model": model, "file": file}
            if language:
                kwargs["language"] = language
            transcript = await client.audio.transcriptions.create(**kwargs)
            return {"text": transcript.text}
        except Exception as e:
            logger.warning(f"Whisper transcription failed: {e}")
            return {"text": ""}


class OpenAITextToSpeech:
    def __init__(self, api_key: str = ""):
        self.api_key = api_key or ""

    async def generate_speech(self, text: str, model="tts-1", voice="echo") -> bytes:
        if not self.api_key:
            return b""
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self.api_key)
            response = await client.audio.speech.create(
                model=model,
                voice=voice,
                input=text
            )
            return response.content
        except Exception as e:
            logger.warning(f"OpenAI TTS failed: {e}")
            return b""
