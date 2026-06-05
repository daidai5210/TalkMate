"""conversation 模块 pytest 测试。

覆盖场景:
- 未认证拒绝
- 创建对话:成功 + 不存在场景报错
- 获取对话:成功 + 拉历史消息
- 发送消息:成功 + 对话不存在报错
- 错误码 2001(场景不存在)/ 3001(对话不存在)
"""
import os
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.modules.scenario.seed import seed_scenarios

TEST_DB_PATH = "./test_conversation.db"


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


@pytest.fixture
def mock_ai_client():
    """替换 conversation routes 内部的 AIService 使用的 DeepSeekClient。"""
    from app.modules.ai_service.client import DeepSeekClient
    from app.modules.ai_service.service import AIService

    fake = MagicMock(spec=DeepSeekClient)
    fake.chat.return_value = "AI 占位回复:已收到你的消息"
    original = DeepSeekClient.__init__
    DeepSeekClient.__init__ = lambda self, *a, **kw: setattr(self, "client", MagicMock()) or setattr(self, "model", "fake") or setattr(self, "chat", fake.chat)
    original_service_init = AIService.__init__
    AIService.__init__ = lambda self, *a, **kw: setattr(self, "client", fake) or setattr(self, "max_history", 20)
    try:
        yield fake
    finally:
        DeepSeekClient.__init__ = original
        AIService.__init__ = original_service_init


def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _register_login(client: TestClient, username: str = "convuser") -> str:
    client.post(
        "/api/v1/auth/register",
        json={"username": username, "password": "TestPass123", "captcha": "1234"},
    )
    resp = client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": "TestPass123"},
    )
    return resp.json()["data"]["token"]


def test_create_conversation_unauthorized(client: TestClient) -> None:
    resp = client.post("/api/v1/conversations", json={"scenario_id": 1})
    assert resp.status_code == 401
    assert resp.json()["code"] == 1004


def test_create_conversation_success(client: TestClient) -> None:
    token = _register_login(client)
    resp = client.post(
        "/api/v1/conversations",
        json={"scenario_id": 1},
        headers=_auth_header(token),
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["code"] == 0
    conv = body["data"]
    assert conv["scenario"]["id"] == 1
    assert conv["scenario"]["name"] == "面试"
    assert conv["messages"] == []


def test_create_conversation_scenario_not_found(client: TestClient) -> None:
    token = _register_login(client, "convuser2")
    resp = client.post(
        "/api/v1/conversations",
        json={"scenario_id": 9999},
        headers=_auth_header(token),
    )
    assert resp.status_code == 400
    assert resp.json()["code"] == 2001


def test_get_conversation_with_messages(client: TestClient, mock_ai_client) -> None:
    token = _register_login(client, "convuser3")
    create = client.post(
        "/api/v1/conversations",
        json={"scenario_id": 2},
        headers=_auth_header(token),
    )
    conv_id = create.json()["data"]["id"]

    msg = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"text": "Hello, I want to order food"},
        headers=_auth_header(token),
    )
    assert msg.status_code == 200, msg.text
    msg_body = msg.json()
    assert msg_body["code"] == 0
    assert msg_body["data"]["user_message"]["role"] == "user"
    assert msg_body["data"]["user_message"]["text"] == "Hello, I want to order food"
    assert msg_body["data"]["ai_message"]["role"] == "ai"
    assert "占位" in msg_body["data"]["ai_message"]["text"]

    resp = client.get(
        f"/api/v1/conversations/{conv_id}",
        headers=_auth_header(token),
    )
    assert resp.status_code == 200
    body = resp.json()
    msgs = body["data"]["messages"]
    assert len(msgs) == 2
    assert msgs[0]["role"] == "user"
    assert msgs[1]["role"] == "ai"


def test_get_conversation_not_found(client: TestClient) -> None:
    token = _register_login(client, "convuser4")
    resp = client.get(
        "/api/v1/conversations/9999",
        headers=_auth_header(token),
    )
    assert resp.status_code == 400
    assert resp.json()["code"] == 3001


def test_send_message_not_found(client: TestClient) -> None:
    token = _register_login(client, "convuser5")
    resp = client.post(
        "/api/v1/conversations/9999/messages",
        json={"text": "hi"},
        headers=_auth_header(token),
    )
    assert resp.status_code == 400
    assert resp.json()["code"] == 3001


def test_send_message_validation(client: TestClient) -> None:
    token = _register_login(client, "convuser6")
    create = client.post(
        "/api/v1/conversations",
        json={"scenario_id": 1},
        headers=_auth_header(token),
    )
    conv_id = create.json()["data"]["id"]
    resp = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"text": ""},
        headers=_auth_header(token),
    )
    assert resp.status_code == 422
