from fastapi import APIRouter

from app.modules.auth.routes import router as auth_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(auth_router)
