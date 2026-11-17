# ORCA
## Marine Ecosystem Reasoning with Collaborative Agents

**AI-powered Marine Intelligence and Coastal Safety Platform**

**Designed and Developed by Surya Akhil and Team**

**Understand the sea. Assess the risks. Make informed decisions.**

---

## Executive Overview

ORCA is an AI-powered marine intelligence platform designed to make coastal and ocean information easier to access, understand and use. It brings marine weather, sea conditions, coastal alerts, route information and AI assistance together in one application.

Marine information is often spread across different sources and can be difficult to interpret quickly. ORCA helps fishers, boat operators, coastal communities and other marine users by presenting available information through a simple dashboard, interactive maps and a multilingual conversational assistant.

Users can select a coastal region, explore sea conditions, ask questions through text or voice, and receive explanations that highlight relevant conditions and potential risks.

## Key Features

### 1. Marine Conditions Dashboard
- View marine and weather conditions for selected coastal regions.
- Explore wave height, wind speed, wind gusts and weather conditions.
- Access current and forecast information where available.
- View the data source and time information when provided by the application.

### 2. AI Marine Assistant
- Ask natural-language questions about coastal conditions, weather, fishing areas and marine safety.
- Understand the user's question and identify the type of marine information required.
- Combine available data with rule-based checks to prepare a relevant response.
- Receive clear explanations instead of having to interpret raw data.

### 3. Marine Safety Assessment
- Evaluate relevant conditions such as wind, gusts, waves and weather.
- Present a simple safety status such as SAFE, CAUTION or UNSAFE where supported.
- Explain the conditions and factors behind the assessment.
- Help users identify potential hazards before planning marine activities.

### 4. Route Safety and Map View
- Explore route-related information between selected coastal locations.
- View geographic information and route details on a map.
- Highlight relevant marine conditions and potential hazards along a requested route where data is available.
- Present route guidance as decision-support information, not as a replacement for navigation systems.

### 5. Potential Fishing Zone Information
- Explore available potential fishing zone information.
- View relevant ocean conditions that may help users understand fishing areas.
- Use location-based information to make the results more relevant.

### 6. Coastal Alerts and Advisories
- Access available marine warnings and coastal alert information.
- Understand weather-related risks and changing sea conditions.
- Review the information available for the selected region.

### 7. Multilingual Voice Assistant
- Ask questions using voice where the feature is available.
- Convert speech into text for the AI assistant.
- Listen to generated responses through text-to-speech.
- Support multilingual interaction, including English and Indian languages such as Telugu and Hindi.
- Use a text-based experience when voice services are unavailable.

### 8. Location-Based Marine Information
- Select a coastal region manually or use device location where permission is granted.
- Adapt information and responses to the selected location.
- Explore supported coastal regions through the application.

## How ORCA Works

1. **Select a location:** Choose a coastal region or allow the application to use your location.
2. **Explore conditions:** ORCA displays the available marine and weather information for that region.
3. **Ask a question:** Enter a question through text or voice.
4. **Understand the request:** The AI assistant identifies the user's intent and the information needed.
5. **Evaluate conditions:** Available data and safety rules are used to assess relevant marine conditions.
6. **Get an explanation:** ORCA presents the result in a simple response with supporting information where available.

## Data Sources and Services

ORCA uses live external services where configured, along with cached and regional reference data. The availability of each source may vary by feature and deployment.

| Source / Service | Purpose in ORCA |
| --- | --- |
| **Open-Meteo Marine API** | Marine wave information, including wave height, direction and period |
| **Open-Meteo Forecast API** | Weather conditions, wind speed, wind gusts and temperature |
| **INCOIS** | Indian ocean information and official marine advisory context |
| **IMD** | Meteorological information and weather warning context |
| **ISRO Bhuvan** | Geographic and earth-observation reference context |
| **OpenStreetMap** | Map display and geographic reference information |
| **Google Gemini** | Natural-language understanding, planning and AI response generation when configured |
| **ElevenLabs** | Speech recognition and voice generation when configured |
| **OpenAI services** | Configured fallback for AI and voice features through the backend service |

**Data availability:** The application currently fetches marine and forecast weather data from Open-Meteo and uses caching and regional fallback data when live data is unavailable. INCOIS, IMD and ISRO Bhuvan are included as relevant official information and geographic reference sources; this README does not imply that every one of them is connected as a direct live API feed.

## Technology Stack

| Category | Technology |
| --- | --- |
| Mobile and Web Application | React Native, Expo and TypeScript |
| Backend | Python and FastAPI |
| AI Assistant | Google Gemini with configured fallback support |
| Voice Processing | ElevenLabs with configured OpenAI fallback support |
| Database | MongoDB with fallback handling for local development |
| Maps and Location | OpenStreetMap and location services |
| API Communication | HTTPX and REST APIs |
| Deployment | Vercel |

## Getting Started

### Prerequisites
- Git
- Node.js and npm
- Python 3.10 or later
- MongoDB (optional for basic local testing)

### 1. Clone the Repository
```bash
git clone https://github.com/Suryaakhilp18/ORCA_MOBILE_APP.git
cd ORCA_MOBILE_APP
```

### 2. Set Up the Backend
```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

**Windows PowerShell**
```powershell
.venv\Scripts\Activate.ps1
```

**macOS / Linux**
```bash
source .venv/bin/activate
```

Install the Python dependencies:
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file inside the `backend` directory. Add the keys for the services you want to use:
```env
GEMINI_API_KEY=your_gemini_api_key
EMERGENT_LLM_KEY=your_fallback_llm_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
MONGO_URL=mongodb://localhost:27017
DB_NAME=orca_db
```

- `GEMINI_API_KEY` is used for the primary AI assistant.
- `EMERGENT_LLM_KEY` is used for configured AI and voice fallback services.
- `ELEVENLABS_API_KEY` is used for voice features.
- `MONGO_URL` and `DB_NAME` configure MongoDB storage.

Keep API keys private. Do not upload your `.env` file or secret keys to GitHub. Some features may work without optional service keys, but AI or voice functionality may be limited.

### 4. Run the Backend

From the `backend` directory, run:
```bash
python -m uvicorn server:app --reload --host 127.0.0.1 --port 8000
```

The backend will run at `http://127.0.0.1:8000`.

Open the interactive API documentation at:

[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 5. Set Up and Run the Frontend

Open a second terminal from the project root:
```bash
cd frontend
npm install
npx expo start
```

To run the web application:
```bash
npx expo start --web
```

The Expo development server will show the available options for opening the application on web or a connected device.

## Project Structure

```text
ORCA_MOBILE_APP/
├── api/             # Deployment API entry point
├── backend/         # FastAPI application and data services
│   ├── data_adapters/ # Marine data and regional reference data
│   ├── orchestrator/  # AI planning and response coordination
│   ├── voice/         # Speech recognition and voice generation
│   └── server.py      # Backend application
├── frontend/        # Expo mobile and web application
├── vercel.json      # Deployment configuration
└── README.md        # Project overview and setup guide
```

## Safety, Scope and Limitations

ORCA is designed to support awareness and decision-making. It is not an official forecasting authority and must not be treated as a replacement for official warnings, nautical charts, navigation equipment, local port authorities, Coast Guard instructions or a qualified skipper's judgement.

- Marine conditions can change quickly. Always check the latest official IMD and INCOIS advisories before going to sea.
- Data may be live, cached or based on regional fallback information. Check the source and timestamp shown in the application.
- Route information is advisory and is not a certified navigational route.
- Potential fishing zone information is guidance and should be verified with current official information.
- Do not assume vessel or fleet displays represent a live AIS feed unless the application explicitly identifies a verified live source.
- Never make a decision to sail based only on an ORCA safety label or AI-generated response.

## Future Scope

- Broader coverage of official marine datasets and verified real-time advisories.
- Improved route risk analysis using additional ocean and weather information.
- More Indian language and regional voice support.
- Better offline access to essential regional information.
- Expanded tools for coastal communities, fishers and marine organisations.

## Contributing

Contributions, suggestions and feedback are welcome.

1. Fork the repository.
2. Create a new branch for your changes.
3. Make and test your updates.
4. Submit a pull request with a clear description of the changes.

## License and Credits

ORCA is developed as a marine intelligence and coastal safety project.

**Designed and Developed by Surya Akhil and Team.**

---

**ORCA — Making marine information easier to understand and coastal decisions better informed.**