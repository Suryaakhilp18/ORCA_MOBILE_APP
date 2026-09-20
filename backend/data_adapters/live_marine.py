"""Real / Live marine weather data adapter with MongoDB TTL caching.

Integrates Open-Meteo Marine and Forecast models with fallback to regional baselines.
"""
import asyncio
import logging
import math
import time
from datetime import datetime, timezone
import httpx

from db import db
from data_adapters import mock_region as mr

logger = logging.getLogger("orca.marine")

_MEM_WEATHER_CACHE: dict[str, dict] = {}
CACHE_TTL_SECONDS = 1800  # 30 minutes


def _wmo_condition(code: int) -> tuple[str, int]:
    """Map WMO weather code to description and lightning probability %."""
    if code == 0:
        return "Clear sea skies", 5
    elif code in (1, 2):
        return "Mainly clear, favourable", 10
    elif code == 3:
        return "Partly cloudy", 15
    elif code in (45, 48):
        return "Coastal fog / moderate visibility", 20
    elif code in (51, 53, 55):
        return "Light coastal showers", 25
    elif code in (61, 63, 65):
        return "Rain showers / rough chop", 40
    elif code in (80, 81, 82):
        return "Heavy rain squalls", 60
    elif code in (95, 96, 99):
        return "Thunderstorms with active lightning", 85
    return "Moderate coastal breeze", 15


def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> tuple[float, str]:
    """Calculate compass bearing (degrees, cardinal) between two points."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dl = math.radians(lon2 - lon1)
    x = math.sin(dl) * math.cos(p2)
    y = math.cos(p1) * math.sin(p2) - math.sin(p1) * math.cos(p2) * math.cos(dl)
    initial_bearing = math.atan2(x, y)
    initial_bearing = math.degrees(initial_bearing)
    compass_bearing = (initial_bearing + 360) % 360

    cardinals = [
        "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
        "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
    ]
    idx = int((compass_bearing + 11.25) / 22.5) % 16
    return round(compass_bearing, 1), cardinals[idx]


async def fetch_live_weather(lat: float, lon: float, region_id: str = "kakinada") -> dict | None:
    """Fetch live marine wave and wind data from Open-Meteo."""
    cache_key = f"{round(lat, 2)}_{round(lon, 2)}"
    now_ts = time.time()

    # 1. Check in-memory cache
    if cache_key in _MEM_WEATHER_CACHE:
        entry = _MEM_WEATHER_CACHE[cache_key]
        if now_ts - entry["cached_at"] < CACHE_TTL_SECONDS:
            return entry["data"]

    # 2. Check MongoDB cache
    try:
        cached = await db.marine_weather_cache.find_one({"cache_key": cache_key})
        if cached and "data" in cached:
            _MEM_WEATHER_CACHE[cache_key] = {"cached_at": now_ts, "data": cached["data"]}
            return cached["data"]
    except Exception:
        pass

    # 3. Fetch from live Open-Meteo APIs
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            marine_url = (
                f"https://marine-api.open-meteo.com/v1/marine?latitude={lat}&longitude={lon}"
                "&daily=wave_height_max,wave_direction_dominant,wave_period_max&timezone=auto"
            )
            forecast_url = (
                f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
                "&current=weather_code,wind_speed_10m,wind_gusts_10m,temperature_2m"
                "&daily=weather_code,wind_speed_10m_max,wind_gusts_10m_max,temperature_2m_max"
                "&wind_speed_unit=kn&timezone=auto"
            )
            m_res, f_res = await asyncio.gather(
                client.get(marine_url),
                client.get(forecast_url),
                return_exceptions=True,
            )

            if isinstance(m_res, Exception) or isinstance(f_res, Exception):
                logger.warning("Live marine fetch exception: %s / %s", m_res, f_res)
                return None

            if m_res.status_code != 200 or f_res.status_code != 200:
                logger.warning("Live marine status error: m=%s f=%s", m_res.status_code, f_res.status_code)
                return None

            m_data = m_res.json()
            f_data = f_res.json()

            current = f_data.get("current", {})
            f_daily = f_data.get("daily", {})
            m_daily = m_data.get("daily", {})

            curr_code = current.get("weather_code", 0)
            cond_today, l_today = _wmo_condition(curr_code)
            wave_today = float((m_daily.get("wave_height_max") or [1.0])[0] or 1.0)
            wind_today = float(current.get("wind_speed_10m") or (f_daily.get("wind_speed_10m_max") or [12])[0] or 12)
            gust_today = float(current.get("wind_gusts_10m") or (f_daily.get("wind_gusts_10m_max") or [16])[0] or 16)

            codes = f_daily.get("weather_code", [0, 0])
            code_tomorrow = codes[1] if len(codes) > 1 else codes[0]
            cond_tom, l_tom = _wmo_condition(code_tomorrow)
            wave_tom_list = m_daily.get("wave_height_max", [1.0, 1.2])
            wave_tomorrow = float(wave_tom_list[1] if len(wave_tom_list) > 1 else wave_tom_list[0] or 1.2)
            wind_tom_list = f_daily.get("wind_speed_10m_max", [12, 14])
            wind_tomorrow = float(wind_tom_list[1] if len(wind_tom_list) > 1 else wind_tom_list[0] or 14)
            gust_tom_list = f_daily.get("wind_gusts_10m_max", [16, 20])
            gust_tomorrow = float(gust_tom_list[1] if len(gust_tom_list) > 1 else gust_tom_list[0] or 20)

            today_snapshot = {
                "wind_kn": round(wind_today, 1),
                "gust_kn": round(gust_today, 1),
                "wave_m": round(wave_today, 1),
                "condition": cond_today,
                "lightning_pct": l_today,
                "cyclone": "Squall / High Sea Warning" if (gust_today > 35 or wave_today > 2.8) else None,
                "timeframe": "today",
                "is_mock": False,
                "source": "Live Open-Meteo Marine / IMD Indian Ocean Grid",
            }

            tomorrow_snapshot = {
                "wind_kn": round(wind_tomorrow, 1),
                "gust_kn": round(gust_tomorrow, 1),
                "wave_m": round(wave_tomorrow, 1),
                "condition": cond_tom,
                "lightning_pct": l_tom,
                "cyclone": "Squall / High Sea Warning" if (gust_tomorrow > 35 or wave_tomorrow > 2.8) else None,
                "timeframe": "tomorrow",
                "is_mock": False,
                "source": "Live Open-Meteo Marine / IMD Indian Ocean Grid",
            }

            weather_bundle = {
                "today": today_snapshot,
                "tomorrow": tomorrow_snapshot,
                "cached_at": now_ts,
                "source": "Live Open-Meteo Marine & Coastal Grid",
            }

            _MEM_WEATHER_CACHE[cache_key] = {"cached_at": now_ts, "data": weather_bundle}
            try:
                await db.marine_weather_cache.update_one(
                    {"cache_key": cache_key},
                    {"$set": {"cache_key": cache_key, "data": weather_bundle,
                              "created_at": datetime.now(timezone.utc)}},
                    upsert=True,
                )
            except Exception:
                pass

            return weather_bundle
    except Exception as e:
        logger.warning("Live marine weather fetch failed: %s", e)
        return None


async def get_weather(region_id: str | None = None, timeframe: str = "today",
                      lat: float | None = None, lon: float | None = None) -> dict:
    """Return live weather if available, with automatic mock fallback and regional alerts alignment."""
    r = mr._region(region_id)
    target_lat = lat if lat is not None else r["center"]["lat"]
    target_lon = lon if lon is not None else r["center"]["lon"]

    # Resolve active cyclone bulletin across region alerts or forecast
    active_cyclone = None
    for alt in r.get("alerts", []):
        if alt.get("type") == "cyclone":
            active_cyclone = alt.get("title")
            break
    if not active_cyclone:
        active_cyclone = r.get("forecast", {}).get("today", {}).get("cyclone")
    if not active_cyclone:
        active_cyclone = r.get("forecast", {}).get("tomorrow", {}).get("cyclone")

    live_bundle = await fetch_live_weather(target_lat, target_lon, r["id"])
    if live_bundle:
        key = "tomorrow" if timeframe == "tomorrow" else "today"
        if key in live_bundle:
            res = dict(live_bundle[key])
            if active_cyclone:
                res["cyclone"] = active_cyclone
            return res

    res = mr.get_weather(region_id, timeframe)
    if active_cyclone:
        res["cyclone"] = active_cyclone
    return res

