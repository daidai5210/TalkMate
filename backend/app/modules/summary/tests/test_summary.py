"""Summary pytest 测试(100% mock AI client)。"""
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.db.base import Base
from app.main import app
from app.modules.ai_service.client import DeepSeekClient
from app.modules.ai_service.service import AIService
from app.db.session import get_db


@pytest.fixture
def mock_ai_summary():
    """注入 mock AI client 返回 deterministic feedback + summary。"""
    fake = MagicMock(spec=DeepSeekClient)

    feedback_json = (
        '[{"original":"I am go to school","corrected":"I am going to school",'
        '"reason":"Wrong verb form: after am/is/are use going not go",'
        '"suggestion":"Remember: am/is/are + going + to + verb"}]'
    )
    summary_json = (
        '{"score":78,'
        '"suggestions":[{"category":"grammar","content":"Practice present continuous"}],'
        '"grammar_issues":{"tense_errors":2,"subject_verb_agreement":0,"article_usage":0,"word_order":1,"other":0},'
        '"vocabulary_usage":{"unique_words":15,"advanced_words_used":["interview","experience"],'
        '"repetitive_words":["I"],"level":"intermediate"}}'
    )

    def fake_chat(messages):
        first = messages[0]["content"]
        if "error analysis" in first.lower() or "feedback" in first.lower():
            return feedback_json
        return summary_json

    fake.chat.side_effect = fake_chat
    return fake


@pytest.fixture
def test_engine():
    eng = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=eng)
    return eng


@pytest.fixture
def client(test_engine, mock_ai_summary):
    from app.modules.conversation.models import Conversation, Message  # noqa: F401
    from app.modules.scenario.models import Scenario  # noqa: F401
    from app.modules.scenario.seed import seed_scenarios
    from app.modules.auth.models import User  # noqa: F401

    TestingSession = sessionmaker(bind=test_engine, autocommit=False, autoflush=False)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    get_settings.cache_clear()

    seed = TestingSession()
    seed_scenarios(seed)
    seed.commit()

    original_init = AIService.__init__

    def patched_init(self, client=None, max_history=20):
        original_init(self, client=mock_ai_summary, max_history=max_history)

    AIService.__init__ = patched_init

    with TestClient(app) as c:
        yield c

    AIService.__init__ = original_init
    app.dependency_overrides.clear()


def _register_login(client, username):
    client.post(
        "/api/v1/auth/register",
        json={"username": username, "password": "TestPass123", "captcha": "1234"},
    )
    r = client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": "TestPass123"},
    )
    return r.json()["data"]["token"]


def _create_conv_with_messages(client, token, scenario_id=1):
    r = client.post(
        "/api/v1/conversations",
        headers={"Authorization": f"Bearer {token}"},
        json={"scenario_id": scenario_id},
    )
    conv_id = r.json()["data"]["id"]
    client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        headers={"Authorization": f"Bearer {token}"},
        json={"text": "I am go to school"},
    )
    return conv_id


def test_post_summary_generates_and_persists(client):
    token = _register_login(client, "sumuser1")
    conv_id = _create_conv_with_messages(client, token)
    r = client.post(
        f"/api/v1/conversations/{conv_id}/summary",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["score"] == 78
    assert len(data["feedback"]) == 1
    assert data["feedback"][0]["original"] == "I am go to school"
    assert "tense_errors" in data["grammar_issues"]
    assert data["vocabulary_usage"]["level"] == "intermediate"
    assert len(data["suggestions"]) == 1


def test_post_summary_is_idempotent(client):
    token = _register_login(client, "sumuser2")
    conv_id = _create_conv_with_messages(client, token)
    r1 = client.post(
        f"/api/v1/conversations/{conv_id}/summary",
        headers={"Authorization": f"Bearer {token}"},
    )
    r2 = client.post(
        f"/api/v1/conversations/{conv_id}/summary",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r1.json()["data"]["id"] == r2.json()["data"]["id"]


def test_get_summary_returns_existing(client):
    token = _register_login(client, "sumuser3")
    conv_id = _create_conv_with_messages(client, token)
    client.post(
        f"/api/v1/conversations/{conv_id}/summary",
        headers={"Authorization": f"Bearer {token}"},
    )
    r = client.get(
        f"/api/v1/conversations/{conv_id}/summary",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["score"] == 78
    assert len(data["feedback"]) == 1


def test_get_summary_missing_returns_empty_state_code(client):
    token = _register_login(client, "sumuser4")
    conv_id = _create_conv_with_messages(client, token)
    r = client.get(
        f"/api/v1/conversations/{conv_id}/summary",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 400
    assert r.json()["code"] == 3003
    assert "暂无总结" in r.json()["message"]


def test_post_summary_unauthorized(client):
    r = client.post("/api/v1/conversations/1/summary")
    assert r.status_code == 401


def test_post_summary_conversation_not_found(client):
    token = _register_login(client, "sumuser5")
    r = client.post(
        "/api/v1/conversations/9999/summary",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 400
    assert r.json()["code"] == 3001


def test_post_summary_empty_conversation_rejected(client):
    token = _register_login(client, "sumuser6")
    r = client.post(
        "/api/v1/conversations",
        headers={"Authorization": f"Bearer {token}"},
        json={"scenario_id": 1},
    )
    conv_id = r.json()["data"]["id"]
    r2 = client.post(
        f"/api/v1/conversations/{conv_id}/summary",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r2.status_code == 400
    assert r2.json()["code"] == 3002
