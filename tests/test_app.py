import copy
from fastapi.testclient import TestClient
import src.app as app_module
from src.app import app

client = TestClient(app)

# Snapshot the initial activities so tests can reset global state
_initial_activities = copy.deepcopy(app_module.activities)

import pytest

@pytest.fixture(autouse=True)
def reset_activities():
    # Reset activities before each test to ensure isolation
    app_module.activities = copy.deepcopy(_initial_activities)
    yield


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_and_presence():
    res = client.post("/activities/Chess%20Club/signup?email=testuser%40example.com")
    assert res.status_code == 200
    assert "Signed up testuser@example.com for Chess Club" in res.json()["message"]

    res2 = client.get("/activities")
    assert "testuser@example.com" in res2.json()["Chess Club"]["participants"]


def test_signup_duplicate():
    client.post("/activities/Chess%20Club/signup?email=testuser%40example.com")
    res = client.post("/activities/Chess%20Club/signup?email=testuser%40example.com")
    assert res.status_code == 400


def test_signup_invalid_activity():
    res = client.post("/activities/NoSuchActivity/signup?email=foo%40bar.com")
    assert res.status_code == 404


def test_unregister_existing():
    client.post("/activities/Chess%20Club/signup?email=testuser%40example.com")
    res = client.delete("/activities/Chess%20Club/unregister?email=testuser%40example.com")
    assert res.status_code == 200
    assert "Unregistered testuser@example.com from Chess Club" in res.json()["message"]

    res2 = client.get("/activities")
    assert "testuser@example.com" not in res2.json()["Chess Club"]["participants"]


def test_unregister_not_present():
    res = client.delete("/activities/Chess%20Club/unregister?email=missing%40example.com")
    assert res.status_code == 404
