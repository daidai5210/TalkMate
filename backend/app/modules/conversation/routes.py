from typing import Optional

from fastapi import APIRouter, Depends, Header, status
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.modules.auth.repository import UserRepository
from app.modules.conversation.schemas import (
    CreateConversationRequest,
    SendMessageRequest,
    SendMessageResponse,
)
from app.modules.conversation.service import ConversationService
from app.modules.profile.service import ProfileService
from app.shared.exceptions import AuthError, BusinessError
from app.shared.responses import ok

router = APIRouter(prefix="/conversations", tags=["conversations"])


def _require_user_id(authorization: Optional[str] = Header(default=None)) -> int:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AuthError(1004, "未提供有效 token")
    token = authorization.split(" ", 1)[1].strip()
    user_id = decode_access_token(token)
    if user_id is None:
        raise AuthError(1004, "Token 无效或已过期")
    return user_id


@router.post("", status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: CreateConversationRequest,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> dict:
    user_id = _require_user_id(authorization)
    user_repo = UserRepository(db)
    if user_repo.get_by_id(user_id) is None:
        raise AuthError(1004, "Token 无效或已过期")
    service = ConversationService(db)
    conv = service.create(user_id=user_id, scenario_id=payload.scenario_id)
    return ok(data=conv.model_dump(mode="json"), message="创建对话成功")


@router.get("")
def list_conversations(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> dict:
    user_id = _require_user_id(authorization)
    service = ConversationService(db)
    conversations = service.list_history(user_id=user_id)
    return ok(data=[item.model_dump(mode="json") for item in conversations])


@router.get("/{conversation_id}")
def get_conversation(
    conversation_id: int,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> dict:
    user_id = _require_user_id(authorization)
    service = ConversationService(db)
    conv = service.get(conversation_id=conversation_id, user_id=user_id)
    return ok(data=conv.model_dump(mode="json"))


@router.post("/{conversation_id}/messages")
def send_message(
    conversation_id: int,
    payload: SendMessageRequest,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> dict:
    user_id = _require_user_id(authorization)
    service = ConversationService(db)
    result: SendMessageResponse = service.send_message(
        conversation_id=conversation_id, text=payload.text, user_id=user_id
    )
    return ok(data=result.model_dump(mode="json"), message="消息已发送")


@router.delete("/{conversation_id}", status_code=status.HTTP_200_OK)
def delete_conversation(
    conversation_id: int,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> dict:
    user_id = _require_user_id(authorization)
    service = ConversationService(db)
    service.delete(conversation_id=conversation_id, user_id=user_id)

    profile_svc = ProfileService(db)
    profile_svc.remove_from_window(conversation_id)

    return ok(message="对话已删除")
