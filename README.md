# ORCA – Ocean Risk & Coastal Advisory

**A marine intelligence and safety assistant for India's coastal waters.**

ORCA helps fishers, boat operators and coastal users understand sea conditions, check marine risks and plan routes through a simple dashboard and conversational assistant.

**[Open ORCA](https://orca-mobile-application.vercel.app/)** · **[View Source Code](https://github.com/Suryaakhilp18/ORCA_MOBILE_APP)**

---

## What is ORCA?

Marine information is often spread across different websites and reports. It can be difficult to understand weather conditions, sea warnings and route risks quickly, especially while working at sea.

ORCA brings useful marine information together in one place. Users can select a coastal region, view its marine situation and ask questions using text or voice. ORCA presents responses in a simple format, with maps and safety information where available.

## What can you do with ORCA?

- **Check sea conditions:** View wind, wave, weather and marine condition information.
- **Understand safety risks:** See a `SAFE`, `CAUTION` or `UNSAFE` assessment with the reasons behind it.
- **Ask the marine assistant:** Ask questions about weather, fishing areas, routes and coastal conditions in natural language.
- **Explore routes:** View route information and map-based guidance for selected coastal journeys.
- **Find fishing areas:** Explore potential fishing zone information and related ocean conditions.
- **Receive alerts:** View coastal warnings and important marine updates.
- **Use voice interaction:** Speak to the assistant and listen to its responses.
- **Choose your language:** Interact in supported Indian languages, including Telugu, Hindi and English.
- **Save locations:** Keep useful coastal locations and waypoints for quick access.

## How does it work?

1. Open ORCA and select a coastal region or allow location access.
2. Check the marine dashboard for weather, sea conditions and alerts.
3. Ask a question by typing or using voice.
4. ORCA collects the available marine information and evaluates relevant safety conditions.
5. The assistant explains the result in a simple way.
6. View the related map or route information when available.

## Data sources and services

ORCA uses a combination of external services and locally available reference data.

| Source / Service | How ORCA uses it |
| --- | --- |
| **Open-Meteo Marine API** | Marine wave information and sea conditions |
| **Open-Meteo Forecast API** | Weather, wind speed, wind gusts and temperature |
| **INCOIS** | Marine and ocean information referenced in the application's advisories |
| **IMD** | Meteorological safety guidance and warning context |
| **ISRO Bhuvan** | Mapping and geographic reference context |
| **OpenStreetMap** | Map and location-related information |
| **Google Gemini** | Natural-language understanding and response generation when configured |
| **ElevenLabs** | Speech-to-text and text-to-speech services when configured |

Some screens and responses can also use bundled regional data when a live service is unavailable. Data may therefore be live, cached or fallback data depending on the feature and connection. Check the source and time shown in the application before making a decision.

## Technology used

| Part | Technology |
| --- | --- |
| Mobile and web app | React Native, Expo and TypeScript |
| Backend | Python and FastAPI |
| AI assistant | Google Gemini, with configured fallback support |
| Voice | ElevenLabs, with configured fallback support |
| Maps and location | OpenStreetMap and mapping tools |
| Data storage | MongoDB, with in-memory fallback |
| Hosting | Vercel |

## Getting started

### Requirements

- Git
- Node.js and npm
- Python 3.10 or later
- A terminal or code editor

### 1. Download the project

```bash
git clone https://github.com/Suryaakhilp18/ORCA_MOBILE_APP.git
cd ORCA_MOBILE_APP
```

### 2. Start the backend

Open a terminal:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

**Windows (PowerShell):**
```powershell
.venv\Scripts\Activate.ps1
```

**macOS / Linux:**
```bash
source .venv/bin/activate
```

Install the required packages:

```bash
pip install -r requirements.txt
```

Create a file named `.env` inside the `backend` folder:

```env
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
EMERGENT_LLM_KEY=your_fallback_llm_key
MONGO_URL=mongodb://localhost:27017
DB_NAME=orca_db
```

Add only the keys for services you intend to use. Keep secret keys in the backend environment and never commit them to GitHub. MongoDB is optional for basic local testing because the backend includes an in-memory fallback.

Run the backend:

```bash
python -m uvicorn server:app --reload --host 127.0.0.1 --port 8000
```

The backend will be available at `http://127.0.0.1:8000`. Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### 3. Start the frontend

Open a second terminal from the project folder:

```bash
cd frontend
npm install
npx expo start
```

To run the web version:

```bash
npx expo start --web
```

For local web development, the frontend is configured to connect to the backend on port `8000`. For a different backend address, set `EXPO_PUBLIC_BACKEND_URL` in the frontend environment.

## API and backend

The FastAPI backend provides endpoints for the main application features, including:

- Health checks
- Marine situation and alerts
- Chat assistant
- Coastal regions and location detection
- Route and geographic information
- Voice transcription and speech generation
- Saved locations and notifications

When the backend is running, visit **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)** to explore the available endpoints.

## Important safety note

ORCA is a decision-support and information tool. It is **not a replacement** for official IMD or INCOIS warnings, local port authorities, Coast Guard instructions, a vessel's safety equipment or a qualified skipper's judgement.

Marine conditions can change quickly. Information may be delayed, incomplete or based on fallback data. Always verify the latest official advisories and local conditions before sailing. Never treat an ORCA status alone as permission to go to sea.

## Current scope and limitations

- Some information may come from cached or bundled regional reference data when live sources are unavailable.
- Fleet and vessel information may be simulated; do not assume it is a live AIS feed.
- Fishing-zone information should be treated as guidance and verified against current official advisories.
- Route suggestions are informational and should not replace nautical charts, navigational equipment or professional judgement.
- Feature availability can depend on network access and configured API services.

## Project structure

```text
ORCA_MOBILE_APP/
├── api/          # Backend entry point for deployment
├── backend/      # FastAPI server and data services
├── frontend/     # Expo mobile and web application
├── vercel.json   # Deployment configuration
└── README.md     # Project overview and setup guide
```

## Contributing

Contributions and suggestions are welcome.

1. Fork the repository.
2. Create a branch for your changes.
3. Make and test your changes.
4. Open a pull request with a short explanation.

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

**Built to make marine information easier to understand and coastal decisions better informed.** 🌊