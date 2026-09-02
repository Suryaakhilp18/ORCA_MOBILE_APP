"""Generates ORCA_Project_Documentation.docx — full project documentation."""
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import datetime

NAVY = RGBColor(0x0A, 0x0E, 0x17)
BLUE = RGBColor(0x3B, 0x9E, 0xFF)
DARK = RGBColor(0x1A, 0x1A, 0x1A)
GREY = RGBColor(0x5A, 0x68, 0x79)

doc = Document()

# ---------- base style tweaks ----------
normal = doc.styles["Normal"]
normal.font.name = "Calibri"
normal.font.size = Pt(11)
normal.font.color.rgb = DARK

for i in range(1, 5):
    h = doc.styles[f"Heading {i}"]
    h.font.color.rgb = BLUE if i == 1 else NAVY
    h.font.name = "Calibri"


def set_cell_shading(cell, hex_color):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    tc_pr.append(shd)


def add_title_page():
    doc.add_paragraph().add_run()
    for _ in range(4):
        doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("🐋 ORCA")
    run.font.size = Pt(54)
    run.font.bold = True
    run.font.color.rgb = BLUE

    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run2 = p2.add_run("Agentic AI Marine Intelligence Platform")
    run2.font.size = Pt(22)
    run2.font.color.rgb = NAVY
    run2.font.bold = True

    p3 = doc.add_paragraph()
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run3 = p3.add_run(
        "For Indian Fishermen, Coastal Researchers & Disaster-Management Agencies"
    )
    run3.font.size = Pt(13)
    run3.font.color.rgb = GREY
    run3.italic = True

    for _ in range(6):
        doc.add_paragraph()

    p4 = doc.add_paragraph()
    p4.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run4 = p4.add_run("Project Documentation")
    run4.font.size = Pt(16)
    run4.bold = True

    p5 = doc.add_paragraph()
    p5.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run5 = p5.add_run(datetime.datetime.now().strftime("Generated: %B %Y"))
    run5.font.size = Pt(11)
    run5.font.color.rgb = GREY

    p6 = doc.add_paragraph()
    p6.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run6 = p6.add_run("Stack: Expo (React Native) · FastAPI · MongoDB · Multi-Agent LLM Orchestration")
    run6.font.size = Pt(11)
    run6.font.color.rgb = GREY

    doc.add_page_break()


def h1(text):
    doc.add_heading(text, level=1)


def h2(text):
    doc.add_heading(text, level=2)


def h3(text):
    doc.add_heading(text, level=3)


def para(text, bold=False, italic=False, size=11, color=None):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.bold = bold
    r.italic = italic
    r.font.size = Pt(size)
    if color:
        r.font.color.rgb = color
    return p


def bullet(text, level=0):
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.left_indent = Inches(0.25 * (level + 1))
    p.add_run(text)
    return p


def numbered(text):
    p = doc.add_paragraph(style="List Number")
    p.add_run(text)
    return p


def code_block(text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.3)
    run = p.add_run(text)
    run.font.name = "Consolas"
    run.font.size = Pt(9.5)
    run.font.color.rgb = RGBColor(0x0F, 0x15, 0x20)
    # light grey shading via a 1-cell table trick omitted for simplicity;
    # use paragraph shading instead
    p_pr = p._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), "F1F3F5")
    p_pr.append(shd)
    return p


def table_with_header(headers, rows, col_widths=None):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Light Grid Accent 1"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_cells = t.rows[0].cells
    for i, htext in enumerate(headers):
        hdr_cells[i].text = ""
        p = hdr_cells[i].paragraphs[0]
        r = p.add_run(htext)
        r.bold = True
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        set_cell_shading(hdr_cells[i], "3B9EFF")
    for row in rows:
        cells = t.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = str(val)
            for p in cells[i].paragraphs:
                for r in p.runs:
                    r.font.size = Pt(9.5)
    doc.add_paragraph()
    return t


# =============================================================================
add_title_page()

# ----------------------------------------------------------------------------
h1("1. Executive Summary")
para(
    "ORCA is an agentic AI-powered marine intelligence platform built for the "
    "entire Indian coastline. It gives fishermen, coastal researchers, and "
    "disaster-management agencies natural-language answers about ocean and "
    "weather conditions, Potential Fishing Zones (PFZ), maps, and safety "
    "alerts — in English, Telugu, and Hindi, by voice or text."
)
para(
    "The platform is architected around a 7-agent LLM orchestrator layered on "
    "top of a DETERMINISTIC, rule-based safety engine: the AI explains "
    "conditions in warm, natural language, but it never decides whether "
    "it is safe to sail — that verdict always comes from hard-coded "
    "threshold rules evaluated against weather data, so safety-critical "
    "output can never be 'hallucinated'."
)
bullet("Full-stack: Expo (React Native) frontend + FastAPI backend + MongoDB database")
bullet("India-wide coastal coverage across 6 seeded regions (Bay of Bengal & Arabian Sea)")
bullet("Multilingual UI and AI responses: English, Telugu (తెలుగు), Hindi (हिन्दी)")
bullet("Voice input (speech-to-text) and voice output (text-to-speech) — the 'Marine Copilot'")
bullet("Offline-tolerant: cached responses, safe-default answers when APIs are unreachable")
bullet("Interactive MapLibre GL maps with PFZ markers, boundaries, heatmaps, and route plotting")
bullet("Resilient LLM/voice provider fallback chains (never a dead feature on quota exhaustion)")

# ----------------------------------------------------------------------------
h1("2. Problem Statement")
para(
    "Build \"ORCA\" — an Agentic AI-powered marine intelligence platform for "
    "Indian fishermen, coastal researchers, and disaster-management agencies. "
    "The app provides natural-language answers about ocean/weather conditions, "
    "PFZ (Potential Fishing Zones), maps, and safety alerts."
)
para("Key requirements:", bold=True)
bullet("India-wide coastal coverage (not a single city/region)")
bullet("Multi-agent AI with deterministic safety rules — AI explains, rules decide")
bullet("Multilingual UI + AI responses (English, Telugu, Hindi)")
bullet("Offline-tolerant architecture")
bullet("Voice input and voice output capabilities")

# ----------------------------------------------------------------------------
h1("3. Technology Stack")

h2("3.1 Frontend")
table_with_header(
    ["Layer", "Technology"],
    [
        ["Framework", "Expo (React Native) 54.0.37, React 19.1.0, React Native 0.81.5"],
        ["Routing", "expo-router 6.0.24 — file-based routing, typed routes"],
        ["Navigation", "@react-navigation/bottom-tabs (via expo-router Tabs)"],
        ["Maps", "MapLibre GL JS (bundled locally as an asset) rendered in react-native-webview"],
        ["Animations", "react-native-reanimated 4.1.1, react-native-worklets"],
        ["Gestures", "react-native-gesture-handler"],
        ["Keyboard handling", "react-native-keyboard-controller"],
        ["Voice / Audio", "expo-audio (recording & playback), expo-file-system"],
        ["Location", "expo-location (GPS + permission handling)"],
        ["Storage", "@react-native-async-storage/async-storage (session, language, region cache)"],
        ["Icons", "@expo/vector-icons (Ionicons)"],
        ["Fonts", "expo-font (SpaceMono, loaded locally — no Google Fonts CDN)"],
        ["Charts", "Custom SVG-based ChartWidget (react-native-svg)"],
        ["Language", "TypeScript 5.9.3"],
    ],
)

h2("3.2 Backend")
table_with_header(
    ["Layer", "Technology"],
    [
        ["Framework", "FastAPI 0.110.1 (Python, modular monolith), Uvicorn ASGI server"],
        ["Database", "MongoDB (via Motor async driver) — stands in for PostGIS with 2dsphere indexes"],
        ["LLM orchestration", "emergentintegrations (LlmChat) + litellm"],
        ["Primary LLM", "Gemini 3.5 Flash (user-provided API key)"],
        ["Fallback LLM", "GPT-5.6 Luna via Emergent Universal Key"],
        ["Voice STT/TTS (primary)", "ElevenLabs (scribe_v1 STT, eleven_v3 / eleven_multilingual_v2 TTS)"],
        ["Voice STT/TTS (fallback)", "OpenAI Whisper (whisper-1) & TTS (tts-1) via Emergent Universal Key"],
        ["Geocoding", "OpenStreetMap Nominatim (rate-limited proxy + Mongo cache)"],
        ["HTTP client", "httpx (async)"],
        ["Auth / security libs", "passlib, python-jose, PyJWT, bcrypt (available, not yet wired to an auth flow)"],
    ],
)

h2("3.3 Infrastructure")
bullet("Kubernetes-hosted container; Metro bundler serves the Expo web preview")
bullet("Supervisor manages backend (port 8001), Expo (port 3000), and MongoDB processes")
bullet("All backend routes are prefixed with /api to match ingress routing rules")
bullet("Environment variables via .env files (never hardcoded secrets)")

# ----------------------------------------------------------------------------
h1("4. System Architecture")
para(
    "ORCA follows a modular-monolith backend with a clear separation between "
    "AI reasoning (orchestrator/), deterministic safety logic (orchestrator/rules.py), "
    "geospatial queries (gis/), mock regional data feeds (data_adapters/), the voice "
    "layer (voice/), and hazard notifications (notifications/)."
)

h2("4.1 High-Level Request Flow")
numbered("User sends a message (typed or transcribed from voice) from the Expo app.")
numbered("FastAPI /api/chat endpoint receives the request, rate-limits per user, and loads conversation history from MongoDB.")
numbered("The Planner Agent (LLM) decomposes intent, detects language/script, and resolves location.")
numbered("Specialist Agents deterministically gather data (weather, ocean grid, PFZ, boundaries, routes, tides, alerts) relevant to that intent.")
numbered("The Rules Engine evaluates sea-safety thresholds (wind/wave/lightning/cyclone) to produce a SAFE / CAUTION / UNSAFE verdict — never the LLM.")
numbered("The Synthesizer Agent (LLM) turns the verdict + data into one warm, natural-language reply in the user's language, honoring the deterministic verdict as a hard constraint.")
numbered("The response (text + verdict + map/chart widgets + reasoning trace + citations) is persisted to MongoDB and returned to the app.")
numbered("If voice mode was used, the reply text is also sent to the TTS voice endpoint and played back to the user.")

h2("4.2 The 7-Agent Orchestrator")
table_with_header(
    ["#", "Agent", "Role"],
    [
        ["1", "Planner Agent", "LLM — decomposes the user message into intent, timeframe, language/script, location, and required datasets (strict JSON output). Falls back to a deterministic keyword classifier if both LLM providers fail."],
        ["2", "Data Discovery Agent", "Deterministic — maps the resolved intent to the exact datasets needed (weather, sst, chl, pfz, tide, alerts, boundaries)."],
        ["3", "Weather Intelligence Agent", "Deterministic — fetches weather snapshot and runs it through the Rules Engine to get the SAFE/CAUTION/UNSAFE verdict."],
        ["4", "Ocean Analytics Agent", "Deterministic — correlates SST & chlorophyll grid data to identify favourable feeding zones."],
        ["5", "Geospatial / Risk Agent", "Deterministic — MongoDB 2dsphere $geoNear / $geoIntersects queries for nearest PFZ, geofence breaches, and route safety sampling."],
        ["6", "Reporting / Visualization Agent", "Deterministic — builds the map and chart widget JSON payloads sent to the client."],
        ["7", "Synthesizer Agent", "LLM — converts the machine-computed result into one natural, localized, conversational reply; hard-constrained to never contradict the deterministic verdict."],
    ],
)

h2("4.3 Deterministic Safety Rules (orchestrator/rules.py)")
para("Sea-safety thresholds (small-craft advisory style):", bold=True)
table_with_header(
    ["Factor", "Caution Threshold", "Unsafe Threshold"],
    [
        ["Wind speed", "≥ 18 kn", "≥ 25 kn"],
        ["Wave height", "≥ 1.8 m", "≥ 2.5 m"],
        ["Lightning probability", "≥ 30%", "≥ 60%"],
        ["Active cyclone", "—", "Any active cyclonic system → UNSAFE"],
    ],
)
para(
    "The Alerts tab's overall severity (critical / warning / advisory) is likewise a "
    "pure function of this verdict plus any active hazard bulletin severities — "
    "never LLM-guessed."
)

h2("4.4 Resilience & Fallback Chains")
bullet("Chat LLM: Gemini 3.5 Flash (user key) → automatic fallback to GPT-5.6 Luna (Emergent Universal Key) on quota/auth/network failure.")
bullet("Voice STT: ElevenLabs Scribe → OpenAI Whisper (Emergent key) fallback.")
bullet("Voice TTS: ElevenLabs eleven_v3 → eleven_multilingual_v2 → OpenAI tts-1 (Emergent key) fallback chain.")
bullet("If BOTH LLM providers fail, a templated deterministic safe-default answer is returned in the user's language — the safety pipeline itself never goes down.")
bullet("Frontend caches the last-known Alerts/Situation snapshot in AsyncStorage and shows a 'stale data' banner when offline.")

# ----------------------------------------------------------------------------
h1("5. Supported Coastal Regions (India-Wide)")
para(
    "ORCA is India-wide by design: any coastal place a user names is geocoded and "
    "snapped to the nearest of these seeded reference regions for weather/PFZ/boundary "
    "data purposes, while the LLM can still reason qualitatively about any other "
    "Indian coastal location."
)
table_with_header(
    ["Region", "State", "Sea"],
    [
        ["Kakinada (default)", "Andhra Pradesh", "Bay of Bengal"],
        ["Chennai", "Tamil Nadu", "Bay of Bengal"],
        ["Kochi", "Kerala", "Arabian Sea"],
        ["Mumbai", "Maharashtra", "Arabian Sea"],
        ["Paradip", "Odisha", "Bay of Bengal"],
        ["Veraval", "Gujarat", "Arabian Sea"],
    ],
)

# ----------------------------------------------------------------------------
h1("6. Key Features")

h2("6.1 Conversational Marine Copilot (Chat Tab)")
bullet("Natural-language Q&A about tides, weather, safety, fishing zones, cyclones, lightning")
bullet("Deterministic SAFE / CAUTION / UNSAFE verdict badge on every safety-relevant answer")
bullet("Inline reasoning trace showing which of the 7 agents contributed to the answer")
bullet("Inline citations (data sources, clearly marked as demo/mock where applicable)")
bullet("Inline MapLibre map widget (PFZ markers, boundaries, heatmaps, routes) and trend charts")
bullet("Region switcher: GPS auto-detect, free-text search (any Indian location), or manual pick")
bullet("Persistent conversation history per session, restored on app relaunch")
bullet("Quick-start suggestion chips for common queries")

h2("6.2 Marine Safety Center (Alerts Tab)")
bullet("Situation Summary card: severity badge, active cyclone banner, wind/wave/lightning metrics, reasons")
bullet("Animated Radar card showing a live-feeling coastal-sector sweep tied to current severity")
bullet("7-day trend charts: wind speed, wave height, sea-surface temperature")
bullet("Active hazard bulletins and personal notifications (geofence breaches, saved-location hazards)")
bullet("Pull-to-refresh with offline fallback to last-cached snapshot + stale-data banner")

h2("6.3 Saved Locations Tab")
bullet("Save named coordinates (manual entry, GPS, or place search)")
bullet("Vessel profile toggle for boats vs. fixed shore locations")
bullet("One-tap 'Ask in Chat' deep link pre-filled with the saved location's context")
bullet("One-tap Geofence check against restricted/MPA/EEZ boundary polygons")
bullet("Auto-evaluates hazard bulletins for newly saved locations")

h2("6.4 Route Planning")
bullet("Point-to-point route safety check: samples the straight path between start/end into 6 segments")
bullet("Flags any segment that crosses a restricted/hazardous boundary polygon")
bullet("Recommends the safest reachable Potential Fishing Zone when multiple candidates exist")
bullet("Route drawn on the map as a color-coded polyline (green = safe, red = unsafe) with start/end markers")

h2("6.5 Voice Agent (\"Marine Copilot\" voice mode)")
bullet("Tap-to-record microphone input with full permission-contract handling (ask → deny → settings redirect)")
bullet("Speech transcribed via ElevenLabs Scribe (fallback: OpenAI Whisper)")
bullet("Transcript sent through the exact same /api/chat pipeline as typed text — no special-cased logic")
bullet("Assistant reply read aloud via ElevenLabs eleven_v3 (fallback: multilingual_v2, then OpenAI TTS)")
bullet("Auto-stop recording after 30 seconds; visual recording/transcribing/speaking states")

h2("6.6 Multilingual Support")
bullet("UI fully localized in English, Telugu (తెలుగు), and Hindi (हिन्दी)")
bullet("AI responses match the detected input language OR the app's selected language preference")
bullet("Detects both native script (Telugu/Devanagari) and casual romanized Telugu/Hindi text messaging style")
bullet("Replies in matching tone — romanized input gets a casual romanized-style reply, not formal native script")

# ----------------------------------------------------------------------------
h1("7. API Reference")
para("All backend routes are prefixed with /api. Base URL is resolved from EXPO_PUBLIC_BACKEND_URL on the client.")

h2("7.1 Health & Core")
table_with_header(
    ["Method", "Endpoint", "Description"],
    [
        ["GET", "/api/", "Service health + region coverage summary"],
        ["GET", "/api/health", "Simple health check with server timestamp"],
    ],
)

h2("7.2 Chat & Conversation")
table_with_header(
    ["Method", "Endpoint", "Description"],
    [
        ["POST", "/api/chat", "Main orchestrator entry point — sends a message, returns the assistant's reply, verdict, widgets, citations, and reasoning trace"],
        ["GET", "/api/conversations/{session_id}", "Retrieve full stored conversation history for a session"],
    ],
)

h2("7.3 Saved Locations")
table_with_header(
    ["Method", "Endpoint", "Description"],
    [
        ["POST", "/api/locations", "Save a named location (auto-evaluates hazards on save)"],
        ["GET", "/api/locations", "List all saved locations for a user"],
        ["DELETE", "/api/locations/{location_id}", "Delete a saved location"],
    ],
)

h2("7.4 Alerts & Situation Intelligence")
table_with_header(
    ["Method", "Endpoint", "Description"],
    [
        ["GET", "/api/alerts", "Active hazard bulletins for a region"],
        ["GET", "/api/notifications", "Personal notifications (geofence breaches, saved-location hazards)"],
        ["GET", "/api/situation", "Aggregated Alerts-tab snapshot: severity, verdict, reasons, weather, tide, 7-day trends"],
    ],
)

h2("7.5 Geospatial & Reference Data")
table_with_header(
    ["Method", "Endpoint", "Description"],
    [
        ["POST", "/api/geofence/check", "Point-in-polygon breach check against restricted/MPA/EEZ boundaries"],
        ["GET", "/api/data/boundaries", "Bundled maritime boundary layer for a region"],
        ["GET", "/api/data/pfz", "Potential Fishing Zone advisory for a region"],
        ["GET", "/api/data/ocean", "SST/chlorophyll grid + trend series for a region"],
        ["GET", "/api/region", "Single region config lookup"],
        ["GET", "/api/regions", "Full India-wide region roster"],
        ["GET", "/api/regions/detect", "Nearest supported region for a given lat/lon (GPS auto-detect)"],
        ["GET", "/api/geocode", "Forward-geocode free-text place name → coordinates (India-biased, Nominatim proxy, rate-limited + cached)"],
    ],
)

h2("7.6 Voice Agent")
table_with_header(
    ["Method", "Endpoint", "Description"],
    [
        ["POST", "/api/voice/transcribe", "Speech (audio upload) → text, via ElevenLabs Scribe / Whisper fallback"],
        ["POST", "/api/voice/speak", "Text → speech (mp3 bytes), via ElevenLabs / OpenAI TTS fallback"],
    ],
)

para(
    "Rate limiting: chat is capped at 20 requests/60s per user; voice endpoints are "
    "capped at 15 requests/60s per client (tighter, since voice hits paid quotas)."
)

# ----------------------------------------------------------------------------
h1("8. Frontend Architecture")

h2("8.1 Routing (expo-router, file-based)")
code_block(
    "app/\n"
    "├── _layout.tsx            Root layout: fonts, splash, providers, Stack\n"
    "├── index.tsx               Redirects '/' -> '/(tabs)'\n"
    "├── +html.tsx               Web HTML shell (safe-area / scroll reset)\n"
    "└── (tabs)/\n"
    "    ├── _layout.tsx         Bottom tab bar (Chat / Alerts / Saved)\n"
    "    ├── index.tsx           Chat tab (ChatScreen)\n"
    "    ├── alerts.tsx          Marine Safety Center (Alerts tab)\n"
    "    └── saved.tsx           Saved Locations tab"
)

h2("8.2 Shared Source (src/)")
code_block(
    "src/\n"
    "├── api.ts                  Typed API client (fetch wrapper over /api/*)\n"
    "├── theme.ts                 Design tokens: colors, spacing, radius, type\n"
    "├── context/\n"
    "│   └── AppContext.tsx       Global state: language, session, region, toast\n"
    "├── hooks/\n"
    "│   └── useVoiceAgent.ts     Recording/playback state machine + permissions\n"
    "├── utils/\n"
    "│   └── storage/             AsyncStorage/localStorage cross-platform wrapper\n"
    "└── components/\n"
    "    ├── MessageBubble.tsx     Chat bubble (verdict badge, widgets, sources)\n"
    "    ├── MapWidget.tsx         MapLibre GL map (native) / marker list (web fallback)\n"
    "    ├── ChartWidget.tsx       SVG line chart for 7-day trends\n"
    "    ├── RadarCard.tsx         Animated radar-sweep situation card\n"
    "    ├── SituationCard.tsx     Alerts-tab situation summary\n"
    "    ├── AlertCard.tsx         Individual hazard/notification card\n"
    "    ├── VerdictBadge.tsx      SAFE / CAUTION / UNSAFE badge\n"
    "    ├── ReasoningTrace.tsx    Collapsible multi-agent trace viewer\n"
    "    ├── RegionSwitcher.tsx    GPS / search / manual region picker modal\n"
    "    ├── LanguagePicker.tsx    EN / Telugu / Hindi picker modal\n"
    "    └── StaleBanner.tsx       Offline / cached-data banner"
)

h2("8.3 Design System")
para(
    "\"Maritime Command Console\" dark theme — deep navy-black surfaces, command-blue "
    "accent, monospace telemetry text, green/amber/red safety semantics."
)
table_with_header(
    ["Token", "Value", "Usage"],
    [
        ["bg / surface", "#0A0E17 / #0F1520", "Screen background / card surfaces"],
        ["brand", "#3B9EFF", "Primary buttons, active tab, links"],
        ["success / warning / error", "#3FD07F / #E9B44C / #FF5B6E", "SAFE / CAUTION / UNSAFE semantics"],
        ["onSurface / muted", "#E6EDF3 / #5A6879", "Primary text / secondary text"],
        ["Grid", "8pt spacing scale", "4 / 8 / 12 / 16 / 24 / 32 / 48"],
    ],
)

# ----------------------------------------------------------------------------
h1("9. Data Model (MongoDB Collections)")
table_with_header(
    ["Collection", "Purpose", "Key Fields"],
    [
        ["conversations", "Chat session history", "session_id, user_id, messages[] (role, content, verdict, widgets, reasoning_trace)"],
        ["locations", "User-saved coordinates", "id, name, lat, lon, user_id, is_vessel, subscribed"],
        ["notifications", "Hazard/geofence alerts per user", "id, user_id, type, severity, title, body, kind, read"],
        ["boundaries", "Maritime boundary polygons (EEZ/MPA/restricted)", "key, name, geometry (2dsphere), restricted"],
        ["pfz", "Potential Fishing Zone points", "key, name, location (2dsphere), sst_c, chl_mg_m3"],
        ["geocode_cache", "Nominatim search result cache", "cache_key, query, results[], TTL 30 days"],
    ],
)
para(
    "MongoDB's 2dsphere geospatial indexes stand in for PostGIS, enabling nearest-neighbour "
    "($geoNear) PFZ lookups and point-in-polygon ($geoIntersects) geofence checks."
)

# ----------------------------------------------------------------------------
h1("10. Permissions")
table_with_header(
    ["Permission", "Platform", "Usage Description Shown to User"],
    [
        ["Location (when in use)", "iOS & Android", "\"Check sea conditions near your location\""],
        ["Microphone", "iOS & Android", "\"Ask the Marine Copilot questions by voice\""],
    ],
)
para(
    "Permissions are requested contextually (only after the user taps a location- or "
    "voice-triggering action), respect canAskAgain / denial state, and redirect to "
    "device Settings on hard denial rather than dead-ending the feature."
)

# ----------------------------------------------------------------------------
h1("11. Known Limitations & Mocked Data")
bullet("Weather, tide, SST/chlorophyll, PFZ, and boundary data are DEMO/MOCK datasets per region — not live IMD/INCOIS/Bhuvan feeds. Every response is clearly labelled 'mock'/'demo' in citations.")
bullet("Gemini API key free tier has a hard daily quota (~20 req/day) — the app automatically falls back to the Emergent Universal Key so functionality is never lost, just the provider changes transparently.")
bullet("ElevenLabs voice quota is limited on the free/starter tier — falls back to Emergent-managed OpenAI Whisper/TTS (English-accented for non-English text, a provider limitation).")
bullet("The MapLibre interactive WebView map does not render on browser/web preview (react-native-webview is native-only) — a marker-list fallback is shown on web instead; full map works on Expo Go / native builds.")
bullet("No authentication system yet — all requests use a fixed demo user_id; user accounts/login are a backlog item.")
bullet("Push notifications (FCM) are structured with a no-op send_push() hook but not yet wired to a real Firebase project.")

# ----------------------------------------------------------------------------
h1("12. Backend Test Coverage")
para("Automated backend tests live in /app/backend/tests/:")
bullet("test_orca_backend.py — core chat/orchestrator pipeline")
bullet("test_pfz_recommendation.py — safest-PFZ recommendation logic")
bullet("test_pfz_regions.py — India-wide region resolution")
bullet("test_situation_and_route.py — /api/situation + route safety")
bullet("test_voice_situation_route.py — voice endpoints + situation route")
bullet("test_localization_manual.py — multilingual response verification")

# ----------------------------------------------------------------------------
h1("13. Deployment Notes")
bullet("Development: Metro bundler serves the Expo web preview; FastAPI runs via Uvicorn on port 8001; MongoDB runs locally.")
bullet("Production build/publish is done via the Emergent platform's Publish button (top-right) — generates iOS and Android builds.")
bullet("Environment variables (API keys, backend URL) are managed via .env files and are never hardcoded in source.")
bullet("Some native-only features (voice recording playback in background, MapLibre WebView) require a real device / native build — not testable purely in Expo Go web preview.")

# ----------------------------------------------------------------------------
h1("14. Future Roadmap")
bullet("Live data source integration: replace mock adapters with real INCOIS, IMD, and Bhuvan API feeds")
bullet("Push notifications via FCM for proactive hazard/cyclone alerts (requires Emergent-managed push + native build)")
bullet("Phone OTP / account authentication for persistent user profiles across devices")
bullet("Expand seeded region roster beyond the current 6 coastal reference points")
bullet("Restore native multilingual ElevenLabs voice once quota/key constraints are resolved")

doc.add_page_break()
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("— End of Document —")
r.italic = True
r.font.color.rgb = GREY

doc.save("/app/documentation/ORCA_Project_Documentation.docx")
print("Document generated successfully.")
