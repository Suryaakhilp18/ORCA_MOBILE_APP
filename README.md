# 🌊 ORCA — Ocean Risk & Coastal Advisory

### AI-Powered Marine Safety, Intelligent Navigation & Coastal Intelligence Platform

\<p align="center">   \<strong>Making maritime intelligence accessible, understandable, and actionable.\</strong> \</p>

\<p align="center">   \<a href="[https://orca-mobile-application.vercel.app](https://orca-mobile-application.vercel.app)">Live Application\</a> •   \<a href="[https://github.com/Suryaakhilp18/ORCA_MOBILE_APP](https://github.com/Suryaakhilp18/ORCA_MOBILE_APP)">GitHub Repository\</a> \</p>

---

## 1. Overview

**ORCA (Ocean Risk & Coastal Advisory)** is an AI-powered maritime intelligence platform designed to improve marine safety, navigation awareness, and coastal decision-making.

The platform combines real-time marine weather information, geospatial analysis, deterministic safety assessments, and multi-agent AI orchestration to provide contextual maritime insights.

ORCA is designed with particular attention to the needs of fishermen, coastal communities, and maritime operators who require accessible and understandable information about changing sea conditions.

Instead of presenting raw environmental data, ORCA aims to translate complex marine information into practical insights through an interactive dashboard and a multilingual conversational assistant.

### Project Vision

To make reliable maritime intelligence more accessible by combining oceanographic data, artificial intelligence, geospatial technologies, and multilingual communication.

## 2. Problem Statement

Maritime communities face several challenges when accessing and interpreting marine information.

| Challenge                    | Impact                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| Unpredictable sea conditions | Cyclones, strong winds, and high waves increase operational risks.                           |
| Information accessibility    | Technical weather bulletins can be difficult for local fishing communities to understand.    |
| Language barriers            | Important marine advisories may not be available in users' preferred languages.              |
| Limited connectivity         | Offshore connectivity can interrupt access to online services.                               |
| Navigation uncertainty       | Straight-line navigation does not account for coastlines and potential geographical hazards. |
| Fragmented information       | Weather, ocean conditions, and navigation information are often accessed separately.         |

ORCA addresses these challenges through a unified platform that combines marine intelligence, safety analysis, navigation assistance, and conversational interaction.

## 3. Core Features

### 3.1 Marine Safety Intelligence

ORCA evaluates marine conditions and provides three levels of safety assessment:

- **SAFE:** No configured critical safety conditions have been detected.
- **CAUTION:** Environmental conditions require additional attention.
- **UNSAFE:** One or more configured critical safety conditions have been detected.

The safety assessment uses deterministic rules implemented separately from generative AI.

The assessment considers available parameters such as:

- Wind speed and gusts.
- Wave height.
- Lightning probability.
- Cyclone and severe weather warnings.
- Regional marine conditions.

Each assessment is intended to include the reasons behind its classification, helping users understand the factors influencing the result.

### 3.2 Multi-Agent AI Orchestration

ORCA uses a specialized seven-agent workflow to process maritime queries.

| Agent                         | Responsibility                                                       |
| ----------------------------- | -------------------------------------------------------------------- |
| 1. Planner Agent              | Identifies user intent, locations, requested dates, and language.    |
| 2. Data Discovery Agent       | Retrieves relevant information from the coastal region registry.     |
| 3. Weather Intelligence Agent | Processes available marine weather information.                      |
| 4. Ocean Analytics Agent      | Evaluates oceanographic indicators and potential fishing conditions. |
| 5. Geospatial & Risk Agent    | Performs geographical analysis and route-related risk assessment.    |
| 6. Fleet Operations Agent     | Handles vessel-related information when supported data is available. |
| 7. Synthesizer Agent          | Combines the results into understandable, contextual responses.      |

This architecture separates information retrieval, domain-specific analysis, safety evaluation, and response generation.

### 3.3 Intelligent Maritime Navigation

The navigation module provides geographical analysis to support maritime route planning.

Key capabilities include:

- Route generation between selected coastal locations.
- Geospatial waypoint calculations.
- Distance estimation in nautical miles.
- Bearing and directional information.
- Estimated journey duration.
- Coastal boundary awareness.
- Identification of potential route conflicts with configured restricted areas.
- Consideration of relevant maritime separation zones.

The system is designed to provide more meaningful geographical context than simple straight-line distance calculations.

### 3.4 Potential Fishing Zone Intelligence

ORCA incorporates oceanographic indicators to help identify potentially favourable fishing areas.

The analysis considers:

- Sea Surface Temperature (SST).
- Chlorophyll-a concentration.
- Ocean temperature gradients.
- Potential biological convergence zones.
- Distance from coastal reference locations.

The system aims to transform these indicators into understandable fishing-related insights.

Fishing recommendations are indicative estimates and should not be interpreted as guaranteed catch predictions.

### 3.5 Multilingual Voice Assistant

ORCA includes a conversational interface that supports text-based and voice-based interaction.

**Supported languages:**

- Telugu (తెలుగు)
- Hindi (हिन्दी)
- English

Key capabilities:

- Automatic language identification.
- Natural-language maritime queries.
- Speech-to-text interaction.
- Text-to-speech responses.
- Spoken-language text normalization.
- Natural pronunciation of nautical terminology.
- Contextual responses in the detected language.

The voice subsystem integrates ElevenLabs speech synthesis and browser-based speech capabilities.

### 3.6 Offline Resilience

ORCA incorporates fallback mechanisms to improve usability when backend connectivity is unavailable.

These include:

- Bundled regional marine datasets.
- Locally available situation information.
- Cached or static dashboard information.
- Client-side fallback handling.
- Defensive handling of missing network responses.

**Important:** Offline fallback information is not equivalent to live marine intelligence. Real-time weather updates, external AI services, and other network-dependent capabilities require connectivity.

### 3.7 Interactive Marine Dashboard

The application provides a dedicated dashboard for accessing important maritime information.

Dashboard components include:

- Marine condition indicators.
- Weather and ocean telemetry.
- Interactive geographical maps.
- Radar-style visualizations.
- Marine situation summaries.
- Hazard and alert information.
- Saved locations and waypoints.

The interface is designed to present complex maritime information through a clear and accessible visual experience.

---

## 4. System Architecture

ORCA follows a modular architecture consisting of a frontend application, backend API services, specialized AI agents, geospatial processing, and external data integrations.

### High-Level Processing Workflow

**User Interaction → Intent Recognition → Data Discovery → Marine Intelligence Processing → Geospatial Analysis → Safety Assessment → Response Generation → Voice or Visual Output**

### Architecture Components

| Layer               | Responsibility                                                        |
| ------------------- | --------------------------------------------------------------------- |
| Presentation Layer  | Dashboard, conversational interface, maps, and visualizations.        |
| API Layer           | Handles client requests and communication with backend services.      |
| Orchestration Layer | Coordinates the seven specialized agents.                             |
| Intelligence Layer  | Processes weather, oceanographic, and geographical information.       |
| Safety Layer        | Applies deterministic rules to assess marine conditions.              |
| Voice Layer         | Handles speech processing and audio generation.                       |
| Persistence Layer   | Manages session information and supported saved data.                 |
| External Services   | Provides marine weather, oceanographic, mapping, and AI capabilities. |

### Architecture Principles

- Separation of concerns between AI reasoning and safety evaluation.
- Modular agent responsibilities.
- Reusable frontend components.
- Centralized API communication.
- Resilient handling of network failures.
- Clear distinction between live information and fallback datasets.

---

## 5. Marine Safety Assessment Methodology

A key architectural principle of ORCA is that safety classifications should not depend exclusively on generative AI.

The backend includes a dedicated deterministic rules module responsible for evaluating available marine parameters.

The assessment process follows these stages:

1. Retrieve available environmental information.
2. Validate the relevant input parameters.
3. Evaluate conditions against configured safety thresholds.
4. Determine the applicable safety classification.
5. Identify the factors contributing to the result.
6. Pass the assessment and supporting context to the response-generation layer.
7. Present the result in an understandable format.

The implementation is located in the backend safety rules module.

This approach improves transparency and makes safety decisions easier to inspect and test.

Safety classifications are advisory outputs, not certified maritime clearance or a substitute for official warnings, nautical charts, professional navigation systems, or the judgement of qualified operators.

---

## 6. Coastal Monitoring Registry

ORCA includes a regional registry covering 28 coastal locations across mainland India and island territories.

| State / Union Territory   | Locations                                     |
| ------------------------- | --------------------------------------------- |
| Andhra Pradesh            | Kakinada, Visakhapatnam, Machilipatnam        |
| Tamil Nadu                | Chennai, Thoothukudi, Rameswaram, Kanyakumari |
| Kerala                    | Kochi, Kozhikode, Vizhinjam                   |
| Karnataka                 | Mangalore, Karwar                             |
| Goa                       | Mormugao                                      |
| Maharashtra               | Mumbai, Ratnagiri, Malvan                     |
| Gujarat                   | Veraval, Porbandar, Okha, Kandla              |
| Odisha                    | Paradip, Puri, Gopalpur                       |
| West Bengal               | Digha, Sundarbans                             |
| Andaman & Nicobar Islands | Port Blair                                    |
| Lakshadweep               | Kavaratti                                     |
| Puducherry                | Puducherry                                    |

The registry supports regional selection, location discovery, and access to location-specific marine information.

The inclusion of a location in the registry does not imply that it has a dedicated live observation station or independently verified real-time sensor coverage.

---

## 7. Technology Stack

| Category              | Technologies                              |
| --------------------- | ----------------------------------------- |
| Frontend              | React Native, Expo, React, TypeScript     |
| Navigation            | Expo Router                               |
| Backend               | Python, FastAPI, Uvicorn                  |
| AI Integration        | Google Gemini API                         |
| Agent Orchestration   | Python-based multi-agent architecture     |
| Voice Synthesis       | ElevenLabs                                |
| Speech Processing     | Web Speech API                            |
| Marine Weather        | Open-Meteo Marine API                     |
| Oceanographic Data    | INCOIS and ISRO-related data integrations |
| Mapping               | Leaflet, OpenStreetMap                    |
| Geospatial Processing | Turf.js, Haversine calculations           |
| Visualization         | React Native SVG                          |
| Database              | MongoDB, in-memory session storage        |
| Deployment            | Vercel                                    |
| Testing               | Pytest, TypeScript compiler               |

Technology versions and external service availability should be verified against the current dependency configuration before deployment.

---

## 8. Repository Structure

The repository is organized into frontend, backend, API, and supporting documentation modules.

| Directory / File           | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `api/`                     | Deployment entry point for the backend.            |
| `backend/`                 | Core backend application and services.             |
| `backend/data_adapters/`   | Marine data retrieval and regional datasets.       |
| `backend/gis/`             | Geospatial calculations and navigation logic.      |
| `backend/orchestrator/`    | Agent coordination and deterministic safety rules. |
| `backend/notifications/`   | Notification and alert services.                   |
| `backend/voice/`           | Speech synthesis services.                         |
| `backend/tests/`           | Backend unit and integration tests.                |
| `frontend/`                | Expo and React Native application.                 |
| `frontend/app/`            | Application screens and navigation.                |
| `frontend/src/components/` | Reusable interface components.                     |
| `frontend/src/context/`    | Shared application state.                          |
| `frontend/src/hooks/`      | Reusable application hooks.                        |
| `frontend/src/utils/`      | Navigation and supporting utilities.               |
| `documentation/`           | Project documentation and supporting materials.    |
| `tests/`                   | Additional project tests.                          |

The root directory also contains dependency configuration, deployment settings, and project documentation.

---

## 9. API Reference

The backend exposes REST endpoints for marine intelligence, user interaction, navigation support, and voice processing.

| Method | Endpoint                | Purpose                                               |
| ------ | ----------------------- | ----------------------------------------------------- |
| GET    | `/api/health`           | Checks backend service health.                        |
| GET    | `/api/regions`          | Retrieves registered coastal locations.               |
| GET    | `/api/regions/detect`   | Identifies a nearby coastal region using coordinates. |
| POST   | `/api/chat`             | Processes conversational maritime queries.            |
| GET    | `/api/situation`        | Retrieves regional marine situation information.      |
| GET    | `/api/alerts`           | Retrieves regional alert information.                 |
| GET    | `/api/alerts/stream`    | Provides alert updates through Server-Sent Events.    |
| POST   | `/api/voice/speak`      | Generates spoken responses.                           |
| POST   | `/api/voice/transcribe` | Processes audio transcription requests.               |
| GET    | `/api/locations`        | Retrieves saved locations.                            |
| POST   | `/api/locations`        | Saves a location or waypoint.                         |
| DELETE | `/api/locations/{id}`   | Removes a saved location.                             |
| GET    | `/api/geocode`          | Resolves geographical search queries.                 |

### API Documentation

The backend provides interactive API documentation through FastAPI's Swagger interface when the application is running locally.

Endpoint availability and request schemas should be confirmed against the current backend implementation.

---

## 10. Installation and Local Setup

### Prerequisites

Before setting up ORCA, ensure that the following tools are available:

- Git
- Node.js and npm
- Python
- A code editor such as Visual Studio Code
- Required external API credentials

Use dependency versions compatible with the project's Expo and Python configurations.

### Step 1: Clone the Repository

Clone the ORCA repository from GitHub and open the project directory in your development environment.

Repository: [https://github.com/Suryaakhilp18/ORCA_MOBILE_APP](https://github.com/Suryaakhilp18/ORCA_MOBILE_APP)

### Step 2: Configure Environment Variables

Configure the required environment variables according to the backend and frontend service configuration.

The documented integrations include:

| Variable             | Purpose                                     |
| -------------------- | ------------------------------------------- |
| `GEMINI_API_KEY`     | Google Gemini API authentication.           |
| `ELEVENLABS_API_KEY` | ElevenLabs speech synthesis authentication. |
| `PORT`               | Backend server port configuration.          |

Use the appropriate environment file location for each service.

**Security requirements:**

- Never commit API keys or credentials.
- Keep environment files excluded from version control.
- Use deployment environment variables for production.
- Do not expose private API keys through frontend bundles.

### Step 3: Configure the Backend

Navigate to the backend directory.

Install the dependencies listed in its requirements configuration and start the FastAPI application using the project's development server configuration.

Once running, access the interactive API documentation through the local Swagger endpoint.

### Step 4: Configure the Frontend

Navigate to the frontend directory.

Install the dependencies defined in the frontend package configuration and start the Expo development environment in web mode.

Open the local application address displayed by the development server.

### Step 5: Verify Integration

Confirm that:

- The frontend loads successfully.
- Backend health checks respond.
- Coastal locations are accessible.
- Marine situation information is returned.
- Chat requests are processed.
- Voice services work when credentials are configured.
- Fallback handling works when external services are unavailable.

---

## 11. Testing and Verification

ORCA includes backend testing and frontend type validation.

### Backend Testing

The documented test coverage includes:

- Marine safety classification.
- Safety threshold boundaries.
- Geospatial calculations.
- Distance and bearing calculations.
- Regional data retrieval.
- API endpoint integration.
- Conversational request processing.
- Saved-location operations.

The repository's existing test report records 17 passing backend tests.

This is a recorded test result, not a guarantee that every deployment or subsequent code revision will pass the same tests.

### Frontend Validation

The frontend uses TypeScript validation to identify type-related issues and improve development reliability.

### Recommended Verification Areas

- API availability and error handling.
- Invalid or missing environmental inputs.
- External service timeouts.
- Voice permissions and audio playback.
- Network interruption and recovery.
- Accuracy of location and route calculations.
- Mobile and desktop responsiveness.

---

## 12. Security, Reliability and Operational Limitations

Marine applications involve safety-sensitive information. ORCA should therefore distinguish between technical functionality and operationally verified capabilities.

Important considerations include:

1. Live marine data depends on external provider availability and geographic coverage.
2. Offline datasets may be outdated and must not be treated as current weather observations.
3. AI-generated explanations may contain errors and should not override verified source information.
4. Navigation calculations are not a replacement for certified Electronic Chart Display and Information Systems (ECDIS).
5. Route recommendations require validation against authoritative nautical charts, navigational restrictions, and current conditions.
6. Vessel tracking and AIS-related functionality depend on the availability and reliability of the underlying data source.
7. Fishing-zone indicators are estimates, not guaranteed catch predictions.
8. Safety assessments depend on the completeness and quality of their input data.

**Marine Safety Disclaimer**

ORCA is a decision-support and informational platform developed to improve access to maritime intelligence. It is not a certified navigation system, official maritime warning service, or replacement for professional maritime judgement. Always consult official IMD, INCOIS, port authorities, and applicable maritime advisories before making operational decisions at sea.

---

## 13. Future Development Roadmap

The following enhancements represent potential future development directions.

### 13.1 Expanded Language Support

Extend voice and conversational capabilities to additional Indian coastal languages, including Tamil, Malayalam, Kannada, Bengali, Marathi, Gujarati, and Odia.

### 13.2 On-Device AI and Offline Voice

Explore lightweight speech recognition and synthesis models to improve accessibility in low-connectivity environments.

### 13.3 Satellite and Navigation Integration

Investigate integration with NavIC-compatible receivers and satellite communication systems for enhanced positioning and emergency communication.

### 13.4 Advanced Bathymetric Intelligence

Explore authoritative bathymetric datasets, tidal information, and depth-clearance calculations for more detailed navigational awareness.

### 13.5 Computer Vision for Fishing Applications

Investigate fish species identification, catch classification, and size estimation using computer vision.

### 13.6 Advanced Marine Analytics

Expand oceanographic analysis, historical marine trends, regional hazard forecasting, and data visualization.

---

## 14. Project Information

**Project Name:** ORCA – Ocean Risk & Coastal Advisory

**Project Category:** Artificial Intelligence, Marine Technology, Geospatial Intelligence and Decision Support

**Primary Focus:** Maritime safety, coastal intelligence, navigation assistance, and fishing-related insights.

**Lead Developer:** P. Surya Akhil

**GitHub Repository:** [https://github.com/Suryaakhilp18/ORCA_MOBILE_APP](https://github.com/Suryaakhilp18/ORCA_MOBILE_APP)

**Live Application:** [https://orca-mobile-application.vercel.app](https://orca-mobile-application.vercel.app)

### Acknowledgements

ORCA builds upon technologies and publicly available resources from the broader developer and scientific ecosystem, including:

- Google Gemini
- Open-Meteo
- INCOIS
- ISRO
- ElevenLabs
- OpenStreetMap
- Leaflet
- React Native
- Expo
- FastAPI

Refer to the respective providers' documentation and licensing terms for their data, APIs, and software.

### License

A license declaration should be added here only after the repository's actual license file and permissions have been verified. Until then, no open-source license is asserted.

---

\<p align="center">   \<strong>ORCA — Intelligence for Safer Seas.\</strong>   \<br/>   Building a more accessible and informed maritime ecosystem through technology. \</p>
