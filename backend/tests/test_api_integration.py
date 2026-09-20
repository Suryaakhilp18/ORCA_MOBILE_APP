import pytest
from starlette.testclient import TestClient
from server import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


class TestApiEndpoints:
    def test_health(self, client):
        r = client.get("/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_regions_and_detect(self, client):
        r = client.get("/api/regions")
        assert r.status_code == 200
        data = r.json()
        assert "regions" in data
        assert len(data["regions"]) >= 6

        r_det = client.get("/api/regions/detect?lat=16.9891&lon=82.2475")
        assert r_det.status_code == 200
        assert r_det.json()["region"]["id"] == "kakinada"

    def test_situation(self, client):
        r = client.get("/api/situation?region_id=kakinada")
        assert r.status_code == 200
        data = r.json()
        assert "severity" in data
        assert "verdict" in data
        assert "weather_today" in data
        assert "weather_tomorrow" in data
        assert "trends" in data

    def test_alerts(self, client):
        r = client.get("/api/alerts?region_id=kakinada")
        assert r.status_code == 200
        data = r.json()
        assert "alerts" in data

    def test_locations_crud(self, client):
        # Create
        loc = {"name": "Test Anchorage", "lat": 16.95, "lon": 82.40, "user_id": "test-user-pytest"}
        r_create = client.post("/api/locations", json=loc)
        assert r_create.status_code == 200
        created = r_create.json()
        loc_id = created["id"]
        assert created["name"] == "Test Anchorage"

        # List
        r_list = client.get("/api/locations?user_id=test-user-pytest")
        assert r_list.status_code == 200
        items = r_list.json()
        assert any(i["id"] == loc_id for i in items)

        # Delete
        r_del = client.delete(f"/api/locations/{loc_id}")
        assert r_del.status_code == 200
        assert r_del.json()["deleted"] is True

    def test_register_push_token(self, client):
        payload = {
            "user_id": "test-user-push",
            "token": "ExponentPushToken[xxxx-test-token-xxxx]",
            "region_id": "kakinada",
        }
        r = client.post("/api/notifications/register-token", json=payload)
        assert r.status_code == 200
        assert r.json()["registered"] is True

    def test_chat_pipeline(self, client):
        payload = {
            "message": "Where is the nearest safe fishing zone?",
            "session_id": "test-session-pytest-123",
            "language": "en",
            "location": {"lat": 16.9891, "lon": 82.2475, "name": "Kakinada Harbor"},
            "region_id": "kakinada",
            "user_id": "test-user-pytest",
        }
        r = client.post("/api/chat", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert "user_message" in data
        assert "assistant_message" in data
        am = data["assistant_message"]
        assert am["role"] == "assistant"
        assert len(am["content"]) > 0
        assert "widgets" in am

