import asyncio
import math
import pytest
from orchestrator.rules import evaluate_sea_safety, compute_situation_severity
from gis import spatial
from data_adapters import mock_region as mr


class TestSafetyRules:
    def test_safe_conditions(self):
        w = {
            "wind_kn": 10,
            "gust_kn": 15,
            "wave_m": 0.8,
            "lightning_pct": 10,
            "cyclone": None,
        }
        res = evaluate_sea_safety(w)
        assert res["verdict"] == "SAFE"
        assert len(res["reasons"]) >= 1

    def test_caution_moderate_waves(self):
        w = {
            "wind_kn": 18,
            "gust_kn": 22,
            "wave_m": 1.8,
            "lightning_pct": 20,
            "cyclone": None,
        }
        res = evaluate_sea_safety(w)
        assert res["verdict"] == "CAUTION"
        assert len(res["reasons"]) > 0

    def test_unsafe_cyclone_warning(self):
        w = {
            "wind_kn": 32,
            "gust_kn": 45,
            "wave_m": 3.2,
            "lightning_pct": 75,
            "cyclone": "Deep Depression BOB-04",
        }
        res = evaluate_sea_safety(w)
        assert res["verdict"] == "UNSAFE"
        assert any("cyclone" in r.lower() or "depression" in r.lower() for r in res["reasons"])

    def test_unsafe_high_lightning(self):
        w = {
            "wind_kn": 12,
            "gust_kn": 15,
            "wave_m": 0.9,
            "lightning_pct": 80,
            "cyclone": None,
        }
        res = evaluate_sea_safety(w)
        assert res["verdict"] == "UNSAFE"
        assert any("lightning" in r.lower() for r in res["reasons"])

    def test_situation_severity(self):
        assert compute_situation_severity("UNSAFE", [{"severity": "high"}]) == "critical"
        assert compute_situation_severity("CAUTION", []) == "warning"
        assert compute_situation_severity("SAFE", []) == "advisory"


class TestSpatialAlgorithms:
    def test_haversine_distance(self):
        # Distance from Kakinada (16.9891, 82.2475) to Uppada (17.085, 82.33) ~13-16 km
        d = spatial._haversine_km(16.9891, 82.2475, 17.085, 82.33)
        assert 10.0 < d < 20.0

    def test_bearing_cardinal(self):
        # Due East
        deg, card = spatial._bearing(10.0, 80.0, 10.0, 85.0)
        assert 88.0 <= deg <= 92.0
        assert card == "E"

        # Due North
        deg_n, card_n = spatial._bearing(10.0, 80.0, 15.0, 80.0)
        assert deg_n == 0.0 or deg_n == 360.0
        assert card_n == "N"

    def test_point_in_polygon(self):
        poly = [[0.0, 0.0], [2.0, 0.0], [2.0, 2.0], [0.0, 2.0], [0.0, 0.0]]
        assert spatial._point_in_polygon(1.0, 1.0, poly) is True
        assert spatial._point_in_polygon(3.0, 3.0, poly) is False

    def test_nearest_pfz(self):
        zones = asyncio.run(spatial.nearest_pfz(16.9891, 82.2475, limit=3))
        assert len(zones) == 3
        # Should be sorted ascending by distance_km
        assert zones[0]["distance_km"] <= zones[1]["distance_km"] <= zones[2]["distance_km"]
        assert all("lat" in z and "lon" in z and "name" in z for z in zones)

    def test_route_safety_navigation(self):
        start = {"lat": 16.9891, "lon": 82.2475, "name": "Kakinada Harbor"}
        end = {"lat": 17.12, "lon": 82.55, "name": "Uppada Deep"}
        res = asyncio.run(spatial.route_safety(start, end, samples=6))

        assert res["total"] == 7
        assert res["distance_km"] > 0
        assert res["distance_nm"] > 0
        assert "bearing_deg" in res
        assert "bearing_cardinal" in res
        assert "eta_str" in res
        assert len(res["segments"]) == 7
        assert res["segments"][0]["label"].startswith("START")
        assert "DESTINATION" in res["segments"][-1]["label"]

