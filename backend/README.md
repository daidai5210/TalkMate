# TalkMate Backend (FastAPI)

## 启动

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# 编辑 .env：配置 DATABASE_URL 与 TIDB_CA_PEM_B64（TiDB Cloud，本地与生产共用）

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 访问

- API 根: <http://localhost:8000>
- Swagger: <http://localhost:8000/docs>
- 健康检查: <http://localhost:8000/api/health>

## 当前状态(PR-001 骨架)

- ✅ FastAPI 应用入口
- ✅ 健康检查端点
- ⏳ 数据库/认证/业务模块: 后续 PR 增量交付
