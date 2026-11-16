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
  // "Bella" (EXAVITQu4vr4xnSDxMaL) — verified ultra-natural, warm human multilingual voice
  const VOICE_ID = "EXAVITQu4vr4xnSDxMaL";
  const MODEL_ID = "eleven_multilingual_v2";

  // Clean text of markdown, technical acronyms, coordinates, and non-verbal symbols
  let clean = text
    .replace(/(డేటా మూలం|విడుదల సమయం|Data Source|Advisory Timestamp|Published time|COORDS|STATUS|CREW|MMSI|CALLSIGN).*/gi, '')
    .replace(/\d+\.\d+°[NSEW],\s*\d+\.\d+°[NSEW]/gi, '')
    .replace(/[\d.]+°[NSEW]/gi, '')
    .replace(/\((Heading|ETA|SAFE|PFZ|SST|Chl|AIS|AIS Telemetrics|కోఆర్డినేట్స్|Coordinates|SOG|COG|Active Trawling|Drift Netting|Trawling Outer Shelf|Valid 24h|PFZ సమాచారం|UNSAFE\/CAUTION|CAUTION)\)/gi, '')
    .replace(/[*#_~`•|()\[\]]/g, ' ')
    .replace(/⛔|⚠️|✓|★|➔|->|🧭|🐟|⚓|⛵|🌊|💡|📍/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If text is in Telugu, ensure English port names and fish species are cleanly pronounced
  if (/[\u0C00-\u0C7F]/.test(clean) || language === 'te') {
    clean = clean
      .replace(/\bKakinada\b/gi, "కాకినాడ")
      .replace(/\bVisakhapatnam\b|\bVizag\b/gi, "విశాఖపట్నం")
      .replace(/\bChennai\b/gi, "చెన్నై")
      .replace(/\bMumbai\b/gi, "ముంబై")
      .replace(/\bKochi\b/gi, "కొచ్చి")
      .replace(/\bGujarat\b/gi, "గుజరాత్")
      .replace(/\bMachilipatnam\b/gi, "మచిలీపట్నం")
      .replace(/\bTuticorin\b/gi, "తూత్తుకుడి")
      .replace(/\bRameswaram\b/gi, "రామేశ్వరం")
      .replace(/\bKanyakumari\b/gi, "కన్యాకుమారి")
      .replace(/\bParadip\b/gi, "పారాదీప్")
      .replace(/\bVeraval\b/gi, "వెరావల్")
      .replace(/\bPorbandar\b/gi, "పోర్‌బందర్")
      .replace(/Indian Mackerel, Sardine, Tuna/gi, "కానగంతలు, కవళ్లు మరియు సూర చేపలు")
      .replace(/Indian Mackerel, Sardine/gi, "కానగంతలు మరియు కవళ్లు")
      .replace(/Yellowfin Tuna, Seer Fish/gi, "వంజరం మరియు ట్యూనా చేపలు")
      .replace(/\bENE\b/g, "ఈశాన్యం వైపు")
      .replace(/\bESE\b/g, "తూర్పు ఆగ్నేయం వైపు")
      .replace(/\bSSE\b/g, "దక్షిణ ఆగ్నేయం వైపు")
      .replace(/\bSSW\b/g, "దక్షిణ నైరుతి వైపు")
      .replace(/\bNE\b/g, "ఈశాన్యం వైపు")
      .replace(/\bSE\b/g, "ఆగ్నేయం వైపు")
      .replace(/\bSW\b/g, "నైరుతి వైపు")
      .replace(/\bNW\b/g, "వాయువ్యం వైపు")
      .replace(/\bVHF\s*Ch(?:annel)?\s*16\b/gi, "వైర్‌లెస్ రేడియో ఛానల్ పదహారు")
      .replace(/\bNM\b|\bNautical Miles\b/gi, " నాటికల్ మైళ్ళు ")
      .replace(/\bkts\b|\bknots\b|\bkn\b/gi, " నాట్లు ")
      .replace(/\bkm\b/gi, " కిలోమీటర్లు ")
      .replace(/°C/g, " డిగ్రీల సెల్సియస్ ")
      .replace(/~/g, "సుమారు ")
      .replace(/Sagar Samrat/gi, "సాగర్ సామ్రాట్")
      .replace(/Matsya Prabha/gi, "మత్స్య ప్రభ");
  } else if (/[\u0900-\u097F]/.test(clean) || language === 'hi') {
    clean = clean
      .replace(/\bKakinada\b/gi, "काकीनाडा")
      .replace(/\bVisakhapatnam\b|\bVizag\b/gi, "विशाखापट्टनम")
      .replace(/\bChennai\b/gi, "चेन्नई")
      .replace(/\bMumbai\b/gi, "मुंबई")
      .replace(/\bKochi\b/gi, "कोच्चि")
      .replace(/\bGujarat\b/gi, "गुजरात")
      .replace(/Indian Mackerel, Sardine, Tuna/gi, "मैकेरल, सार्डिन और टूना")
      .replace(/\bENE\b/g, "उत्तर-पूर्व")
      .replace(/\bESE\b/g, "पूर्व-दक्षिण-पूर्व")
      .replace(/\bSSE\b/g, "दक्षिण-पूर्व")
      .replace(/\bVHF\s*Ch(?:annel)?\s*16\b/gi, "रेडियो चैनल सोलह")
      .replace(/\bNM\b|\bNautical Miles\b/gi, " नॉटिकल मील ")
      .replace(/\bkts\b|\bknots\b|\bkn\b/gi, " नॉट ")
      .replace(/\bkm\b/gi, " किलोमीटर ")
      .replace(/°C/g, " डिग्री सेल्सियस ")
      .replace(/~/g, "लगभग ")
      .replace(/Sagar Samrat/gi, "सागर सम्राट")
      .replace(/Matsya Prabha/gi, "मत्स्य प्रभा");
  }

  clean = clean.replace(/\s+/g, ' ').trim();

  try {
    const payload = {
      text: clean,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.65,
        similarity_boost: 0.85,
        style: 0.15,
        use_speaker_boost: true
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

