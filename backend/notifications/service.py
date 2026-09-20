"""Notifications module with SSE stream, Expo Push delivery, and background hazard poller."""
import asyncio
import json
import logging
import uuid
from collections import defaultdict
from datetime import datetime, timezone
import httpx

from data_adapters import live_marine, mock_region as mr
from db import clean, db
from gis import spatial

logger = logging.getLogger("orca.notifications")

_IN_MEMORY_NOTIFICATIONS: dict[str, list[dict]] = defaultdict(list)
_PUSH_TOKENS: dict[str, set[str]] = defaultdict(set)  # user_id -> set of Expo push tokens
_SSE_CLIENTS: set[asyncio.Queue] = set()
_POLLER_RUNNING = False


def register_sse_client(queue: asyncio.Queue):
    _SSE_CLIENTS.add(queue)


def unregister_sse_client(queue: asyncio.Queue):
    _SSE_CLIENTS.discard(queue)


async def broadcast_alert(event: str, data: dict):
    """Broadcast an SSE event to all connected clients."""
    payload = json.dumps({"event": event, "data": data, "timestamp": datetime.now(timezone.utc).isoformat()})
    for q in list(_SSE_CLIENTS):
        try:
            await q.put(payload)
        except Exception:
            _SSE_CLIENTS.discard(q)


async def register_push_token(user_id: str, token: str, region_id: str = "kakinada"):
    """Register an Expo Push Token for background notifications."""
    _PUSH_TOKENS[user_id].add(token)
    doc = {
        "user_id": user_id,
        "token": token,
        "region_id": region_id,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        await db.push_tokens.update_one(
            {"user_id": user_id, "token": token},
            {"$set": doc},
            upsert=True,
        )
    except Exception:
        pass
    return {"registered": True, "token": token}


async def send_expo_push(tokens: list[str], title: str, body: str, data: dict | None = None) -> bool:
    """Send native push notification via Expo Push Notification service."""
    if not tokens:
        return False
    messages = [
        {
            "to": t,
            "sound": "default",
            "title": title,
            "body": body,
            "data": data or {},
            "priority": "high",
            "channelId": "marine-alerts",
        }
        for t in tokens if t and t.startswith("ExponentPushToken")
    ]
    if not messages:
        return False

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.post(
                "https://exp.host/--/api/v2/push/send",
                json=messages,
                headers={"Accept": "application/json", "Content-Type": "application/json"},
            )
            return res.status_code == 200
    except Exception as e:
        logger.warning("Failed to dispatch Expo push notification: %s", e)
        return False


async def _record(user_id: str, notif: dict) -> dict:
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "read": False,
        **notif,
    }
    try:
        await db.notifications.insert_one(doc)
    except Exception:
        pass
    _IN_MEMORY_NOTIFICATIONS[user_id].insert(0, doc)

    # Broadcast over SSE in real-time (with sanitized ObjectId)
    await broadcast_alert("new_notification", clean(doc))

    # Trigger push notification to user's registered devices
    tokens = list(_PUSH_TOKENS.get(user_id, []))
    if tokens:
        asyncio.create_task(send_expo_push(tokens, doc.get("title", "ORCA Alert"), doc.get("body", ""), clean(doc)))

    return clean(doc)


async def evaluate_location_hazards(user_id: str, location: dict) -> list[dict]:
    created = []
    region, _dist_km = mr.nearest_region(location["lat"], location["lon"])
    for a in mr.get_active_alerts(region["id"]):
        notif = {
            "type": a["type"],
            "severity": a["severity"],
            "title": a["title"],
            "body": a["body"],
            "source": a["source"],
            "location_name": location.get("name"),
            "kind": "hazard",
        }
        created.append(await _record(user_id, notif))
    return created


async def check_geofence_breach(user_id: str, name: str, lat: float,
                                lon: float) -> dict:
    breaches = await spatial.geofence_check(lat, lon)
    restricted = [b for b in breaches if b.get("restricted")]
    notifs = []
    for b in restricted:
        notif = {
            "type": "geofence",
            "severity": "high",
            "title": f"⛔ Restricted Zone Breach: {b['name']}",
            "body": (f"Vessel location '{name}' ({lat:.4f}, {lon:.4f}) has entered "
                     f"{b['name']}. Please turn back or steer seaward."),
            "source": "Maritime Boundary Geofence",
            "location_name": name,
            "kind": "geofence",
        }
        notifs.append(await _record(user_id, notif))
    return {"breach": len(restricted) > 0, "zones": restricted,
            "notifications": notifs}


async def list_notifications(user_id: str) -> list[dict]:
    try:
        out = []
        async for doc in db.notifications.find({"user_id": user_id}).sort("created_at", -1):
            out.append(clean(doc))
        if out:
            return out
    except Exception:
        pass
    return _IN_MEMORY_NOTIFICATIONS.get(user_id, [])


async def start_background_hazard_poller():
    """Background poller that regularly scans coastal regions for new hazards and broadcasts SSE."""
    global _POLLER_RUNNING
    if _POLLER_RUNNING:
        return
    _POLLER_RUNNING = True
    logger.info("Starting ORCA background marine hazard poller...")

    while True:
        try:
            await asyncio.sleep(45)  # poll every 45s
            for r in mr.list_regions():
                rid = r["id"]
                weather = await live_marine.get_weather(rid, "today")
                alerts = mr.get_active_alerts(rid)

                # If severe conditions exist, broadcast live telemetry
                is_severe = (
                    weather.get("gust_kn", 0) > 30 or
                    weather.get("wave_m", 0) > 2.5 or
                    weather.get("lightning_pct", 0) > 60 or
                    len(alerts) > 0
                )

                if is_severe:
                    telemetry = {
                        "region_id": rid,
                        "region_name": r["name"],
                        "weather": weather,
                        "alerts_count": len(alerts),
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                    await broadcast_alert("hazard_update", telemetry)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.warning("Hazard poller tick error: %s", e)

