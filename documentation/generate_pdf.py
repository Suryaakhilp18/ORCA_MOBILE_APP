"""Generates ORCA_Project_Documentation.pdf — full project documentation (PDF)."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    ListFlowable, ListItem, HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
import datetime

NAVY = colors.HexColor("#0A0E17")
BLUE = colors.HexColor("#3B9EFF")
GREY = colors.HexColor("#5A6879")
LIGHTBG = colors.HexColor("#F1F3F5")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle("TitleBig", fontSize=40, leading=46, alignment=TA_CENTER,
                          textColor=BLUE, fontName="Helvetica-Bold", spaceAfter=10))
styles.add(ParagraphStyle("SubTitle", fontSize=18, leading=22, alignment=TA_CENTER,
                          textColor=NAVY, fontName="Helvetica-Bold", spaceAfter=6))
styles.add(ParagraphStyle("SubTitle2", fontSize=12, leading=16, alignment=TA_CENTER,
                          textColor=GREY, fontName="Helvetica-Oblique", spaceAfter=6))
styles.add(ParagraphStyle("Meta", fontSize=10, leading=14, alignment=TA_CENTER,
                          textColor=GREY, fontName="Helvetica"))
styles.add(ParagraphStyle("H1", fontSize=18, leading=22, textColor=BLUE,
                          fontName="Helvetica-Bold", spaceBefore=18, spaceAfter=8))
styles.add(ParagraphStyle("H2", fontSize=14, leading=18, textColor=NAVY,
                          fontName="Helvetica-Bold", spaceBefore=12, spaceAfter=6))
styles.add(ParagraphStyle("Body", fontSize=10.3, leading=15, alignment=TA_JUSTIFY,
                          fontName="Helvetica", spaceAfter=6))
styles.add(ParagraphStyle("BodyBold", parent=styles["Body"], fontName="Helvetica-Bold"))
styles.add(ParagraphStyle("BulletCustom", fontSize=10.3, leading=14, fontName="Helvetica",
                          leftIndent=12))
styles.add(ParagraphStyle("CodeBlock", fontSize=8.3, leading=11, fontName="Courier",
                          backColor=LIGHTBG, borderPadding=6, spaceAfter=8))

story = []


def h1(text):
    story.append(Paragraph(text, styles["H1"]))


def h2(text):
    story.append(Paragraph(text, styles["H2"]))


def body(text, bold=False):
    story.append(Paragraph(text, styles["BodyBold" if bold else "Body"]))


def bullets(items):
    story.append(
        ListFlowable(
            [ListItem(Paragraph(i, styles["BulletCustom"]), bulletColor=BLUE) for i in items],
            bulletType="bullet", start="circle", leftIndent=14,
        )
    )
    story.append(Spacer(1, 6))


def numbered(items):
    story.append(
        ListFlowable(
            [ListItem(Paragraph(i, styles["BulletCustom"])) for i in items],
            bulletType="1", leftIndent=14,
        )
    )
    story.append(Spacer(1, 6))


def code(text):
    story.append(Paragraph(text.replace("\n", "<br/>").replace(" ", "&nbsp;"), styles["CodeBlock"]))


def table(headers, rows, widths=None):
    data = [headers] + rows
    t = Table(data, colWidths=widths, repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.3),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7F9FA")]),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]
    t.setStyle(TableStyle(style))
    story.append(t)
    story.append(Spacer(1, 10))


# ---------------- Title page ----------------
story.append(Spacer(1, 1.6 * inch))
story.append(Paragraph("ORCA", styles["TitleBig"]))
story.append(Paragraph("Agentic AI Marine Intelligence Platform", styles["SubTitle"]))
story.append(Paragraph(
    "For Indian Fishermen, Coastal Researchers &amp; Disaster-Management Agencies",
    styles["SubTitle2"]))
story.append(Spacer(1, 1.4 * inch))
story.append(Paragraph("Project Documentation", styles["SubTitle"]))
story.append(Paragraph(datetime.datetime.now().strftime("Generated: %B %Y"), styles["Meta"]))
story.append(Paragraph(
    "Stack: Expo (React Native) &middot; FastAPI &middot; MongoDB &middot; "
    "Multi-Agent LLM Orchestration", styles["Meta"]))
story.append(PageBreak())

# ---------------- 1. Executive Summary ----------------
h1("1. Executive Summary")
body(
    "ORCA is an agentic AI-powered marine intelligence platform built for the "
    "entire Indian coastline. It gives fishermen, coastal researchers, and "
    "disaster-management agencies natural-language answers about ocean and "
    "weather conditions, Potential Fishing Zones (PFZ), maps, and safety "
    "alerts &mdash; in English, Telugu, and Hindi, by voice or text."
)
body(
    "The platform is architected around a 7-agent LLM orchestrator layered on "
    "top of a DETERMINISTIC, rule-based safety engine: the AI explains "
    "conditions in warm, natural language, but it never decides whether "
    "it is safe to sail &mdash; that verdict always comes from hard-coded "
    "threshold rules evaluated against weather data."
)
bullets([
    "Full-stack: Expo (React Native) frontend + FastAPI backend + MongoDB database",
    "India-wide coastal coverage across 6 seeded regions (Bay of Bengal &amp; Arabian Sea)",
    "Multilingual UI and AI responses: English, Telugu, Hindi",
    "Voice input (speech-to-text) and voice output (text-to-speech) &mdash; the 'Marine Copilot'",
    "Offline-tolerant: cached responses, safe-default answers when APIs are unreachable",
    "Interactive MapLibre GL maps with PFZ markers, boundaries, heatmaps, and route plotting",
    "Resilient LLM/voice provider fallback chains (never a dead feature on quota exhaustion)",
])

# ---------------- 2. Problem statement ----------------
h1("2. Problem Statement")
body(
    "Build \"ORCA\" &mdash; an Agentic AI-powered marine intelligence platform for "
    "Indian fishermen, coastal researchers, and disaster-management agencies. "
    "The app provides natural-language answers about ocean/weather conditions, "
    "PFZ (Potential Fishing Zones), maps, and safety alerts."
)
body("Key requirements:", bold=True)
bullets([
    "India-wide coastal coverage (not a single city/region)",
    "Multi-agent AI with deterministic safety rules &mdash; AI explains, rules decide",
    "Multilingual UI + AI responses (English, Telugu, Hindi)",
    "Offline-tolerant architecture",
    "Voice input and voice output capabilities",
])

# ---------------- 3. Tech stack ----------------
h1("3. Technology Stack")
h2("3.1 Frontend")
table(
    ["Layer", "Technology"],
    [
        ["Framework", "Expo (React Native) 54.0.37, React 19.1.0, RN 0.81.5"],
        ["Routing", "expo-router 6.0.24 (file-based, typed routes)"],
        ["Maps", "MapLibre GL JS bundled locally, rendered in react-native-webview"],
        ["Animations", "react-native-reanimated 4.1.1 + worklets"],
        ["Voice / Audio", "expo-audio, expo-file-system"],
        ["Location", "expo-location"],
        ["Storage", "@react-native-async-storage/async-storage"],
        ["Charts", "Custom SVG ChartWidget (react-native-svg)"],
        ["Language", "TypeScript 5.9.3"],
    ],
    widths=[130, 340],
)
h2("3.2 Backend")
table(
    ["Layer", "Technology"],
    [
        ["Framework", "FastAPI 0.110.1, Uvicorn ASGI"],
        ["Database", "MongoDB (Motor async) with 2dsphere geospatial indexes"],
        ["LLM orchestration", "emergentintegrations (LlmChat) + litellm"],
        ["Primary LLM", "Gemini 3.5 Flash (user API key)"],
        ["Fallback LLM", "GPT-5.6 Luna via Emergent Universal Key"],
        ["Voice (primary)", "ElevenLabs scribe_v1 STT, eleven_v3 / multilingual_v2 TTS"],
        ["Voice (fallback)", "OpenAI Whisper-1 &amp; TTS-1 via Emergent Universal Key"],
        ["Geocoding", "OpenStreetMap Nominatim (rate-limited + cached)"],
    ],
    widths=[130, 340],
)

# ---------------- 4. Architecture ----------------
h1("4. System Architecture")
body(
    "ORCA follows a modular-monolith backend: orchestrator/ (AI reasoning), "
    "orchestrator/rules.py (deterministic safety logic), gis/ (geospatial "
    "queries), data_adapters/ (regional mock data), voice/ (STT/TTS), and "
    "notifications/ (hazard + geofence alerts)."
)
h2("4.1 High-Level Request Flow")
numbered([
    "User sends a message (typed or transcribed from voice).",
    "FastAPI /api/chat rate-limits per user and loads conversation history.",
    "Planner Agent (LLM) decomposes intent, language/script, and location.",
    "Specialist Agents deterministically gather weather, ocean, PFZ, boundary, route, tide, and alert data.",
    "Rules Engine evaluates thresholds to produce SAFE / CAUTION / UNSAFE &mdash; never the LLM.",
    "Synthesizer Agent (LLM) turns the verdict + data into one natural-language reply, honoring the verdict as a hard constraint.",
    "Response (text + verdict + widgets + reasoning trace + citations) is persisted and returned.",
    "If voice mode, reply text is also sent to TTS and played back.",
])
h2("4.2 The 7-Agent Orchestrator")
table(
    ["#", "Agent", "Role"],
    [
        ["1", "Planner Agent", "LLM: intent, timeframe, language/script, location, datasets"],
        ["2", "Data Discovery Agent", "Deterministic: maps intent to required datasets"],
        ["3", "Weather Intelligence Agent", "Deterministic: weather snapshot -> Rules Engine verdict"],
        ["4", "Ocean Analytics Agent", "Deterministic: correlates SST &amp; chlorophyll"],
        ["5", "Geospatial / Risk Agent", "Deterministic: $geoNear PFZ, $geoIntersects geofence, route sampling"],
        ["6", "Reporting/Visualization Agent", "Deterministic: builds map/chart widget JSON"],
        ["7", "Synthesizer Agent", "LLM: natural localized reply, constrained by verdict"],
    ],
    widths=[25, 145, 300],
)
h2("4.3 Deterministic Safety Rules")
table(
    ["Factor", "Caution", "Unsafe"],
    [
        ["Wind speed", "\u2265 18 kn", "\u2265 25 kn"],
        ["Wave height", "\u2265 1.8 m", "\u2265 2.5 m"],
        ["Lightning probability", "\u2265 30%", "\u2265 60%"],
        ["Active cyclone", "\u2014", "Any active system -> UNSAFE"],
    ],
    widths=[160, 155, 155],
)
h2("4.4 Resilience &amp; Fallback Chains")
bullets([
    "Chat LLM: Gemini 3.5 Flash -> GPT-5.6 Luna (Emergent Key) on any failure",
    "Voice STT: ElevenLabs Scribe -> OpenAI Whisper (Emergent Key)",
    "Voice TTS: ElevenLabs eleven_v3 -> multilingual_v2 -> OpenAI tts-1 (Emergent Key)",
    "If both LLM providers fail: templated deterministic safe-default answer in-language",
    "Frontend caches last-known Alerts snapshot; shows stale-data banner offline",
])

# ---------------- 5. Regions ----------------
h1("5. Supported Coastal Regions (India-Wide)")
body(
    "Any coastal place a user names is geocoded and snapped to the nearest "
    "seeded reference region for weather/PFZ/boundary data, while the LLM can "
    "still reason qualitatively about any other Indian coastal location."
)
table(
    ["Region", "State", "Sea"],
    [
        ["Kakinada (default)", "Andhra Pradesh", "Bay of Bengal"],
        ["Chennai", "Tamil Nadu", "Bay of Bengal"],
        ["Kochi", "Kerala", "Arabian Sea"],
        ["Mumbai", "Maharashtra", "Arabian Sea"],
        ["Paradip", "Odisha", "Bay of Bengal"],
        ["Veraval", "Gujarat", "Arabian Sea"],
    ],
    widths=[160, 160, 150],
)

# ---------------- 6. Key features ----------------
h1("6. Key Features")
h2("6.1 Conversational Marine Copilot (Chat Tab)")
bullets([
    "Natural-language Q&amp;A about tides, weather, safety, fishing zones, cyclones, lightning",
    "Deterministic SAFE / CAUTION / UNSAFE verdict badge on safety-relevant answers",
    "Inline reasoning trace of which agents contributed to the answer",
    "Inline citations, MapLibre map widget, and trend charts",
    "Region switcher: GPS auto-detect, free-text search, or manual pick",
    "Persistent conversation history restored on relaunch",
])
h2("6.2 Marine Safety Center (Alerts Tab)")
bullets([
    "Situation Summary card: severity badge, cyclone banner, wind/wave/lightning metrics",
    "Animated Radar card tied to current severity",
    "7-day trend charts: wind, wave, sea-surface temperature",
    "Active hazard bulletins and personal notifications",
    "Pull-to-refresh with offline fallback + stale-data banner",
])
h2("6.3 Saved Locations Tab")
bullets([
    "Save named coordinates (manual, GPS, or place search)",
    "Vessel profile toggle",
    "One-tap 'Ask in Chat' deep link with saved location's context",
    "One-tap geofence check against restricted/MPA/EEZ boundaries",
    "Auto-evaluates hazard bulletins for newly saved locations",
])
h2("6.4 Route Planning")
bullets([
    "Point-to-point route safety check sampled into 6 segments",
    "Flags segments crossing restricted/hazardous boundary polygons",
    "Recommends the safest reachable Potential Fishing Zone",
    "Route drawn as color-coded polyline with start/end markers",
])
h2("6.5 Voice Agent (\"Marine Copilot\" voice mode)")
bullets([
    "Tap-to-record mic input with full permission-contract handling",
    "Speech transcribed via ElevenLabs Scribe (fallback: OpenAI Whisper)",
    "Transcript sent through the same /api/chat pipeline as typed text",
    "Reply read aloud via ElevenLabs (fallback: OpenAI TTS)",
    "Auto-stop recording after 30 seconds; recording/transcribing/speaking states",
])
h2("6.6 Multilingual Support")
bullets([
    "UI fully localized in English, Telugu, and Hindi",
    "AI responses match detected input language or app's language preference",
    "Detects native script AND casual romanized Telugu/Hindi",
    "Replies in matching tone (romanized in, romanized-style reply out)",
])

# ---------------- 7. API Reference ----------------
h1("7. API Reference")
body("All backend routes are prefixed with /api.")
h2("7.1 Health &amp; Core")
table(["Method", "Endpoint", "Description"], [
    ["GET", "/api/", "Service health + region coverage summary"],
    ["GET", "/api/health", "Simple health check with server timestamp"],
], widths=[55, 160, 260])
h2("7.2 Chat &amp; Conversation")
table(["Method", "Endpoint", "Description"], [
    ["POST", "/api/chat", "Main orchestrator entry point"],
    ["GET", "/api/conversations/{session_id}", "Retrieve stored conversation history"],
], widths=[55, 160, 260])
h2("7.3 Saved Locations")
table(["Method", "Endpoint", "Description"], [
    ["POST", "/api/locations", "Save a named location (auto hazard eval)"],
    ["GET", "/api/locations", "List saved locations for a user"],
    ["DELETE", "/api/locations/{location_id}", "Delete a saved location"],
], widths=[55, 160, 260])
h2("7.4 Alerts &amp; Situation Intelligence")
table(["Method", "Endpoint", "Description"], [
    ["GET", "/api/alerts", "Active hazard bulletins for a region"],
    ["GET", "/api/notifications", "Personal notifications"],
    ["GET", "/api/situation", "Aggregated Alerts-tab snapshot"],
], widths=[55, 160, 260])
h2("7.5 Geospatial &amp; Reference Data")
table(["Method", "Endpoint", "Description"], [
    ["POST", "/api/geofence/check", "Point-in-polygon breach check"],
    ["GET", "/api/data/boundaries", "Bundled maritime boundary layer"],
    ["GET", "/api/data/pfz", "Potential Fishing Zone advisory"],
    ["GET", "/api/data/ocean", "SST/chlorophyll grid + trends"],
    ["GET", "/api/region", "Single region config lookup"],
    ["GET", "/api/regions", "Full India-wide region roster"],
    ["GET", "/api/regions/detect", "Nearest region for a lat/lon"],
    ["GET", "/api/geocode", "Forward-geocode place name -> coordinates"],
], widths=[55, 160, 260])
h2("7.6 Voice Agent")
table(["Method", "Endpoint", "Description"], [
    ["POST", "/api/voice/transcribe", "Speech (audio) -> text"],
    ["POST", "/api/voice/speak", "Text -> speech (mp3 bytes)"],
], widths=[55, 160, 260])
body(
    "Rate limiting: chat capped at 20 req/60s per user; voice capped at "
    "15 req/60s per client."
)

# ---------------- 8. Frontend architecture ----------------
h1("8. Frontend Architecture")
h2("8.1 Routing (expo-router, file-based)")
code(
    "app/\n"
    "|-- _layout.tsx        Root layout: fonts, splash, providers, Stack\n"
    "|-- index.tsx          Redirects '/' -> '/(tabs)'\n"
    "|-- +html.tsx          Web HTML shell\n"
    "'-- (tabs)/\n"
    "    |-- _layout.tsx    Bottom tab bar (Chat / Alerts / Saved)\n"
    "    |-- index.tsx      Chat tab (ChatScreen)\n"
    "    |-- alerts.tsx     Marine Safety Center\n"
    "    '-- saved.tsx      Saved Locations tab"
)
h2("8.2 Shared Source (src/)")
code(
    "src/\n"
    "|-- api.ts              Typed API client\n"
    "|-- theme.ts            Design tokens\n"
    "|-- context/AppContext.tsx   Global state (lang, session, region, toast)\n"
    "|-- hooks/useVoiceAgent.ts   Recording/playback state machine\n"
    "|-- utils/storage/      AsyncStorage/localStorage wrapper\n"
    "'-- components/\n"
    "    MessageBubble, MapWidget, ChartWidget, RadarCard, SituationCard,\n"
    "    AlertCard, VerdictBadge, ReasoningTrace, RegionSwitcher,\n"
    "    LanguagePicker, StaleBanner"
)
h2("8.3 Design System")
body(
    "\"Maritime Command Console\" dark theme &mdash; deep navy-black surfaces, "
    "command-blue accent, monospace telemetry text, green/amber/red safety "
    "semantics, 8pt spacing grid."
)

# ---------------- 9. Data model ----------------
h1("9. Data Model (MongoDB Collections)")
table(
    ["Collection", "Purpose", "Key Fields"],
    [
        ["conversations", "Chat session history", "session_id, user_id, messages[]"],
        ["locations", "Saved coordinates", "id, name, lat, lon, user_id, is_vessel"],
        ["notifications", "Hazard/geofence alerts", "id, user_id, type, severity, kind"],
        ["boundaries", "Maritime boundary polygons", "key, name, geometry (2dsphere), restricted"],
        ["pfz", "Potential Fishing Zone points", "key, name, location (2dsphere), sst_c, chl_mg_m3"],
        ["geocode_cache", "Nominatim result cache", "cache_key, query, results[], TTL 30d"],
    ],
    widths=[95, 190, 185],
)

# ---------------- 10. Permissions ----------------
h1("10. Permissions")
table(
    ["Permission", "Platform", "Description Shown to User"],
    [
        ["Location (when in use)", "iOS &amp; Android", "\"Check sea conditions near your location\""],
        ["Microphone", "iOS &amp; Android", "\"Ask the Marine Copilot questions by voice\""],
    ],
    widths=[140, 90, 240],
)

# ---------------- 11. Limitations ----------------
h1("11. Known Limitations &amp; Mocked Data")
bullets([
    "Weather/tide/SST/chlorophyll/PFZ/boundary data are DEMO/MOCK per region, clearly labelled in citations",
    "Gemini free-tier daily quota exhausts quickly; auto-falls back to Emergent Universal Key",
    "ElevenLabs voice quota limited; falls back to Emergent-managed OpenAI Whisper/TTS",
    "Interactive MapLibre map does not render on browser/web preview (native-only); marker-list fallback shown on web",
    "No authentication system yet; fixed demo user_id used for all requests",
    "Push notifications (FCM) structured but not wired to a real Firebase project",
])

# ---------------- 12. Tests ----------------
h1("12. Backend Test Coverage")
bullets([
    "test_orca_backend.py &mdash; core chat/orchestrator pipeline",
    "test_pfz_recommendation.py &mdash; safest-PFZ recommendation logic",
    "test_pfz_regions.py &mdash; India-wide region resolution",
    "test_situation_and_route.py &mdash; /api/situation + route safety",
    "test_voice_situation_route.py &mdash; voice endpoints + situation route",
    "test_localization_manual.py &mdash; multilingual response verification",
])

# ---------------- 13. Deployment ----------------
h1("13. Deployment Notes")
bullets([
    "Development: Metro bundler serves Expo web preview; FastAPI via Uvicorn on port 8001; MongoDB local",
    "Production build/publish via Emergent platform's Publish button (top-right) &mdash; generates iOS/Android builds",
    "Environment variables managed via .env files; never hardcoded",
    "Some native-only features (voice background playback, MapLibre WebView) require a real device/native build",
])

# ---------------- 14. Roadmap ----------------
h1("14. Future Roadmap")
bullets([
    "Live data source integration: replace mock adapters with real INCOIS, IMD, and Bhuvan feeds",
    "Push notifications via FCM for proactive hazard/cyclone alerts",
    "Phone OTP / account authentication for persistent user profiles",
    "Expand seeded region roster beyond the current 6 coastal reference points",
    "Restore native multilingual ElevenLabs voice once quota/key constraints are resolved",
])

story.append(Spacer(1, 20))
story.append(HRFlowable(width="100%", color=GREY, thickness=0.5))
story.append(Spacer(1, 6))
story.append(Paragraph("&mdash; End of Document &mdash;", styles["Meta"]))


def _footer(canvas, doc_):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(GREY)
    canvas.drawCentredString(A4[0] / 2, 20, f"ORCA Project Documentation \u2014 Page {doc_.page}")
    canvas.restoreState()


doc = SimpleDocTemplate(
    "/app/documentation/ORCA_Project_Documentation.pdf",
    pagesize=A4,
    leftMargin=0.85 * inch, rightMargin=0.85 * inch,
    topMargin=0.75 * inch, bottomMargin=0.75 * inch,
    title="ORCA Project Documentation",
)
doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
print("PDF generated successfully.")
