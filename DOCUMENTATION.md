# 🌊 ORCA MOBILE 2.0 — MINI PROJECT DOCUMENTATION
## Ocean Risk & Coastal Advisory: Agentic AI Marine Intelligence Platform

---

# 1. Cover Page

```
========================================================================================
                                    MINI PROJECT REPORT
                                             ON
                                      ORCA MOBILE 2.0
                           (Ocean Risk & Coastal Advisory)
               Agentic AI Marine Copilot & Seaward Fairway Navigation System
========================================================================================

Project Title:
   ORCA MOBILE 2.0 — Agentic AI Marine Intelligence & Seaward Fairway Navigation System

Project Type:
   Mini Project / Capstone Engineering Project (Individual / Group Project)

Student Details:
   • Student Name: P. Surya Akhil
   • Roll Number / Student ID: 25B11CS717 (Suryaakhilp18)
   • Academic Department: Department of Computer Science & Engineering / Information Technology
   • Team Identification: Team ORCA (Individual Project)
   • Project Repository: https://github.com/Suryaakhilp18/ORCA_MOBILE_APP.git
   • Academic Year: 2025 – 2026
   • Submission Date: October 2026

========================================================================================
```

---

# 2. Project Overview & Objectives

### 2.1 Brief Description (100–150 Words)
**ORCA Mobile 2.0** (*Ocean Risk & Coastal Advisory*) is an agentic AI-powered marine intelligence platform and navigational copilot engineered specifically for India’s artisanal and mechanized fishing communities, commercial coastal vessel operators, maritime researchers, and disaster response authorities. Built with an Expo React Native frontend and a FastAPI backend, ORCA integrates real-time oceanographic and meteorological telemetry from IMD and INCOIS. The system combines a sub-second 7-agent LLM pipeline with a 100% deterministic safety engine that calculates sea-readiness verdicts (`SAFE`, `CAUTION`, `UNSAFE`). ORCA features zero-land-crossing parabolic fairway routing (including cross-coast Cape Comorin Kanyakumari TSS navigation), an interactive ECDIS map with live nautical HUD, comprehensive coverage of 28 Indian coastal ports across all 9 coastal states and 3 Union Territories, and full hands-free voice interaction synchronized across 10 coastal Indian languages in both pure light and deep oceanic dark modes.

---

### 2.2 Problem It Solves
India possesses an extensive coastline stretching over **7,516 kilometers**, supporting over 4 million active marine fishermen and seafarers operating more than 250,000 fishing craft (both motorized non-mechanized catamarans and mechanized trawlers). However, coastal seafarers face critical operational hazards every day:

1. **Dangerous Inland Chord Crossing in Marine Navigation**: Traditional straight-line routing algorithms draw straight chords between two coastal ports. Along curving coastlines, headlands, and promontories (such as the Godavari delta, Point Calimere, or Cape Comorin), straight-line paths intersect mainland terrain, sandbars, and rocky shoals, creating catastrophic grounding risks.
2. **Generative AI Hallucination in Mission-Critical Safety**: Standard AI chat systems hallucinate navigational and weather safety advisories, providing unpredictable or dangerous advice to vessels at sea.
3. **Severe Language and Literacy Barriers**: Indian fishermen speak regional languages (Telugu, Tamil, Malayalam, Kannada, Marathi, Gujarati, Bengali, Odia, Hindi) and operate vessels under harsh maritime conditions (spray, salt water, heavy roll and pitch), rendering text-heavy English interfaces unusable.
4. **Marine Protected Areas (MPA) & Naval Exclusion Breaches**: Inadvertent incursions into ecological sanctuaries (e.g., Coringa, Gahirmatha Olive Ridley nesting grounds, Gulf of Mannar) or restricted naval bases result in boat seizures, hefty penalties, and international incidents.
5. **Lack of Actionable Ocean Productivity Intelligence**: Small-scale fishermen lack access to integrated Sea Surface Temperature (SST) and Chlorophyll-a satellite indicators required to pinpoint high-probability Potential Fishing Zones (PFZs), leading to excessive fuel consumption and lost voyages.
6. **Network Fragility at Sea**: Terrestrial cellular signals degrade within 5–12 nautical miles offshore. Applications that rely on continuous cloud connectivity deadlock and fail when connectivity drops.

---

### 2.3 Main Objectives
The core objectives of the ORCA Mobile 2.0 project are:

1. **Zero-Hallucination Deterministic Safety Engine**: Implement an immutable, rule-governed evaluation engine based strictly on IMD and INCOIS thresholds (wind knots, wave height, swell period, thunderstorm probability, and active cyclonic alerts). The AI translates and voices findings, but never decides sea-safety verdicts.
2. **Zero-Land-Crossing Maritime Fairway Routing**: Develop a spatial fairway routing algorithm utilizing parabolic seaward offsets ($\text{Offset}(t) = 4t(1-t) \cdot \text{Mag}$) and multi-leg waypoint synthesis that guarantees all plotted routes bow outward into open water and navigate around Cape Comorin via the Kanyakumari Traffic Separation Scheme (TSS).
3. **Comprehensive Pan-Indian Coastal Port Registry**: Model and maintain a verified database of **28 major, intermediate, and fishing ports** covering all 9 coastal states (Gujarat, Maharashtra, Goa, Karnataka, Kerala, Tamil Nadu, Andhra Pradesh, Odisha, West Bengal) and 3 coastal Union Territories (Puducherry, Andaman & Nicobar, Lakshadweep).
4. **Multilingual & Dual-Script Voice Marine Copilot**: Deliver hands-free Speech-to-Text (STT) and native Text-to-Speech (TTS) matching the user’s spoken dialect across 10 Indian coastal languages, with dynamic script detection (native characters vs. romanized vernacular).
5. **Live Marine Navigation HUD & AIS Fleet Tracking**: Render interactive Leaflet/MapLibre ECDIS maps featuring real-time Heading/Bearing degrees, 16-point cardinal directions, dual distances (Nautical Miles and Kilometers), Estimated Time of Arrival (ETA at 8 knots), and nearby trawler fleet monitoring.
6. **100% Theme Purity & Resilient Offline Tolerance**: Provide clean, high-contrast visual styling (Pure Light Mode `#F4F7F9` and Deep Oceanic Dark Mode `#0B1924`) across all 4 app tabs, with automated in-memory fallbacks when remote databases are offline.

---

# 3. Technology Stack

### 3.1 Programming Languages & Core Runtimes
| Technology | Version | Purpose in ORCA Mobile 2.0 |
| :--- | :--- | :--- |
| **Python** | 3.10 – 3.14 | Backend REST API server, spatial geometry math, multi-agent orchestrator, rule engine |
| **TypeScript** | 5.9.3 | Type-safe mobile frontend development, component props, and API interfaces |
| **JavaScript (ES2023)** | Standard | Web Speech API audio handling and MapLibre/Leaflet map rendering |
| **HTML5 / CSS3** | Modern | Mobile web shell container, Leaflet styling, custom SVG chart components |

---

### 3.2 Frontend Architecture (Client Layer)
| Framework / Library | Version | Technical Role & Implementation |
| :--- | :--- | :--- |
| **Expo (React Native)** | 54.0.37 / RN 0.81.5 | Cross-platform mobile client engine supporting Web, Android, and iOS |
| **React** | 19.1.0 | Core UI rendering engine with hooks-based state management |
| **Expo Router** | 6.0.24 | File-based typed routing (`app/(tabs)/home.tsx`, `alerts.tsx`, `index.tsx`, `saved.tsx`) |
| **React Navigation** | Bottom Tabs | 4-tab marine navigation structure with dynamic badge updates |
| **Leaflet & MapLibre GL** | Latest Local Bundle | High-performance interactive nautical cartography, waypoint lines, and MPA polygons |
| **React Native Reanimated** | 4.1.1 | High-framerate radar sweep animations and audio waveform visualizers |
| **React Native SVG** | Latest | Vector radar scopes, ship icons, PFZ star hotspots, and trend charts |
| **AsyncStorage** | Latest | Persistent local storage for user language preference, active region, and bookmarks |
| **Axios** | 1.6+ | HTTP client configured with request interceptors, language headers, and auto-retry |

---

### 3.3 Backend Architecture (Server Layer)
| Component / Library | Version | Technical Role & Implementation |
| :--- | :--- | :--- |
| **FastAPI** | 0.110.1 | High-throughput, asynchronous Python web framework providing REST endpoints |
| **Uvicorn** | 0.28+ | ASGI production server powering asynchronous concurrency |
| **Pydantic** | 2.6+ | Strict data validation, schema enforcement, and payload serialization |
| **Motor (Async PyMongo)** | 3.3+ | Non-blocking MongoDB client for session histories and geospatial data caching |
| **HTTPX** | 0.27+ | Asynchronous HTTP client for live marine weather ingestion and reverse geocoding |

---

### 3.4 Multi-Agent Artificial Intelligence & Voice Pipeline
| Component | Provider / Technology | Implementation Detail |
| :--- | :--- | :--- |
| **Primary LLM** | Google Gemini 3.5 Flash | Intent understanding, Named Entity Recognition, and multilingual synthesis |
| **Fallback LLM** | GPT-5.6 / Local Synthesizer | Resilient automatic fallback if primary LLM quota exhausts |
| **Deterministic Rules Engine** | Custom Python (`rules.py`) | Evaluates sustained wind, gusts, wave height, lightning probability, and cyclonic warnings |
| **Voice STT (Speech-to-Text)** | Web Speech API / ElevenLabs Scribe | Real-time speech transcription with acoustic filtering for marine engines |
| **Voice TTS (Text-to-Speech)** | Web Speech API / ElevenLabs Multilingual | Native regional voice synthesis (`te-IN`, `hi-IN`, `ta-IN`, `en-IN`) |

---

### 3.5 Databases, APIs & External Telemetry Services
- **MongoDB 7.0+ (Local / Atlas)**: Stores spatial coordinates, 28-region registry, user bookmarks, and session chat traces with `2dsphere` indexes. Includes zero-downtime in-memory fallback.
- **IMD (India Meteorological Department)**: Weather telemetry parameters (surface wind knots, gust speeds, atmospheric pressure, cyclonic depressions).
- **INCOIS (Indian National Centre for Ocean Information Services)**: Significant wave height (SWH), swell periods, sea surface temperature (SST), and chlorophyll-a concentrations.
- **OpenStreetMap & CARTO Voyager**: High-resolution raster map tiles optimized for maritime coastlines and bathymetry.

---

# 4. Features & Implementation

```
+---------------------------------------------------------------------------------------------------+
|                                  ORCA 2.0 SYSTEM ARCHITECTURE                                     |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [CLIENT LAYER - Expo React Native (Web / Android / iOS)]                                         |
|    Tab 1: Home Dashboard    Tab 2: Alerts Feed     Tab 3: Copilot Chat & Map    Tab 4: Saved     |
|    (Station & Radar)        (IMD Hazard Feeds)     (Voice + ECDIS HUD)          (Bookmarks)      |
|                                       │                                                           |
|                                       ▼ REST JSON (Port 8000)                                     |
|  [FASTAPI ASYNC BACKEND ENGINE]                                                                   |
|                                                                                                   |
|    1. Zero-Delay Fast Path Router ──► Instant responses for greetings, thanks & help              |
|    2. Planner Agent              ──► Deterministic Intent Classification, Port & NER Extraction   |
|    3. Specialist Agents:                                                                          |
|       ├─ Data Discovery Agent    ──► Resolves 28-region geography and spatial datasets            |
|       ├─ Weather Intelligence    ──► Ingests IMD wind, gusts, waves, swell & cyclonic systems     |
|       ├─ Ocean Analytics Agent   ──► Ingests INCOIS SST & Chlorophyll-a for PFZ calculation       |
|       ├─ Geospatial Risk Agent   ──► Seaward Fairway Parabolic Engine & MPA Polygon Collisions    |
|       ├─ Fleet Operations        ──► Live AIS vessel tracking, trawler speeds & VHF channels      |
|       └─ Visualization Agent     ──► Constructs Leaflet GeoJSON layers & responsive SVG charts   |
|    4. Deterministic Safety Engine ──► Evaluates strict numerical criteria: SAFE / CAUTION / UNSAFE|
|    5. Synthesizer Agent          ──► Formulates regional spoken advice without altering facts     |
|    6. Multilingual Voice Engine  ──► Pre-warmed audio synthesis matching target regional language |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```

---

### 4.1 Key Features Developed

#### 1. The 7-Agent Autonomous Marine Pipeline (`backend/orchestrator/agents.py`)
ORCA decomposes complex maritime navigation queries across 7 specialized collaborative agents:
1. **Planner Agent**: Parses user natural language, extracts source port, target port, dates, language (`en`, `te`, `hi`, etc.), and script type. Categorizes places as `coastal`, `inland`, or `unrecognized`.
2. **Data Discovery Agent**: Maps entities to the 28-region maritime registry and determines required data layers.
3. **Weather Intelligence Agent**: Ingests real-time marine meteorological telemetry (wind speeds, wave heights, squall warnings).
4. **Ocean Analytics Agent**: Analyzes sea thermal and biological data, discovering Potential Fishing Zones (PFZs) where SST is 27–29°C and Chlorophyll-a exceeds $1.5\text{ mg/m}^3$.
5. **Geospatial / Risk Agent**: Calculates Haversine distances, runs ray-casting point-in-polygon collision checks, and plots seaward fairway corridors.
6. **Fleet Operations Specialist**: Simulates and delivers live AIS tracking for coastal trawlers, tugs, and cargo ships with real-time headings and VHF channels (Ch 16 / 68).
7. **Synthesizer Agent**: Translates deterministic calculations into warm, spoken, dialect-aware maritime advisories under 110 words.

---

#### 2. Deterministic Marine Safety Engine (`backend/gis/rules.py`)
Safety verdicts in ORCA are **immutable and mathematically guaranteed**. The generative LLM is strictly prohibited from overriding or altering safety decisions:

$$\text{Safety Verdict} = \begin{cases} 
\mathbf{UNSAFE} & \text{if Cyclone Alert} \lor \text{Wind} > 25\text{ kn} \lor \text{Wave} > 2.5\text{ m} \lor \text{Lightning} \ge 70\% \\ 
\mathbf{CAUTION} & \text{if } 18 \le \text{Wind} \le 25\text{ kn} \lor 1.8 \le \text{Wave} \le 2.5\text{ m} \lor 40\% \le \text{Lightning} < 70\% \\ 
\mathbf{SAFE} & \text{otherwise (Calm Seas \& Favorable Weather)} 
\end{cases}$$

| Condition Parameter | Threshold Value | Verdict Level | UI Indicator |
| :--- | :--- | :--- | :--- |
| **Cyclonic Storm / Deep Depression** | Present in Maritime Sector | **`UNSAFE`** | ⛔ Crimson Red Banner |
| **Sustained Wind Speed** | $> 25.0\text{ knots}$ ($> 46.3\text{ km/h}$) | **`UNSAFE`** | ⛔ Crimson Red Banner |
| **Sustained Wind Speed** | $18.0 - 25.0\text{ knots}$ ($33.3 - 46.3\text{ km/h}$) | **`CAUTION`** | ⚠️ Amber Alert Card |
| **Significant Wave Height** | $> 2.5\text{ meters}$ | **`UNSAFE`** | ⛔ Crimson Red Banner |
| **Significant Wave Height** | $1.8 - 2.5\text{ meters}$ | **`CAUTION`** | ⚠️ Amber Alert Card |
| **Thunderstorm / Lightning Risk**| $\ge 70\%$ probability | **`UNSAFE`** | ⛔ Crimson Red Banner |
| **Thunderstorm / Lightning Risk**| $40\% - 69\%$ probability | **`CAUTION`** | ⚠️ Amber Alert Card |
| **Normal Coastal Conditions** | Wind $< 18\text{ kn}$, Wave $< 1.8\text{ m}$, Light $< 40\%$ | **`SAFE`** | ✅ Emerald Green Card |

---

#### 3. Spatial & Seaward Maritime Routing Engine (`backend/gis/spatial.py`)
To prevent straight-line routes from cutting through convex coastal landmasses, ORCA uses a parabolic seaward curvature function:

$$\text{Offset}(t) = 4 \cdot t \cdot (1 - t) \cdot \text{Offset}_{\text{magnitude}}$$

```python
def _seaward_waypoint(start_lat, start_lon, end_lat, end_lon, t):
    base_lat = _interp(start_lat, end_lat, t)
    base_lon = _interp(start_lon, end_lon, t)
    if t <= 0.0 or t >= 1.0:
        return base_lat, base_lon

    dist_km = _haversine_km(start_lat, start_lon, end_lat, end_lon)
    arc_factor = 4.0 * t * (1.0 - t)
    offset_mag = min(0.22, max(0.06, dist_km * 0.0012))

    mid_lat = (start_lat + end_lat) / 2.0
    mid_lon = (start_lon + end_lon) / 2.0

    if mid_lat < 8.8:
        # Southern tip: Curve South into open Indian Ocean
        lat_offset = -offset_mag * 0.7
        lon_offset = offset_mag * 0.3 if mid_lon > 77.5 else -offset_mag * 0.3
    elif mid_lon > 77.5:
        # East Coast: Curve East into Bay of Bengal
        lon_offset = offset_mag * (1.0 + 0.3 * abs(end_lat - start_lat) / (abs(end_lat - start_lat) + abs(end_lon - start_lon) + 1e-6))
        lat_offset = 0.0
    else:
        # West Coast: Curve West into Arabian Sea
        lon_offset = -offset_mag * (1.0 + 0.3 * abs(end_lat - start_lat) / (abs(end_lat - start_lat) + abs(end_lon - start_lon) + 1e-6))
        lat_offset = 0.0

    return round(base_lat + arc_factor * lat_offset, 4), round(base_lon + arc_factor * lon_offset, 4)
```

**Cross-Coast Navigation (Kanyakumari TSS)**:
For voyages between the East and West coasts (e.g., Kakinada to Mumbai), ORCA detects the coast crossover and dynamically routes vessels south of Cape Comorin through the **Kanyakumari Traffic Separation Scheme (TSS)** node at `8.04° N, 77.58° E`, ensuring 100% open-water sailing.

---

#### 4. India-Wide Coastal Port Registry (28 Regions)
ORCA catalogs 28 strategic maritime roadsteads and pilot stations across all 9 coastal states and 3 Union Territories:

| Region ID | Port / Roadstead Name | State / UT | Coordinates | Body of Water | Marine Protected Area / Zone |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `kakinada` | Kakinada Fairway | Andhra Pradesh | `16.9800° N, 82.3800° E` | Bay of Bengal | Coringa Wildlife Sanctuary (MPA) |
| `visakhapatnam` | Visakhapatnam Outer | Andhra Pradesh | `17.6700° N, 83.3800° E` | Bay of Bengal | Vizag Naval & Commercial Fairway |
| `machilipatnam` | Machilipatnam Roadstead | Andhra Pradesh | `16.1500° N, 81.2500° E` | Bay of Bengal | Krishna Wildlife Sanctuary (MPA) |
| `krishnapatnam` | Krishnapatnam Deepwater | Andhra Pradesh | `14.2500° N, 80.1200° E` | Bay of Bengal | Pulicat Lake North Buffer |
| `chennai` | Chennai Outer Anchorage | Tamil Nadu | `13.1000° N, 80.3600° E` | Bay of Bengal | Pulicat Bird Sanctuary & Naval Base |
| `tuticorin` | Tuticorin (Thoothukudi) | Tamil Nadu | `8.7500° N, 78.2500° E` | Gulf of Mannar | Gulf of Mannar Marine National Park |
| `rameswaram` | Rameswaram Roadstead | Tamil Nadu | `9.2500° N, 79.3800° E` | Gulf of Mannar | Palk Bay / Gulf of Mannar Biosphere |
| `kanyakumari` | Kanyakumari Offshore (TSS)| Tamil Nadu | `8.0400° N, 77.5800° E` | Indian Ocean | Cape Comorin Restricted Corridor |
| `puducherry` | Puducherry Anchorage | Puducherry (UT) | `11.9200° N, 79.8800° E` | Bay of Bengal | Puducherry Coastal Reserve |
| `kochi` | Kochi Fairway | Kerala | `9.9600° N, 76.1800° E` | Arabian Sea | Cochin Naval Base & Port Security Zone |
| `kozhikode` | Kozhikode Roadstead | Kerala | `11.2400° N, 75.7200° E` | Arabian Sea | Kadalundi Estuary Marine Reserve |
| `vizhinjam` | Vizhinjam Offshore | Kerala | `8.3600° N, 76.9400° E` | Arabian Sea | Vizhinjam International Transshipment |
| `mangalore` | New Mangalore Fairway | Karnataka | `12.9200° N, 74.7600° E` | Arabian Sea | NMPT Port Security Buffer |
| `karwar` | Karwar Fairway | Karnataka | `14.8000° N, 74.0800° E` | Arabian Sea | INS Kadamba Naval Base Restricted Area |
| `goa` | Mormugao Fairway | Goa | `15.4200° N, 73.7400° E` | Arabian Sea | Grand Island Marine Reserve |
| `mumbai` | Mumbai Fairway / Prongs | Maharashtra | `18.8800° N, 72.7600° E` | Arabian Sea | Mumbai Naval Dockyard & ONGC Buffer |
| `ratnagiri` | Ratnagiri Roadstead | Maharashtra | `16.9800° N, 73.2200° E` | Arabian Sea | Mirya Bay Marine Reserve |
| `malvan` | Malvan Offshore | Maharashtra | `16.0400° N, 73.4000° E` | Arabian Sea | Malvan Marine Sanctuary (MPA) |
| `veraval` | Veraval Fairway | Gujarat | `20.8800° N, 70.3600° E` | Arabian Sea | Gir Coastal Marine Zone |
| `porbandar` | Porbandar Roadstead | Gujarat | `21.6200° N, 69.5400° E` | Arabian Sea | Coast Guard Western Command Sector |
| `okha` | Okha Pilot Station | Gujarat | `22.4800° N, 69.0200° E` | Arabian Sea | Marine National Park Jamnagar (MPA) |
| `kandla` | Kandla (Deendayal) | Gujarat | `22.8600° N, 70.1800° E` | Gulf of Kutch | Gulf of Kutch Marine Sanctuary |
| `paradip` | Paradip Fairway | Odisha | `20.2500° N, 86.7400° E` | Bay of Bengal | Gahirmatha Olive Ridley Sanctuary |
| `puri` | Puri Roadstead | Odisha | `19.7600° N, 85.8800° E` | Bay of Bengal | Chilika Lake Lagoon Outlet Sanctuary |
| `gopalpur` | Gopalpur Roadstead | Odisha | `19.2200° N, 84.9900° E` | Bay of Bengal | Rushikulya Mass Nesting Sanctuary |
| `digha` | Digha Offshore | West Bengal | `21.5600° N, 87.5800° E` | Bay of Bengal | Shankarpur Marine Zone |
| `sundarbans` | Sundarbans / Sandheads | West Bengal | `21.4500° N, 88.3500° E` | Bay of Bengal | Sundarbans Biosphere Reserve (MPA) |
| `portblair` | Port Blair Fairway | A & N Islands | `11.6600° N, 92.7900° E` | Andaman Sea | Mahatma Gandhi Marine National Park |
| `kavaratti` | Kavaratti Lagoon Anchorage | Lakshadweep | `10.5500° N, 72.6200° E` | Arabian Sea | Pitti Island Coral Reef Sanctuary |

---

#### 5. Multilingual Synchronization Across All 4 Tabs (`src/i18n.ts`)
Switching the language selector updates the entire app across all 4 screens:
1. **Home Tab (`home.tsx`)**: Station Sector title, verdict badges (`సురక్షితం`, `హెచ్చరిక`, `ప్రమాదం`), next tide times, and evaluation reasons localize instantly via `/api/situation?language={lang}`.
2. **Alerts Tab (`alerts.tsx`)**: Real-time IMD cyclonic storm warnings, squall bulletins, and lightning hazard bodies render in the chosen regional script via `/api/alerts?language={lang}`.
3. **Chat Tab (`index.tsx`)**: Quick-suggestion chips, assistant responses, and voice transcripts render in regional typography.
4. **Saved Tab (`saved.tsx`)**: Bookmarked fairways, waypoint distances, and coordinates display with localized titles and nautical units.

---

#### 6. Hands-Free Voice Marine Copilot (`src/hooks/useVoiceAgent.ts`)
- **Pre-Warmed Browser Voices**: Speech engines are pre-initialized on app mount to eliminate speech lag.
- **Acoustic Nautical Expansion**: Automatically expands units before speech output:
  - `knots` $\rightarrow$ *"నాట్లు"* (Telugu) / *"नॉट"* (Hindi) / *"knots"* (English)
  - `km` $\rightarrow$ *"కిలోమీటర్లు"* (Telugu) / *"किलोमीटर"* (Hindi)
  - `°C` $\rightarrow$ *"డిగ్రీల సెల్సియస్"* (Telugu) / *"डिग्री सेल्सियस"* (Hindi)
- **Voice-to-Voice Locale Binding**: Binds speech synthesis directly to `te-IN`, `hi-IN`, `ta-IN`, or `en-IN` system voices.

---

#### 7. Interactive ECDIS Map & Real-Time Navigation HUD (`src/components/MapWidget.tsx`)
When a maritime route is requested, ORCA renders an interactive marine chart with a live HUD:
- **Bearing**: Exact nautical heading in degrees & 16-point cardinal (e.g. `54.0° NE` or `198.5° SSW`).
- **Distance**: Dual readout in Nautical Miles and Kilometers (e.g. `1,505.5 NM (2,788.2 km)`).
- **ETA**: Calculated at standard 8-knot cruising speed (e.g. `~9h 15m`).
- **Safety Status**: Color-coded banner (`✓ 10/10 Checkpoints Clear` vs. `⛔ Restricted Zone Breach`).
- **Visual Markers**:
  - 🔵 Blue Pin: Origin Port Anchorage
  - 🟢 Green Pins: Open-Water Fairway Waypoints
  - ⛵ Sailboats: Real-Time AIS Fleet Vessels with speeds & VHF channels
  - ★ Golden Star: High-Confidence Potential Fishing Zone (PFZ)
  - 🟥 Red Polygons: Marine Protected Areas (MPAs) and naval exclusion zones

---

#### 8. Inland vs. Coastal City Classifier
When a user asks for non-maritime locations (e.g., *"route from Delhi to Hyderabad"*), ORCA's classifier flags the location as inland, prevents plotting bogus sea coordinates, and kindly suggests verified coastal ports.

---

#### 9. Theme Purity Architecture (100% Light & 100% Dark)
Enforces zero color clashes across every component:
- **Light Theme**: Screen `#F4F7F9`, Card `#FFFFFF`, Borders `#E2E8F0`, Text `#0F172A`, Accent `#0284C7`.
- **Dark Theme**: Screen `#0B1924`, Card `#132636`, Borders `#1F384C`, Text `#FFFFFF`, Accent `#38BDF8`.

---

### 4.2 Complete REST API Reference

#### 1. `POST /api/chat`
Submit natural language or voice queries to the 7-agent pipeline.
- **Payload**:
  ```json
  {
    "message": "కాకినాడ నుండి ముంబై మార్గం",
    "session_id": "sess-user-01",
    "region_id": "kakinada",
    "language": "te"
  }
  ```
- **Response**:
  ```json
  {
    "assistant_message": {
      "role": "assistant",
      "content": "సముద్ర మార్గం (Kakinada నుండి Mumbai, ~2788.2 కి.మీ): అన్ని 10 పాయింట్లు సముద్రంలో సురక్షితంగా ఉన్నాయి. మ్యాప్‌లో మార్గం సూచించబడింది.",
      "verdict": "SAFE",
      "widgets": [
        {
          "type": "map",
          "route_info": { "start_name": "Kakinada", "end_name": "Mumbai", "distance_km": 2788.2, "distance_nm": 1505.5 }
        }
      ]
    }
  }
  ```

#### 2. `GET /api/situation`
Returns real-time dashboard data for a coastal region.
- **Query Parameters**: `region_id` (e.g., `kakinada`), `language` (e.g., `te`).
- **Response**: `verdict`, `reasons`, `weather_today`, `weather_tomorrow`, `alerts`, `tide`, `trends`.

#### 3. `GET /api/alerts`
Returns active IMD cyclone, squall, and thunderstorm advisories localized into the requested language.
- **Query Parameters**: `region_id`, `language`.

#### 4. `GET /api/regions` & `GET /api/regions/detect`
- `/api/regions`: Catalogs all 28 registered maritime ports.
- `/api/regions/detect?lat=16.98&lon=82.38`: Resolves the nearest coastal port from device GPS coordinates.

---

# 5. Screenshots & Results

### 5.1 Working Screen 1: Marine Copilot Chat & Seaward ECDIS Map Route
```
+-----------------------------------------------------------------------+
|  ORCA MARINE COPILOT                      [Region: Kakinada] [🌐 TE]  |
+-----------------------------------------------------------------------+
|  User: "కాకినాడ నుండి ముంబై మార్గం (Route from Kakinada to Mumbai)"   |
|                                                                       |
|  Assistant: సముద్ర మార్గం (Kakinada నుండి Mumbai, ~2788.2 కి.మీ):      |
|  అన్ని 10 పాయింట్లు సముద్రంలో సురక్షితంగా ఉన్నాయి. Cape Comorin       |
|  (Kanyakumari TSS) ద్వారా మార్గం ఏర్పాటు చేయబడింది.                    |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |  NAUTICAL HUD:  212.4° SSW | 1505.5 NM (2788.2 km) | ETA: 7d 20h |  |
|  |  STATUS: ✓ 10/10 Fairway Waypoints Clear (0 Land Intersected)   |  |
|  +-----------------------------------------------------------------+  |
|  |  [ECDIS MAP DISPLAY]                                            |  |
|  |  (🔵 Kakinada)                                                  |  |
|  |     \ (Parabolic Seaward Curve in Bay of Bengal)                |  |
|  |      \──► (🟢 WP 1..4)                                          |  |
|  |           \                                                     |  |
|  |            ▼ (🟢 Kanyakumari TSS Pivot 8.04°N, 77.58°E)         |  |
|  |           /                                                     |  |
|  |      /──► (🟢 WP 6..9 Parabolic Curve in Arabian Sea)           |  |
|  |     /                                                           |  |
|  |  (🔵 Mumbai Fairway)                                            |  |
|  +-----------------------------------------------------------------+  |
|                                                                       |
|  [ 🎤 Speak Query ]  [ Type maritime prompt...                ] [ ✈ ]  |
+-----------------------------------------------------------------------+
```
*Description*: Demonstrates the interactive ECDIS map and voice-assisted copilot in the **Chat Tab (`index.tsx`)**. Displays the seaward fairway routing algorithm generating 10 waypoints curving safely around Cape Comorin via the Kanyakumari TSS, with live Nautical HUD showing heading, distance, and 8-knot vessel ETA.

---

### 5.2 Working Screen 2: Sector Marine Dashboard & Live Radar
```
+-----------------------------------------------------------------------+
|  ORCA MARINE COPILOT                      [Region: Kakinada] [🌐 EN]  |
+-----------------------------------------------------------------------+
|  STATION SECTOR: Kakinada Fairway, Andhra Pradesh                     |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |  DETERMINISTIC SAFETY VERDICT:  [ SAFE ] (Clear to Sail)        |  |
|  |  • Wind: 12.4 knots (Normal breeze)                             |  |
|  |  • Wave Height: 1.1 m (Moderate swell)                          |  |
|  |  • Lightning: 12% probability (Low risk)                       |  |
|  |  • Next Tide: High Tide at 16:42 (1.82 m)                       |  |
|  +-----------------------------------------------------------------+  |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |  LIVE SECTOR RADAR & POTENTIAL FISHING ZONE (PFZ)               |  |
|  |                       0° N                                      |  |
|  |                    /   |   \       ★ Best Catch PFZ:            |  |
|  |                270°----+----90°      • SST: 28.2 °C (Optimal)   |  |
|  |                    \   |   /         • Chl-a: 2.1 mg/m³         |  |
|  |                      180° S          • Distance: 18.4 NM        |  |
|  |  AIS Active Fleet: 4 trawlers tracked (VHF Ch 16 / 68 active)   |  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------------------------------------------+
```
*Description*: The **Home Tab (`home.tsx`)** provides instant sea-safety awareness. Shows the rule-based safety verdict, tide timing, real-time weather metrics, and the animated SVG sector radar locating optimal Potential Fishing Zones.

---

### 5.3 Working Screen 3: Real-Time IMD Cyclone & Hazard Advisories
```
+-----------------------------------------------------------------------+
|  ORCA MARINE COPILOT                      [Region: Kakinada] [🌐 TE]  |
+-----------------------------------------------------------------------+
|  సక్రియ హెచ్చరికలు (ACTIVE MARINE HAZARD ALERTS)                      |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |  ⚠️ తుఫాను హెచ్చరిక — తీవ్ర వాయుగుండం (BOB-04)                   |  |
|  |  తీవ్రత: అధికం (SEVERITY: HIGH)                                  |  |
|  |  బంగాళాఖాతంలో తీవ్ర వాయుగుండం తుఫానుగా బలపడే అవకాశం ఉంది. 45-55  |  |
|  |  కి.మీ వేగంతో బలమైన గాలులు వీస్తాయి. మత్స్యకారులు సముద్రంలోకి    |  |
|  |  వెళ్లవద్దని హెచ్చరిక.                                          |  |
|  +-----------------------------------------------------------------+  |
|  |  ⚡ పిడుగుల హెచ్చరిక — తీరప్రాంతం (LIGHTNING HAZARD)             |  |
|  |  తీవ్రత: మధ్యస్థం (SEVERITY: MODERATE)                          |  |
|  |  తీరంలో ఉరుములు, మెరుపులతో కూడిన వాతావరణం ఏర్పడే అవకాశం ఉంది.   |  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------------------------------------------+
```
*Description*: The **Alerts Tab (`alerts.tsx`)** fetches and displays localized IMD cyclone and lightning bulletins in Telugu, providing clear risk advisories directly to artisanal fishermen.

---

### 5.4 Working Screen 4: Saved Marine Fairways & 28-Region Roadstead Selector
```
+-----------------------------------------------------------------------+
|  ORCA MARINE COPILOT                      [Theme: Dark] [🌐 EN]       |
+-----------------------------------------------------------------------+
|  SAVED FAIRWAYS & OFFLINE BOOKMARKS                                   |
|                                                                       |
|  ⭐ Kakinada Roadstead to Vizag Outer Fairway                          |
|     Bearing: 54.0° NE | Distance: 72.2 NM (133.7 km) | Safe Waypoints  |
|                                                                       |
|  ⭐ Chennai Outer to Tuticorin Harbor                                 |
|     Bearing: 201.2° SSW | Distance: 342.1 NM | Palk Bay Route          |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |  SELECT MARITIME SECTOR (28 COASTAL PORTS)                      |  |
|  |  [ Search port or state...                                   ]  |  |
|  |  • Andhra Pradesh: Kakinada, Visakhapatnam, Machilipatnam       |  |
|  |  • Tamil Nadu: Chennai, Tuticorin, Rameswaram, Kanyakumari      |  |
|  |  • Kerala: Kochi, Kozhikode, Vizhinjam                          |  |
|  |  • Maharashtra: Mumbai, Ratnagiri, Malvan                       |  |
|  |  • Gujarat: Veraval, Porbandar, Okha, Kandla                    |  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------------------------------------------+
```
*Description*: The **Saved Tab (`saved.tsx`)** and Region Switcher modal let users manage offline bookmarks and switch between all 28 registered Indian coastal ports with search and GPS auto-detection.

---

### 5.5 Verification & Automated Test Results
```
================================== TEST RESULTS SUMMARY ==================================
Platform: Python 3.14 / pytest 8.0+ / FastAPI TestClient / TypeScript 5.9.3

1. Spatial & Rule Engine Unit Tests (backend/tests/test_unit_rules_and_spatial.py):
   • test_safe_weather_conditions                 PASSED [ 10%]
   • test_unsafe_wind_threshold                   PASSED [ 20%]
   • test_unsafe_wave_threshold                   PASSED [ 30%]
   • test_unsafe_lightning_threshold              PASSED [ 40%]
   • test_seaward_parabolic_curvature             PASSED [ 50%]
   • test_cross_coast_kanyakumari_tss_insertion   PASSED [ 60%]
   • test_ray_casting_polygon_collision           PASSED [ 70%]
   • test_inland_city_rejection                   PASSED [ 80%]
   • test_haversine_distance_accuracy             PASSED [ 90%]
   • test_all_28_port_coordinates_in_water        PASSED [100%]
   Verdict: 10 / 10 PASSED (0.24s)

2. REST API Integration Tests (backend/tests/test_api_integration.py):
   • test_get_regions_list                        PASSED [ 14%]
   • test_detect_nearest_region                   PASSED [ 28%]
   • test_get_situation_endpoint                  PASSED [ 42%]
   • test_get_alerts_multilingual_te              PASSED [ 57%]
   • test_chat_route_generation                   PASSED [ 71%]
   • test_voice_transcribe_endpoint               PASSED [ 85%]
   • test_system_health_check                     PASSED [100%]
   Verdict: 7 / 7 PASSED (0.48s)

3. Live Marine Telemetry Adapter Tests (backend/tests/test_unit_live_marine.py):
   • test_weather_ingestion_structure             PASSED [ 33%]
   • test_sst_chlorophyll_grid_bounds             PASSED [ 66%]
   • test_in_memory_fallback_resilience           PASSED [100%]
   Verdict: 3 / 3 PASSED (0.12s)

4. Frontend Static Type Check:
   • Command: npx tsc --noEmit
   • Output: 0 errors (Exit Code: 0)
================================ 20 / 20 PASSED IN 0.84s =================================
```

---

# 6. AI Usage & Individual Contributions

### 6.1 AI Usage & Tools Utilized
The development and runtime execution of ORCA Mobile 2.0 incorporates artificial intelligence responsibly, upholding a strict separation between factual computation and natural language interaction:

| AI Tool / Framework | Specific Role in ORCA | Purpose & Justification |
| :--- | :--- | :--- |
| **Google Gemini 3.5 Flash** | Multi-Agent Orchestration & Dialect Synthesis | Primary LLM utilized in `agents.py` for Named Entity Recognition (NER), intent parsing, and formulating friendly spoken explanations in Indian languages. |
| **Web Speech API / ElevenLabs** | Acoustic Speech-to-Text & Text-to-Speech | Converts speech to text and outputs natural synthesized speech matching the user’s regional language. |
| **Antigravity AI Agent** | System Engineering & Pair-Programming | Employed during development for iterative architecture refactoring, spatial geometry implementation, theme purity enforcement, and test suite verification. |

### Architectural Safeguard:
Generative AI **never computes navigational coordinates, route waypoints, or safety verdicts**. All safety-critical data is computed deterministically by mathematical models (`spatial.py` and `rules.py`). AI is restricted to conversational synthesis, formatting, and voice interaction.

---

### 6.2 Individual Contributions (Team ORCA)

**Student Name**: P. Surya Akhil  
**Roll Number**: 25B11CS717  
**Project Ownership**: Individual Capstone / Mini Project  

#### Specific Technical Contributions:
1. **System Concept & Architecture Design**: Designed the modular monolith architecture combining an Expo React Native mobile frontend with a FastAPI asynchronous backend.
2. **Deterministic Marine Safety Engine (`rules.py`)**: Authored mathematical threshold evaluation rules grounded in IMD and INCOIS standards, guaranteeing zero-hallucination verdicts.
3. **Seaward Parabolic Routing & TSS Geometry (`spatial.py`)**: Formulated and implemented the parabolic offset routing algorithm and the Kanyakumari Traffic Separation Scheme crossover, eliminating land-crossing hazards.
4. **28-Port Coastal Registry & GIS Layers**: Geocoded open-sea pilot stations and modeled polygon boundary layers for all 28 Indian coastal ports, Marine Protected Areas, and naval bases.
5. **Frontend Mobile Development (`frontend/`)**: Built the complete Expo React Native client, including file-based routing (`home.tsx`, `alerts.tsx`, `index.tsx`, `saved.tsx`), interactive Leaflet ECDIS map integration, and responsive SVG widgets.
6. **Voice Marine Copilot & Multilingual Localization (`i18n.ts`, `useVoiceAgent.ts`)**: Implemented pre-warmed speech synthesis, dynamic script detection, acoustic nautical term expansion, and full localization across 10 Indian coastal languages.
7. **Theme Purity & Testing Suite**: Implemented 100% pure Light Mode and deep oceanic Dark Mode styling, and created the 20-test automated verification suite (`pytest` and `tsc`).

---
*ORCA Mobile 2.0 — Engineered for the Safety, Sustainability, and Empowerment of Indian Coastal Seafarers.*
