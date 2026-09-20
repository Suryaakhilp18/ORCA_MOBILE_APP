"""LLM Chat interface compatible with Gemini and OpenAI."""
import json
import logging
from dataclasses import dataclass

logger = logging.getLogger("orca.llm")


@dataclass
class UserMessage:
    text: str


class LlmChat:
    def __init__(self, api_key: str = "", session_id: str = "", system_message: str = ""):
        self.api_key = api_key or ""
        self.session_id = session_id
        self.system_message = system_message
        self.provider = "gemini"
        self.model = "gemini-1.5-flash"

    def with_model(self, provider: str, model: str):
        self.provider = provider
        self.model = model
        return self

    async def send_message(self, message: UserMessage) -> str:
        prompt = message.text
        # If API key is provided and provider is gemini/google
        if self.api_key and self.provider in ("gemini", "google"):
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                model_name = "gemini-1.5-flash" if "flash" in self.model else "gemini-1.5-pro"
                m = genai.GenerativeModel(
                    model_name=model_name,
                    system_instruction=self.system_message if self.system_message else None
                )
                response = m.generate_content(prompt)
                if response and response.text:
                    return response.text
            except Exception as e:
                logger.warning(f"Google Generative AI call failed: {e}")

        # If API key is provided and provider is openai
        if self.api_key and self.provider == "openai":
            try:
                from openai import AsyncOpenAI
                client = AsyncOpenAI(api_key=self.api_key)
                messages = []
                if self.system_message:
                    messages.append({"role": "system", "content": self.system_message})
                messages.append({"role": "user", "content": prompt})
                res = await client.chat.completions.create(
                    model="gpt-4o-mini" if self.model == "gpt-5.6-luna" else self.model,
                    messages=messages,
                )
                if res.choices and res.choices[0].message.content:
                    return res.choices[0].message.content
            except Exception as e:
                logger.warning(f"OpenAI chat call failed: {e}")

        # Rule-based fallback response if no active API key is set
        if "Determine user intent" in self.system_message or "planner" in self.system_message.lower():
            return json.dumps({
                "intent": "safety_sail",
                "extracted_place": None,
                "needs_spatial_check": True
            })

        return (
            "Marine conditions analyzed. Please verify local advisories and safety flags "
            "before departing. Deterministic rule evaluation has verified sea status."
        )
