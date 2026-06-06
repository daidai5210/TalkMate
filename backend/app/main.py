"""TalkMate Backend FastAPI Application.

集成 PR-003 + PR-006 内容:
- CORS 中间件(允许前端 5173 跨域)
- lifespan 启动时 init_db() 自动建表 + seed_scenarios() 写入 5 个种子场景
- 注册 /api/v1/auth + /api/v1/scenarios 路由
- BusinessError / SQLAlchemyError 异常处理
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api.v1 import api_v1_router
from app.core.config import get_settings
from app.core.security import AuthError as SecurityAuthError
from app.db.base import engine, init_db
from app.modules.practice.seed import seed_practice_cards
from app.modules.scenario.seed import seed_scenarios
from app.shared.exceptions import BusinessError
from app.shared.responses import err, ok
from sqlalchemy.orm import sessionmaker

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    SessionLocal = sessionmaker(bind=engine)
    seed_scenarios(SessionLocal())
    seed_practice_cards(SessionLocal())
    yield


app = FastAPI(
    title="TalkMate API",
    version="0.2.0",
    description="AI 英语口语陪练后端服务",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(BusinessError)
async def business_error_handler(_: Request, exc: BusinessError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=err(code=exc.code, message=exc.message),
    )


@app.exception_handler(SecurityAuthError)
async def security_auth_error_handler(_: Request, exc: SecurityAuthError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=err(code=exc.code, message=exc.message),
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_error_handler(_: Request, exc: SQLAlchemyError) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content=err(code=5001, message=f"数据库错误: {exc.__class__.__name__}"),
    )


@app.get("/api/health")
def health() -> dict:
    return ok(data={"status": "ok", "service": "talkmate-backend", "version": "0.1.0"})


app.include_router(api_v1_router)
