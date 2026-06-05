"""scenario 模块 pytest 测试。

覆盖场景:
- 未认证拒绝
- 有效 token 返回 5 个场景
- 场景按 sort_order 排序
- 种子数据自动写入空表
"""
import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.modules.scenario.seed import seed_scenarios

TEST_DB_PATH = "./test_scenario.db"


@pytest.fixture
def client() -> TestClient:
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
    test_engine = create_engine(
        f"sqlite:///{TEST_DB_PATH}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=test_engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    seed_scenarios(TestingSessionLocal())

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    get_settings.cache_clear()
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


def _register_and_login(client: TestClient, username: str = "scenuser") -> str:
    client.post(
        "/api/v1/auth/register",
        json={"username": username, "password": "TestPass123", "captcha": "1234"},
    )
    resp = client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": "TestPass123"},
    )
    return resp.json()["data"]["token"]


def test_list_scenarios_unauthorized(client: TestClient) -> None:
    resp = client.get("/api/v1/scenarios")
    assert resp.status_code == 401
    assert resp.json()["code"] == 1004


def test_list_scenarios_invalid_token(client: TestClient) -> None:
    resp = client.get(
        "/api/v1/scenarios",
        headers={"Authorization": "Bearer invalid.token"},
    )
    assert resp.status_code == 401


def test_list_scenarios_returns_seeded(client: TestClient) -> None:
    token = _register_and_login(client)
    resp = client.get(
        "/api/v1/scenarios",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["code"] == 0
    scenarios = body["data"]
    assert len(scenarios) == 5


def test_list_scenarios_fields(client: TestClient) -> None:
    token = _register_and_login(client, username="fielduser")
    resp = client.get(
        "/api/v1/scenarios",
        headers={"Authorization": f"Bearer {token}"},
    )
    scenarios = resp.json()["data"]
    expected_keys = {"id", "name", "description", "icon"}
    for s in scenarios:
        assert set(s.keys()) == expected_keys
        assert s["name"]
        assert s["description"]
        assert s["icon"]


def test_list_scenarios_ordered_by_sort_order(client: TestClient) -> None:
    token = _register_and_login(client, username="orderuser")
    resp = client.get(
        "/api/v1/scenarios",
        headers={"Authorization": f"Bearer {token}"},
    )
    scenarios = resp.json()["data"]
    names = [s["name"] for s in scenarios]
    assert names == ["面试", "点餐", "会议", "旅行", "日常"]
