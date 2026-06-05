from fastapi import FastAPI

app = FastAPI(
    title="TalkMate API",
    version="0.1.0",
    description="AI 英语口语陪练后端服务",
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "talkmate-backend", "version": "0.1.0"}
