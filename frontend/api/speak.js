// Vercel Serverless Function: /api/speak
// Synthesizes natural human-like speech in Telugu, Hindi, and English using ElevenLabs eleven_v3 or eleven_multilingual_v2

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, language = 'en' } = req.body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Valid text is required for synthesis' });
  }

  const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || "sk_db59e110ba0eb8a29276a160e9d6a45d809a5f979ddc9338";
  // "Adam" — reliable multi-lingual voice ID on ElevenLabs
  const VOICE_ID = "pNInz6obpgDQGcFmaJgB";
  const MODEL_ID = "eleven_multilingual_v2";

  // Clean text of markdown and non-verbal symbols
  const clean = text
    .replace(/[*#_~`•]/g, ' ')
    .replace(/⛔|⚠️|✓|★|➔|->|🧭|🐟|⚓|⛵/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  try {
    const payload = {
      text: clean,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8
      }
    };
    // ElevenLabs only supports language_code for a specific whitelist of ISO codes.
    // For Telugu, Tamil, Kannada, Malayalam, etc., omitting language_code allows
    // eleven_multilingual_v2 to automatically and flawlessly synthesize native speech.
    const SUPPORTED_EXPLICIT_CODES = ["en", "hi", "es", "fr", "de", "it", "pt", "pl"];
    if (language && SUPPORTED_EXPLICIT_CODES.includes(language.toLowerCase())) {
      payload.language_code = language.toLowerCase();
    }

    const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify(payload)
    });

    if (elevenRes.ok) {
      const buffer = await elevenRes.arrayBuffer();
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.status(200).send(Buffer.from(buffer));
    } else {
      const errBody = await elevenRes.text().catch(() => "");
      console.warn("ElevenLabs TTS response not ok:", elevenRes.status, errBody);
    }
  } catch (err) {
    console.warn("ElevenLabs synthesis exception:", err);
  }

  return res.status(502).json({ error: "Voice synthesis failed" });
}

