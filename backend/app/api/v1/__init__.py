"""API v1 路由聚合。"""
from fastapi import APIRouter

from app.modules.auth.routes import router as auth_router
from app.modules.conversation.routes import router as conversation_router
from app.modules.practice.routes import router as practice_router
from app.modules.scenario.routes import router as scenario_router
from app.modules.summary.routes import router as summary_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(auth_router)
api_v1_router.include_router(conversation_router)
api_v1_router.include_router(practice_router)
api_v1_router.include_router(scenario_router)
api_v1_router.include_router(summary_router)
