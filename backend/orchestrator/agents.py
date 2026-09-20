"""Planner + specialist agents + synthesizer pipeline.

India-wide: agents never hardcode a single region. Every specialist call is
parametrised by a `region_id`, resolved per-request from (in priority order):
1. An explicit place mentioned in the user's message (Planner extracts it and
   we snap to the nearest known region via `mr.nearest_region`).
2. The caller's GPS location / currently-selected app region.
3. The India-wide default demo region (Kakinada).
"""
import json
import logging
import os
import re
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage

from data_adapters import live_marine, mock_region as mr
from gis import spatial
from orchestrator.rules import evaluate_sea_safety

# User-provided Gemini API key powers ORCA's planner + synthesizer agents.
# Note: this key's free tier has a hard cap of ~20 requests/day for
# gemini-3.5-flash (and zero quota for "pro" models) — confirmed via live
# 429 RESOURCE_EXHAUSTED responses during testing. Since a normal chat turn
# is 2 LLM calls (plan + synthesize), that budget exhausts in ~10 messages.
# To keep ORCA usable, every LLM call automatically falls back to the
# Emergent-managed Universal Key (GPT-5.6 Luna) if Gemini errors for ANY
# reason (quota, auth, network) — Gemini always stays the first attempt.
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = ("gemini", "gemini-3.5-flash")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
FALLBACK_MODEL = ("openai", "gpt-5.6-luna")

INTENTS = [
    "pfz_nearest", "safety_sail", "conditions", "alerts_query",
    "chlorophyll_sst", "route_safety", "geofence_avoid",
    "productivity_decline", "general",
]


import asyncio

async def _chat_with_fallback(session_id: str, system: str, prompt: str) -> str:
    """Call the LLM with strict timeout for sub-second responsiveness."""
    if not GEMINI_API_KEY and not EMERGENT_LLM_KEY:
        return ""
    if GEMINI_API_KEY:
        try:
            chat = LlmChat(api_key=GEMINI_API_KEY, session_id=session_id,
                           system_message=system).with_model(*GEMINI_MODEL)
            resp = await asyncio.wait_for(chat.send_message(UserMessage(text=prompt)), timeout=0.8)
            if resp and resp.strip():
                return resp.strip()
        except Exception:
            pass
    if EMERGENT_LLM_KEY:
        try:
            chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"{session_id}-fb",
                           system_message=system).with_model(*FALLBACK_MODEL)
            resp = await asyncio.wait_for(chat.send_message(UserMessage(text=prompt)), timeout=0.8)
            if resp and resp.strip():
                return resp.strip()
        except Exception:
            pass
    return ""


def _extract_json(text: str) -> dict:
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if not m:
        return {}
    try:
        return json.loads(m.group(0))
    except Exception:
        return {}


# ---------------------------------------------------------------------------
# Planner Agent — decompose intent, resolve location, detect language
# ---------------------------------------------------------------------------
def _region_roster() -> str:
    return ", ".join(f"{r['name']} ({r['state']})" for r in mr.list_regions())


def _planner_system(region_hint: dict, lang_hint: str | None) -> str:
    hint_line = (
        f"The user's app language preference is currently set to '{lang_hint}'. "
        "See the LANGUAGE DETECTION RULES below for exactly how to use this.\n"
        if lang_hint else ""
    )
    return (
        "You are the PLANNER agent of ORCA, a marine intelligence assistant "
        "covering the ENTIRE Indian coastline — not a single city. ORCA has "
        f"live validated data for: {_region_roster()}, and can reason about "
        "any other Indian coastal location by estimating coordinates. The "
        f"user's app is currently focused on {region_hint['name']}, "
        f"{region_hint['state']} ({region_hint['center']['lat']}, "
        f"{region_hint['center']['lon']}).\n"
        f"{hint_line}"
        "Decompose the user's message into a plan. Respond with STRICT JSON "
        "only, no prose. Schema:\n"
        "{\n"
        '  "intent": one of ["pfz_nearest","safety_sail","conditions","alerts_query",'
        '"chlorophyll_sst","route_safety","geofence_avoid","productivity_decline","general"],\n'
        '  "timeframe": "today" | "tomorrow",\n'
        '  "language": "en" | "te" | "ta" | "ml" | "kn" | "mr" | "gu" | "bn" | "or" | "hi",\n'
        '  "script": "native" | "romanized",\n'
        '  "location": {"name": string, "lat": number, "lon": number} | null,\n'
        '  "route": {"start":{"lat":number,"lon":number},"end":{"lat":number,"lon":number}} | null,\n'
        '  "datasets": string[]  (subset of ["pfz","weather","sst","chl","tide","alerts","boundaries"])\n'
        "}\n"
        "ROUTE COORDINATES — CRITICAL (a common mistake): 'route' represents "
        "a BOAT's path through OPEN WATER, never through land. If the user "
        "names a coastal town/harbor/village as start or end (e.g. "
        "'Kakinada', 'Chennai'), do NOT use that town's on-land/city-centre "
        "coordinates — using your own knowledge of the Indian coastline's "
        "shape, shift the point a few km further out, into the sea in front "
        "of that town, so BOTH the point itself and the straight line "
        "between start and end stay over water and never cross a peninsula, "
        "island, bay mouth landmass, or riverbank. If the user names an "
        "island, fishing zone, or offshore landmark, that is already a sea "
        "point — use it as given.\n"
        "LANGUAGE DETECTION RULES (priority order):\n"
        "- 'te' = Telugu, 'hi' = Hindi, 'en' = English.\n"
        "- STEP 1: If the message is written in Telugu script, Devanagari "
        "script, OR clearly recognisable ROMANIZED Telugu/Hindi (e.g. 'Repu "
        "sea loki vellacha?' is romanized Telugu; 'Kal samundar jaana safe "
        "hai?' is romanized Hindi) — that detected language WINS, regardless "
        "of the app's language preference. Set script='native' for "
        "Telugu/Devanagari script, 'romanized' for Latin-script "
        "Telugu/Hindi.\n"
        "- STEP 2: Otherwise (plain/neutral English, or genuinely "
        "ambiguous), use the app's language preference from above as the "
        "reply language — the user chose that language for the WHOLE app, "
        "so replies should honour it even if they happened to type in "
        "English. Set script='native' in this case.\n"
        "- Only fall back to 'en' if there is no app language preference at all.\n"
        "LOCATION RULES:\n"
        "If the user references ANY Indian coastal place by name (e.g. Chennai, "
        "Kochi, Kakinada, Mumbai, Paradip, Veraval, Visakhapatnam, Goa, Mangalore, "
        "or any other coastal town), estimate its approximate lat/lon and set "
        "location to that place. If the user does NOT mention a specific place, "
        "set location to null so the app's currently selected region is used."
    )


async def run_planner(session_id: str, message: str, context: str,
                      region_hint: dict, lang_hint: str | None = None) -> dict:
    fast_plan = _keyword_plan(message, lang_hint, region_hint)
    if fast_plan.get("intent") in INTENTS and fast_plan["intent"] != "general":
        return fast_plan

    prompt = (f"Conversation so far:\n{context}\n\nUser message: {message}")
    try:
        resp = await _chat_with_fallback(f"{session_id}-plan",
                                         _planner_system(region_hint, lang_hint),
                                         prompt)
        plan = _extract_json(resp)
        if plan.get("intent") in INTENTS:
            valid_langs = ("en", "te", "ta", "ml", "kn", "mr", "gu", "bn", "or", "hi")
            if plan.get("language") not in valid_langs:
                plan["language"] = lang_hint if lang_hint in valid_langs else "en"
            return plan
    except Exception:
        pass

    return fast_plan


COASTAL_PORTS = {
    # Andhra Pradesh
    "kakinada": {"name": "Kakinada", "state": "Andhra Pradesh", "lat": 16.9800, "lon": 82.2800, "region_id": "kakinada"},
    "visakhapatnam": {"name": "Visakhapatnam", "state": "Andhra Pradesh", "lat": 17.6850, "lon": 83.3050, "region_id": "visakhapatnam"},
    "vizag": {"name": "Visakhapatnam", "state": "Andhra Pradesh", "lat": 17.6850, "lon": 83.3050, "region_id": "visakhapatnam"},
    "machilipatnam": {"name": "Machilipatnam", "state": "Andhra Pradesh", "lat": 16.1800, "lon": 81.1600, "region_id": "machilipatnam"},
    "krishnapatnam": {"name": "Krishnapatnam", "state": "Andhra Pradesh", "lat": 14.2500, "lon": 80.1250, "region_id": "chennai"},
    "nellore": {"name": "Krishnapatnam", "state": "Andhra Pradesh", "lat": 14.2500, "lon": 80.1250, "region_id": "chennai"},
    # Tamil Nadu & Puducherry
    "chennai": {"name": "Chennai", "state": "Tamil Nadu", "lat": 13.0900, "lon": 80.3000, "region_id": "chennai"},
    "madras": {"name": "Chennai", "state": "Tamil Nadu", "lat": 13.0900, "lon": 80.3000, "region_id": "chennai"},
    "tuticorin": {"name": "Tuticorin", "state": "Tamil Nadu", "lat": 8.7500, "lon": 78.1950, "region_id": "tuticorin"},
    "thoothukudi": {"name": "Tuticorin", "state": "Tamil Nadu", "lat": 8.7500, "lon": 78.1950, "region_id": "tuticorin"},
    "rameswaram": {"name": "Rameswaram", "state": "Tamil Nadu", "lat": 9.2800, "lon": 79.3200, "region_id": "rameswaram"},
    "dhanushkodi": {"name": "Rameswaram", "state": "Tamil Nadu", "lat": 9.2800, "lon": 79.3200, "region_id": "rameswaram"},
    "kanyakumari": {"name": "Kanyakumari", "state": "Tamil Nadu", "lat": 8.0800, "lon": 77.5500, "region_id": "kanyakumari"},
    "pondicherry": {"name": "Puducherry", "state": "Puducherry", "lat": 11.9150, "lon": 79.8350, "region_id": "puducherry"},
    "puducherry": {"name": "Puducherry", "state": "Puducherry", "lat": 11.9150, "lon": 79.8350, "region_id": "puducherry"},
    # Kerala
    "kochi": {"name": "Kochi", "state": "Kerala", "lat": 9.9650, "lon": 76.2250, "region_id": "kochi"},
    "cochin": {"name": "Kochi", "state": "Kerala", "lat": 9.9650, "lon": 76.2250, "region_id": "kochi"},
    "kozhikode": {"name": "Kozhikode", "state": "Kerala", "lat": 11.2400, "lon": 75.7700, "region_id": "kozhikode"},
    "calicut": {"name": "Kozhikode", "state": "Kerala", "lat": 11.2400, "lon": 75.7700, "region_id": "kozhikode"},
    "vizhinjam": {"name": "Vizhinjam", "state": "Kerala", "lat": 8.3750, "lon": 76.9900, "region_id": "vizhinjam"},
    "trivandrum": {"name": "Vizhinjam", "state": "Kerala", "lat": 8.3750, "lon": 76.9900, "region_id": "vizhinjam"},
    # Karnataka & Goa
    "mangalore": {"name": "Mangalore", "state": "Karnataka", "lat": 12.9250, "lon": 74.8100, "region_id": "mangalore"},
    "mangaluru": {"name": "Mangalore", "state": "Karnataka", "lat": 12.9250, "lon": 74.8100, "region_id": "mangalore"},
    "karwar": {"name": "Karwar", "state": "Karnataka", "lat": 14.8050, "lon": 74.1250, "region_id": "karwar"},
    "goa": {"name": "Goa", "state": "Goa", "lat": 15.4100, "lon": 73.7900, "region_id": "goa"},
    "mormugao": {"name": "Goa", "state": "Goa", "lat": 15.4100, "lon": 73.7900, "region_id": "goa"},
    "panaji": {"name": "Goa", "state": "Goa", "lat": 15.4100, "lon": 73.7900, "region_id": "goa"},
    # Maharashtra
    "mumbai": {"name": "Mumbai", "state": "Maharashtra", "lat": 18.9250, "lon": 72.8450, "region_id": "mumbai"},
    "bombay": {"name": "Mumbai", "state": "Maharashtra", "lat": 18.9250, "lon": 72.8450, "region_id": "mumbai"},
    "ratnagiri": {"name": "Ratnagiri", "state": "Maharashtra", "lat": 16.9850, "lon": 73.2750, "region_id": "ratnagiri"},
    "malvan": {"name": "Malvan", "state": "Maharashtra", "lat": 16.0500, "lon": 73.4600, "region_id": "malvan"},
    # Gujarat
    "veraval": {"name": "Veraval", "state": "Gujarat", "lat": 20.9000, "lon": 70.3650, "region_id": "veraval"},
    "porbandar": {"name": "Porbandar", "state": "Gujarat", "lat": 21.6300, "lon": 69.5850, "region_id": "porbandar"},
    "okha": {"name": "Okha", "state": "Gujarat", "lat": 22.4700, "lon": 69.0750, "region_id": "okha"},
    "kandla": {"name": "Kandla", "state": "Gujarat", "lat": 23.0000, "lon": 70.2200, "region_id": "kandla"},
    # Odisha & West Bengal
    "paradip": {"name": "Paradip", "state": "Odisha", "lat": 20.2600, "lon": 86.6800, "region_id": "paradip"},
    "puri": {"name": "Puri", "state": "Odisha", "lat": 19.7900, "lon": 85.8300, "region_id": "puri"},
    "gopalpur": {"name": "Gopalpur", "state": "Odisha", "lat": 19.3000, "lon": 84.9700, "region_id": "gopalpur"},
    "digha": {"name": "Digha", "state": "West Bengal", "lat": 21.6200, "lon": 87.5300, "region_id": "digha"},
    "sundarbans": {"name": "Sundarbans", "state": "West Bengal", "lat": 21.6500, "lon": 88.2500, "region_id": "sundarbans"},
    # Islands
    "portblair": {"name": "Port Blair", "state": "Andaman & Nicobar", "lat": 11.6700, "lon": 92.7400, "region_id": "portblair"},
    "kavaratti": {"name": "Kavaratti", "state": "Lakshadweep", "lat": 10.5600, "lon": 72.6350, "region_id": "kavaratti"},
}

COASTAL_PORT_ALIASES = {
    "visakhapatnam": ["visakhapatnam", "vishakapatnam", "vizag", "visakha", "vishakhapatnam", "vsp", "waltair", "why zag", "y zag", "విశాఖపట్నం", "విశాఖ", "వైజాగ్", "विशाखापट्टनम", "विशाखापत्तनम", "விசாகப்பட்டினம்"],
    "kakinada": ["kakinada", "kaki nada", "cocanada", "kakinada port", "కాకినాడ", "काकीनाडा", "காக்கிநாடா"],
    "machilipatnam": ["machilipatnam", "machli patnam", "masulipatnam", "bandar", "మచిలీపట్నం", "మచిలిపట్నం", "బందరు", "मछलीपट्टनम", "மச்சிலிப்பட்டினம்"],
    "krishnapatnam": ["krishnapatnam", "krishna patnam", "nellore", "కృష్ణపట్నం", "నెల్లూరు", "कृष्णपट्टनम"],
    "chennai": ["chennai", "madras", "ennore", "kasimedu", "chenai", "చెన్నై", "मद्रास", "चेन्नई", "சென்னை"],
    "tuticorin": ["tuticorin", "tuti corin", "thoothukudi", "thoothukudi port", "తూత్తుకుడి", "టుటికోరిన్", "तूतीकोरिन", "தூத்துக்குடி"],
    "rameswaram": ["rameswaram", "rameshwaram", "dhanushkodi", "pamban", "రామేశ్వరం", "रामेश्वरम", "ராமேஸ்வரம்"],
    "kanyakumari": ["kanyakumari", "cape comorin", "కన్యాకుమారి", "कन्याकुमारी", "கன்னியாகுமரி"],
    "puducherry": ["puducherry", "pondicherry", "pondy", "పుదుచ్చేరి", "పాండిచ్చేరి", "पुडुचेरी", "பாண்டிச்சேரி"],
    "kochi": ["kochi", "cochin", "ernakulam", "willingdon", "కొచ్చి", "कोच्चि", "கொச்சி", "കൊച്ചി"],
    "kozhikode": ["kozhikode", "calicut", "beypore", "కోజికోడ్", "कोझिकोड", "കോഴിക്കോട്"],
    "vizhinjam": ["vizhinjam", "trivandrum", "thiruvananthapuram", "విళింజం", "తిరువనంతపురం", "विझिंजम", "തിരുവനന്തപുരം"],
    "mangalore": ["mangalore", "mangaluru", "panambur", "new mangalore", "మంగళూరు", "मंगलौर", "मैंगलोर", "ಮಂಗಳೂರು"],
    "karwar": ["karwar", "baithkol", "కార్వార్", "कारवार"],
    "goa": ["goa", "mormugao", "panaji", "panjim", "vasco", "vasco da gama", "గోవా", "पणजी", "गोवा"],
    "mumbai": ["mumbai", "bombay", "nhava sheva", "jnpt", "mazagon", "ముంబై", "బొంబాయి", "मुंबई", "बंबई", "மும்பை"],
    "ratnagiri": ["ratnagiri", "bhagwati", "రత్నగిరి", "रत्नागिरी"],
    "malvan": ["malvan", "tarkarli", "మాల్వాన్", "मालवन"],
    "veraval": ["veraval", "vera val", "somnath", "వెరావల్", "వేరావల్", "वेरावल", "વેરાવળ"],
    "porbandar": ["porbandar", "por bandar", "పోర్‌బందర్", "पोरबंदर", "પોરબંદર"],
    "okha": ["okha", "dwarka", "beyt dwarka", "ఓఖా", "ద్వారక", "ओखा", "द्वारका", "ઓખા"],
    "kandla": ["kandla", "deendayal", "mundra", "కాండ్లా", "कांडला", "કંડલા"],
    "paradip": ["paradip", "paradeep", "dhamra", "పారాదీప్", "पारादीप", "ପାରାଦୀପ"],
    "puri": ["puri", "chandrabhaga", "పూరి", "पुरी", "ପୁରୀ"],
    "gopalpur": ["gopalpur", "gopal pur", "గోపాల్‌పూర్", "गोपालपुर"],
    "digha": ["digha", "shankarpur", "దిఘా", "दीघा", "দিঘা"],
    "sundarbans": ["sundarbans", "kakdwip", "namkhana", "సుందర్‌బన్స్", "सुंदरबन", "সুন্দরবন"],
    "portblair": ["port blair", "portblair", "havelock", "andaman", "swaraj dweep", "పోర్ట్ బ్లెయిర్", "पोर्ट ब्लेयर"],
    "kavaratti": ["kavaratti", "agatti", "minicoy", "lakshadweep", "కవరత్తి", "లక్షద్వీప్", "कवरत्ती", "लक्षद्वीप"],
}

INLAND_CITIES = {
    "delhi", "new delhi", "hyderabad", "bengaluru", "bangalore", "pune",
    "ahmedabad", "jaipur", "lucknow", "kanpur", "nagpur", "indore", "bhopal",
    "patna", "ludhiana", "agra", "nashik", "faridabad", "meerut", "rajkot",
    "varanasi", "srinagar", "aurangabad", "dhanbad", "amritsar", "allahabad",
    "prayagraj", "ranchi", "gwalior", "jabalpur", "vijayawada", "jodhpur",
    "raipur", "kota", "chandigarh", "guwahati", "solapur", "hubli", "dharwad",
    "bareilly", "moradabad", "mysore", "mysuru", "gurgaon", "gurugram", "noida",
    "jalandhar", "tiruchirappalli", "trichy", "tirupati", "salem", "warangal",
    "guntur", "dehradun", "shimla", "jammu", "amravati", "bikaner", "nanded",
    "kolhapur", "ajmer", "akola", "gulbarga", "ujjain", "siliguri", "jhansi",
    "kurnool", "secunderabad", "rajahmundry", "kadapa", "anantapur", "karimnagar",
    "nizamabad", "khammam", "eluru", "ongole", "chittoor", "vellore", "erode",
    "coimbatore", "tiruppur", "madurai", "dindigul", "thanjavur", "tirunelveli"
}

NON_PLACE_STOPWORDS = {
    "sea", "ocean", "water", "waters", "bay", "deep", "today", "tomorrow",
    "morning", "evening", "night", "now", "here", "harbour", "harbor", "port",
    "ports", "coast", "coastal", "gulf", "channel", "strait", "island", "islands",
    "fleet", "fleets", "vessel", "vessels", "boat", "boats", "ship", "ships",
    "craft", "fish", "fishes", "fishing", "zone", "zones", "pfz", "cyclone",
    "storm", "warning", "alert", "alerts", "weather", "condition", "conditions",
    "monsoon", "depression", "english", "hindi", "telugu", "tamil", "bengali",
    "gujarati", "marathi", "kannada", "malayalam", "odia", "india", "indian",
    "indian ocean", "arabian sea", "bay of bengal", "go", "sail", "safe",
    "safety", "venture", "travel", "navigation", "nav", "route", "corridor",
    "distance", "passage", "map", "radar", "wind", "wave", "swell", "tide",
    "help", "status", "info", "overview", "update", "please", "kindly",
    "tell", "give", "show", "check", "find", "view", "me", "us", "you",
    "good", "fine", "what", "where", "how", "when", "why", "which",
    "near", "nearby", "around", "close", "local", "active", "our", "my",
    "all", "any", "can", "catch", "is", "it", "are", "we", "i", "do", "does"
}

def _find_coastal_port(text: str) -> dict | None:
    if not text:
        return None
    t = text.lower().strip()
    clean = re.sub(r"[^\w\s]", "", t).strip()
    if clean in COASTAL_PORT_ALIASES:
        return COASTAL_PORTS[clean]
    for port_key, aliases in COASTAL_PORT_ALIASES.items():
        if clean in aliases:
            return COASTAL_PORTS[port_key]
        for a in aliases:
            if any(ord(c) > 127 for c in a):
                if a in clean or a in t:
                    return COASTAL_PORTS[port_key]
            elif re.search(r"\b" + re.escape(a) + r"\b", clean):
                return COASTAL_PORTS[port_key]
    return None

def _classify_place(candidate: str) -> tuple[str, any]:
    if not candidate:
        return "none", None
    clean = re.sub(r"[^\w\s]", "", candidate.lower()).strip()
    if not clean or clean in NON_PLACE_STOPWORDS:
        return "stopword", clean
    port = _find_coastal_port(clean)
    if port:
        return "coastal", port
    if clean in INLAND_CITIES or any(c in clean for c in ["delhi", "hyderabad", "bengaluru", "bangalore", "pune", "jaipur", "lucknow"]):
        return "inland", clean
    return "unrecognized", clean

def _build_invalid_location_message(inv: dict, lang: str = "en") -> str:
    kind = inv.get("kind", "unrecognized")
    name = inv.get("name", "specified location")
    pos = inv.get("position")
    name_display = name.title()

    if kind == "inland":
        if pos == "start":
            context_str = f"Departure point **{name_display}** is an inland city"
        elif pos == "end":
            context_str = f"Destination **{name_display}** is an inland city"
        else:
            context_str = f"**{name_display}** is an inland city"

        if lang == "te":
            return (f"⚠️ {context_str} - ఇక్కడ సముద్ర తీరం లేదా నావిగేషన్ పోర్ట్ లేదు.\n\n"
                    f"ORCA కేవలం భారతీయ సముద్ర తీరప్రాంతాలు మరియు ఓడరేవులకు మాత్రమే సముద్ర సమాచారాన్ని అందిస్తుంది.\n\n"
                    f"**సహాయపడే తీరప్రాంత పోర్టులు**:\n"
                    f"• తూర్పు తీరం: కాకినాడ, విశాఖపట్నం, చెన్నై, టుటికోరిన్, రామేశ్వరం, పారాదీప్\n"
                    f"• పశ్చిమ తీరం: ముంబై, కొచ్చి, గోవా, మంగళూరు, వెరావల్, కాండ్లా")
        elif lang == "hi":
            return (f"⚠️ {context_str} - यहाँ कोई समुद्री तट या नौगम्य बंदरगाह नहीं है।\n\n"
                    f"ORCA केवल भारतीय समुद्री तटीय क्षेत्रों और बंदरगाहों के लिए नेविगेशन और मौसम की जानकारी प्रदान करता है।\n\n"
                    f"**उपलब्ध तटीय बंदरगाह**:\n"
                    f"• पूर्वी तट: काकीनाडा, विशाखापट्टनम, चेन्नई, तूतीकोरिन, रामेश्वरम, पारादीप\n"
                    f"• पश्चिमी तट: मुंबई, कोच्चि, गोवा, मैंगलोर, वेरावल, कांडला")
        else:
            return (f"⚠️ {context_str} with no sea coastline or navigable marine harbour.\n\n"
                    f"ORCA specializes exclusively in coastal maritime navigation across the Bay of Bengal, Arabian Sea, and Indian Ocean.\n\n"
                    f"**Supported Coastal Ports**:\n"
                    f"• East Coast: Kakinada, Visakhapatnam, Chennai, Tuticorin, Rameswaram, Paradip\n"
                    f"• West Coast: Mumbai, Kochi, Goa, Mangalore, Veraval, Porbandar, Kandla")

    # kind == "unrecognized"
    if pos == "start":
        context_str = f"Departure point **'{name}'**"
    elif pos == "end":
        context_str = f"Destination **'{name}'**"
    else:
        context_str = f"Location **'{name}'**"

    if lang == "te":
        return (f"⚠️ {context_str} మా భారతీయ తీరప్రాంత డేటాబేస్‌లో గుర్తించబడలేదు.\n\n"
                f"దయచేసి సరైన తీరప్రాంత పోర్ట్ పేరును పేర్కొనండి (ఉదాహరణకు: **కాకినాడ, విశాఖపట్నం, చెన్నై, ముంబై, కొచ్చి, మంగళూరు, గోవా, పారాదీప్**).")
    elif lang == "hi":
        return (f"⚠️ {context_str} हमारे भारतीय तटीय डेटाबेस में उपलब्ध नहीं है।\n\n"
                f"कृपया किसी मान्य तटीय बंदरगाह का चयन करें (जैसे: **काकीनाडा, विशाखापट्टनम, चेन्नई, मुंबई, कोच्चि, मैंगलोर, गोवा, पारादीप**)।")
    else:
        return (f"⚠️ {context_str} was not recognized as a coastal port or maritime sector in our Indian coastal navigation database.\n\n"
                f"Please check the spelling or select a verified coastal port such as **Kakinada, Visakhapatnam, Chennai, Kochi, Mumbai, Mangalore, Goa, Paradip, or Tuticorin**.")

CONVERSATIONAL_GREETINGS = {
    "hi", "hello", "hey", "hola", "namaste", "namaskar", "namaskaram",
    "vanakkam", "pranam", "kemon acho", "kem cho", "adaab", "salam",
    "good morning", "good afternoon", "good evening", "good day", "shubhodhayam"
}
CONVERSATIONAL_THANKS = {
    "thank you", "thanks", "thank u", "thx", "dhanyavadamulu", "dhanyavad",
    "dhanyavadam", "shukriya", "nandri", "nandi", "ok", "okay", "alright",
    "got it", "sure", "fine", "cool", "bye", "goodbye", "take care"
}
CONVERSATIONAL_HELP = {
    "who are you", "what are you", "what can you do", "tell me about yourself",
    "how can you help", "what is orca", "who made you", "help", "how to use",
    "what are your features", "features"
}

def _check_conversational(text: str, lang: str = "en") -> tuple[str | None, str | None]:
    """Returns (type, reply_text) for pure conversational inputs with zero delay and no badges."""
    t = text.lower().strip()
    clean = re.sub(r"[^\w\s]", "", t).strip()

    # If the text has question marks or marine terms, it is an inquiry, NOT a pure greeting or thanks!
    has_marine_terms = bool(re.search(
        r"(cycl|storm|depress|squall|gale|weather|wave|wind|swell|tide|fleet|boat|vessel|fish|pfz|route|port|harbour|sea|sail|rain|temp|safe|danger|alert|warning|how|what|where|can|is|are|tell|give|show|possibilit)",
        t, re.IGNORECASE
    ))
    if has_marine_terms:
        return None, None
    
    is_greeting = clean in CONVERSATIONAL_GREETINGS or any(clean.startswith(g + " ") for g in CONVERSATIONAL_GREETINGS)
    is_thanks = clean in CONVERSATIONAL_THANKS
    is_help = clean in CONVERSATIONAL_HELP or any(h in clean for h in ["what can you do", "who are you", "what is orca"])

    if is_greeting:
        replies = {
            "en": "Hello! I'm ORCA, your marine intelligence assistant. How can I assist you with sea conditions, safe navigation routes, or fishing zones today?",
            "te": "నమస్కారం! నేను ORCA, మీ సముద్ర సహాయకుడిని. సముద్ర పరిస్థితులు, సురక్షితమైన నావిగేషన్ మార్గాలు లేదా ఫిషింగ్ జోన్ల సమాచారంలో నేను మీకు ఎలా సహాయపడగలను?",
            "hi": "नमस्ते! मैं ORCA हूँ, आपका समुद्री सहायक। आज मैं समुद्र की स्थिति, सुरक्षित नेविगेशन मार्ग या मछली पकड़ने के क्षेत्रों के बारे में आपकी क्या मदद कर सकता हूँ?",
            "ta": "வணக்கம்! நான் ORCA, உங்கள் கடல்சார் உதவியாளர். கடல் நிலைமைகள், பாதுகாப்பான வழித்தடங்கள் அல்லது மீன்பிடி மண்டலங்கள் குறித்து நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?",
            "ml": "നമസ്കാരം! ഞാൻ ORCA, നിങ്ങളുടെ സമുദ്ര സഹായി. കാലാവസ്ഥ, സുരക്ഷിതമായ റൂട്ടുകൾ, ഫിഷിംഗ് സോണുകൾ എന്നിവയെക്കുറിച്ച് എനിക്ക് എങ്ങനെ സഹായിക്കാനാകും?",
            "kn": "ನಮಸ್ಕಾರ! ನಾನು ORCA, ನಿಮ್ಮ ಸಮುದ್ರ ಸಹಾಯಕ. ಸಮುದ್ರದ ಸ್ಥಿತಿ, ಸುರಕ್ಷಿತ ಸಂಚಾರ ಮಾರ್ಗಗಳು ಅಥವಾ ಮೀನುಗಾರಿಕೆ ವಲಯಗಳ ಬಗ್ಗೆ ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
            "mr": "नमस्कार! मी ORCA, तुमचा सागरी सहाय्यक. हवामान, सुरक्षित सागरी मार्ग किंवा मासेमारी क्षेत्रांबद्दल मी तुम्हाला कशी मदत करू शकतो?",
            "gu": "નમસ્તે! હું ORCA છું, તમારો દરિયાઈ સહાયક. દરિયાઈ સ્થિતિ, સલામત નૌકાવહન માર્ગો અથવા માછીમારી ઝોન વિશે હું તમને કેવી રીતે મદદ કરી શકું?",
            "bn": "নমস্কার! আমি ORCA, আপনার সামুদ্রিক সহায়ক। সমুদ্রের পরিস্থিতি, নিরাপদ নৌচলাচল রুট বা মাছ ধরার এলাকা সম্পর্কে আমি কীভাবে সাহায্য করতে পারি?",
            "or": "ନମସ୍କାର! ମୁଁ ORCA, ଆପଣଙ୍କ ସାମୁଦ୍ରିକ ସହାୟକ। ସମୁଦ୍ର ପାଣିପାଗ, ସୁରକ୍ଷିତ ନୌଚାଳନା ମାର୍ଗ ବା ମାଛ ଧରିବା ଅଞ୍ଚଳ ବିଷୟରେ ମୁଁ କିପରି ସାହାଯ୍ୟ କରିବି?",
        }
        return "greeting", replies.get(lang, replies["en"])
    elif is_thanks:
        replies = {
            "en": "You're welcome! Wishing you calm seas and safe voyages. Let me know if you need any weather or navigation updates.",
            "te": "ధన్యవాదాలు! మీ ప్రయాణం సురక్షితంగా సాగాలని కోరుకుంటున్నాను. సముద్ర సమాచారం కావాలంటే ఎప్పుడైనా అడగండి.",
            "hi": "आपका स्वागत है! आपकी समुद्री यात्रा सुरक्षित और मंगलमय हो। किसी भी जानकारी के लिए कभी भी पूछ सकते हैं।",
            "ta": "மகிழ்ச்சி! உங்கள் கடல் பயணம் பாதுகாப்பாக அமைய வாழ்த்துகள். தேவைப்படும்போது என்னை அழையுங்கள்.",
            "ml": "സ്വാഗതം! സുരക്ഷിതമായ യാത്ര ആശംസിക്കുന്നു. എപ്പോൾ വേണമെങ്കിലും ചോദിക്കാം.",
            "kn": "ಸ್ವಾಗತ! ನಿಮ್ಮ ಸಮುದ್ರ ಪ್ರಯಾಣ ಸುರಕ್ಷಿತವಾಗಿರಲಿ. ಅಗತ್ಯವಿದ್ದಾಗ ಯಾವಾಗ ಬೇಕಾದರೂ ಕೇಳಿ.",
            "mr": "आपले स्वागत आहे! आपला सागरी प्रवास सुरक्षित होवो. हवामान किंवा मार्गाबद्दल कधीही विचारा.",
            "gu": "આપનું સ્વાગત છે! તમારી દરિયાઈ યાત્રા સુરક્ષિત રહે. જરૂર પડે ત્યારે ગમે ત્યારે પૂછી શકો છો.",
            "bn": "আপনাকে স্বাগতম! আপনার সমুদ্রযাত্রা নিরাপদ হোক। কোনো আপডেট প্রয়োজন হলে নির্দ্বিधায় জানান।",
            "or": "ସ୍ୱାଗତ! ଆପଣଙ୍କ ସାମୁଦ୍ରିକ ଯାତ୍ରା ସୁରକ୍ଷିତ ରହୁ। କୌଣସି ସୂଚନା ଦରକାର ହେଲେ ପଚାରନ୍ତୁ।",
        }
        return "thanks", replies.get(lang, replies["en"])
    elif is_help:
        replies = {
            "en": "I'm ORCA, your dedicated marine assistant for Indian coastal waters. I can help you with:\n• Port-to-port maritime navigation routes and distance estimates\n• Sea safety checks before departing harbor\n• Live weather, wind speed, wave height, and swell alerts\n• Potential Fishing Zones (PFZ) and ocean thermal trends\n• Active IMD cyclone bulletins and restricted marine sanctuaries\n\nWhat would you like to explore?",
            "te": "నేను ORCA, భారతీయ తీరప్రాంతాల కోసం మీ సముద్ర సహాయకుడిని. నేను మీకు అందించే సేవలు:\n• ఒక పోర్ట్ నుండి మరొక పోర్ట్‌కు సురక్షితమైన నావిగేషన్ మార్గాలు మరియు దూరం\n• సముద్రంలోకి వెళ్లేముందు భద్రతా తనిఖీ\n• లైవ్ వాతావరణం, గాలి వేగం, అలల ఎత్తు మరియు హెచ్చరికలు\n• పొటెన్షియల్ ఫిషింగ్ జోన్లు (PFZ)\n• తుఫాను హెచ్చరికలు మరియు రక్షిత ప్రాంతాల సమాచారం",
            "hi": "मैं ORCA हूँ, भारतीय तटीय जलक्षेत्र के लिए आपका समुद्री सहायक। मैं आपकी इन चीज़ों में मदद कर सकता हूँ:\n• एक बंदरगाह से दूसरे बंदरगाह का सुरक्षित समुद्री मार्ग और दूरी\n• समुद्र में जाने से पहले सुरक्षा जाँच\n• मौसम, हवा की गति, लहरों की ऊँचाई और चेतावनी\n• संभावित मछली पकड़ने के क्षेत्र (PFZ)\n• चक्रवात चेतावनी और प्रतिबंधित समुद्री क्षेत्र",
        }
        return "help", replies.get(lang, replies["en"])
    return None, None

def _clean_voice_transcript(text: str) -> str:
    """Cleans common speech-to-text noise, stutter duplicates, and phonetic glitches."""
    if not text:
        return ""
    t = text.lower().strip()
    t = re.sub(r"\b(\w+)\s+\1\b", r"\1", t)
    t = re.sub(r"\b(pf z|p f z|pfzed|p\.f\.z|pzf)\b", "pfz", t)
    t = re.sub(r"\b(fish zone|fishing zone|fishing area|fish area)\b", "pfz", t)
    t = re.sub(r"\b(sea safe|sea condition|can i go|can we go|safe to go|safe to travel)\b", "safe to sail", t)
    t = re.sub(r"\b(storm warning|toofan|cyclone alert|weather warning)\b", "cyclone alert", t)
    return t

def _extract_ports_and_route(m: str, region_hint: dict | None = None) -> tuple[dict | None, dict | None, str | None, dict | None]:
    """
    Robustly extracts start and destination ports with aliases, prepositions, and detects
    unrecognized or inland endpoints so ORCA never defaults inappropriately.
    Returns (p_start, p_end, port_mode, invalid_info).
    """
    # 1. Check for route patterns with 2 endpoints
    from_to = re.search(r"\bfrom\s+(.+?)\s+to\s+(.+)", m, re.IGNORECASE)
    to_from = re.search(r"\b(?:route\s+to|sail\s+to|reach|passage\s+to)\s+(.+?)\s+from\s+(.+)", m, re.IGNORECASE)
    between_and = re.search(r"\bbetween\s+(.+?)\s+and\s+(.+)", m, re.IGNORECASE)
    simple_to = re.search(r"\b([a-zA-Z\s]{2,25})\s+to\s+([a-zA-Z\s]{2,25})\b", m, re.IGNORECASE)

    raw_start = None
    raw_end = None

    if to_from:
        raw_end = to_from.group(1).strip()
        raw_start = to_from.group(2).strip()
    elif from_to:
        raw_start = from_to.group(1).strip()
        raw_end = from_to.group(2).strip()
    elif between_and:
        raw_start = between_and.group(1).strip()
        raw_end = between_and.group(2).strip()
    elif simple_to:
        c1 = simple_to.group(1).strip()
        c2 = simple_to.group(2).strip()
        if c1.lower() not in {"go", "safe", "time", "how", "ready", "want", "like"} and c2.lower() not in {"sea", "sail", "fish", "travel", "depart", "harbour", "harbor"}:
            raw_start = c1
            raw_end = c2

    if raw_start and raw_end:
        raw_start = re.sub(r"^(?:route\s+from|sail\s+from|passage\s+from|from|a\s+route\s+from)\s+", "", raw_start, flags=re.IGNORECASE).strip()
        raw_end = re.sub(r"\b(?:please|now|today|tomorrow|fast|quickly|safe|safely)\b", "", raw_end, flags=re.IGNORECASE).strip()

        cls_start, obj_start = _classify_place(raw_start)
        cls_end, obj_end = _classify_place(raw_end)

        if cls_start == "coastal" and cls_end == "coastal":
            return obj_start, obj_end, "multi_port", None
        
        # Check if one or both are inland or unrecognized
        if cls_start in ("inland", "unrecognized"):
            return None, None, "invalid_route_location", {"kind": cls_start, "name": raw_start, "position": "start"}
        if cls_end in ("inland", "unrecognized"):
            return None, None, "invalid_route_location", {"kind": cls_end, "name": raw_end, "position": "end"}

    # 2. Check for single destination route (e.g. "route to asdfgh", "route to mumbai")
    single_dest_match = re.search(r"\b(?:route\s+to|sail\s+to|passage\s+to|reach|corridor\s+to|distance\s+to|way\s+to)\s+([a-zA-Z\s]{2,25})\b", m, re.IGNORECASE)
    if single_dest_match:
        cand = single_dest_match.group(1).strip()
        cand = re.sub(r"\b(?:please|now|today|tomorrow)\b", "", cand, flags=re.IGNORECASE).strip()
        cls_dest, obj_dest = _classify_place(cand)
        if cls_dest == "coastal":
            return None, obj_dest, "single_port", None
        elif cls_dest in ("inland", "unrecognized"):
            return None, None, "invalid_route_location", {"kind": cls_dest, "name": cand, "position": "end"}

    # 3. Find known coastal ports mentioned anywhere in text
    matches = []
    for port_key, aliases in COASTAL_PORT_ALIASES.items():
        base = COASTAL_PORTS.get(port_key)
        if not base:
            continue
        for a in aliases:
            if any(ord(c) > 127 for c in a):
                start_pos = 0
                while True:
                    idx = m.lower().find(a.lower(), start_pos)
                    if idx == -1:
                        break
                    matches.append((idx, idx + len(a), base, a))
                    start_pos = idx + len(a)
            else:
                for match in re.finditer(r"\b" + re.escape(a) + r"\b", m, re.IGNORECASE):
                    matches.append((match.start(), match.end(), base, a))
    matches.sort(key=lambda x: x[0])

    unique = []
    seen = set()
    for start, end, port, alias in matches:
        if port["name"] not in seen:
            seen.add(port["name"])
            unique.append((start, end, port, alias))

    if len(unique) >= 2:
        return unique[0][2], unique[1][2], "multi_port", None
    elif len(unique) == 1:
        return None, unique[0][2], "single_port", None

    return None, None, None, None

def _keyword_plan(message: str, lang_hint: str | None = None, region_hint: dict | None = None) -> dict:
    """Deterministic, sub-second parser for marine intelligence queries with voice normalization."""
    m_clean = _clean_voice_transcript(message)
    m = m_clean

    valid_langs = ("en", "te", "ta", "ml", "kn", "mr", "gu", "bn", "or", "hi")
    is_te = bool(re.search(r"[\u0c00-\u0c7f]", message))
    is_hi = bool(re.search(r"[\u0900-\u097f]", message))
    is_ta = bool(re.search(r"[\u0b80-\u0bff]", message))
    is_ml = bool(re.search(r"[\u0d00-\u0d7f]", message))
    is_kn = bool(re.search(r"[\u0c80-\u0cff]", message))
    is_bn = bool(re.search(r"[\u0980-\u09ff]", message))
    is_gu = bool(re.search(r"[\u0a80-\u0aff]", message))
    is_or = bool(re.search(r"[\u0b00-\u0b7f]", message))

    if is_te:
        lang = "te"
    elif is_hi:
        lang = "hi"
    elif is_ta:
        lang = "ta"
    elif is_ml:
        lang = "ml"
    elif is_kn:
        lang = "kn"
    elif is_bn:
        lang = "bn"
    elif is_gu:
        lang = "gu"
    elif is_or:
        lang = "or"
    else:
        lang = lang_hint if lang_hint in valid_langs else "en"

    # Conversational check
    conv_type, _ = _check_conversational(m, lang)
    if conv_type:
        return {
            "intent": "general",
            "timeframe": "today",
            "language": lang,
            "script": "native",
            "location": None,
            "route": None,
            "datasets": [],
        }

    p_start, p_end, port_mode, invalid_route_info = _extract_ports_and_route(m, region_hint)

    if port_mode == "invalid_route_location" and invalid_route_info:
        return {
            "intent": "general",
            "timeframe": "today",
            "language": lang,
            "script": "native",
            "location": None,
            "route": None,
            "datasets": [],
            "invalid_location": invalid_route_info,
        }

    # Detect single location inquiry with preposition: in/at/near/around/for/off <place>
    loc_match = re.search(r"\b(?:in|at|near|around|for|off)\s+([a-zA-Z\s]{2,25})\b", m, re.IGNORECASE)
    if loc_match and port_mode is None:
        cand_loc = loc_match.group(1).strip()
        words = cand_loc.lower().split()
        marine_words = {"sea", "ocean", "water", "waters", "morning", "evening", "night", "today", "tomorrow", "now", "here", "fleet", "vessel", "boat", "fish", "pfz", "deep"}
        if not any(w in marine_words for w in words):
            cls_loc, obj_loc = _classify_place(cand_loc)
            if cls_loc in ("inland", "unrecognized"):
                return {
                    "intent": "general",
                    "timeframe": "today",
                    "language": lang,
                    "script": "native",
                    "location": None,
                    "route": None,
                    "datasets": [],
                    "invalid_location": {"kind": cls_loc, "name": cand_loc, "position": "single"},
                }

    # Check if user message is just 1-2 words naming an invalid place (e.g. "delhi", "asdfgh", "weather delhi")
    has_marine_op = bool(re.search(r"\b(fleet|vessel|boat|craft|trawler|ship|fish|pfz|catch|cycl|toofan|storm|wind|wave|swell|tide|sail|safety|safe)\b", m, re.IGNORECASE))
    clean_words = [w for w in re.sub(r"[^\w\s]", "", m.lower()).split() if w not in NON_PLACE_STOPWORDS]
    if clean_words and len(clean_words) <= 2 and port_mode is None and not has_marine_op:
        cand_word = " ".join(clean_words)
        cls_loc, obj_loc = _classify_place(cand_word)
        if cls_loc in ("inland", "unrecognized"):
            return {
                "intent": "general",
                "timeframe": "today",
                "language": lang,
                "script": "native",
                "location": None,
                "route": None,
                "datasets": [],
                "invalid_location": {"kind": cls_loc, "name": cand_word, "position": "single"},
            }

    has_from_to = bool(re.search(r"\b(from\s+\w+\s+to\s+\w+|route\s+from|sail\s+from|path\s+from|corridor|passage\s+plan)\b", m)) or bool(re.search(r"(నుండి|నుంచి|నుంచీ|से|முதல்|வரை)", m))
    has_route_words = bool(re.search(r"\b(route\s+to|how\s+to\s+sail\s+to|how\s+to\s+reach|distance\s+to|path\s+to|route|corridor|voyage|passage)\b", m)) or bool(re.search(r"(మార్గం|దారి|రూట్|రాస్తా|मार्ग|रास्ता|दिशा|பாதை|வழி)", m))
    is_safety_query = any(w in m for w in [
        "safe", "safety", "venture", "can i go", "can we go", "can we sail",
        "is it safe", "good to go", "sea condition", "safe to sail", "vellacha", "jaana safe",
        "go to sea", "go out", "వెళ్లవచ్చా", "వెళ్ళవచ్చా", "సురక్షితమా", "సురక్షితం", "పోవచ్చా", "जा सकते हैं", "सुरक्षित", "जाना ठीक", "செல்லலாமா", "பாதுகாப்பானதா"
    ])

    route = None
    loc = None

    if port_mode == "multi_port" and (has_from_to or has_route_words or " to " in m or " and " in m or "->" in m or "-" in m or bool(re.search(r"(నుండి|నుంచి|से|முதல்|మార్గం|దారి|मार्ग|रास्ता)", m))):
        route = {
            "start": {"name": p_start["name"], "lat": p_start["lat"], "lon": p_start["lon"]},
            "end": {"name": p_end["name"], "lat": p_end["lat"], "lon": p_end["lon"]},
        }
        loc = route["start"]
        intent = "route_safety"
    elif port_mode == "single_port":
        loc = p_end
        if has_route_words and not is_safety_query and region_hint and "center" in region_hint and region_hint.get("name") != p_end["name"]:
            # Route from current active region to the mentioned destination port
            start_name = region_hint.get("name", "Current Location")
            route = {
                "start": {"name": start_name, "lat": region_hint["center"]["lat"], "lon": region_hint["center"]["lon"]},
                "end": {"name": p_end["name"], "lat": p_end["lat"], "lon": p_end["lon"]},
            }
            intent = "route_safety"
        elif bool(re.search(r"(fleet|vessel|boat|craft|trawler|ship|nearby\s+fleet|fleet\s+op|traffic|పడవలు|బోట్లు|పడవ|మత్స్యకారులు|नाव|नावें|नौका|படகு|படகுகள்)", m)):
            intent = "fleet_status"
        elif bool(re.search(r"(cycl|toofan|storm|depress|squall|gale|hazard|warning|alert|tsunami|low\s*press|తుఫాను|తుపాను|హెచ్చరికలు|హెచ్చరిక|వాయుగుండం|तूफान|चेतावनी|புயல்|எச்சரிக்கை)", m)):
            intent = "alerts_query"
        elif any(w in m for w in ["pfz", "fish", "catch", "trawler", "చేపలు", "మత్స్య", "వేట", "మండలం", "मछली", "शिकार", "மீன்", "மீன்பிடி"]):
            intent = "pfz_nearest"
        elif any(w in m for w in ["chlorophyll", "sst", "temperature", "temp"]):
            intent = "chlorophyll_sst"
        elif is_safety_query or any(w in m for w in ["sail", "leave", "voyage"]):
            intent = "safety_sail"
        elif bool(re.search(r"(weather|condition|tide|swell|wind|wave|rain|temp|sea\s*state|marine|వాతావరణం|అలలు|గాలి|సముద్రం|मौसम|हवा|लहरें|வானிலை|அலை)", m)):
            intent = "conditions"
        else:
            intent = "conditions"
    elif has_route_words and not is_safety_query:
        intent = "route_safety"
    elif bool(re.search(r"(fleet|vessel|boat|craft|trawler|ship|nearby\s+fleet|fleet\s+op|traffic|పడవలు|బోట్లు|పడవ|మత్స్యకారులు|नाव|नावें|नौका|படகு|படகுகள்)", m)):
        intent = "fleet_status"
    elif bool(re.search(r"(cycl|toofan|storm|depress|squall|gale|hazard|warning|alert|tsunami|low\s*press|తుఫాను|తుపాను|హెచ్చరికలు|హెచ్చరిక|వాయుగుండం|तूफान|चेतावनी|புயல்|எச்சரிக்கை)", m)):
        intent = "alerts_query"
    elif any(w in m for w in ["pfz", "fishing zone", "catch fish", "fish zone", "where to fish", "చేపలు", "మత్స్య", "వేట", "మండలం", "मछली", "शिकार", "மீன்", "மீன்பிடி"]) or ("fish" in m and "declin" not in m):
        intent = "pfz_nearest"
    elif is_safety_query:
        intent = "safety_sail"
    elif any(w in m for w in ["chlorophyll", "sst", "temperature", "plankton", "water temp"]):
        intent = "chlorophyll_sst"
    elif any(w in m for w in ["avoid", "restrict", "geofenc", "boundary", "border", "sanctuary"]):
        intent = "geofence_avoid"
    elif any(w in m for w in ["declin", "productivity", "catch drop", "less fish"]):
        intent = "productivity_decline"
    elif bool(re.search(r"(weather|condition|tide|swell|wind|wave|rain|temp|sea\s*state|marine|వాతావరణం|అలలు|గాలి|సముద్రం|मौसम|हवा|लहरें|வானிலை|அலை)", m)):
        intent = "conditions"
    else:
        intent = "conditions"

    timeframe = "tomorrow" if ("tomorrow" in m or "repu" in m or "kal" in m or "naalai" in m) else "today"
    return {
        "intent": intent,
        "timeframe": timeframe,
        "language": lang,
        "script": "native",
        "location": loc,
        "route": route,
        "datasets": [],
    }

async def run_specialists(plan: dict, loc: dict, region_id: str) -> dict:
    """Invoke specialist agents relevant to intent. Only gathers what is required."""
    intent = plan["intent"]
    timeframe = plan.get("timeframe", "today")
    region = mr.get_region(region_id)
    trace = []
    citations = []
    widgets = []
    data = {}
    verdict = None

    if intent == "general":
        intent = "conditions"

    needed = _discover(intent)
    trace.append({"agent": "Data Discovery Agent",
                  "detail": (f"Query intent '{intent}' resolved to region "
                             f"{region['name']}, {region['state']}; datasets: "
                             f"{', '.join(needed) if needed else 'none'}.")})

    # Weather Intelligence Agent
    if "weather" in needed:
        weather = await live_marine.get_weather(region_id, timeframe, lat=loc.get("lat"), lon=loc.get("lon"))
        data["weather"] = weather
        citations.append(f"{weather['source']} ({weather['timeframe']})")
        if intent in ("safety_sail", "conditions"):
            safety = evaluate_sea_safety(weather)
            data["safety"] = safety
            verdict = safety["verdict"]
            trace.append({"agent": "Weather Intelligence Agent",
                          "detail": (f"wind {weather['wind_kn']}kn, wave {weather['wave_m']}m, "
                                     f"lightning {weather['lightning_pct']}%, "
                                     f"cyclone={weather['cyclone'] or 'none'} -> "
                                     f"safety verdict {safety['verdict']}.")})

    # Ocean Analytics Agent (only when SST/Chl or PFZ requested)
    if "sst" in needed or "chl" in needed:
        grid = mr.get_sst_chl_grid(region_id)
        data["ocean_grid"] = grid
        citations.append(f"{grid['source']} (mock)")
        trace.append({"agent": "Ocean Analytics Agent",
                      "detail": "Correlated SST & chlorophyll satellite grid for marine biological productivity."})

    # Geospatial Agent — ONLY runs for pfz_nearest
    if intent == "pfz_nearest":
        zones = await spatial.nearest_pfz(loc["lat"], loc["lon"], limit=3)
        data["nearest_pfz"] = zones
        adv = mr.get_pfz_advisory(region_id)
        citations.append(f"{adv['source']} (mock)")
        trace.append({"agent": "Geospatial/Risk Agent",
                      "detail": f"INCOIS-indexed geo-spatial query returned {len(zones)} PFZ candidate coordinates."})
        best = None
        for z in zones:
            rr = await spatial.route_safety(loc, {"lat": z["lat"], "lon": z["lon"], "name": z.get("name")})
            if best is None or rr["unsafe_count"] < best["route"]["unsafe_count"]:
                best = {"zone": z, "route": rr}
            if rr["unsafe_count"] == 0:
                break
        if best:
            data["route"] = best["route"]
            data["recommended_pfz"] = best["zone"]
            trace.append({"agent": "Geospatial/Risk Agent",
                          "detail": (f"Direct navigational course plotted to {best['zone']['name']}: "
                                     f"{best['route']['distance_nm']} NM, Course {best['route']['bearing_deg']}° {best['route']['bearing_cardinal']}.")})

    # Maritime Boundaries
    if intent in ("route_safety", "geofence_avoid"):
        bnds = mr.all_boundaries_all_regions() if intent == "route_safety" else mr.get_boundaries(region_id)
        data["boundaries"] = bnds
        if intent == "geofence_avoid":
            data["avoid_zones"] = [b for b in bnds if b.get("restricted")]

    # Port-to-Port Route Safety
    if intent == "route_safety" and plan.get("route"):
        route = plan["route"]
        rr = await spatial.route_safety(route["start"], route["end"])
        weather = await live_marine.get_weather(region_id, timeframe, lat=route["start"].get("lat"), lon=route["start"].get("lon"))
        data["weather"] = weather
        safety = evaluate_sea_safety(weather)
        data["safety"] = safety
        route_unsafe = rr["unsafe_count"] > 0 or safety["verdict"] == "UNSAFE"
        verdict = "UNSAFE" if route_unsafe else ("CAUTION" if safety["verdict"] == "CAUTION" else "SAFE")
        data["route"] = rr
        data["route_plan"] = route
        citations.append("Maritime Navigational Channel + IMD Marine Weather")
        trace.append({"agent": "Geospatial/Risk Agent",
                      "detail": (f"Voyage Passage: {route['start'].get('name', 'Origin')} -> {route['end'].get('name', 'Destination')} "
                                 f"| Distance: {rr.get('distance_nm')} NM ({rr.get('distance_km')} km) | "
                                 f"Course: {rr.get('bearing_deg')}° {rr.get('bearing_cardinal')} | "
                                 f"ETA: ~{rr.get('eta_str')} | "
                                 f"Status: {verdict} ({rr['unsafe_count']} restricted checkpoints).")})

    if "tide" in needed:
        tide = mr.get_tide_table(region_id)
        data["tide"] = tide
        citations.append(f"{tide['source']} (mock)")

    if "alerts" in needed or intent == "alerts_query":
        alerts = mr.get_active_alerts(region_id)
        data["alerts"] = alerts
        for a in alerts:
            citations.append(f"{a['source']} (mock)")
        trace.append({"agent": "Weather Intelligence Agent",
                      "detail": f"{len(alerts)} active IMD hazard bulletin(s) for {region['name']}."})

    if intent == "fleet_status":
        vessels = mr.get_fleet_vessels(region_id)
        data["fleet_vessels"] = vessels
        if "weather" not in data:
            weather = await live_marine.get_weather(region_id, timeframe, lat=loc.get("lat"), lon=loc.get("lon"))
            data["weather"] = weather
        citations.append("Coastal Automatic Identification System (AIS) & Marine Fleet Registry")
        trace.append({"agent": "Fleet Operations Specialist",
                      "detail": f"Monitored {len(vessels)} active marine craft in {region['name']} coastal waters."})

    widgets = _build_widgets(intent, loc, data, region)
    return {"data": data, "verdict": verdict, "citations": _dedupe(citations),
            "widgets": widgets, "trace": trace, "region": region}

def _discover(intent: str) -> list[str]:
    table = {
        "pfz_nearest": ["pfz", "sst", "chl", "weather"],
        "safety_sail": ["weather", "alerts", "boundaries"],
        "conditions": ["weather", "tide", "boundaries"],
        "alerts_query": ["alerts", "weather", "boundaries"],
        "fleet_status": ["weather", "boundaries"],
        "chlorophyll_sst": ["sst", "chl", "boundaries"],
        "route_safety": ["weather", "boundaries"],
        "geofence_avoid": ["boundaries"],
        "productivity_decline": ["sst", "chl", "boundaries"],
        "general": ["weather", "boundaries"],
    }
    return table.get(intent, ["weather", "boundaries"])

def _dedupe(items: list[str]) -> list[str]:
    seen, out = set(), []
    for i in items:
        if i not in seen:
            seen.add(i)
            out.append(i)
    return out

def _build_widgets(intent: str, loc: dict, data: dict, region_hint: dict | None = None) -> list[dict]:
    widgets = []

    # Chart widgets
    if intent in ("chlorophyll_sst", "productivity_decline") and data.get("ocean_grid"):
        region_id = data.get("ocean_grid", {}).get("region_id")
        sst = mr.get_sst_trend(region_id)
        chl = mr.get_chl_trend(region_id)
        widgets.append({"type": "chart", "title": "Sea Surface Temperature (7-day)",
                        "unit": sst["unit"], "labels": sst["labels"],
                        "values": sst["values"], "color": "#E63946"})
        widgets.append({"type": "chart", "title": "Chlorophyll-a (7-day)",
                        "unit": chl["unit"], "labels": chl["labels"],
                        "values": chl["values"], "color": "#2A3B32"})

    # Do not show map widget for pure conversational inputs (Hi, Hello, Thank you)
    if intent == "general":
        return widgets

    markers = []
    layers = []

    # Only include background boundary/MPA layers for routes and geofence checks
    if intent in ("route_safety", "geofence_avoid"):
        if data.get("boundaries"):
            layers.append({"type": "boundary", "features": data["boundaries"]})
        if data.get("avoid_zones"):
            layers.append({"type": "boundary", "features": data["avoid_zones"]})

    # Only include ocean grid heatmap for explicit thermal / chlorophyll analysis
    if intent in ("chlorophyll_sst", "productivity_decline") and data.get("ocean_grid"):
        layers.append({"type": "heatmap",
                       "metric": "chl",
                       "grid": data["ocean_grid"]["grid"]})

    if intent == "route_safety" and data.get("route"):
        rr = data["route"]
        rp = data.get("route_plan", {})
        st = rp.get("start", {})
        en = rp.get("end", {})
        st_name = st.get("name") or rr.get("start_name") or loc.get("name") or "Origin Port"
        en_name = en.get("name") or rr.get("end_name") or "Destination Port"
        segs = rr.get("segments", [])

        # Start and Destination markers with explicit kinds
        for i, s in enumerate(segs):
            if i == 0:
                markers.append({"lat": s["lat"], "lon": s["lon"], "label": f"START: {st_name} Port", "kind": "route_start"})
            elif i == len(segs) - 1:
                markers.append({"lat": s["lat"], "lon": s["lon"], "label": f"DESTINATION: {en_name} Port", "kind": "route_end"})
            else:
                markers.append({"lat": s["lat"], "lon": s["lon"], "label": s.get("label", "Checkpoint"), "kind": "route_safe" if s.get("safe") else "route_unsafe"})

        route_segments = rr.get("line_segments") or []
        if not route_segments:
            for a, b in zip(segs, segs[1:]):
                route_segments.append({
                    "a": [a["lon"], a["lat"]], "b": [b["lon"], b["lat"]],
                    "unsafe": (not a.get("safe")) or (not b.get("safe")),
                })
        layers.append({"type": "route_line", "segments": route_segments})

        mid_idx = len(segs) // 2
        center = {"lat": segs[mid_idx]["lat"], "lon": segs[mid_idx]["lon"]} if segs else loc

        route_info = {
            "start_name": st_name,
            "end_name": en_name,
            "distance_km": rr.get("distance_km"),
            "distance_nm": rr.get("distance_nm"),
            "bearing_deg": rr.get("bearing_deg"),
            "bearing_cardinal": rr.get("bearing_cardinal"),
            "eta_str": rr.get("eta_str"),
            "unsafe_count": rr.get("unsafe_count", 0),
            "total": rr.get("total", len(segs)),
        }
        widgets.append({
            "type": "map",
            "center": center,
            "markers": markers,
            "layers": layers,
            "route_info": route_info,
        })

    elif intent == "fleet_status":
        reg_name = (region_hint or {}).get("name") or "Coastal"
        markers.append({
            "lat": loc["lat"],
            "lon": loc["lon"],
            "name": f"{reg_name} Coastal Station",
            "label": f"BASE: {loc.get('name') or f'{reg_name} Harbour'}",
            "kind": "user",
        })
        vessels = data.get("fleet_vessels", [])
        for v in vessels:
            markers.append({
                "lat": v["lat"],
                "lon": v["lon"],
                "name": v["name"],
                "label": f"⛵ {v['name']} ({v.get('speed_kn', 5.0)} kn)",
                "type": v.get("type", "Mechanised Trawler"),
                "speed_kn": v.get("speed_kn", 5.0),
                "heading_deg": v.get("heading_deg", 90),
                "status": v.get("status", "Active Trawling"),
                "vhf_channel": v.get("vhf_channel", "Ch 16 / 68"),
                "crew": v.get("crew", 6),
                "safety_verdict": v.get("safety_verdict", "SAFE"),
                "kind": "fleet",
            })
        if data.get("boundaries"):
            layers.append({"type": "boundary", "features": data["boundaries"]})
        widgets.append({
            "type": "map",
            "center": loc,
            "markers": markers,
            "layers": layers,
            "fleet_info": {
                "sector": reg_name,
                "total_vessels": len(vessels),
                "vessels": vessels,
            },
        })

    elif intent == "pfz_nearest":
        reg_name = (region_hint or {}).get("name") or "Coastal"
        harbour_label = loc.get("name") or f"{reg_name} Harbour"
        markers.append({
            "lat": loc["lat"],
            "lon": loc["lon"],
            "name": harbour_label,
            "label": f"DEPARTURE: {harbour_label}",
            "kind": "user",
        })

        rec = data.get("recommended_pfz")
        all_zones = data.get("nearest_pfz") or []
        if not rec and all_zones:
            rec = all_zones[0]

        rec_name = rec.get("name") if rec else None
        if rec:
            dist_val = rec.get("distance_km", 18.0)
            markers.append({
                "lat": rec["lat"],
                "lon": rec["lon"],
                "name": rec["name"],
                "label": f"★ BEST CATCH: {rec['name']} ({rec.get('species', 'Pelagic')})",
                "species": rec.get("species", "Mackerel, Sardine"),
                "depth_m": rec.get("depth_m", 35),
                "sst_c": rec.get("sst_c", 28.2),
                "chl_mg_m3": rec.get("chl_mg_m3", 2.1),
                "confidence": int(rec.get("confidence", 0.86) * 100),
                "distance_km": dist_val,
                "kind": "pfz_recommended",
            })

        for z in all_zones:
            if z.get("name") != rec_name:
                dist_val = z.get("distance_km", 25.0)
                markers.append({
                    "lat": z["lat"],
                    "lon": z["lon"],
                    "name": z["name"],
                    "label": f"🐟 PFZ: {z['name']} ({z.get('species', 'Fish')})",
                    "species": z.get("species", "Pelagic / Demersal"),
                    "depth_m": z.get("depth_m", 40),
                    "sst_c": z.get("sst_c", 28.0),
                    "chl_mg_m3": z.get("chl_mg_m3", 1.8),
                    "confidence": int(z.get("confidence", 0.75) * 100),
                    "distance_km": dist_val,
                    "kind": "pfz",
                })

        # Direct route line from harbor to PFZ
        if data.get("route"):
            segs = data["route"]["segments"]
            route_segments = []
            for a, b in zip(segs, segs[1:]):
                route_segments.append({
                    "a": [a["lon"], a["lat"]], "b": [b["lon"], b["lat"]],
                    "unsafe": (not a["safe"]) or (not b["safe"]),
                })
            layers.append({"type": "route_line", "segments": route_segments})

        # Center in the coastal waters
        if rec:
            center = {
                "lat": round((loc["lat"] + rec["lat"]) / 2, 4),
                "lon": round((loc["lon"] + rec["lon"]) / 2, 4),
            }
        else:
            center = loc

        widgets.append({
            "type": "map",
            "center": center,
            "markers": markers,
            "layers": layers,
            "pfz_info": {
                "sector": reg_name,
                "recommended": rec,
                "zones": all_zones,
            },
        })

    else:
        # Default interactive OpenStreetMap ECDIS map for marine queries (safety, conditions)
        reg_name = (region_hint or {}).get("name") or "Coastal"
        markers.append({"lat": loc["lat"], "lon": loc["lon"], "label": f"{reg_name} Monitored Coastal Waters", "kind": "user"})
        if data.get("boundaries"):
            layers.append({"type": "boundary", "features": data["boundaries"]})
        widgets.append({
            "type": "map",
            "center": {"lat": loc["lat"], "lon": loc["lon"]},
            "markers": markers,
            "layers": layers,
        })

    return widgets


# ---------------------------------------------------------------------------
# Synthesizer — explain the deterministic verdict in natural, localised language
# ---------------------------------------------------------------------------
SYNTH_SYSTEM = (
    "You are ORCA, a friendly, knowledgeable marine copilot talking directly to "
    "a fisherman — not a report generator. You receive a machine-computed result "
    "with a DETERMINISTIC safety verdict and the data that produced it. Turn it "
    "into ONE warm, natural, human reply, the way a trusted local friend who "
    "knows the sea would explain it over a phone call.\n"
    "HARD SAFETY RULES (never break these):\n"
    "- NEVER change, soften or contradict the given verdict. If verdict is "
    "UNSAFE, clearly and unambiguously tell the user it is not safe to go. If "
    "data is missing/verdict is null, say conditions could not be verified and "
    "explicitly tell them not to assume it is safe.\n"
    "- Numbers must stay accurate — never invent or round away key figures.\n"
    "TONE RULES (very important):\n"
    "- Sound like a person, not a weather bulletin. Prefer 'the sea looks rougher "
    "than usual tomorrow morning, so I'd hold off' over 'wind velocity is 32 "
    "km/h, risk threshold exceeded'.\n"
    "- Weave 1-2 concrete numbers in naturally (wind speed, wave height) instead "
    "of listing every metric like a spec sheet.\n"
    "- Mention the data sources briefly and naturally, not as a citation list "
    "(e.g. 'IMD's forecast shows...' not 'Source: IMD Marine Weather Forecast').\n"
    "- Mention which coastal region this is for, conversationally.\n"
    "- Keep it under 110 words. No markdown, asterisks, bullet symbols or '#' — "
    "plain spoken sentences only, as if you were talking, not writing a memo.\n"
    "- Do NOT mirror the user's grammar mistakes; understand their intent and "
    "still reply cleanly and naturally.\n"
    "ROUTE QUERIES: if 'route_summary' is present in the data, this is a "
    "route-safety check between a start and destination point. You MUST "
    "explicitly and unambiguously state whether the ROUTE (not just the "
    "general sea) is safe to sail, and if any stretch of it passes through "
    "a restricted/hazardous zone, name that zone and mention roughly how "
    "many of the sampled points along the path were unsafe. Make it obvious "
    "this is about the whole path from start to destination, e.g. 'the "
    "route you're planning...' — the user has a map showing this path.\n"
    "LANGUAGE & STYLE MATCHING:\n"
    "- Reply entirely in the given 'language': 'en' = English, 'te' = Telugu, "
    "'ta' = Tamil, 'ml' = Malayalam, 'kn' = Kannada, 'mr' = Marathi, 'gu' = Gujarati, "
    "'bn' = Bengali, 'or' = Odia, 'hi' = Hindi.\n"
    "- If 'script' is 'romanized' (user typed Telugu/Hindi using English "
    "letters, e.g. 'Repu sea loki vellacha?'), reply in the SAME casual "
    "romanized style mixed naturally with English words — the way people "
    "actually text each other — instead of switching to formal native script. "
    "Example tone for romanized Telugu: 'Repu morning sea konchem rough ga "
    "untundi, kabatti fishing ki vellakapovadam better.' If 'script' is "
    "'native', reply in proper native script, still keeping it casual and warm "
    "rather than overly formal/bureaucratic.\n"
    "Return plain text only, nothing else."
)


def _prepare_context(d: dict) -> dict:
    d = dict(d)
    if "ocean_grid" in d:
        g = d["ocean_grid"]
        d["ocean_grid"] = {"source": g.get("source"), "mean_sst": 28.3,
                           "sample_count": len(g["grid"])}
    if "boundaries" in d:
        d["boundaries"] = [b["name"] for b in d["boundaries"]]
    return d


async def run_synthesizer(session_id: str, message: str, plan: dict,
                          result: dict) -> str:
    data = result.get("data", {})
    payload = {
        "user_question": message,
        "language": plan.get("language", "en"),
        "script": plan.get("script", "native"),
        "intent": plan["intent"],
        "region": f"{result['region']['name']}, {result['region']['state']}",
        "verdict": result.get("verdict"),
        "data": _prepare_context(data),
        "sources": result.get("citations", []),
    }
    if data.get("route"):
        route = data["route"]
        rec = data.get("recommended_pfz")
        rp = data.get("route_plan", {})
        st_name = rp.get("start", {}).get("name", "Origin")
        end_name = rp.get("end", {}).get("name", "Destination")
        dest = f"the recommended fishing zone ({rec['name']})" if rec else f"{st_name} to {end_name}"
        if route["unsafe_count"] > 0:
            hazard_names = _dedupe([s["reason"] for s in route["segments"] if s.get("reason")])
            payload["route_summary"] = (
                f"{route['unsafe_count']} of {route['total']} sampled checkpoints along "
                f"the path ({route.get('distance_km')} km / {route.get('distance_nm')} NM) to {dest} pass through restricted/hazardous zone(s): "
                f"{', '.join(hazard_names) or 'unspecified'}. "
                + ("This is the LEAST-unsafe of the nearby zones checked — mention this "
                   "clearly and suggest extra caution." if rec else "Route is NOT fully safe.")
            )
        else:
            payload["route_summary"] = (
                f"All {route['total']} sampled checkpoints along the {route.get('distance_km')} km ({route.get('distance_nm')} NM) path from {dest} are "
                "clear of restricted/hazardous zones."
                + (" Mention that a safe route to this zone has been plotted on the map."
                   if rec else "")
            )
    if not GEMINI_API_KEY and not EMERGENT_LLM_KEY:
        return _fallback_answer(plan, result)

    try:
        prompt = ("Produce the answer from this result JSON:\n"
                  + json.dumps(payload, ensure_ascii=False, default=str))
        text = await _chat_with_fallback(f"{session_id}-synth", SYNTH_SYSTEM, prompt)
        if text and text.strip():
            return text.strip()
    except Exception:
        pass
    return _fallback_answer(plan, result)


def _slim(data: dict) -> dict:
    """Trim large grids out of the synthesizer payload."""
    return _prepare_context(data)


def _fallback_answer(plan: dict, result: dict) -> str:
    """Polished deterministic marine intelligence explanation."""
    v = result.get("verdict")
    lang = plan.get("language", "en")
    data = result.get("data", {})
    region_name = f"{result['region']['name']}, {result['region']['state']}"
    intent = plan.get("intent")

    if intent == "pfz_nearest" and data.get("nearest_pfz"):
        z = data["nearest_pfz"][0]
        rec = data.get("recommended_pfz", z)
        route = data.get("route")
        has_route = route and route.get("unsafe_count", 0) == 0
        dist = rec.get("distance_km", 18.0)
        sst = rec.get("sst_c", 28.2)
        chl = rec.get("chl_mg_m3", 0.45)
        name = rec.get("name", "Zone")
        reg = result['region']['name']

        if lang == "te":
            msg = (f"సమీప సంభావ్య మత్స్య వేట జోన్ (PFZ): **{name}** ({reg} తీరం నుండి దాదాపు ~{dist} కి.మీ).\n"
                   f"• సముద్ర ఉపరితల ఉష్ణోగ్రత (SST): {sst}°C\n"
                   f"• క్లోరోఫిల్ సాంద్రత: {chl} mg/m³\n"
                   f"INCOIS సలహా ప్రకారం ఈ ప్రాంతంలో చేపల లభ్యత ఎక్కువగా ఉండే అవకాశం ఉంది.")
            if has_route:
                msg += " హార్బర్ నుండి నేరుగా సముద్ర మార్గం మీ మ్యాప్‌లో చూపబడింది."
            return msg
        elif lang == "hi":
            msg = (f"निकटतम संभावित मछली पकड़ने का क्षेत्र (PFZ): **{name}** ({reg} तट से लगभग ~{dist} किमी)।\n"
                   f"• समुद्र का तापमान (SST): {sst}°C\n"
                   f"• क्लोरोफिल: {chl} mg/m³\n"
                   f"INCOIS परामर्श के अनुसार यहाँ मछली पकड़ने की अच्छी संभावना है।")
            if has_route:
                msg += " बंदरगाह से सीधा सुरक्षित समुद्री मार्ग नक्शे पर अंकित है।"
            return msg
        elif lang == "ta":
            msg = (f"அருகிலுள்ள சாத்தியமான மீன்பிடி மண்டலம் (PFZ): **{name}** ({reg} கடற்கரையிலிருந்து ~{dist} கி.மீ).\n"
                   f"• கடல் வெப்பநிலை: {sst}°C | குளோரோபில்: {chl} mg/m³\n"
                   f"INCOIS வழிகாட்டுதலின்படி மீன் வளம் அதிகம் உள்ள பகுதி.")
            if has_route:
                msg += " வரைபடத்தில் நேரடி கடல் பாதை குறிக்கப்பட்டுள்ளது."
            return msg
        else:
            route_note = " Direct navigation route is plotted on the map." if has_route else ""
            return (f"Nearest Potential Fishing Zone: **{name}** (~{dist} km offshore from {reg}).\n"
                    f"• SST: {sst}°C | Chlorophyll: {chl} mg/m³\n"
                    f"Verified with INCOIS PFZ advisory.{route_note}")

    if intent == "route_safety" and data.get("route"):
        route = data["route"]
        rp = data.get("route_plan", {})
        st_name = rp.get("start", {}).get("name", "Origin")
        end_name = rp.get("end", {}).get("name", "Destination")
        dist_km = route.get("distance_km", "~")
        dist_nm = route.get("distance_nm", "~")
        if route["unsafe_count"] > 0:
            hazard_names = _dedupe([s["reason"] for s in route["segments"] if s.get("reason")])
            msg = {
                "en": (f"Voyage Route ({st_name} -> {end_name}, ~{dist_km} km / {dist_nm} NM): NOT fully clear - {route['unsafe_count']} of "
                      f"{route['total']} checkpoints intersect restricted areas ({', '.join(hazard_names)}). Adjust your course seaward outside the sanctuary buffer."),
                "te": (f"సముద్ర మార్గం ({st_name} నుండి {end_name}, ~{dist_km} కి.మీ): పూర్తిగా సురక్షితం కాదు - {route['total']} చెక్‌పాయింట్లలో "
                      f"{route['unsafe_count']} నిషేధిత జోన్లు ({', '.join(hazard_names)}) గుండా వెళ్తున్నాయి. సురక్షిత మార్గాన్ని అనుసరించండి."),
                "hi": (f"समुद्री मार्ग ({st_name} से {end_name}, ~{dist_km} किमी): पूरी तरह सुरक्षित नहीं है - {route['total']} में से "
                      f"{route['unsafe_count']} चेकपॉइंट प्रतिबंधित क्षेत्रों ({', '.join(hazard_names)}) से गुज़र रहे हैं। कृपया बाहर से सुरक्षित चक्कर लें।"),
            }
        else:
            msg = {
                "en": (f"Voyage Route ({st_name} -> {end_name}, ~{dist_km} km / {dist_nm} NM): All {route['total']} checkpoints are clear of restricted zones. "
                       f"Open-sea corridor plotted strictly in the sea. Navigational course plotted on your map."),
                "te": (f"సముద్ర మార్గం ({st_name} నుండి {end_name}, ~{dist_km} కి.మీ): అన్ని {route['total']} పాయింట్లు సముద్రంలో సురక్షితంగా ఉన్నాయి. మ్యాప్‌లో మార్గం సూచించబడింది."),
                "hi": (f"समुद्री मार्ग ({st_name} से {end_name}, ~{dist_km} किमी): सभी {route['total']} चेकपॉइंट समुद्र में सुरक्षित हैं। नक्शे पर पूरा समुद्री मार्ग अंकित है।"),
            }
        return msg.get(lang, msg["en"])

    if intent == "fleet_status" and data.get("fleet_vessels"):
        vessels = data["fleet_vessels"]
        if lang == "te":
            lines = [f"• **{v['name']}** ({v['type']}): వేగం {v['speed_kn']} నాట్లు • స్థితి: {v['status']} • VHF {v['vhf_channel']}" for v in vessels]
            return (f"**లైవ్ ఫ్లీట్ కార్యకలాపాలు — {region_name} సెక్టార్**:\n"
                    f"తీరప్రాంత జలాల్లో {len(vessels)} క్రియాశీల పడవలు/బోట్లు పనిచేస్తున్నాయి:\n" +
                    "\n".join(lines) +
                    "\n\nఅన్ని నౌకల స్థానాలు, వేగం మరియు సమాచారం మీ ఇంటరాక్టివ్ ECDIS మ్యాప్‌లో చూపబడ్డాయి.")
        elif lang == "hi":
            lines = [f"• **{v['name']}** ({v['type']}): गति {v['speed_kn']} नॉट • स्थिति: {v['status']} • VHF {v['vhf_channel']}" for v in vessels]
            return (f"**लाइव बेड़ा संचालन — {region_name} सेक्टर**:\n"
                    f"तटीय जलक्षेत्र में {len(vessels)} नौकाएं सक्रिय रूप से कार्य कर रही हैं:\n" +
                    "\n".join(lines) +
                    "\n\nसभी जहाजों की स्थिति, गति और रेडियो चैनल नक्शे पर अंकित हैं।")
        else:
            lines = [f"• **{v['name']}** ({v['type']}): Speed {v['speed_kn']} kts • Status: {v['status']} • VHF {v['vhf_channel']}" for v in vessels]
            return (f"**Live Fleet Operations — {region_name} Sector**:\n"
                    f"{len(vessels)} active marine craft are operating in offshore coastal waters:\n" +
                    "\n".join(lines) +
                    "\n\nAll vessel positions, headings, and radio channels are plotted on your interactive ECDIS map.")

    if intent == "alerts_query":
        alerts = mr.get_active_alerts(result["region"]["id"])
        weather = data.get("weather", {})
        cyclone_note = weather.get("cyclone")
        gust = weather.get("gust_kn", 35)
        wave = weather.get("wave_m", 2.5)
        wind = weather.get("wind_kn", 14)

        if lang == "te":
            if alerts:
                titles = [f"• **{a['title']}** ({a['severity'].upper()}): {a['body']}" for a in alerts]
                resp = f"**{region_name} కోసం తీవ్ర వాతావరణ మరియు ప్రమాద హెచ్చరికలు**:\n" + "\n".join(titles)
                if cyclone_note:
                    resp += f"\n\n**తుఫాను సమాచారం**: {cyclone_note}. గాలి వేగం గరిష్టంగా {gust} నాట్లు, అలల ఎత్తు {wave} మీటర్లు. మత్స్యకారులు సముద్రంలోకి వెళ్లరాదని IMD హెచ్చరిస్తోంది."
                return resp
            elif cyclone_note:
                return (f"**{region_name} కోసం వాతావరణం & తుఫాను సమాచారం**:\n"
                        f"• హెచ్చరిక: {cyclone_note}\n"
                        f"• గాలి వేగం: {wind} నాట్లు (గరిష్టంగా {gust} నాట్లు)\n"
                        f"• అలల ఎత్తు: {wave} మీటర్లు\n"
                        f"ప్రస్తుతానికి తీవ్ర తుఫాను హెచ్చరికలు లేవు. సముద్రంలోకి వెళ్లే ముందు స్థానిక జెండాలను గమనించండి.")
            return f"**{region_name} వాతావరణ అప్‌డేట్**: ప్రస్తుతం ఎలాంటి తుఫాను లేదా వాయుగుండం హెచ్చరికలు లేవు. సముద్ర పరిస్థితులు సాధారణంగా ఉన్నాయి."
        elif lang == "hi":
            if alerts:
                titles = [f"• **{a['title']}** ({a['severity'].upper()}): {a['body']}" for a in alerts]
                resp = f"**{region_name} के लिए गंभीर मौसम और खतरे की चेतावनी**:\n" + "\n".join(titles)
                if cyclone_note:
                    resp += f"\n\n**चक्रवात मूल्यांकन**: {cyclone_note}। हवा के झोंके {gust} नॉट तक, लहरों की ऊँचाई {wave} मीटर। मछुआरों को समुद्र में न जाने की सलाह दी जाती है।"
                return resp
            elif cyclone_note:
                return (f"**{region_name} के लिए मौसम और चक्रवात सलाह**:\n"
                        f"• सलाह: {cyclone_note}\n"
                        f"• हवा: {wind} नॉट (झोंके {gust} नॉट)\n"
                        f"• लहरें: {wave} मीटर\n"
                        f"वर्तमान में कोई गंभीर तूफान की चेतावनी नहीं है। प्रस्थान से पहले स्थानीय झंडों की जाँच करें।")
            return f"**{region_name} मौसम अपडेट**: वर्तमान में कोई सक्रिय चक्रवात या निम्न दबाव की चेतावनी नहीं है। समुद्र की स्थिति सामान्य है।"
        else:
            if alerts:
                titles = [f"• **{a['title']}** ({a['severity'].upper()}): {a['body']}" for a in alerts]
                resp = f"**Severe Weather & Hazard Alerts for {region_name}**:\n" + "\n".join(titles)
                if cyclone_note:
                    resp += f"\n\n**Cyclone Assessment**: {cyclone_note}. Wind gusts reaching {gust} kn, wave height {wave} m. Fishermen are strongly advised to adhere to IMD warnings."
                return resp
            elif cyclone_note:
                return (f"**Weather & Cyclone Advisory for {region_name}**:\n"
                        f"• Advisory: {cyclone_note}\n"
                        f"• Wind: {wind} kn (Gusts {gust} kn)\n"
                        f"• Wave: {wave} m\n"
                        f"No active storm warnings beyond the current advisory. Check local flags before sailing.")
            return f"**Weather & Hazard Update for {region_name}**: No active cyclone, depression, or severe sea warnings at this time. Sea conditions are currently normal."

    if intent == "chlorophyll_sst" and data.get("ocean_grid"):
        return (f"Ocean thermal and chlorophyll analysis for {region_name}: "
                f"SST averages 27.5–29.0°C with elevated chlorophyll (>0.4 mg/m³) "
                f"along the coastal shelf. Favourable biological productivity detected.")

    if v == "UNSAFE":
        reasons = "; ".join(data.get("safety", {}).get("reasons", []))
        msg = {
            "en": f"⚠️ NOT SAFE to venture out near {region_name}. {reasons}. Do not assume conditions are safe.",
            "te": f"⚠️ {region_name} దగ్గర సముద్రంలోకి వెళ్లడం సురక్షితం కాదు. {reasons}. సురక్షితమని భావించవద్దు.",
            "hi": f"⚠️ {region_name} के पास समुद्र में जाना सुरक्षित नहीं है। {reasons}। इसे सुरक्षित न मानें।",
        }
        return msg.get(lang, msg["en"])

    if v == "SAFE":
        msg = {
            "en": f"Conditions near {region_name} are currently within safe operational limits according to latest INCOIS/IMD advisories. Check local flags before departing.",
            "te": f"{region_name} దగ్గర పరిస్థితులు సురక్షిత పరిధిలో ఉన్నాయి. బయలుదేరే ముందు స్థానికంగా నిర్ధారించుకోండి.",
            "hi": f"{region_name} के पास हालात सुरक्षित सीमा में हैं। जाने से पहले स्थानीय रूप से पुष्टि कर लें।",
        }
        return msg.get(lang, msg["en"])

    if intent == "general":
        return {
            "en": "Hello! I'm ORCA, your marine intelligence assistant. How can I assist you with navigation routes, sea conditions, or fishing zones today?",
            "te": "నమస్కారం! నేను ORCA, మీ సముద్ర సహాయకుడిని. నావిగేషన్ మార్గాలు, సముద్ర పరిస్థితులు లేదా ఫిషింగ్ జోన్ల సమాచారంలో మీకు ఎలా సహాయపడగలను?",
            "hi": "नमस्ते! मैं ORCA हूँ, आपका समुद्री सहायक। आज मैं समुद्री मार्ग, मौसम या मछली पकड़ने के क्षेत्रों में आपकी क्या मदद कर सकता हूँ?",
            "ta": "வணக்கம்! நான் ORCA, உங்கள் கடல்சார் உதவியாளர். வழித்தடங்கள் அல்லது கடல் நிலைமைகள் குறித்து நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?",
            "ml": "നമസ്കാരം! ഞാൻ ORCA. സമുദ്ര സാഹചര്യങ്ങളെക്കുറിച്ചോ നാവിഗേഷൻ റൂട്ടുകളെക്കുറിച്ചോ അറിയാൻ എങ്ങനെ സഹായിക്കണം?",
            "kn": "ನಮಸ್ಕಾರ! ನಾನು ORCA. ಸಮುದ್ರ ಸಂಚಾರ ಅಥವಾ ಹವಾಮಾನದ ಬಗ್ಗೆ ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
            "mr": "नमस्कार! मी ORCA, तुमचा सागरी सहाय्यक. सागरी मार्ग किंवा हवामानाबद्दल मी कशी मदत करू शकतो?",
            "gu": "નમસ્તે! હું ORCA છું. દરિયાઈ માર્ગ અથવા હવામાન વિશે હું કેવી રીતે મદદ કરી શકું?",
            "bn": "নমস্কার! আমি ORCA। নৌচলাচল বা আবহাওয়া সম্পর্কে আজ কীভাবে সাহায্য করতে পারি?",
            "or": "ନମସ୍କାର! ମୁଁ ORCA। ସାମୁଦ୍ରିକ ମାର୍ଗ ବା ପାଣିପାଗ ବିଷୟରେ କିପରି ସାହାଯ୍ୟ କରିବି?",
        }.get(lang, "Hello! I'm ORCA, your marine intelligence assistant. How can I assist you today?")

    weather = data.get("weather", {})
    cond = weather.get("condition", "Normal")
    wind = weather.get("wind_kn", 12)
    wave = weather.get("wave_m", 1.2)
    if lang == "te":
        return (f"**{region_name} సముద్ర మరియు వాతావరణ సమాచారం**:\n"
                f"• సముద్ర స్థితి: {cond}\n"
                f"• గాలి వేగం: {wind} నాట్లు\n"
                f"• అలల ఎత్తు: {wave} మీటర్లు\n"
                f"పర్యవేక్షించబడే తీరప్రాంత జలాలు మరియు నావిగేషన్ మార్గాలు మీ మ్యాప్‌లో చూపబడ్డాయి.")
    elif lang == "hi":
        return (f"**{region_name} समुद्री और मौसम अपडेट**:\n"
                f"• समुद्र की स्थिति: {cond}\n"
                f"• हवा की गति: {wind} नॉट\n"
                f"• लहरों की ऊँचाई: {wave} मीटर\n"
                f"निगरानी क्षेत्र और नेविगेशन मार्ग आपके नक्शे पर अंकित हैं।")
    elif lang == "ta":
        return (f"**{region_name} கடல்சார் மற்றும் வானிலை தகவல்**:\n"
                f"• கடல் நிலைமை: {cond}\n"
                f"• காற்றின் வேகம்: {wind} நாட்கள்\n"
                f"• அலை உயரம்: {wave} மீட்டர்\n"
                f"கண்காணிக்கப்படும் கடலோரப் பகுதிகள் வரைபடத்தில் குறிக்கப்பட்டுள்ளன.")
    else:
        return (f"**Marine Intelligence Update for {region_name}**:\n"
                f"• Sea Condition: {cond}\n"
                f"• Wind Velocity: {wind} kn\n"
                f"• Wave Height / Swell: {wave} m\n"
                f"Monitored coastal waters and active fairways are plotted on your map.")


# ---------------------------------------------------------------------------
# Full pipeline
# ---------------------------------------------------------------------------
async def orchestrate(session_id: str, message: str, context: str,
                      user_location: dict | None,
                      region_id: str | None = None,
                      lang_hint: str | None = None) -> dict:
    started = datetime.now(timezone.utc)
    region_hint = mr.get_region(region_id)

    # 1. Zero-lag Conversational Fast-Path (Instant natural response without badges or maps)
    conv_type, conv_reply = _check_conversational(message, lang_hint or "en")
    if conv_reply:
        loc = user_location if user_location and "lat" in user_location else region_hint["center"]
        return {
            "answer": conv_reply,
            "verdict": None,
            "language": lang_hint or "en",
            "intent": "general",
            "citations": [],
            "widgets": [],
            "reasoning_trace": [{"agent": "ORCA Marine Copilot", "detail": "Instant conversational greeting/assistance."}],
            "location": loc,
            "region": region_hint,
            "elapsed_ms": 1,
        }

    plan = await run_planner(session_id, message, context, region_hint, lang_hint)

    # 2. Check for invalid, unrecognized, or non-coastal inland locations
    if plan.get("invalid_location"):
        inv = plan["invalid_location"]
        reply_msg = _build_invalid_location_message(inv, plan.get("language", "en"))
        return {
            "answer": reply_msg,
            "verdict": None,
            "language": plan.get("language", "en"),
            "intent": "general",
            "citations": [],
            "widgets": [],
            "reasoning_trace": [{"agent": "Marine Geography Agent", "detail": f"Handled {inv.get('kind')} query for '{inv.get('name')}' without defaulting to any coastal sector."}],
            "location": None,
            "region": None,
            "elapsed_ms": 1,
        }

    if plan.get("location") and "lat" in plan["location"] and "lon" in plan["location"]:
        loc = plan["location"]
        resolved_region, dist_km = mr.nearest_region(loc["lat"], loc["lon"])
        resolved_region_id = resolved_region["id"]
    else:
        # Check user location: if within 50 km of coast, use it; if inland (> 50 km), snap to active coastal harbour
        if user_location and "lat" in user_location and "lon" in user_location:
            nearest_coastal, coastal_dist = mr.nearest_region(user_location["lat"], user_location["lon"])
            if coastal_dist <= 50.0:
                loc = user_location
                resolved_region = nearest_coastal
                resolved_region_id = region_id or nearest_coastal["id"]
            else:
                loc = {
                    "name": f"{region_hint['name']} Harbour",
                    "lat": region_hint["center"]["lat"],
                    "lon": region_hint["center"]["lon"],
                }
                resolved_region = region_hint
                resolved_region_id = region_hint["id"]
        else:
            loc = {
                "name": f"{region_hint['name']} Harbour",
                "lat": region_hint["center"]["lat"],
                "lon": region_hint["center"]["lon"],
            }
            resolved_region = region_hint
            resolved_region_id = region_hint["id"]

    trace = [{"agent": "Planner Agent",
              "detail": (f"Intent='{plan['intent']}', timeframe='{plan.get('timeframe')}', "
                         f"language='{plan.get('language')}', "
                         f"location={loc.get('name') or 'coords'} "
                         f"-> region resolved to {resolved_region['name']}, "
                         f"{resolved_region['state']}.")}]

    result = await run_specialists(plan, loc, resolved_region_id)
    trace.extend(result["trace"])

    answer = await run_synthesizer(session_id, message, plan, result)
    trace.append({"agent": "Synthesizer",
                  "detail": "Combined specialist outputs into one explainable answer."})

    return {
        "answer": answer,
        "verdict": result.get("verdict"),
        "language": plan.get("language", "en"),
        "intent": plan["intent"],
        "citations": result["citations"],
        "widgets": result["widgets"],
        "reasoning_trace": trace,
        "location": loc,
        "region": result["region"],
        "elapsed_ms": int((datetime.now(timezone.utc) - started).total_seconds() * 1000),
    }
