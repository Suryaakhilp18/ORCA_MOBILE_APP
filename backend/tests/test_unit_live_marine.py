import pytest
from data_adapters.live_marine import _wmo_condition, calculate_bearing, get_weather, _MEM_WEATHER_CACHE


class TestLiveMarineAdapter:
    def test_wmo_condition_mapping(self):
        desc, light = _wmo_condition(0)
        assert "clear" in desc.lower()
        assert light == 5

        desc, light = _wmo_condition(95)
        assert "thunderstorm" in desc.lower() or "lightning" in desc.lower()
        assert light >= 70

        desc, light = _wmo_condition(51)
        assert "drizzle" in desc.lower() or "shower" in desc.lower()

    def test_calculate_bearing_angles(self):
        # East
        deg, card = calculate_bearing(0.0, 0.0, 0.0, 1.0)
        assert 89.0 <= deg <= 91.0
        assert card == "E"

        # North
        deg, card = calculate_bearing(0.0, 0.0, 1.0, 0.0)
        assert deg == 0.0 or deg == 360.0
        assert card == "N"

        # South
        deg, card = calculate_bearing(1.0, 0.0, 0.0, 0.0)
        assert 179.0 <= deg <= 181.0
        assert card == "S"

    def test_get_weather_live_or_fallback(self):
        import asyncio
        w = asyncio.run(get_weather("kakinada", "today"))
        assert "wind_kn" in w
        assert "wave_m" in w
        assert "condition" in w
        assert "lightning_pct" in w
        assert "source" in w
        assert w["wind_kn"] >= 0
        assert w["wave_m"] >= 0

