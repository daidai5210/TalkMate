"""auth 模块 pytest 测试。

覆盖 9 个核心场景:
- 健康检查
- 完整 register → login → logout 流程
- 重复用户名
- 错误验证码
- 错误密码
- 用户不存在
- 缺 token 登出
- 非法 token 登出
- 入参校验
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

TEST_DB_PATH = "./test_talkmate.db"


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


def test_health(client: TestClient) -> None:
    resp = client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    assert body["data"]["status"] == "ok"


def test_register_login_logout_flow(client: TestClient) -> None:
    payload = {"username": "testuser1", "password": "TestPass123", "captcha": "1234"}
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["code"] == 0
    assert body["data"]["username"] == "testuser1"

    resp = client.post(
        "/api/v1/auth/login",
        json={"username": "testuser1", "password": "TestPass123"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["code"] == 0
    token = body["data"]["token"]
    assert token

    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/api/v1/auth/logout", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["code"] == 0


def test_register_duplicate_username(client: TestClient) -> None:
    payload = {"username": "dupuser", "password": "TestPass123", "captcha": "1234"}
    r1 = client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 201
    r2 = client.post("/api/v1/auth/register", json=payload)
    assert r2.status_code == 400
    assert r2.json()["code"] == 1005


def test_register_invalid_captcha(client: TestClient) -> None:
    payload = {"username": "capuser", "password": "TestPass123", "captcha": "0000"}
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 400
    assert resp.json()["code"] == 1006


def test_login_wrong_password(client: TestClient) -> None:
    r = client.post(
        "/api/v1/auth/register",
        json={"username": "wpuser", "password": "TestPass123", "captcha": "1234"},
    )
    assert r.status_code == 201
    resp = client.post(
        "/api/v1/auth/login",
        json={"username": "wpuser", "password": "WrongPass1"},
    )
    assert resp.status_code == 401
    assert resp.json()["code"] == 1002


def test_login_user_not_found(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/auth/login",
        json={"username": "nosuchuser", "password": "TestPass123"},
    )
    assert resp.status_code == 401
    assert resp.json()["code"] == 1001


def test_logout_without_token(client: TestClient) -> None:
    resp = client.post("/api/v1/auth/logout")
    assert resp.status_code == 401


def test_logout_invalid_token(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": "Bearer invalid.token.here"},
    )
    assert resp.status_code == 401


def test_register_validation(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/auth/register",
        json={"username": "ab", "password": "TestPass123", "captcha": "1234"},
    )
    assert resp.status_code == 422

    resp = client.post(
        "/api/v1/auth/register",
        json={"username": "validuser", "password": "short", "captcha": "1234"},
    )
    assert resp.status_code == 422
