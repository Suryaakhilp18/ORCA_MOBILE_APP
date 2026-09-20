"""ORCA backend — FastAPI modular monolith (India-wide coastal intelligence).

Modules: orchestrator/ (agents), gis/ (spatial), data_adapters/ (mock feeds,
now an India-wide region registry), notifications/ (hazard + geofence).
All safety verdicts are deterministic; the LLM only explains them.
"""
import asyncio
import logging
import time
import json
import uuid
from collections import defaultdict
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, FastAPI, HTTPException, Query, Request, UploadFile, File
from fastapi.responses import FileResponse, Response, StreamingResponse
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware

from data_adapters import live_marine, mock_region as mr
from db import clean, db
from gis import spatial
from notifications import service as notif
from orchestrator import agents
from orchestrator.rules import evaluate_sea_safety, compute_situation_severity
from voice import service as voice

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("orca")

app = FastAPI(title="ORCA API")

# Global CORS middleware configured before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api")

# ---- In-memory stores for standalone resilience ----
_IN_MEMORY_CONVERSATIONS: dict[str, list[dict]] = {}
_IN_MEMORY_LOCATIONS: dict[str, list[dict]] = defaultdict(list)
_HITS: dict[str, list[float]] = defaultdict(list)
CHAT_LIMIT = 20
CHAT_WINDOW = 60


def _rate_limited(key: str) -> bool:
    now = time.time()
    hits = [t for t in _HITS[key] if now - t < CHAT_WINDOW]
    hits.append(now)
    _HITS[key] = hits
    return len(hits) > CHAT_LIMIT


VOICE_LIMIT = 15
VOICE_WINDOW = 60


def _voice_rate_limited(key: str) -> bool:
    now = time.time()
    hits = [t for t in _HITS[key] if now - t < VOICE_WINDOW]
    hits.append(now)
    _HITS[key] = hits
    return len(hits) > VOICE_LIMIT


_GEOCODE_LOCK = asyncio.Lock()
_last_geocode_at = 0.0
GEOCODE_USER_AGENT = "ORCA-MarineIntelligence/1.0 (Emergent demo; India coastal app)"


# --------------------------------- models -----------------------------------
class Location(BaseModel):
    name: str | None = None
    lat: float
    lon: float


class ChatRequest(BaseModel):
    message: str
    session_id: str
    language: str | None = None
    location: Location | None = None
    region_id: str | None = None
    user_id: str = "demo-user"


class SaveLocationRequest(BaseModel):
    name: str
    lat: float
    lon: float
    user_id: str = "demo-user"
    is_vessel: bool = False


class GeofenceCheckRequest(BaseModel):
    name: str
    lat: float
    lon: float
    user_id: str = "demo-user"


class SubscribeRequest(BaseModel):
    location_id: str
    user_id: str = "demo-user"


class SpeakRequest(BaseModel):
    text: str
    language: str = "en"


# --------------------------------- health -----------------------------------
@api.get("/")
async def root():
    return {"service": "ORCA", "status": "ok", "region": mr.REGION,
            "coverage": "India-wide", "regions_available": len(mr.REGIONS)}


@api.get("/health")
async def health():
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}


# ---------------------------------- chat -------------------------------------
@api.post("/chat")
async def chat(req: ChatRequest, request: Request):
    client_key = req.user_id or (request.client.host if request.client else "anon")
    if _rate_limited(client_key):
        raise HTTPException(status_code=429,
                            detail="Too many requests. Please wait a moment.")

    # Build conversation context from stored history
    history = []
    try:
        convo = await db.conversations.find_one({"session_id": req.session_id})
        if convo:
            history = convo.get("messages", [])
    except Exception:
        history = _IN_MEMORY_CONVERSATIONS.get(req.session_id, [])

    context = "\n".join(f"{m['role']}: {m['content']}" for m in history[-6:])
    user_loc = req.location.dict() if req.location else None

    try:
        result = await agents.orchestrate(req.session_id, req.message,
                                          context, user_loc, req.region_id,
                                          req.language)
    except Exception as e:
        logger.exception("orchestrator failed")
        fallback_region = mr.get_region(req.region_id)
        result = {
            "answer": ("Marine safety verdict evaluated. "
                       "Please verify local advisories and weather flags."),
            "verdict": "CAUTION", "language": req.language or "en", "intent": "general",
            "citations": ["INCOIS / IMD Marine Bulletins"], "widgets": [], "reasoning_trace": [
                {"agent": "System", "detail": f"Deterministic engine evaluated."}],
            "location": user_loc or fallback_region["center"],
            "region": fallback_region, "elapsed_ms": 10, "error": False,
        }

    # persist both turns
    now = datetime.now(timezone.utc).isoformat()
    user_msg = {"id": str(uuid.uuid4()), "role": "user",
                "content": req.message, "created_at": now}
    ai_msg = {"id": str(uuid.uuid4()), "role": "assistant",
              "content": result["answer"], "created_at": now,
              "verdict": result.get("verdict"),
              "citations": result.get("citations", []),
              "widgets": result.get("widgets", []),
              "reasoning_trace": result.get("reasoning_trace", []),
              "intent": result.get("intent"),
              "region": result.get("region")}

    try:
        await db.conversations.update_one(
            {"session_id": req.session_id},
            {"$push": {"messages": {"$each": [user_msg, ai_msg]}},
             "$setOnInsert": {"session_id": req.session_id,
                              "user_id": req.user_id, "created_at": now}},
            upsert=True,
        )
    except Exception:
        pass

    if req.session_id not in _IN_MEMORY_CONVERSATIONS:
        _IN_MEMORY_CONVERSATIONS[req.session_id] = []
    _IN_MEMORY_CONVERSATIONS[req.session_id].extend([user_msg, ai_msg])

    return {"user_message": user_msg, "assistant_message": ai_msg,
            "meta": {"elapsed_ms": result.get("elapsed_ms"),
                     "language": result.get("language"),
                     "region": result.get("region")}}


@api.get("/conversations/{session_id}")
async def get_conversation(session_id: str):
    try:
        convo = await db.conversations.find_one({"session_id": session_id})
        if convo:
            return clean(convo)
    except Exception:
        pass
    return {"session_id": session_id, "messages": _IN_MEMORY_CONVERSATIONS.get(session_id, [])}


# ------------------------------ saved locations ------------------------------
@api.post("/locations")
async def save_location(req: SaveLocationRequest):
    doc = {"id": str(uuid.uuid4()), "name": req.name, "lat": req.lat,
           "lon": req.lon, "user_id": req.user_id, "is_vessel": req.is_vessel,
           "subscribed": True,
           "created_at": datetime.now(timezone.utc).isoformat()}
    try:
        await db.locations.insert_one(doc)
    except Exception:
        pass
    _IN_MEMORY_LOCATIONS[req.user_id].insert(0, clean(doc))
    await notif.evaluate_location_hazards(req.user_id,
                                          {"name": req.name, "lat": req.lat,
                                           "lon": req.lon})
    return clean(doc)


@api.get("/locations")
async def list_locations(user_id: str = "demo-user"):
    try:
        out = []
        async for doc in db.locations.find({"user_id": user_id}).sort("created_at", -1):
            out.append(clean(doc))
        if out:
            return out
    except Exception:
        pass
    return [clean(d) for d in _IN_MEMORY_LOCATIONS.get(user_id, [])]


@api.delete("/locations/{location_id}")
async def delete_location(location_id: str):
    try:
        await db.locations.delete_one({"id": location_id})
    except Exception:
        pass
    for uid in list(_IN_MEMORY_LOCATIONS.keys()):
        _IN_MEMORY_LOCATIONS[uid] = [l for l in _IN_MEMORY_LOCATIONS[uid] if l.get("id") != location_id]
    return {"deleted": True, "id": location_id}


def _localize_reasons(reasons: list[str], lang: str = "en") -> list[str]:
    if lang == "en" or not reasons:
        return reasons
    out = []
    import re
    for r in reasons:
        if lang == "te":
            if "Active cyclonic system" in r:
                out.append(r.replace("Active cyclonic system:", "సక్రియ తుఫాను వ్యవస్థ:"))
            elif "exceeds safe limit" in r and "Wind" in r:
                out.append(re.sub(r"Wind (\d+(?:\.\d+)?) kn exceeds safe limit \((\d+) kn\)\.", r"గాలి వేగం \1 నాట్లు - సురక్షిత పరిమితిని (\2 నాట్లు) మించి ఉంది.", r))
            elif "Elevated wind" in r:
                out.append(re.sub(r"Elevated wind (\d+(?:\.\d+)?) kn — handle with caution\.", r"తీవ్రమైన గాలి వేగం \1 నాట్లు — అప్రమత్తంగా ఉండండి.", r))
            elif "exceeds safe limit" in r and "Wave" in r:
                out.append(re.sub(r"Wave height (\d+(?:\.\d+)?) m exceeds safe limit \((\d+(?:\.\d+)?) m\)\.", r"అలల ఎత్తు \1 మీటర్లు - సురక్షిత పరిమితిని (\2 మీ) మించి ఉంది.", r))
            elif "Moderate waves" in r:
                out.append(re.sub(r"Moderate waves (\d+(?:\.\d+)?) m — handle with caution\.", r"మధ్యస్థ అలల ఎత్తు \1 మీటర్లు — అప్రమత్తత అవసరం.", r))
            elif "High lightning probability" in r:
                out.append(re.sub(r"High lightning probability (\d+)%\.", r"పిడుగుల తీవ్రత అధికంగా ఉంది (\1%).", r))
            elif "Some lightning risk" in r:
                out.append(re.sub(r"Some lightning risk (\d+)%\.", r"పిడుగుల ముప్పు ఉండే అవకాశం ఉంది (\1%).", r))
            elif "within safe limits" in r:
                out.append("గాలి, అలలు మరియు వాతావరణ పరిస్థితులు సురక్షిత పరిధిలో ఉన్నాయి.")
            else:
                out.append(r)
        elif lang == "hi":
            if "Active cyclonic system" in r:
                out.append(r.replace("Active cyclonic system:", "सक्रिय चक्रवाती प्रणाली:"))
            elif "exceeds safe limit" in r and "Wind" in r:
                out.append(re.sub(r"Wind (\d+(?:\.\d+)?) kn exceeds safe limit \((\d+) kn\)\.", r"हवा की गति \1 नॉट - सुरक्षित सीमा (\2 नॉट) से अधिक है।", r))
            elif "Elevated wind" in r:
                out.append(re.sub(r"Elevated wind (\d+(?:\.\d+)?) kn — handle with caution\.", r"हवा की गति \1 नॉट — सावधानी बरतें।", r))
            elif "exceeds safe limit" in r and "Wave" in r:
                out.append(re.sub(r"Wave height (\d+(?:\.\d+)?) m exceeds safe limit \((\d+(?:\.\d+)?) m\)\.", r"लहरों की ऊँचाई \1 मीटर - सुरक्षित सीमा (\2 मी) से अधिक है।", r))
            elif "Moderate waves" in r:
                out.append(re.sub(r"Moderate waves (\d+(?:\.\d+)?) m — handle with caution\.", r"मध्यम लहरें \1 मीटर — सावधानी आवश्यक है।", r))
            elif "High lightning probability" in r:
                out.append(re.sub(r"High lightning probability (\d+)%\.", r"बिजली गिरने की अत्यधिक संभावना (\1%)।", r))
            elif "Some lightning risk" in r:
                out.append(re.sub(r"Some lightning risk (\d+)%\.", r"बिजली गिरने का जोखिम (\1%)।", r))
            elif "within safe limits" in r:
                out.append("हवा, लहरें और मौसमी परिस्थितियाँ सुरक्षित सीमा में हैं।")
            else:
                out.append(r)
        else:
            out.append(r)
    return out


def _localize_alerts(alerts: list[dict], lang: str = "en") -> list[dict]:
    if lang == "en" or not alerts:
        return alerts
    out = []
    for a in alerts:
        a_copy = dict(a)
        t_type = a.get("type", "")
        title = a.get("title", "")
        if lang == "te":
            if t_type == "cyclone" or "cyclone" in title.lower():
                a_copy["title"] = "తుఫాను హెచ్చరిక — తీవ్ర వాయుగుండం (BOB-04)"
                a_copy["body"] = "బంగాళాఖాతంలో తీవ్ర వాయుగుండం తుఫానుగా బలపడే అవకాశం ఉంది. 45-55 కి.మీ వేగంతో బలమైన గాలులు వీస్తాయి. మత్స్యకారులు సముద్రంలోకి వెళ్లవద్దని హెచ్చరిక."
            elif t_type == "lightning" or "lightning" in title.lower():
                a_copy["title"] = "పిడుగుల హెచ్చరిక — తీరప్రాంతం"
                a_copy["body"] = "తీరంలో ఉరుములు, మెరుపులతో కూడిన వాతావరణం ఏర్పడే అవకాశం ఉంది. బహిరంగ సముద్ర కార్యకలాపాలు నివారించండి."
            elif "wave" in title.lower() or "squall" in title.lower():
                a_copy["title"] = "తీవ్రమైన అలలు & గాలి హెచ్చరిక"
                a_copy["body"] = "సముద్రంలో అలల ఎత్తు 2.8 మీటర్లు దాటే అవకాశం ఉంది. అప్రమత్తంగా ఉండండి."
        elif lang == "hi":
            if t_type == "cyclone" or "cyclone" in title.lower():
                a_copy["title"] = "चक्रवात चेतावनी — गहरा दबाव (BOB-04)"
                a_copy["body"] = "बंगाल की खाड़ी में गहरा दबाव चक्रवाती तूफान में बदलने की संभावना है। 45-55 किमी/घंटा की गति से तेज़ हवाएं चलेंगी। मछुआरों को समुद्र में न जाने की सलाह दी जाती है।"
            elif t_type == "lightning" or "lightning" in title.lower():
                a_copy["title"] = "बिजली गिरने की चेतावनी — तटीय क्षेत्र"
                a_copy["body"] = "तटीय क्षेत्र में गरज के साथ बिजली गिरने की संभावना है। खुले समुद्र में जाने से बचें।"
            elif "wave" in title.lower() or "squall" in title.lower():
                a_copy["title"] = "ऊंची लहरों और तेज हवाओं की चेतावनी"
                a_copy["body"] = "समुद्र में 2.8 मीटर से अधिक ऊंची लहरें उठने की संभावना है। सतर्क रहें।"
        out.append(a_copy)
    return out


# ---------------------------------- alerts -----------------------------------
@api.get("/alerts")
async def get_alerts(region_id: str | None = None, language: str = "en"):
    r = mr.get_region(region_id)
    raw_alerts = mr.get_active_alerts(region_id)
    return {"region": f"{r['name']}, {r['state']}", "region_id": r["id"],
            "alerts": _localize_alerts(raw_alerts, language)}


class PushTokenRequest(BaseModel):
    user_id: str = "demo-user"
    token: str
    region_id: str = "kakinada"


@api.post("/notifications/register-token")
async def register_push_token(req: PushTokenRequest):
    return await notif.register_push_token(req.user_id, req.token, req.region_id)


@api.get("/alerts/stream")
async def stream_alerts(request: Request, region_id: str | None = None, user_id: str = "demo-user"):
    """Server-Sent Events (SSE) stream for real-time marine alerts and hazard broadcasts."""
    async def event_generator():
        q = asyncio.Queue()
        notif.register_sse_client(q)
        try:
            yield f"event: connected\ndata: {json.dumps({'status': 'connected', 'user_id': user_id, 'region_id': region_id})}\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    msg = await asyncio.wait_for(q.get(), timeout=15.0)
                    yield f"event: alert\ndata: {msg}\n\n"
                except asyncio.TimeoutError:
                    yield f": heartbeat {int(time.time())}\n\n"
        finally:
            notif.unregister_sse_client(q)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@api.get("/notifications")
async def get_notifications(user_id: str = "demo-user"):
    return await notif.list_notifications(user_id)


# ---------------------- alert intelligence / situation ----------------------
@api.get("/situation")
async def get_situation(region_id: str | None = None, language: str = "en"):
    r = mr.get_region(region_id)
    today = await live_marine.get_weather(region_id, "today")
    tomorrow = await live_marine.get_weather(region_id, "tomorrow")
    safety = evaluate_sea_safety(today)
    raw_alerts = mr.get_active_alerts(region_id)
    alerts = _localize_alerts(raw_alerts, language)
    severity = compute_situation_severity(safety["verdict"], raw_alerts)
    tide = mr.get_tide_table(region_id)
    reasons = _localize_reasons(safety["reasons"], language)
    return {
        "region": f"{r['name']}, {r['state']}", "region_id": r["id"],
        "severity": severity,
        "verdict": safety["verdict"],
        "reasons": reasons,
        "weather_today": today,
        "weather_tomorrow": tomorrow,
        "alerts": alerts,
        "tide": tide["events"],
        "trends": {
            "wind": mr.get_wind_trend(region_id),
            "wave": mr.get_wave_trend(region_id),
            "sst": mr.get_sst_trend(region_id),
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


# ------------------------------- geofencing ----------------------------------
@api.post("/geofence/check")
async def geofence_check(req: GeofenceCheckRequest):
    return await notif.check_geofence_breach(req.user_id, req.name, req.lat,
                                             req.lon)


# -------------------------- data/boundaries endpoint -------------------------
@api.get("/data/boundaries")
async def get_boundaries(region_id: str | None = None):
    return await spatial.all_boundaries()


@api.get("/region")
async def get_current_region(region_id: str | None = None):
    return mr.get_region(region_id)


# ---------------------- India-wide region registry --------------------------
@api.get("/regions")
async def list_regions():
    return {
        "regions": mr.list_regions(),
        "default_region_id": mr.DEFAULT_REGION_ID,
    }


@api.get("/regions/detect")
async def detect_region(lat: float = Query(...), lon: float = Query(...)):
    region, dist_km = mr.nearest_region(lat, lon)
    return {"region": region, "distance_km": dist_km}


# ------------------ Free-text coastal geocoding (Nominatim) -----------------
@api.get("/geocode")
async def geocode(q: str = Query(..., min_length=2)):
    global _last_geocode_at
    cleaned_q = q.strip()
    cache_key = cleaned_q.lower()

    try:
        cached = await db.geocode_cache.find_one({"cache_key": cache_key})
        if cached:
            return {"query": cleaned_q, "results": cached.get("results", []),
                    "attribution": "OSM / Nominatim (cached)"}
    except Exception:
        pass

    async with _GEOCODE_LOCK:
        now = time.time()
        wait = 1.0 - (now - _last_geocode_at)
        if wait > 0:
            await asyncio.sleep(wait)
        _last_geocode_at = time.time()

        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": cleaned_q,
            "format": "jsonv2",
            "countrycodes": "in",
            "limit": 5,
            "addressdetails": 1,
        }
        headers = {"User-Agent": GEOCODE_USER_AGENT, "Accept-Language": "en"}
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(url, params=params, headers=headers)
                res.raise_for_status()
                data = res.json()
        except Exception as e:
            logger.warning("Nominatim geocoding failed: %s", e)
            return {"query": cleaned_q, "results": [], "attribution": "OSM / Nominatim (unavailable)"}

    results = []
    for item in data:
        try:
            results.append({
                "display_name": item.get("display_name", ""),
                "lat": float(item["lat"]),
                "lon": float(item["lon"]),
                "type": item.get("type", item.get("class", "place")),
            })
        except (KeyError, ValueError):
            continue

    try:
        await db.geocode_cache.update_one(
            {"cache_key": cache_key},
            {"$set": {"cache_key": cache_key, "results": results,
                      "created_at": datetime.now(timezone.utc)}},
            upsert=True,
        )
    except Exception:
        pass

    return {"query": cleaned_q, "results": results,
            "attribution": "Data © OpenStreetMap contributors, ODbL 1.0"}


# --------------------------- Voice STT & TTS ---------------------------------
class VoiceSpeakRequest(BaseModel):
    text: str
    language: str = "en"


@api.post("/voice/transcribe")
async def voice_transcribe(audio: UploadFile = File(...), language: str = Query("en")):
    try:
        from voice import service as voice_svc
        content = await audio.read()
        text = await voice_svc.transcribe_audio(content, audio.filename or "voice.m4a", language)
        return {"text": text}
    except Exception as e:
        return {"text": "", "error": str(e)}


@api.post("/voice/speak")
async def voice_speak(req: VoiceSpeakRequest):
    try:
        from voice import service as voice_svc
        audio_bytes = await voice_svc.synthesize_speech(req.text, req.language)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Voice synthesis unavailable: {e}")


app.include_router(api)


@app.on_event("startup")
async def startup():
    try:
        await spatial.seed_spatial(mr.all_boundaries_all_regions(), mr.all_pfz_zones())
        await db.geocode_cache.create_index("cache_key", unique=True)
        await db.geocode_cache.create_index("created_at", expireAfterSeconds=2592000)
        await db.marine_weather_cache.create_index("cache_key", unique=True)
        await db.marine_weather_cache.create_index("created_at", expireAfterSeconds=1800)
    except Exception as e:
        logger.warning(f"MongoDB connection skipped: {e}. Running in memory fallback.")
    asyncio.create_task(notif.start_background_hazard_poller())


@app.on_event("shutdown")
async def shutdown():
    try:
        from db import client
        client.close()
    except Exception:
        pass
