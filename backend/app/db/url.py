from typing import Any


def build_engine_kwargs(database_url: str) -> dict[str, Any]:
    """Build SQLAlchemy engine kwargs for the configured database URL.

    SQLite needs `check_same_thread=False` for the local FastAPI test/dev setup.
    TiDB Cloud is MySQL-compatible and should not receive SQLite-only args.
    `pool_pre_ping=True` helps serverless/runtime environments avoid stale
    pooled connections after cold starts or network reconnects.
    """
    if database_url.startswith("sqlite"):
        return {"connect_args": {"check_same_thread": False}}

    if database_url.startswith("mysql"):
        return {"pool_pre_ping": True}

    return {}
