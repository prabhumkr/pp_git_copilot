from urllib.parse import quote

import pytest
from fastapi.testclient import TestClient

# Try importing app from either import paths depending on PYTHONPATH
try:
    from app import app, activities
except Exception:
    from src.app import app, activities


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # spot-check a known activity exists
    assert "Chess Club" in data


def test_signup_and_unregister():
    activity = "Chess Club"
    email = "pytest_temp@example.com"

    # backup original participants and restore afterwards
    orig = activities[activity]["participants"][:]
    if email in orig:
        orig.remove(email)

    try:
        # sign up
        url = f"/activities/{quote(activity)}/signup?email={quote(email)}"
        r = client.post(url)
        assert r.status_code == 200, r.text

        # verify participant present
        data = client.get("/activities").json()
        assert email in data[activity]["participants"]

        # unregister
        url2 = f"/activities/{quote(activity)}/participants?email={quote(email)}"
        r2 = client.delete(url2)
        assert r2.status_code == 200, r2.text

        # verify removed
        data2 = client.get("/activities").json()
        assert email not in data2[activity]["participants"]
    finally:
        activities[activity]["participants"] = orig
