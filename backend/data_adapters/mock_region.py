"""MOCK data adapters — India-wide coastal region registry.

ORCA is architected for the ENTIRE Indian coastline, covering all 9 coastal
states (Andhra Pradesh, Tamil Nadu, Kerala, Karnataka, Goa, Maharashtra,
Gujarat, Odisha, West Bengal) + Union Territories (Andaman & Nicobar,
Lakshadweep, Puducherry).

Everything here is clearly labelled `is_mock: True` with a named `source`.
Values are realistic but synthetic. Real protected-area / port names are used
(Coringa, Gulf of Mannar, Marine National Park Jamnagar, Gahirmatha, Malvan,
Bhitarkanika, Pulicat, Sundarbans, Mahatma Gandhi Marine NP) with explicit
`restricted: True` polygons so they render in high-visibility RED on the chart.
"""
import math
from datetime import datetime, timedelta, timezone

DEFAULT_REGION_ID = "kakinada"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _hours_ago(h: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(hours=h)).isoformat()


def _poly(cx: float, cy: float, dx: float = 0.09, dy: float = 0.09) -> dict:
    """Small rectangular reference polygon centred on (cx, cy)."""
    return {
        "type": "Polygon",
        "coordinates": [[
            [cx - dx, cy - dy], [cx + dx, cy - dy],
            [cx + dx, cy + dy], [cx - dx, cy + dy], [cx - dx, cy - dy],
        ]],
    }


def _eez_band(lon: float, lat: float, w: float = 0.25, h: float = 0.7) -> dict:
    return {
        "type": "Polygon",
        "coordinates": [[
            [lon, lat - h / 2], [lon + w, lat - h / 2],
            [lon + w, lat + h / 2], [lon, lat + h / 2], [lon, lat - h / 2],
        ]],
    }


# =============================================================================
# REGION REGISTRY — All 9 Coastal States + UTs of India
# =============================================================================
REGIONS: dict[str, dict] = {
    # --- ANDHRA PRADESH ---
    "kakinada": {
        "id": "kakinada", "name": "Kakinada", "state": "Andhra Pradesh",
        "center": {"lat": 16.98, "lon": 82.38}, "coast_bearing": "east",
        "sea": "Bay of Bengal",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Kakinada Bay Mouth", "lat": 16.95, "lon": 82.40,
             "confidence": 0.86, "sst_c": 28.4, "chl_mg_m3": 2.1, "depth_m": 35,
             "species": "Mackerel, Sardine", "distance_note": "~18 km ESE of coast"},
            {"key": "pfz-2", "name": "Hope Island Shelf", "lat": 17.05, "lon": 82.48,
             "confidence": 0.78, "sst_c": 28.1, "chl_mg_m3": 1.8, "depth_m": 42,
             "species": "Tuna, Seer fish", "distance_note": "~30 km NE of coast"},
            {"key": "pfz-3", "name": "Uppada Deep", "lat": 17.12, "lon": 82.55,
             "confidence": 0.72, "sst_c": 27.9, "chl_mg_m3": 1.5, "depth_m": 60,
             "species": "Pomfret", "distance_note": "~42 km NE of coast"},
            {"key": "pfz-4", "name": "Coringa Offshore", "lat": 16.78, "lon": 82.42,
             "confidence": 0.69, "sst_c": 28.6, "chl_mg_m3": 2.4, "depth_m": 28,
             "species": "Prawn, Sardine", "distance_note": "~22 km SE of coast"},
        ],
        "forecast": {
            "today": {"wind_kn": 14, "gust_kn": 20, "wave_m": 1.2,
                      "condition": "Partly cloudy", "lightning_pct": 15,
                      "cyclone": "Deep Depression BOB-04 (Squally winds 45-55 kmph)"},
            "tomorrow": {"wind_kn": 32, "gust_kn": 45, "wave_m": 3.1,
                        "condition": "Squally thunderstorms", "lightning_pct": 70,
                        "cyclone": "Deep Depression 'BOB-04' intensifying, approaching coast"},
        },
        "alerts": [
            {"key": "alert-cyclone-bob04", "type": "cyclone", "severity": "high",
             "title": "Cyclone Warning — Deep Depression BOB-04",
             "body": ("Deep Depression over west-central Bay of Bengal likely to intensify into a cyclonic storm. "
                      "Squally winds 45-55 kmph gusting 65 kmph expected. Fishermen advised NOT to venture into sea."),
             "source": "IMD Cyclone Bulletin", "issued_hours_ago": 2, "valid_hours": 36},
            {"key": "alert-lightning-01", "type": "lightning", "severity": "moderate",
             "title": "Lightning Alert — Offshore Kakinada",
             "body": "Thunderstorms with frequent lightning likely offshore Kakinada. Avoid open-sea activity.",
             "source": "IMD Nowcast", "issued_hours_ago": 1, "valid_hours": 18},
        ],
        "boundaries": [
            {"key": "mpa-coringa", "name": "Coringa Wildlife Sanctuary (MPA)", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: Protected mangrove marine sanctuary — fishing prohibited.",
             "geometry": _poly(82.33, 16.765, 0.09, 0.065)},
            {"key": "krishna-mpa", "name": "Krishna Wildlife Sanctuary (MPA)", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: Protected delta sanctuary — fishing prohibited.",
             "geometry": _poly(80.95, 15.80, 0.08, 0.07)},
            {"key": "restricted-port", "name": "Kakinada Deep-Water Port Restricted Zone",
             "kind": "restricted", "restricted": True,
             "note": "⛔ RESTRICTED: Port security & naval zone — vessel entry prohibited.",
             "geometry": _poly(82.32, 16.96, 0.04, 0.03)},
            {"key": "eez-band", "name": "Indian EEZ Reference Band", "kind": "eez",
             "restricted": False, "note": "Exclusive Economic Zone reference band (informational).",
             "geometry": _eez_band(82.70, 16.95, 0.25, 0.70)},
        ],
        "grid_base": {"lat": 16.75, "lon": 82.35},
        "grid_dir": {"lat_step": 1, "lon_step": 1},
        "sst_trend": [28.9, 28.7, 28.6, 28.5, 28.4, 28.3, 28.4],
        "chl_trend": [1.2, 1.4, 1.6, 1.9, 2.1, 2.2, 2.1],
        "wind_trend": [10, 11, 12, 13, 13, 14, 14],
        "wave_trend": [0.9, 1.0, 1.0, 1.1, 1.1, 1.2, 1.2],
        "tide_events": [
            {"type": "High", "time": "05:42 IST", "height_m": 1.4},
            {"type": "Low", "time": "11:58 IST", "height_m": 0.3},
            {"type": "High", "time": "18:10 IST", "height_m": 1.6},
            {"type": "Low", "time": "23:47 IST", "height_m": 0.5},
        ],
    },
    "visakhapatnam": {
        "id": "visakhapatnam", "name": "Visakhapatnam", "state": "Andhra Pradesh",
        "center": {"lat": 17.67, "lon": 83.38}, "coast_bearing": "east",
        "sea": "Bay of Bengal",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Dolphin's Nose Offshore", "lat": 17.65, "lon": 83.35,
             "confidence": 0.85, "sst_c": 28.2, "chl_mg_m3": 2.2, "depth_m": 45,
             "species": "Tuna, Seer fish", "distance_note": "~15 km E of Vizag"},
            {"key": "pfz-2", "name": "Bheemunipatnam Bank", "lat": 17.90, "lon": 83.50,
             "confidence": 0.79, "sst_c": 28.0, "chl_mg_m3": 2.0, "depth_m": 50,
             "species": "Mackerel, Pomfret", "distance_note": "~28 km NE of coast"},
        ],
        "forecast": {
            "today": {"wind_kn": 13, "gust_kn": 18, "wave_m": 1.1,
                      "condition": "Partly cloudy", "lightning_pct": 12, "cyclone": None},
            "tomorrow": {"wind_kn": 28, "gust_kn": 40, "wave_m": 2.8,
                        "condition": "Squally weather", "lightning_pct": 60, "cyclone": "Deep Depression BOB-04"},
        },
        "alerts": [
            {"key": "alert-vizag-01", "type": "cyclone", "severity": "high",
             "title": "Squally Wind Alert — Visakhapatnam Coast",
             "body": "Winds 45-55 kmph gusting to 65 kmph off Vizag. Sea condition rough.",
             "source": "IMD Cyclone Warning Centre", "issued_hours_ago": 2, "valid_hours": 36},
        ],
        "boundaries": [
            {"key": "naval-dockyard", "name": "Eastern Naval Command Restricted Zone", "kind": "restricted",
             "restricted": True, "note": "⛔ RESTRICTED: Indian Navy Defense Base — STRICT NO ENTRY.",
             "geometry": _poly(83.30, 17.68, 0.05, 0.04)},
            {"key": "vizag-port", "name": "Visakhapatnam Outer Harbour Channel", "kind": "restricted",
             "restricted": True, "note": "⛔ RESTRICTED: Commercial shipping fairway — small crafts prohibited.",
             "geometry": _poly(83.34, 17.67, 0.04, 0.03)},
        ],
        "grid_base": {"lat": 17.50, "lon": 83.25},
        "grid_dir": {"lat_step": 1, "lon_step": 1},
        "sst_trend": [28.6, 28.5, 28.4, 28.3, 28.2, 28.2, 28.3],
        "chl_trend": [1.5, 1.7, 1.9, 2.0, 2.2, 2.1, 2.0],
        "wind_trend": [11, 12, 12, 13, 13, 13, 14],
        "wave_trend": [0.9, 0.9, 1.0, 1.0, 1.1, 1.1, 1.2],
        "tide_events": [
            {"type": "High", "time": "05:20 IST", "height_m": 1.5},
            {"type": "Low", "time": "11:35 IST", "height_m": 0.3},
            {"type": "High", "time": "17:50 IST", "height_m": 1.7},
            {"type": "Low", "time": "23:25 IST", "height_m": 0.4},
        ],
    },
    "machilipatnam": {
        "id": "machilipatnam", "name": "Machilipatnam", "state": "Andhra Pradesh",
        "center": {"lat": 16.15, "lon": 81.25}, "coast_bearing": "east",
        "sea": "Bay of Bengal",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Manginapudi Offshore", "lat": 16.15, "lon": 81.25,
             "confidence": 0.82, "sst_c": 28.8, "chl_mg_m3": 2.5, "depth_m": 25,
             "species": "Prawn, Sardine", "distance_note": "~14 km E of coast"},
        ],
        "forecast": {
            "today": {"wind_kn": 12, "gust_kn": 16, "wave_m": 1.0, "condition": "Clear", "lightning_pct": 10, "cyclone": None},
            "tomorrow": {"wind_kn": 22, "gust_kn": 30, "wave_m": 2.0, "condition": "Cloudy with swells", "lightning_pct": 35, "cyclone": None},
        },
        "alerts": [],
        "boundaries": [
            {"key": "krishna-delta", "name": "Krishna Wildlife Sanctuary Marine Zone", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: Protected ecological breeding zone — fishing prohibited.",
             "geometry": _poly(80.98, 15.82, 0.09, 0.08)},
        ],
        "grid_base": {"lat": 16.00, "lon": 81.15},
        "grid_dir": {"lat_step": 1, "lon_step": 1},
        "sst_trend": [28.9, 28.8, 28.7, 28.6, 28.5, 28.5, 28.6],
        "chl_trend": [2.0, 2.2, 2.4, 2.5, 2.6, 2.5, 2.4],
        "wind_trend": [10, 10, 11, 11, 12, 12, 12],
        "wave_trend": [0.8, 0.8, 0.9, 0.9, 1.0, 1.0, 1.0],
        "tide_events": [
            {"type": "High", "time": "05:10 IST", "height_m": 1.3},
            {"type": "Low", "time": "11:20 IST", "height_m": 0.3},
            {"type": "High", "time": "17:40 IST", "height_m": 1.5},
            {"type": "Low", "time": "23:15 IST", "height_m": 0.4},
        ],
    },

    # --- TAMIL NADU ---
    "chennai": {
        "id": "chennai", "name": "Chennai", "state": "Tamil Nadu",
        "center": {"lat": 13.1, "lon": 80.36}, "coast_bearing": "east",
        "sea": "Bay of Bengal",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Chennai Harbour Approach", "lat": 13.05, "lon": 80.35,
             "confidence": 0.81, "sst_c": 29.6, "chl_mg_m3": 1.4, "depth_m": 30,
             "species": "Seer fish, Anchovy", "distance_note": "~9 km E of coast"},
            {"key": "pfz-2", "name": "Marina Deep", "lat": 13.10, "lon": 80.42,
             "confidence": 0.74, "sst_c": 29.3, "chl_mg_m3": 1.1, "depth_m": 48,
             "species": "Tuna", "distance_note": "~17 km E of coast"},
            {"key": "pfz-3", "name": "Ennore Shelf", "lat": 13.25, "lon": 80.38,
             "confidence": 0.70, "sst_c": 29.1, "chl_mg_m3": 1.3, "depth_m": 40,
             "species": "Sardine", "distance_note": "~20 km NE of coast"},
            {"key": "pfz-4", "name": "Kovalam Bank", "lat": 12.95, "lon": 80.32,
             "confidence": 0.66, "sst_c": 29.4, "chl_mg_m3": 1.0, "depth_m": 25,
             "species": "Prawn, Anchovy", "distance_note": "~14 km S of coast"},
        ],
        "forecast": {
            "today": {"wind_kn": 12, "gust_kn": 16, "wave_m": 1.0, "condition": "Clear", "lightning_pct": 10, "cyclone": None},
            "tomorrow": {"wind_kn": 20, "gust_kn": 28, "wave_m": 2.0, "condition": "Moderate swell", "lightning_pct": 35, "cyclone": None},
        },
        "alerts": [
            {"key": "alert-highwave-01", "type": "high_wave", "severity": "moderate",
             "title": "High Wave Advisory — Chennai Coast",
             "body": "Sea condition rough to very rough with wave heights of 1.8-2.2 m off Chennai coast.",
             "source": "INCOIS Ocean State Forecast", "issued_hours_ago": 3, "valid_hours": 24},
        ],
        "boundaries": [
            {"key": "mpa-pulicat", "name": "Pulicat Bird Sanctuary Marine Buffer", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: Ramsar wetland core sanctuary — motorized fishing restricted.",
             "geometry": _poly(80.32, 13.42, 0.10, 0.09)},
            {"key": "chennai-port-restricted", "name": "Chennai Port & Naval Security Area", "kind": "restricted",
             "restricted": True, "note": "⛔ RESTRICTED: Naval anchorage & port security zone — NO UNAUTHORIZED ENTRY.",
             "geometry": _poly(80.30, 13.10, 0.035, 0.03)},
            {"key": "eez-band", "name": "Indian EEZ Reference Band", "kind": "eez",
             "restricted": False, "note": "Exclusive Economic Zone reference band (informational).",
             "geometry": _eez_band(80.75, 13.08, 0.25, 0.70)},
        ],
        "grid_base": {"lat": 12.90, "lon": 80.25},
        "grid_dir": {"lat_step": 1, "lon_step": 1},
        "sst_trend": [29.8, 29.7, 29.6, 29.5, 29.5, 29.4, 29.5],
        "chl_trend": [0.9, 1.0, 1.1, 1.0, 0.9, 1.0, 1.1],
        "wind_trend": [10, 10, 11, 11, 12, 12, 12],
        "wave_trend": [0.8, 0.8, 0.9, 0.9, 1.0, 1.0, 1.0],
        "tide_events": [
            {"type": "High", "time": "04:58 IST", "height_m": 1.1},
            {"type": "Low", "time": "10:40 IST", "height_m": 0.2},
            {"type": "High", "time": "17:20 IST", "height_m": 1.2},
            {"type": "Low", "time": "23:05 IST", "height_m": 0.3},
        ],
    },
    "tuticorin": {
        "id": "tuticorin", "name": "Tuticorin (Thoothukudi)", "state": "Tamil Nadu",
        "center": {"lat": 8.75, "lon": 78.25}, "coast_bearing": "east",
        "sea": "Gulf of Mannar",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Hare Island Deep", "lat": 8.78, "lon": 78.25,
             "confidence": 0.84, "sst_c": 29.1, "chl_mg_m3": 2.4, "depth_m": 22,
             "species": "Crab, Squid, Seer fish", "distance_note": "~12 km E of port"},
        ],
        "forecast": {
            "today": {"wind_kn": 14, "gust_kn": 19, "wave_m": 1.1, "condition": "Breezy", "lightning_pct": 10, "cyclone": None},
            "tomorrow": {"wind_kn": 18, "gust_kn": 25, "wave_m": 1.5, "condition": "Moderate chop", "lightning_pct": 20, "cyclone": None},
        },
        "alerts": [],
        "boundaries": [
            {"key": "gulf-of-mannar-mpa", "name": "Gulf of Mannar Marine National Park", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: Biosphere Reserve & Coral Reef Sanctuary — ALL TRAWLING PROHIBITED.",
             "geometry": _poly(78.50, 9.00, 0.18, 0.14)},
        ],
        "grid_base": {"lat": 8.60, "lon": 78.15},
        "grid_dir": {"lat_step": 1, "lon_step": 1},
        "sst_trend": [29.2, 29.1, 29.1, 29.0, 29.0, 29.1, 29.1],
        "chl_trend": [2.1, 2.2, 2.3, 2.4, 2.4, 2.3, 2.2],
        "wind_trend": [13, 13, 14, 14, 14, 15, 14],
        "wave_trend": [1.0, 1.0, 1.1, 1.1, 1.1, 1.2, 1.1],
        "tide_events": [
            {"type": "High", "time": "04:30 IST", "height_m": 1.0},
            {"type": "Low", "time": "10:15 IST", "height_m": 0.3},
            {"type": "High", "time": "16:50 IST", "height_m": 1.1},
            {"type": "Low", "time": "22:40 IST", "height_m": 0.4},
        ],
    },
    "rameswaram": {
        "id": "rameswaram", "name": "Rameswaram", "state": "Tamil Nadu",
        "center": {"lat": 9.25, "lon": 79.38}, "coast_bearing": "east",
        "sea": "Palk Strait",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Dhanushkodi Bank", "lat": 9.18, "lon": 79.42,
             "confidence": 0.88, "sst_c": 29.0, "chl_mg_m3": 2.8, "depth_m": 18,
             "species": "Prawn, Crab, Squid", "distance_note": "~12 km SE of Dhanushkodi"},
        ],
        "forecast": {
            "today": {"wind_kn": 12, "gust_kn": 16, "wave_m": 0.8, "condition": "Fair", "lightning_pct": 8, "cyclone": None},
            "tomorrow": {"wind_kn": 16, "gust_kn": 22, "wave_m": 1.2, "condition": "Moderate chop", "lightning_pct": 15, "cyclone": None},
        },
        "alerts": [],
        "boundaries": [
            {"key": "imbl-srilanka", "name": "India–Sri Lanka International Maritime Boundary Line (IMBL)", "kind": "restricted",
             "restricted": True, "note": "⛔ CRITICAL RESTRICTION: International Border — STRICTLY DO NOT CROSS IMBL.",
             "geometry": _poly(79.52, 9.25, 0.08, 0.25)},
            {"key": "mannar-core", "name": "Gulf of Mannar Core Reef Sanctuary", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: Core coral reef zone — fishing prohibited.",
             "geometry": _poly(79.20, 9.15, 0.10, 0.08)},
        ],
        "grid_base": {"lat": 9.10, "lon": 79.20},
        "grid_dir": {"lat_step": 1, "lon_step": 1},
        "sst_trend": [29.1, 29.0, 29.0, 28.9, 28.9, 29.0, 29.0],
        "chl_trend": [2.5, 2.6, 2.7, 2.8, 2.9, 2.8, 2.7],
        "wind_trend": [11, 11, 12, 12, 12, 13, 12],
        "wave_trend": [0.7, 0.7, 0.8, 0.8, 0.8, 0.9, 0.8],
        "tide_events": [
            {"type": "High", "time": "05:00 IST", "height_m": 0.9},
            {"type": "Low", "time": "11:10 IST", "height_m": 0.2},
            {"type": "High", "time": "17:20 IST", "height_m": 1.0},
            {"type": "Low", "time": "23:15 IST", "height_m": 0.3},
        ],
    },
    "kanyakumari": {
        "id": "kanyakumari", "name": "Kanyakumari", "state": "Tamil Nadu",
        "center": {"lat": 8.04, "lon": 77.58}, "coast_bearing": "south",
        "sea": "Indian Ocean",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Wadge Bank Shelf", "lat": 7.90, "lon": 77.50,
             "confidence": 0.91, "sst_c": 28.5, "chl_mg_m3": 3.2, "depth_m": 48,
             "species": "Tuna, Seer fish, Perch", "distance_note": "~22 km S of Cape Comorin"},
        ],
        "forecast": {
            "today": {"wind_kn": 16, "gust_kn": 22, "wave_m": 1.4, "condition": "Breezy with strong currents", "lightning_pct": 15, "cyclone": None},
            "tomorrow": {"wind_kn": 22, "gust_kn": 32, "wave_m": 2.2, "condition": "Rough seas — tri-sea confluence", "lightning_pct": 30, "cyclone": None},
        },
        "alerts": [
            {"key": "alert-currents-01", "type": "high_wave", "severity": "moderate",
             "title": "Strong Cross-Current Advisory — Wadge Bank",
             "body": "Rapid confluence currents at Cape Comorin. Small vessels exercise extreme caution.",
             "source": "INCOIS Ocean State Forecast", "issued_hours_ago": 3, "valid_hours": 24},
        ],
        "boundaries": [
            {"key": "kanyakumari-headland", "name": "Cape Comorin Coastal Navigational Zone", "kind": "restricted",
             "restricted": True, "note": "⛔ RESTRICTED: Heavy commercial shipping separation lane.",
             "geometry": _poly(77.58, 8.02, 0.05, 0.04)},
        ],
        "grid_base": {"lat": 7.80, "lon": 77.40},
        "grid_dir": {"lat_step": 1, "lon_step": 1},
        "sst_trend": [28.6, 28.5, 28.5, 28.4, 28.4, 28.5, 28.5],
        "chl_trend": [2.9, 3.0, 3.1, 3.2, 3.3, 3.2, 3.1],
        "wind_trend": [15, 15, 16, 16, 17, 17, 16],
        "wave_trend": [1.3, 1.3, 1.4, 1.4, 1.5, 1.5, 1.4],
        "tide_events": [
            {"type": "High", "time": "04:15 IST", "height_m": 1.2},
            {"type": "Low", "time": "10:30 IST", "height_m": 0.3},
            {"type": "High", "time": "16:45 IST", "height_m": 1.3},
            {"type": "Low", "time": "22:50 IST", "height_m": 0.4},
        ],
    },

    # --- KERALA ---
    "kochi": {
        "id": "kochi", "name": "Kochi", "state": "Kerala",
        "center": {"lat": 9.96, "lon": 76.18}, "coast_bearing": "west",
        "sea": "Arabian Sea",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Kochi Harbour Mouth", "lat": 9.95, "lon": 76.15,
             "confidence": 0.84, "sst_c": 28.2, "chl_mg_m3": 3.1, "depth_m": 32,
             "species": "Sardine, Malabar Mackerel", "distance_note": "~12 km W of coast"},
            {"key": "pfz-2", "name": "Vypin Shelf", "lat": 10.05, "lon": 76.10,
             "confidence": 0.80, "sst_c": 28.0, "chl_mg_m3": 3.4, "depth_m": 38,
             "species": "Anchovy, Sardine", "distance_note": "~17 km NW of coast"},
            {"key": "pfz-3", "name": "Munambam Bank", "lat": 10.20, "lon": 76.05,
             "confidence": 0.75, "sst_c": 27.8, "chl_mg_m3": 3.0, "depth_m": 45,
             "species": "Mackerel", "distance_note": "~22 km NW of coast"},
            {"key": "pfz-4", "name": "Alappuzha Deep", "lat": 9.75, "lon": 76.10,
             "confidence": 0.71, "sst_c": 28.3, "chl_mg_m3": 2.6, "depth_m": 40,
             "species": "Prawn, Sardine", "distance_note": "~19 km SW of coast"},
        ],
        "forecast": {
            "today": {"wind_kn": 10, "gust_kn": 14, "wave_m": 0.8, "condition": "Fair, light breeze", "lightning_pct": 5, "cyclone": None},
            "tomorrow": {"wind_kn": 13, "gust_kn": 17, "wave_m": 1.0, "condition": "Fair", "lightning_pct": 10, "cyclone": None},
        },
        "alerts": [],
        "boundaries": [
            {"key": "mpa-vembanad", "name": "Vembanad-Kol Wetland (Ramsar) Buffer", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: Ramsar wetland core sanctuary — motorized fishing restricted.",
             "geometry": _poly(76.35, 9.60, 0.10, 0.10)},
            {"key": "kochi-naval-base", "name": "Southern Naval Command Restricted Waters", "kind": "restricted",
             "restricted": True, "note": "⛔ RESTRICTED: Naval base defense perimeter — STRICT NO ENTRY.",
             "geometry": _poly(76.24, 9.96, 0.035, 0.03)},
            {"key": "eez-band", "name": "Indian EEZ Reference Band", "kind": "eez",
             "restricted": False, "note": "Exclusive Economic Zone reference band (informational).",
             "geometry": _eez_band(75.75, 9.93, 0.25, 0.70)},
        ],
        "grid_base": {"lat": 9.75, "lon": 76.30},
        "grid_dir": {"lat_step": 1, "lon_step": -1},
        "sst_trend": [28.5, 28.4, 28.3, 28.2, 28.1, 28.0, 28.1],
        "chl_trend": [2.4, 2.7, 3.0, 3.2, 3.4, 3.3, 3.1],
        "wind_trend": [9, 9, 9, 10, 10, 10, 10],
        "wave_trend": [0.7, 0.7, 0.7, 0.8, 0.8, 0.8, 0.8],
        "tide_events": [
            {"type": "High", "time": "06:10 IST", "height_m": 1.0},
            {"type": "Low", "time": "12:20 IST", "height_m": 0.2},
            {"type": "High", "time": "18:40 IST", "height_m": 1.1},
            {"type": "Low", "time": "00:15 IST", "height_m": 0.3},
        ],
    },
    "kozhikode": {
        "id": "kozhikode", "name": "Kozhikode (Calicut)", "state": "Kerala",
        "center": {"lat": 11.24, "lon": 75.72}, "coast_bearing": "west",
        "sea": "Arabian Sea",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Beypore Offshore Bank", "lat": 11.15, "lon": 75.70,
             "confidence": 0.83, "sst_c": 28.1, "chl_mg_m3": 3.3, "depth_m": 35,
             "species": "Mackerel, Sardine, Sole", "distance_note": "~14 km W of Beypore"},
        ],
        "forecast": {
            "today": {"wind_kn": 11, "gust_kn": 15, "wave_m": 0.9, "condition": "Fair", "lightning_pct": 5, "cyclone": None},
            "tomorrow": {"wind_kn": 14, "gust_kn": 19, "wave_m": 1.1, "condition": "Scattered clouds", "lightning_pct": 12, "cyclone": None},
        },
        "alerts": [],
        "boundaries": [
            {"key": "kadalundi-mpa", "name": "Kadalundi-Vallikkunnu Bird Community Reserve", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: Estuarine sanctuary — commercial netting restricted.",
             "geometry": _poly(75.82, 11.12, 0.04, 0.03)},
        ],
        "grid_base": {"lat": 11.10, "lon": 75.80},
        "grid_dir": {"lat_step": 1, "lon_step": -1},
        "sst_trend": [28.4, 28.3, 28.2, 28.1, 28.1, 28.0, 28.1],
        "chl_trend": [3.0, 3.1, 3.2, 3.3, 3.4, 3.3, 3.2],
        "wind_trend": [10, 10, 11, 11, 11, 12, 11],
        "wave_trend": [0.8, 0.8, 0.8, 0.9, 0.9, 0.9, 0.9],
        "tide_events": [
            {"type": "High", "time": "06:25 IST", "height_m": 1.1},
            {"type": "Low", "time": "12:35 IST", "height_m": 0.2},
            {"type": "High", "time": "18:55 IST", "height_m": 1.2},
            {"type": "Low", "time": "00:30 IST", "height_m": 0.3},
        ],
    },
    "vizhinjam": {
        "id": "vizhinjam", "name": "Vizhinjam (Trivandrum)", "state": "Kerala",
        "center": {"lat": 8.36, "lon": 76.94}, "coast_bearing": "southwest",
        "sea": "Arabian Sea",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Vizhinjam Deep Shelf", "lat": 8.30, "lon": 76.90,
             "confidence": 0.87, "sst_c": 28.4, "chl_mg_m3": 2.9, "depth_m": 55,
             "species": "Tuna, Ribbonfish, Cuttlefish", "distance_note": "~16 km SW of international port"},
        ],
        "forecast": {
            "today": {"wind_kn": 12, "gust_kn": 17, "wave_m": 1.1, "condition": "Partly cloudy", "lightning_pct": 10, "cyclone": None},
            "tomorrow": {"wind_kn": 17, "gust_kn": 24, "wave_m": 1.6, "condition": "Moderate swell", "lightning_pct": 25, "cyclone": None},
        },
        "alerts": [],
        "boundaries": [
            {"key": "vizhinjam-port-channel", "name": "Vizhinjam International Transshipment Fairway", "kind": "restricted",
             "restricted": True, "note": "⛔ RESTRICTED: Deepwater mother-vessel shipping channel.",
             "geometry": _poly(76.98, 8.37, 0.04, 0.03)},
        ],
        "grid_base": {"lat": 8.20, "lon": 77.00},
        "grid_dir": {"lat_step": 1, "lon_step": -1},
        "sst_trend": [28.6, 28.5, 28.4, 28.4, 28.3, 28.3, 28.4],
        "chl_trend": [2.6, 2.7, 2.8, 2.9, 3.0, 2.9, 2.8],
        "wind_trend": [11, 11, 12, 12, 13, 13, 12],
        "wave_trend": [1.0, 1.0, 1.1, 1.1, 1.2, 1.2, 1.1],
        "tide_events": [
            {"type": "High", "time": "05:40 IST", "height_m": 1.0},
            {"type": "Low", "time": "11:50 IST", "height_m": 0.3},
            {"type": "High", "time": "18:00 IST", "height_m": 1.1},
            {"type": "Low", "time": "23:55 IST", "height_m": 0.4},
        ],
    },

    # --- KARNATAKA ---
    "mangalore": {
        "id": "mangalore", "name": "Mangalore", "state": "Karnataka",
        "center": {"lat": 12.92, "lon": 74.76}, "coast_bearing": "west",
        "sea": "Arabian Sea",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Panambur Offshore", "lat": 12.95, "lon": 74.70,
             "confidence": 0.82, "sst_c": 28.0, "chl_mg_m3": 2.7, "depth_m": 34,
             "species": "Mackerel, Seer fish, Squid", "distance_note": "~18 km W of New Mangalore Port"},
            {"key": "pfz-2", "name": "Ullal Shelf", "lat": 12.80, "lon": 74.75,
             "confidence": 0.77, "sst_c": 28.2, "chl_mg_m3": 2.5, "depth_m": 30,
             "species": "Sardine, Prawn", "distance_note": "~14 km SW of coast"},
        ],
        "forecast": {
            "today": {"wind_kn": 12, "gust_kn": 16, "wave_m": 1.0, "condition": "Clear", "lightning_pct": 10, "cyclone": None},
            "tomorrow": {"wind_kn": 15, "gust_kn": 21, "wave_m": 1.3, "condition": "Fair", "lightning_pct": 15, "cyclone": None},
        },
        "alerts": [],
        "boundaries": [
            {"key": "new-mangalore-port", "name": "New Mangalore Port Restricted Waters", "kind": "restricted",
             "restricted": True, "note": "⛔ RESTRICTED: Major port navigation channel & oil tanker berth.",
             "geometry": _poly(74.80, 12.93, 0.04, 0.03)},
        ],
        "grid_base": {"lat": 12.75, "lon": 74.90},
        "grid_dir": {"lat_step": 1, "lon_step": -1},
        "sst_trend": [28.3, 28.2, 28.1, 28.0, 28.0, 27.9, 28.0],
        "chl_trend": [2.3, 2.4, 2.5, 2.6, 2.7, 2.6, 2.5],
        "wind_trend": [10, 11, 11, 12, 12, 12, 12],
        "wave_trend": [0.8, 0.9, 0.9, 1.0, 1.0, 1.0, 1.0],
        "tide_events": [
            {"type": "High", "time": "05:15 IST", "height_m": 1.3},
            {"type": "Low", "time": "11:25 IST", "height_m": 0.3},
            {"type": "High", "time": "17:45 IST", "height_m": 1.4},
            {"type": "Low", "time": "23:35 IST", "height_m": 0.4},
        ],
    },
    "karwar": {
        "id": "karwar", "name": "Karwar", "state": "Karnataka",
        "center": {"lat": 14.8, "lon": 74.08}, "coast_bearing": "west",
        "sea": "Arabian Sea",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Anjadip Island Deep", "lat": 14.75, "lon": 74.05,
             "confidence": 0.85, "sst_c": 27.8, "chl_mg_m3": 2.8, "depth_m": 38,
             "species": "Mackerel, Seer fish", "distance_note": "~15 km SW of Karwar"},
        ],
        "forecast": {
            "today": {"wind_kn": 11, "gust_kn": 15, "wave_m": 0.9, "condition": "Fair", "lightning_pct": 5, "cyclone": None},
            "tomorrow": {"wind_kn": 14, "gust_kn": 19, "wave_m": 1.1, "condition": "Fair", "lightning_pct": 10, "cyclone": None},
        },
        "alerts": [],
        "boundaries": [
            {"key": "project-seabird-naval", "name": "INS Kadamba (Project Seabird) Naval Base", "kind": "restricted",
             "restricted": True, "note": "⛔ RESTRICTED: Strategic Indian Navy Western Fleet base — STRICT NO ENTRY.",
             "geometry": _poly(74.15, 14.78, 0.06, 0.05)},
            {"key": "netrani-island", "name": "Netrani Island Coral Sanctuary & Target Range", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: Protected coral reef and defense testing perimeter.",
             "geometry": _poly(74.33, 14.02, 0.05, 0.04)},
        ],
        "grid_base": {"lat": 14.65, "lon": 74.20},
        "grid_dir": {"lat_step": 1, "lon_step": -1},
        "sst_trend": [28.1, 28.0, 27.9, 27.8, 27.8, 27.7, 27.8],
        "chl_trend": [2.4, 2.5, 2.6, 2.7, 2.8, 2.7, 2.6],
        "wind_trend": [9, 10, 10, 11, 11, 11, 11],
        "wave_trend": [0.8, 0.8, 0.8, 0.9, 0.9, 0.9, 0.9],
        "tide_events": [
            {"type": "High", "time": "05:05 IST", "height_m": 1.4},
            {"type": "Low", "time": "11:15 IST", "height_m": 0.4},
            {"type": "High", "time": "17:35 IST", "height_m": 1.5},
            {"type": "Low", "time": "23:25 IST", "height_m": 0.5},
        ],
    },

    # --- GOA ---
    "goa": {
        "id": "goa", "name": "Goa (Mormugao)", "state": "Goa",
        "center": {"lat": 15.42, "lon": 73.74}, "coast_bearing": "west",
        "sea": "Arabian Sea",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Grande Island Bank", "lat": 15.35, "lon": 73.68,
             "confidence": 0.81, "sst_c": 27.9, "chl_mg_m3": 2.3, "depth_m": 32,
             "species": "Kingfish, Pomfret, Mackerel", "distance_note": "~14 km W of Mormugao"},
            {"key": "pfz-2", "name": "Aguada Deep", "lat": 15.52, "lon": 73.65,
             "confidence": 0.76, "sst_c": 27.7, "chl_mg_m3": 2.1, "depth_m": 40,
             "species": "Seer fish, Tuna", "distance_note": "~18 km W of Fort Aguada"},
        ],
        "forecast": {
            "today": {"wind_kn": 12, "gust_kn": 16, "wave_m": 1.0, "condition": "Clear", "lightning_pct": 8, "cyclone": None},
            "tomorrow": {"wind_kn": 16, "gust_kn": 22, "wave_m": 1.4, "condition": "Fair with afternoon breeze", "lightning_pct": 18, "cyclone": None},
        },
        "alerts": [],
        "boundaries": [
            {"key": "mormugao-port-restricted", "name": "Mormugao Port & Naval Restricted Zone", "kind": "restricted",
             "restricted": True, "note": "⛔ RESTRICTED: Port channel & naval anchorage zone.",
             "geometry": _poly(73.79, 15.42, 0.035, 0.03)},
        ],
        "grid_base": {"lat": 15.25, "lon": 73.85},
        "grid_dir": {"lat_step": 1, "lon_step": -1},
        "sst_trend": [28.2, 28.1, 28.0, 27.9, 27.9, 27.8, 27.9],
        "chl_trend": [2.0, 2.1, 2.2, 2.3, 2.4, 2.3, 2.2],
        "wind_trend": [10, 11, 11, 12, 12, 12, 12],
        "wave_trend": [0.8, 0.9, 0.9, 1.0, 1.0, 1.0, 1.0],
        "tide_events": [
            {"type": "High", "time": "04:55 IST", "height_m": 1.6},
            {"type": "Low", "time": "11:05 IST", "height_m": 0.4},
            {"type": "High", "time": "17:25 IST", "height_m": 1.7},
            {"type": "Low", "time": "23:15 IST", "height_m": 0.5},
        ],
    },

    # --- MAHARASHTRA ---
    "mumbai": {
        "id": "mumbai", "name": "Mumbai", "state": "Maharashtra",
        "center": {"lat": 18.88, "lon": 72.76}, "coast_bearing": "west",
        "sea": "Arabian Sea",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Colaba Point Bank", "lat": 18.88, "lon": 72.70,
             "confidence": 0.77, "sst_c": 27.6, "chl_mg_m3": 1.9, "depth_m": 33,
             "species": "Bombay Duck, Pomfret", "distance_note": "~14 km SW of coast"},
            {"key": "pfz-2", "name": "Versova Shelf", "lat": 19.05, "lon": 72.65,
             "confidence": 0.73, "sst_c": 27.4, "chl_mg_m3": 2.0, "depth_m": 40,
             "species": "Prawn, Bombay Duck", "distance_note": "~19 km W of coast"},
            {"key": "pfz-3", "name": "Thal Deep", "lat": 18.65, "lon": 72.60,
             "confidence": 0.68, "sst_c": 27.8, "chl_mg_m3": 1.7, "depth_m": 55,
             "species": "Pomfret, Seer fish", "distance_note": "~27 km SW of coast"},
            {"key": "pfz-4", "name": "Uran Bank", "lat": 18.85, "lon": 72.75,
             "confidence": 0.65, "sst_c": 27.7, "chl_mg_m3": 1.8, "depth_m": 28,
             "species": "Prawn", "distance_note": "~10 km SW of coast"},
        ],
        "forecast": {
            "today": {"wind_kn": 16, "gust_kn": 22, "wave_m": 1.5, "condition": "Cloudy", "lightning_pct": 20, "cyclone": None},
            "tomorrow": {"wind_kn": 22, "gust_kn": 30, "wave_m": 2.1, "condition": "Rough seas", "lightning_pct": 40, "cyclone": None},
        },
        "alerts": [
            {"key": "alert-roughsea-01", "type": "high_wave", "severity": "moderate",
             "title": "Rough Sea Advisory — Mumbai Coast",
             "body": "Rough sea conditions with wave heights up to 2.1 m off Mumbai tomorrow. Fishermen advised caution.",
             "source": "INCOIS Ocean State Forecast", "issued_hours_ago": 4, "valid_hours": 30},
        ],
        "boundaries": [
            {"key": "mpa-thane", "name": "Thane Creek Flamingo Sanctuary (Buffer)", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: Protected flamingo sanctuary wetland — trawling prohibited.",
             "geometry": _poly(72.98, 19.05, 0.07, 0.06)},
            {"key": "mumbai-naval-dockyard", "name": "Western Naval Command Dockyard Restricted Zone", "kind": "restricted",
             "restricted": True, "note": "⛔ RESTRICTED: Strategic Naval Dockyard — STRICT NO ENTRY.",
             "geometry": _poly(72.84, 18.92, 0.035, 0.03)},
            {"key": "eez-band", "name": "Indian EEZ Reference Band", "kind": "eez",
             "restricted": False, "note": "Exclusive Economic Zone reference band (informational).",
             "geometry": _eez_band(72.20, 18.90, 0.25, 0.70)},
        ],
        "grid_base": {"lat": 18.70, "lon": 72.90},
        "grid_dir": {"lat_step": 1, "lon_step": -1},
        "sst_trend": [27.9, 27.8, 27.7, 27.6, 27.5, 27.5, 27.6],
        "chl_trend": [1.5, 1.6, 1.8, 1.9, 2.0, 1.9, 1.8],
        "wind_trend": [13, 14, 14, 15, 15, 16, 16],
        "wave_trend": [1.2, 1.3, 1.3, 1.4, 1.4, 1.5, 1.5],
        "tide_events": [
            {"type": "High", "time": "05:20 IST", "height_m": 2.1},
            {"type": "Low", "time": "11:35 IST", "height_m": 0.5},
            {"type": "High", "time": "17:50 IST", "height_m": 2.3},
            {"type": "Low", "time": "23:55 IST", "height_m": 0.6},
        ],
    },
    "ratnagiri": {
        "id": "ratnagiri", "name": "Ratnagiri", "state": "Maharashtra",
        "center": {"lat": 16.98, "lon": 73.22}, "coast_bearing": "west",
        "sea": "Arabian Sea",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Mirya Bay Bank", "lat": 17.02, "lon": 73.20,
             "confidence": 0.81, "sst_c": 27.6, "chl_mg_m3": 2.2, "depth_m": 35,
             "species": "Kingfish, Pomfret, Mackerel", "distance_note": "~15 km W of Mirya"},
        ],
        "forecast": {
            "today": {"wind_kn": 13, "gust_kn": 17, "wave_m": 1.1, "condition": "Fair", "lightning_pct": 10, "cyclone": None},
            "tomorrow": {"wind_kn": 17, "gust_kn": 23, "wave_m": 1.5, "condition": "Moderate chop", "lightning_pct": 20, "cyclone": None},
        },
        "alerts": [],
        "boundaries": [
            {"key": "ratnagiri-port", "name": "Bhagwati Port Channel Restricted Area", "kind": "restricted",
             "restricted": True, "note": "⛔ RESTRICTED: Port approach channel.",
             "geometry": _poly(73.27, 16.98, 0.035, 0.03)},
        ],
        "grid_base": {"lat": 16.85, "lon": 73.35},
        "grid_dir": {"lat_step": 1, "lon_step": -1},
        "sst_trend": [27.8, 27.7, 27.6, 27.6, 27.5, 27.5, 27.6],
        "chl_trend": [1.9, 2.0, 2.1, 2.2, 2.3, 2.2, 2.1],
        "wind_trend": [11, 12, 12, 13, 13, 13, 13],
        "wave_trend": [0.9, 1.0, 1.0, 1.1, 1.1, 1.1, 1.1],
        "tide_events": [
            {"type": "High", "time": "05:00 IST", "height_m": 1.8},
            {"type": "Low", "time": "11:10 IST", "height_m": 0.4},
            {"type": "High", "time": "17:30 IST", "height_m": 1.9},
            {"type": "Low", "time": "23:30 IST", "height_m": 0.5},
        ],
    },
    "malvan": {
        "id": "malvan", "name": "Malvan", "state": "Maharashtra",
        "center": {"lat": 16.04, "lon": 73.4}, "coast_bearing": "west",
        "sea": "Arabian Sea",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Sindhudurg Offshore Shelf", "lat": 16.02, "lon": 73.35,
             "confidence": 0.85, "sst_c": 27.7, "chl_mg_m3": 2.5, "depth_m": 30,
             "species": "Seer fish, Pomfret, Squid", "distance_note": "~14 km W of fort"},
        ],
        "forecast": {
            "today": {"wind_kn": 11, "gust_kn": 15, "wave_m": 0.9, "condition": "Clear", "lightning_pct": 5, "cyclone": None},
            "tomorrow": {"wind_kn": 15, "gust_kn": 20, "wave_m": 1.2, "condition": "Fair", "lightning_pct": 12, "cyclone": None},
        },
        "alerts": [],
        "boundaries": [
            {"key": "malvan-mpa", "name": "Malvan Marine Sanctuary (Coral Reef)", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: Protected coral reef & Sindhudurg Fort marine sanctuary — NO COMMERCIAL TRAWLING.",
             "geometry": _poly(73.45, 16.05, 0.06, 0.05)},
        ],
        "grid_base": {"lat": 15.95, "lon": 73.50},
        "grid_dir": {"lat_step": 1, "lon_step": -1},
        "sst_trend": [27.9, 27.8, 27.7, 27.7, 27.6, 27.6, 27.7],
        "chl_trend": [2.1, 2.2, 2.3, 2.4, 2.5, 2.4, 2.3],
        "wind_trend": [10, 10, 11, 11, 11, 12, 11],
        "wave_trend": [0.8, 0.8, 0.8, 0.9, 0.9, 0.9, 0.9],
        "tide_events": [
            {"type": "High", "time": "04:50 IST", "height_m": 1.7},
            {"type": "Low", "time": "11:00 IST", "height_m": 0.4},
            {"type": "High", "time": "17:20 IST", "height_m": 1.8},
            {"type": "Low", "time": "23:20 IST", "height_m": 0.5},
        ],
    },

    # --- GUJARAT ---
    "veraval": {
        "id": "veraval", "name": "Veraval", "state": "Gujarat",
        "center": {"lat": 20.88, "lon": 70.36}, "coast_bearing": "south",
        "sea": "Arabian Sea",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Veraval Harbour Approach", "lat": 20.85, "lon": 70.25,
             "confidence": 0.79, "sst_c": 26.8, "chl_mg_m3": 1.6, "depth_m": 30,
             "species": "Bombay Duck, Ribbonfish", "distance_note": "~11 km SW of coast"},
            {"key": "pfz-2", "name": "Prabhas Deep", "lat": 20.80, "lon": 70.15,
             "confidence": 0.74, "sst_c": 26.6, "chl_mg_m3": 1.5, "depth_m": 44,
             "species": "Pomfret", "distance_note": "~20 km SW of coast"},
            {"key": "pfz-3", "name": "Madhavpur Bank", "lat": 20.75, "lon": 70.05,
             "confidence": 0.69, "sst_c": 26.5, "chl_mg_m3": 1.4, "depth_m": 50,
             "species": "Ribbonfish, Prawn", "distance_note": "~30 km SW of coast"},
            {"key": "pfz-4", "name": "Diu Shelf", "lat": 20.72, "lon": 70.90,
             "confidence": 0.66, "sst_c": 27.0, "chl_mg_m3": 1.3, "depth_m": 33,
             "species": "Bombay Duck", "distance_note": "~48 km SE of coast"},
        ],
        "forecast": {
            "today": {"wind_kn": 11, "gust_kn": 15, "wave_m": 0.9, "condition": "Clear", "lightning_pct": 8, "cyclone": None},
            "tomorrow": {"wind_kn": 15, "gust_kn": 20, "wave_m": 1.1, "condition": "Fair", "lightning_pct": 12, "cyclone": None},
        },
        "alerts": [],
        "boundaries": [
            {"key": "mpa-kutch", "name": "Gulf of Kutch Marine National Park (Buffer)", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: Marine National Park — Coral & mangrove sanctuary strictly protected.",
             "geometry": _poly(70.20, 22.35, 0.12, 0.10)},
            {"key": "veraval-port", "name": "Veraval Commercial Harbour Zone", "kind": "restricted",
             "restricted": True, "note": "⛔ RESTRICTED: Port navigation zone.",
             "geometry": _poly(70.37, 20.90, 0.03, 0.025)},
            {"key": "eez-band", "name": "Indian EEZ Reference Band", "kind": "eez",
             "restricted": False, "note": "Exclusive Economic Zone reference band (informational).",
             "geometry": _eez_band(69.60, 20.90, 0.25, 0.70)},
        ],
        "grid_base": {"lat": 20.60, "lon": 70.10},
        "grid_dir": {"lat_step": 1, "lon_step": -1},
        "sst_trend": [26.9, 26.8, 26.7, 26.6, 26.5, 26.5, 26.6],
        "chl_trend": [1.2, 1.3, 1.4, 1.5, 1.6, 1.5, 1.4],
        "wind_trend": [9, 9, 10, 10, 10, 11, 11],
        "wave_trend": [0.7, 0.7, 0.8, 0.8, 0.8, 0.9, 0.9],
        "tide_events": [
            {"type": "High", "time": "04:40 IST", "height_m": 1.9},
            {"type": "Low", "time": "10:55 IST", "height_m": 0.4},
            {"type": "High", "time": "17:05 IST", "height_m": 2.0},
            {"type": "Low", "time": "23:10 IST", "height_m": 0.5},
        ],
    },
    "porbandar": {
        "id": "porbandar", "name": "Porbandar", "state": "Gujarat",
        "center": {"lat": 21.62, "lon": 69.54}, "coast_bearing": "southwest",
        "sea": "Arabian Sea",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Porbandar Offshore Bank", "lat": 21.55, "lon": 69.50,
             "confidence": 0.81, "sst_c": 26.4, "chl_mg_m3": 1.8, "depth_m": 42,
             "species": "Pomfret, Hilsa, Ribbonfish", "distance_note": "~18 km SW of port"},
        ],
        "forecast": {
            "today": {"wind_kn": 12, "gust_kn": 16, "wave_m": 1.0, "condition": "Clear", "lightning_pct": 5, "cyclone": None},
            "tomorrow": {"wind_kn": 16, "gust_kn": 22, "wave_m": 1.3, "condition": "Fair", "lightning_pct": 10, "cyclone": None},
        },
        "alerts": [],
        "boundaries": [
            {"key": "coast-guard-porbandar", "name": "Indian Coast Guard District HQ Restricted Waters", "kind": "restricted",
             "restricted": True, "note": "⛔ RESTRICTED: Coast Guard tactical training & security area.",
             "geometry": _poly(69.60, 21.62, 0.04, 0.03)},
        ],
        "grid_base": {"lat": 21.45, "lon": 69.55},
        "grid_dir": {"lat_step": 1, "lon_step": -1},
        "sst_trend": [26.6, 26.5, 26.4, 26.3, 26.3, 26.4, 26.4],
        "chl_trend": [1.5, 1.6, 1.7, 1.8, 1.9, 1.8, 1.7],
        "wind_trend": [10, 11, 11, 12, 12, 12, 12],
        "wave_trend": [0.8, 0.8, 0.9, 0.9, 1.0, 1.0, 1.0],
        "tide_events": [
            {"type": "High", "time": "04:30 IST", "height_m": 2.0},
            {"type": "Low", "time": "10:45 IST", "height_m": 0.4},
            {"type": "High", "time": "16:55 IST", "height_m": 2.1},
            {"type": "Low", "time": "23:00 IST", "height_m": 0.5},
        ],
    },
    "okha": {
        "id": "okha", "name": "Okha", "state": "Gujarat",
        "center": {"lat": 22.48, "lon": 69.02}, "coast_bearing": "northwest",
        "sea": "Arabian Sea",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Beyt Dwarka Shelf", "lat": 22.50, "lon": 69.00,
             "confidence": 0.83, "sst_c": 26.2, "chl_mg_m3": 1.9, "depth_m": 35,
             "species": "Pomfret, Lobster, Seer fish", "distance_note": "~12 km WNW of Okha"},
        ],
        "forecast": {
            "today": {"wind_kn": 13, "gust_kn": 18, "wave_m": 1.1, "condition": "Clear", "lightning_pct": 5, "cyclone": None},
            "tomorrow": {"wind_kn": 17, "gust_kn": 24, "wave_m": 1.5, "condition": "Breezy", "lightning_pct": 10, "cyclone": None},
        },
        "alerts": [],
        "boundaries": [
            {"key": "kutch-marine-park", "name": "Marine National Park (Okha Sanctuary Zone)", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: Protected marine national park & coral reef — NO FISHING.",
             "geometry": _poly(69.15, 22.48, 0.08, 0.06)},
        ],
        "grid_base": {"lat": 22.35, "lon": 69.05},
        "grid_dir": {"lat_step": 1, "lon_step": -1},
        "sst_trend": [26.4, 26.3, 26.2, 26.1, 26.1, 26.2, 26.2],
        "chl_trend": [1.6, 1.7, 1.8, 1.9, 2.0, 1.9, 1.8],
        "wind_trend": [11, 12, 12, 13, 13, 13, 13],
        "wave_trend": [0.9, 0.9, 1.0, 1.0, 1.1, 1.1, 1.1],
        "tide_events": [
            {"type": "High", "time": "04:15 IST", "height_m": 2.4},
            {"type": "Low", "time": "10:30 IST", "height_m": 0.5},
            {"type": "High", "time": "16:40 IST", "height_m": 2.6},
            {"type": "Low", "time": "22:45 IST", "height_m": 0.6},
        ],
    },
    "kandla": {
        "id": "kandla", "name": "Kandla (Gulf of Kutch)", "state": "Gujarat",
        "center": {"lat": 22.86, "lon": 70.18}, "coast_bearing": "south",
        "sea": "Gulf of Kutch",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Tuna Buoy Bank", "lat": 22.85, "lon": 70.10,
             "confidence": 0.75, "sst_c": 26.5, "chl_mg_m3": 2.1, "depth_m": 20,
             "species": "Prawn, Mud Crab", "distance_note": "~18 km SW of port"},
        ],
        "forecast": {
            "today": {"wind_kn": 12, "gust_kn": 16, "wave_m": 0.8, "condition": "Clear", "lightning_pct": 5, "cyclone": None},
            "tomorrow": {"wind_kn": 16, "gust_kn": 22, "wave_m": 1.1, "condition": "Fair", "lightning_pct": 10, "cyclone": None},
        },
        "alerts": [],
        "boundaries": [
            {"key": "deendayal-port", "name": "Deendayal Port Restricted Fairway", "kind": "restricted",
             "restricted": True, "note": "⛔ RESTRICTED: Major port navigational fairway & cargo anchorage.",
             "geometry": _poly(70.22, 22.98, 0.05, 0.04)},
        ],
        "grid_base": {"lat": 22.80, "lon": 70.20},
        "grid_dir": {"lat_step": 1, "lon_step": -1},
        "sst_trend": [26.7, 26.6, 26.5, 26.4, 26.4, 26.5, 26.5],
        "chl_trend": [1.8, 1.9, 2.0, 2.1, 2.2, 2.1, 2.0],
        "wind_trend": [10, 11, 11, 12, 12, 12, 12],
        "wave_trend": [0.7, 0.7, 0.8, 0.8, 0.8, 0.9, 0.8],
        "tide_events": [
            {"type": "High", "time": "04:00 IST", "height_m": 4.5},
            {"type": "Low", "time": "10:15 IST", "height_m": 0.8},
            {"type": "High", "time": "16:20 IST", "height_m": 4.8},
            {"type": "Low", "time": "22:30 IST", "height_m": 0.9},
        ],
    },

    # --- ODISHA ---
    "paradip": {
        "id": "paradip", "name": "Paradip", "state": "Odisha",
        "center": {"lat": 20.25, "lon": 86.74}, "coast_bearing": "east",
        "sea": "Bay of Bengal",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Paradip Harbour Mouth", "lat": 20.30, "lon": 86.75,
             "confidence": 0.80, "sst_c": 28.7, "chl_mg_m3": 2.3, "depth_m": 30,
             "species": "Hilsa, Prawn", "distance_note": "~13 km E of coast"},
            {"key": "pfz-2", "name": "Mahanadi Delta Shelf", "lat": 20.45, "lon": 86.85,
             "confidence": 0.76, "sst_c": 28.5, "chl_mg_m3": 2.6, "depth_m": 36,
             "species": "Hilsa", "distance_note": "~24 km NE of coast"},
            {"key": "pfz-3", "name": "Hukitola Bank", "lat": 20.20, "lon": 86.80,
             "confidence": 0.70, "sst_c": 28.6, "chl_mg_m3": 2.2, "depth_m": 42,
             "species": "Pomfret, Prawn", "distance_note": "~19 km SE of coast"},
            {"key": "pfz-4", "name": "Devi River Mouth Deep", "lat": 20.15, "lon": 86.70,
             "confidence": 0.67, "sst_c": 28.4, "chl_mg_m3": 2.4, "depth_m": 26,
             "species": "Prawn, Hilsa", "distance_note": "~16 km SE of coast"},
        ],
        "forecast": {
            "today": {"wind_kn": 16, "gust_kn": 22, "wave_m": 1.4, "condition": "Partly cloudy", "lightning_pct": 20, "cyclone": None},
            "tomorrow": {"wind_kn": 38, "gust_kn": 55, "wave_m": 3.6, "condition": "Severe cyclonic storm conditions", "lightning_pct": 75, "cyclone": "Very Severe Cyclonic Storm approaching Odisha coast"},
        },
        "alerts": [
            {"key": "alert-cyclone-01", "type": "cyclone", "severity": "high",
             "title": "Cyclone Warning — Odisha Coast",
             "body": "Very Severe Cyclonic Storm tracking towards Odisha coast. Winds 90-100 kmph gusting 115 kmph. All fishing suspended.",
             "source": "IMD Cyclone Bulletin", "issued_hours_ago": 3, "valid_hours": 48},
            {"key": "alert-lightning-01", "type": "lightning", "severity": "high",
             "title": "Lightning Alert — Paradip Coast",
             "body": "Heavy rain with frequent lightning likely offshore Paradip. Avoid all open-sea activity.",
             "source": "IMD Nowcast", "issued_hours_ago": 1, "valid_hours": 24},
        ],
        "boundaries": [
            {"key": "gahirmatha-mpa", "name": "Gahirmatha Marine Sanctuary (Olive Ridley Turtle)", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: World's largest Olive Ridley turtle nesting sanctuary — STRICT FISHING BAN.",
             "geometry": _poly(87.05, 20.75, 0.15, 0.12)},
            {"key": "mpa-bhitarkanika", "name": "Bhitarkanika Mangrove & Wildlife Sanctuary (Buffer)", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: Protected mangrove/crocodile sanctuary buffer — fishing restricted.",
             "geometry": _poly(86.90, 20.70, 0.12, 0.10)},
            {"key": "paradip-port", "name": "Paradip Port Restricted Fairway", "kind": "restricted",
             "restricted": True, "note": "⛔ RESTRICTED: Commercial shipping fairway — small crafts prohibited.",
             "geometry": _poly(86.68, 20.30, 0.035, 0.03)},
            {"key": "eez-band", "name": "Indian EEZ Reference Band", "kind": "eez",
             "restricted": False, "note": "Exclusive Economic Zone reference band (informational).",
             "geometry": _eez_band(87.10, 20.30, 0.25, 0.70)},
        ],
        "grid_base": {"lat": 20.10, "lon": 86.70},
        "grid_dir": {"lat_step": 1, "lon_step": 1},
        "sst_trend": [29.0, 28.9, 28.8, 28.7, 28.6, 28.6, 28.7],
        "chl_trend": [1.8, 2.0, 2.2, 2.4, 2.6, 2.5, 2.3],
        "wind_trend": [12, 13, 14, 15, 15, 16, 16],
        "wave_trend": [1.0, 1.1, 1.2, 1.3, 1.3, 1.4, 1.4],
        "tide_events": [
            {"type": "High", "time": "05:05 IST", "height_m": 1.6},
            {"type": "Low", "time": "11:15 IST", "height_m": 0.4},
            {"type": "High", "time": "17:35 IST", "height_m": 1.8},
            {"type": "Low", "time": "23:25 IST", "height_m": 0.5},
        ],
    },
    "puri": {
        "id": "puri", "name": "Puri", "state": "Odisha",
        "center": {"lat": 19.76, "lon": 85.88}, "coast_bearing": "southeast",
        "sea": "Bay of Bengal",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Chilika Mouth Offshore", "lat": 19.70, "lon": 85.65,
             "confidence": 0.84, "sst_c": 28.6, "chl_mg_m3": 2.7, "depth_m": 25,
             "species": "Crab, Prawn, Pomfret", "distance_note": "~15 km SE of lake mouth"},
        ],
        "forecast": {
            "today": {"wind_kn": 14, "gust_kn": 19, "wave_m": 1.2, "condition": "Partly cloudy", "lightning_pct": 15, "cyclone": None},
            "tomorrow": {"wind_kn": 25, "gust_kn": 36, "wave_m": 2.4, "condition": "Squally showers", "lightning_pct": 50, "cyclone": None},
        },
        "alerts": [],
        "boundaries": [
            {"key": "chilika-mpa", "name": "Chilika Lake Ramsar & Dolphin Sanctuary", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: Irrawaddy dolphin & migratory bird wetland sanctuary.",
             "geometry": _poly(85.45, 19.65, 0.14, 0.12)},
            {"key": "balukhand-sanctuary", "name": "Balukhand-Konark Wildlife Sanctuary Marine Buffer", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: Coastal sanctuary buffer zone.",
             "geometry": _poly(85.95, 19.88, 0.08, 0.06)},
        ],
        "grid_base": {"lat": 19.65, "lon": 85.80},
        "grid_dir": {"lat_step": 1, "lon_step": 1},
        "sst_trend": [28.8, 28.7, 28.6, 28.5, 28.5, 28.6, 28.6],
        "chl_trend": [2.2, 2.3, 2.5, 2.6, 2.7, 2.6, 2.5],
        "wind_trend": [12, 12, 13, 13, 14, 14, 14],
        "wave_trend": [1.0, 1.0, 1.1, 1.1, 1.2, 1.2, 1.2],
        "tide_events": [
            {"type": "High", "time": "05:15 IST", "height_m": 1.5},
            {"type": "Low", "time": "11:25 IST", "height_m": 0.4},
            {"type": "High", "time": "17:45 IST", "height_m": 1.7},
            {"type": "Low", "time": "23:35 IST", "height_m": 0.5},
        ],
    },
    "gopalpur": {
        "id": "gopalpur", "name": "Gopalpur", "state": "Odisha",
        "center": {"lat": 19.22, "lon": 84.99}, "coast_bearing": "southeast",
        "sea": "Bay of Bengal",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Rushikulya Offshore Bank", "lat": 19.35, "lon": 85.05,
             "confidence": 0.86, "sst_c": 28.5, "chl_mg_m3": 2.5, "depth_m": 30,
             "species": "Seer fish, Pomfret, Prawn", "distance_note": "~16 km NE of Gopalpur Port"},
        ],
        "forecast": {
            "today": {"wind_kn": 13, "gust_kn": 18, "wave_m": 1.1, "condition": "Partly cloudy", "lightning_pct": 12, "cyclone": None},
            "tomorrow": {"wind_kn": 22, "gust_kn": 32, "wave_m": 2.1, "condition": "Squally showers", "lightning_pct": 45, "cyclone": None},
        },
        "alerts": [],
        "boundaries": [
            {"key": "rushikulya-turtle-rookery", "name": "Rushikulya River Mouth Olive Ridley Rookery", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: Mass Olive Ridley turtle nesting zone — trawler ban enforced.",
             "geometry": _poly(85.08, 19.38, 0.08, 0.07)},
        ],
        "grid_base": {"lat": 19.10, "lon": 84.90},
        "grid_dir": {"lat_step": 1, "lon_step": 1},
        "sst_trend": [28.7, 28.6, 28.5, 28.4, 28.4, 28.5, 28.5],
        "chl_trend": [2.0, 2.1, 2.3, 2.4, 2.5, 2.4, 2.3],
        "wind_trend": [11, 12, 12, 13, 13, 13, 13],
        "wave_trend": [0.9, 1.0, 1.0, 1.1, 1.1, 1.1, 1.1],
        "tide_events": [
            {"type": "High", "time": "05:25 IST", "height_m": 1.4},
            {"type": "Low", "time": "11:35 IST", "height_m": 0.3},
            {"type": "High", "time": "17:55 IST", "height_m": 1.6},
            {"type": "Low", "time": "23:45 IST", "height_m": 0.4},
        ],
    },

    # --- WEST BENGAL ---
    "digha": {
        "id": "digha", "name": "Digha", "state": "West Bengal",
        "center": {"lat": 21.56, "lon": 87.58}, "coast_bearing": "south",
        "sea": "Bay of Bengal",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Shankarpur Deep", "lat": 21.50, "lon": 87.60,
             "confidence": 0.85, "sst_c": 28.8, "chl_mg_m3": 3.0, "depth_m": 25,
             "species": "Hilsa, Pomfret, Tiger Prawn", "distance_note": "~16 km S of Shankarpur Harbour"},
        ],
        "forecast": {
            "today": {"wind_kn": 14, "gust_kn": 19, "wave_m": 1.2, "condition": "Partly cloudy", "lightning_pct": 18, "cyclone": None},
            "tomorrow": {"wind_kn": 26, "gust_kn": 38, "wave_m": 2.5, "condition": "Heavy rain & high swell", "lightning_pct": 60, "cyclone": None},
        },
        "alerts": [],
        "boundaries": [
            {"key": "subarnarekha-mouth", "name": "Subarnarekha Estuary Ecological Zone", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: Protected estuarine fish breeding grounds.",
             "geometry": _poly(87.35, 21.55, 0.08, 0.07)},
        ],
        "grid_base": {"lat": 21.40, "lon": 87.55},
        "grid_dir": {"lat_step": 1, "lon_step": 1},
        "sst_trend": [29.1, 29.0, 28.9, 28.8, 28.8, 28.7, 28.8],
        "chl_trend": [2.6, 2.7, 2.8, 3.0, 3.1, 3.0, 2.9],
        "wind_trend": [12, 13, 13, 14, 14, 14, 14],
        "wave_trend": [1.0, 1.0, 1.1, 1.1, 1.2, 1.2, 1.2],
        "tide_events": [
            {"type": "High", "time": "04:45 IST", "height_m": 2.5},
            {"type": "Low", "time": "10:55 IST", "height_m": 0.5},
            {"type": "High", "time": "17:05 IST", "height_m": 2.8},
            {"type": "Low", "time": "23:05 IST", "height_m": 0.6},
        ],
    },
    "sundarbans": {
        "id": "sundarbans", "name": "Sundarbans (Canning)", "state": "West Bengal",
        "center": {"lat": 21.45, "lon": 88.35}, "coast_bearing": "south",
        "sea": "Bay of Bengal",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Jambudwip Offshore Shelf", "lat": 21.50, "lon": 88.30,
             "confidence": 0.88, "sst_c": 28.9, "chl_mg_m3": 3.4, "depth_m": 22,
             "species": "Hilsa, Bhetki, Giant Prawn", "distance_note": "~15 km S of Sagar Island"},
        ],
        "forecast": {
            "today": {"wind_kn": 15, "gust_kn": 21, "wave_m": 1.3, "condition": "Cloudy", "lightning_pct": 25, "cyclone": None},
            "tomorrow": {"wind_kn": 28, "gust_kn": 42, "wave_m": 2.7, "condition": "Squally winds & thunderstorms", "lightning_pct": 65, "cyclone": None},
        },
        "alerts": [
            {"key": "alert-sundarban-01", "type": "high_wave", "severity": "moderate",
             "title": "Tidal Inundation Advisory — Sundarbans",
             "body": "Spring tides combined with 2.5 m waves likely to cause surge in estuarine channels.",
             "source": "INCOIS Ocean State Forecast", "issued_hours_ago": 2, "valid_hours": 30},
        ],
        "boundaries": [
            {"key": "sundarbans-national-park", "name": "Sundarbans Tiger Reserve & UNESCO Biosphere (Core)", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: UNESCO World Heritage & Core Tiger Reserve — STRICT NO ENTRY FOR FISHING.",
             "geometry": _poly(88.85, 21.75, 0.20, 0.18)},
            {"key": "sajnekhali-sanctuary", "name": "Sajnekhali Wildlife Sanctuary", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: Core mangrove sanctuary zone.",
             "geometry": _poly(88.75, 22.10, 0.12, 0.10)},
        ],
        "grid_base": {"lat": 21.60, "lon": 88.60},
        "grid_dir": {"lat_step": 1, "lon_step": 1},
        "sst_trend": [29.2, 29.1, 29.0, 28.9, 28.9, 28.8, 28.9],
        "chl_trend": [3.0, 3.1, 3.2, 3.4, 3.5, 3.4, 3.3],
        "wind_trend": [13, 14, 14, 15, 15, 15, 15],
        "wave_trend": [1.1, 1.1, 1.2, 1.2, 1.3, 1.3, 1.3],
        "tide_events": [
            {"type": "High", "time": "04:30 IST", "height_m": 3.2},
            {"type": "Low", "time": "10:45 IST", "height_m": 0.6},
            {"type": "High", "time": "16:50 IST", "height_m": 3.6},
            {"type": "Low", "time": "22:50 IST", "height_m": 0.7},
        ],
    },

    # --- UNION TERRITORIES & ISLANDS ---
    "portblair": {
        "id": "portblair", "name": "Port Blair", "state": "Andaman & Nicobar",
        "center": {"lat": 11.66, "lon": 92.79}, "coast_bearing": "east",
        "sea": "Andaman Sea",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Rutland Island Shelf", "lat": 11.45, "lon": 92.65,
             "confidence": 0.90, "sst_c": 29.2, "chl_mg_m3": 1.7, "depth_m": 70,
             "species": "Yellowfin Tuna, Marlin, Grouper", "distance_note": "~20 km S of Port Blair"},
        ],
        "forecast": {
            "today": {"wind_kn": 12, "gust_kn": 16, "wave_m": 1.0, "condition": "Passing showers", "lightning_pct": 15, "cyclone": None},
            "tomorrow": {"wind_kn": 16, "gust_kn": 22, "wave_m": 1.4, "condition": "Scattered thunderstorms", "lightning_pct": 35, "cyclone": None},
        },
        "alerts": [],
        "boundaries": [
            {"key": "mg-marine-national-park", "name": "Mahatma Gandhi Marine National Park (Wandoor)", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: Coral & sea turtle sanctuary — ALL FISHING STRICTLY PROHIBITED.",
             "geometry": _poly(92.58, 11.55, 0.10, 0.08)},
            {"key": "jarawa-tribal-reserve", "name": "Andaman Tribal Reserve Coastal Buffer", "kind": "restricted",
             "restricted": True, "note": "⛔ RESTRICTED: Protected indigenous tribal reserve — STRICT PENALTY FOR ENTRY.",
             "geometry": _poly(92.68, 11.85, 0.09, 0.08)},
        ],
        "grid_base": {"lat": 11.40, "lon": 92.70},
        "grid_dir": {"lat_step": 1, "lon_step": 1},
        "sst_trend": [29.4, 29.3, 29.2, 29.2, 29.1, 29.1, 29.2],
        "chl_trend": [1.4, 1.5, 1.6, 1.7, 1.8, 1.7, 1.6],
        "wind_trend": [11, 11, 12, 12, 12, 13, 12],
        "wave_trend": [0.9, 0.9, 1.0, 1.0, 1.0, 1.1, 1.0],
        "tide_events": [
            {"type": "High", "time": "04:10 IST", "height_m": 1.8},
            {"type": "Low", "time": "10:20 IST", "height_m": 0.4},
            {"type": "High", "time": "16:30 IST", "height_m": 2.0},
            {"type": "Low", "time": "22:35 IST", "height_m": 0.5},
        ],
    },
    "kavaratti": {
        "id": "kavaratti", "name": "Kavaratti", "state": "Lakshadweep",
        "center": {"lat": 10.55, "lon": 72.62}, "coast_bearing": "west",
        "sea": "Arabian Sea",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Suheli Par Atoll Deep", "lat": 10.05, "lon": 72.25,
             "confidence": 0.92, "sst_c": 28.8, "chl_mg_m3": 1.5, "depth_m": 120,
             "species": "Skipjack Tuna, Yellowfin Tuna, Shark", "distance_note": "~45 km SW of Kavaratti Lagoon"},
        ],
        "forecast": {
            "today": {"wind_kn": 10, "gust_kn": 14, "wave_m": 0.9, "condition": "Clear", "lightning_pct": 5, "cyclone": None},
            "tomorrow": {"wind_kn": 13, "gust_kn": 18, "wave_m": 1.1, "condition": "Fair", "lightning_pct": 10, "cyclone": None},
        },
        "alerts": [],
        "boundaries": [
            {"key": "pitti-bird-sanctuary", "name": "Pitti Island (Pakshipitti) Marine Bird Sanctuary", "kind": "mpa",
             "restricted": True, "note": "⛔ RESTRICTED: Pelagic seabird breeding colony — anchoring & fishing prohibited.",
             "geometry": _poly(72.53, 10.78, 0.04, 0.03)},
        ],
        "grid_base": {"lat": 10.40, "lon": 72.60},
        "grid_dir": {"lat_step": 1, "lon_step": -1},
        "sst_trend": [29.0, 28.9, 28.8, 28.8, 28.7, 28.7, 28.8],
        "chl_trend": [1.2, 1.3, 1.4, 1.5, 1.6, 1.5, 1.4],
        "wind_trend": [9, 9, 10, 10, 10, 11, 10],
        "wave_trend": [0.8, 0.8, 0.8, 0.9, 0.9, 0.9, 0.9],
        "tide_events": [
            {"type": "High", "time": "05:30 IST", "height_m": 1.2},
            {"type": "Low", "time": "11:40 IST", "height_m": 0.3},
            {"type": "High", "time": "17:50 IST", "height_m": 1.3},
            {"type": "Low", "time": "23:45 IST", "height_m": 0.4},
        ],
    },
    "puducherry": {
        "id": "puducherry", "name": "Puducherry", "state": "Puducherry",
        "center": {"lat": 11.92, "lon": 79.88}, "coast_bearing": "east",
        "sea": "Bay of Bengal",
        "pfz_zones": [
            {"key": "pfz-1", "name": "Pondicherry Artificial Reef", "lat": 11.90, "lon": 79.88,
             "confidence": 0.84, "sst_c": 29.5, "chl_mg_m3": 1.6, "depth_m": 28,
             "species": "Snapper, Grouper, Seer fish", "distance_note": "~10 km E of promenade"},
        ],
        "forecast": {
            "today": {"wind_kn": 12, "gust_kn": 16, "wave_m": 1.0, "condition": "Clear", "lightning_pct": 10, "cyclone": None},
            "tomorrow": {"wind_kn": 18, "gust_kn": 26, "wave_m": 1.8, "condition": "Moderate swell", "lightning_pct": 30, "cyclone": None},
        },
        "alerts": [],
        "boundaries": [
            {"key": "puducherry-harbour", "name": "Puducherry Port Approach Channel", "kind": "restricted",
             "restricted": True, "note": "⛔ RESTRICTED: Port navigation zone.",
             "geometry": _poly(79.84, 11.92, 0.035, 0.03)},
        ],
        "grid_base": {"lat": 11.80, "lon": 79.80},
        "grid_dir": {"lat_step": 1, "lon_step": 1},
        "sst_trend": [29.7, 29.6, 29.5, 29.4, 29.4, 29.5, 29.5],
        "chl_trend": [1.2, 1.3, 1.4, 1.6, 1.7, 1.6, 1.5],
        "wind_trend": [11, 11, 12, 12, 12, 13, 12],
        "wave_trend": [0.8, 0.9, 0.9, 1.0, 1.0, 1.0, 1.0],
        "tide_events": [
            {"type": "High", "time": "04:50 IST", "height_m": 1.1},
            {"type": "Low", "time": "10:35 IST", "height_m": 0.2},
            {"type": "High", "time": "17:15 IST", "height_m": 1.2},
            {"type": "Low", "time": "23:00 IST", "height_m": 0.3},
        ],
    },
}

# Legacy single-region export (kept for any not-yet-migrated call site).
REGION = {
    "id": REGIONS[DEFAULT_REGION_ID]["id"],
    "name": f"{REGIONS[DEFAULT_REGION_ID]['name']}, {REGIONS[DEFAULT_REGION_ID]['state']}",
    "center": REGIONS[DEFAULT_REGION_ID]["center"],
    "coast_bearing": f"{REGIONS[DEFAULT_REGION_ID]['coast_bearing']} ({REGIONS[DEFAULT_REGION_ID]['sea']})",
}
BOUNDARIES = REGIONS[DEFAULT_REGION_ID]["boundaries"]
PFZ_ZONES = REGIONS[DEFAULT_REGION_ID]["pfz_zones"]


def _region(region_id: str | None) -> dict:
    return REGIONS.get(region_id or DEFAULT_REGION_ID, REGIONS[DEFAULT_REGION_ID])


def _full_name(r: dict) -> str:
    return f"{r['name']}, {r['state']}"


# ---------------------------------------------------------------------------
# Region registry API — used by the India-wide region selector
# ---------------------------------------------------------------------------
def list_regions() -> list[dict]:
    return [
        {"id": r["id"], "name": r["name"], "state": r["state"],
         "center": r["center"], "sea": r["sea"]}
        for r in REGIONS.values()
    ]


def get_region(region_id: str | None = None) -> dict:
    r = _region(region_id)
    return {"id": r["id"], "name": r["name"], "state": r["state"],
            "center": r["center"], "coast_bearing": r["coast_bearing"],
            "sea": r["sea"]}


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = (math.sin(dphi / 2) ** 2
         + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2)
    return 2 * R * math.asin(math.sqrt(a))


def nearest_region(lat: float, lon: float) -> tuple[dict, float]:
    """Nearest supported coastal region to a GPS point (India-wide lookup)."""
    best, best_d = None, float("inf")
    for r in REGIONS.values():
        d = _haversine_km(lat, lon, r["center"]["lat"], r["center"]["lon"])
        if d < best_d:
            best, best_d = r, d
    return get_region(best["id"]), round(best_d, 1)


# ---------------------------------------------------------------------------
# INCOIS adapter — Potential Fishing Zones + tide table
# ---------------------------------------------------------------------------
def get_pfz_advisory(region_id: str | None = None) -> dict:
    r = _region(region_id)
    return {"source": "INCOIS PFZ Advisory", "is_mock": True,
            "last_updated": _hours_ago(6), "region": _full_name(r),
            "region_id": r["id"], "zones": r["pfz_zones"]}


def get_tide_table(region_id: str | None = None) -> dict:
    r = _region(region_id)
    return {"source": "INCOIS Tide Tables", "is_mock": True,
            "last_updated": _hours_ago(6), "region": _full_name(r),
            "region_id": r["id"], "events": r["tide_events"]}


# ---------------------------------------------------------------------------
# IMD adapter — weather forecast + cyclone / lightning bulletins
# ---------------------------------------------------------------------------
def get_weather(region_id: str | None = None, timeframe: str = "today") -> dict:
    r = _region(region_id)
    key = "tomorrow" if timeframe and "tomorrow" in timeframe.lower() else "today"
    fc = r["forecast"][key]
    return {"source": "IMD Marine Weather Forecast", "is_mock": True,
            "last_updated": _hours_ago(3), "region": _full_name(r),
            "region_id": r["id"], "timeframe": key, **fc}


def get_active_alerts(region_id: str | None = None) -> list[dict]:
    r = _region(region_id)
    now = datetime.now(timezone.utc)
    out = []
    for a in r["alerts"]:
        out.append({
            "key": a["key"], "type": a["type"], "severity": a["severity"],
            "title": a["title"], "body": a["body"], "source": a["source"],
            "is_mock": True, "issued_at": _hours_ago(a["issued_hours_ago"]),
            "valid_until": (now + timedelta(hours=a["valid_hours"])).isoformat(),
            "region": _full_name(r), "region_id": r["id"],
        })
    return out


# ---------------------------------------------------------------------------
# ISRO / Bhuvan adapter — SST + chlorophyll grids and 7-day trends
# ---------------------------------------------------------------------------
def _grid(region_id: str | None = None) -> list[dict]:
    r = _region(region_id)
    base_lat, base_lon = r["grid_base"]["lat"], r["grid_base"]["lon"]
    lat_step = r.get("grid_dir", {}).get("lat_step", 1)
    lon_step = r.get("grid_dir", {}).get("lon_step", 1)
    points = []
    for i in range(5):
        for j in range(5):
            lat = round(base_lat + lat_step * i * 0.11, 4)
            lon = round(base_lon + lon_step * j * 0.11, 4)
            sst = round(29.0 - j * 0.28 - i * 0.05, 2)
            chl = round(2.6 - j * 0.32 + (i % 2) * 0.15, 2)
            points.append({"lat": lat, "lon": lon, "sst_c": sst,
                           "chl_mg_m3": max(chl, 0.2)})
    return points


def get_sst_chl_grid(region_id: str | None = None) -> dict:
    r = _region(region_id)
    return {"source": "ISRO / Bhuvan Ocean Colour (SST & Chlorophyll)",
            "is_mock": True, "last_updated": _hours_ago(8),
            "region": _full_name(r), "region_id": r["id"], "grid": _grid(region_id)}


def _trend(region_id: str | None, key: str, source: str, unit: str) -> dict:
    r = _region(region_id)
    days = [(datetime.now(timezone.utc) - timedelta(days=d)).strftime("%d %b")
            for d in range(6, -1, -1)]
    return {"source": source, "is_mock": True, "last_updated": _hours_ago(8),
            "region": _full_name(r), "region_id": r["id"], "unit": unit,
            "labels": days, "values": r[key]}


def get_sst_trend(region_id: str | None = None) -> dict:
    return _trend(region_id, "sst_trend", "ISRO / Bhuvan SST time-series", "°C")


def get_chl_trend(region_id: str | None = None) -> dict:
    return _trend(region_id, "chl_trend", "ISRO / Bhuvan Chlorophyll time-series", "mg/m³")


def get_wind_trend(region_id: str | None = None) -> dict:
    return _trend(region_id, "wind_trend", "IMD Marine Weather time-series", "kn")


def get_wave_trend(region_id: str | None = None) -> dict:
    return _trend(region_id, "wave_trend", "INCOIS Ocean State time-series", "m")


# ---------------------------------------------------------------------------
# Bundled maritime boundary reference layer (static GeoJSON) -> PostGIS/Mongo
# ---------------------------------------------------------------------------
def get_boundaries(region_id: str | None = None) -> list[dict]:
    return _region(region_id)["boundaries"]


# ---------------------------------------------------------------------------
# Flattened, uniquely-keyed exports for seeding the NATIONWIDE spatial index.
# ---------------------------------------------------------------------------
def all_pfz_zones() -> list[dict]:
    out = []
    for r in REGIONS.values():
        for z in r["pfz_zones"]:
            out.append({**z, "key": f"{r['id']}-{z['key']}", "region_id": r["id"],
                       "region": _full_name(r)})
    return out


def all_boundaries_all_regions() -> list[dict]:
    out = []
    for r in REGIONS.values():
        for b in r["boundaries"]:
            out.append({**b, "key": f"{r['id']}-{b['key']}", "region_id": r["id"],
                       "region": _full_name(r)})
    return out


# ---------------------------------------------------------------------------
# Fleet Operations & Real-Time Vessel Tracking (India Coastline)
# ---------------------------------------------------------------------------
def get_fleet_vessels(region_id: str | None = None) -> list[dict]:
    r = _region(region_id)
    c_lat, c_lon = r["center"]["lat"], r["center"]["lon"]
    # Offset vessels realistically into coastal waters based on coast bearing
    bearing = r.get("coast_bearing", "east").lower()
    d_lon = 0.12 if "east" in bearing else -0.12

    vessels = [
        {
            "id": f"vsl-{r['id']}-01",
            "name": f"FV Matsya Jyoti ({r['name']})",
            "type": "Mechanised Trawler",
            "lat": round(c_lat - 0.04, 4),
            "lon": round(c_lon + d_lon * 1.1, 4),
            "speed_kn": 4.8,
            "heading_deg": 115,
            "status": "Active Trawling",
            "vhf_channel": "Ch 16 / 68",
            "crew": 6,
            "safety_verdict": "SAFE",
        },
        {
            "id": f"vsl-{r['id']}-02",
            "name": f"FV Sagar Kanya-04",
            "type": "Gillnetter / Longliner",
            "lat": round(c_lat + 0.08, 4),
            "lon": round(c_lon + d_lon * 1.5, 4),
            "speed_kn": 5.2,
            "heading_deg": 45,
            "status": "Hauling Catch",
            "vhf_channel": "Ch 16 / 72",
            "crew": 8,
            "safety_verdict": "SAFE",
        },
        {
            "id": f"vsl-{r['id']}-03",
            "name": "Artisanal Craft Ganga-9",
            "type": "Motorised Catamaran",
            "lat": round(c_lat + 0.02, 4),
            "lon": round(c_lon + d_lon * 0.7, 4),
            "speed_kn": 3.1,
            "heading_deg": 210,
            "status": "Drifting Net Line",
            "vhf_channel": "Ch 16",
            "crew": 3,
            "safety_verdict": "SAFE",
        },
        {
            "id": f"vsl-{r['id']}-04",
            "name": "ICG Patrol Varuna (C-412)",
            "type": "Coast Guard Interceptor",
            "lat": round(c_lat - 0.10, 4),
            "lon": round(c_lon + d_lon * 1.8, 4),
            "speed_kn": 14.5,
            "heading_deg": 350,
            "status": "Coastal Patrol / Fairway Security",
            "vhf_channel": "Ch 16 (Emergency)",
            "crew": 12,
            "safety_verdict": "SAFE",
        },
    ]
    return vessels

