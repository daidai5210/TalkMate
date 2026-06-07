import base64
import os
import tempfile
from pathlib import Path
from typing import Any

TIDB_CA_PEM_ENV = "TIDB_CA_PEM"
TIDB_CA_PEM_B64_ENV = "TIDB_CA_PEM_B64"
TIDB_CA_RUNTIME_PATH_ENV = "TIDB_CA_RUNTIME_PATH"
TIDB_CA_RUNTIME_PATH = Path("/tmp/tidb-ca.pem")


def resolve_tidb_ca_runtime_path() -> Path:
    """Resolve the runtime CA file path for the current process."""
    env_path = os.getenv(TIDB_CA_RUNTIME_PATH_ENV)
    if env_path:
        return Path(env_path)
    return TIDB_CA_RUNTIME_PATH


def get_tidb_ca_pem(ca_pem: str | None = None, ca_pem_b64: str | None = None) -> str | None:
    """Resolve TiDB CA PEM content from plain PEM first, then base64 PEM.

    `TIDB_CA_PEM` keeps compatibility with direct multi-line PEM configuration.
    `TIDB_CA_PEM_B64` provides a single-line alternative for CLIs that do not
    reliably write multi-line environment variable values.
    """
    pem = ca_pem if ca_pem is not None else os.getenv(TIDB_CA_PEM_ENV)
    if pem:
        return pem

    pem_b64 = ca_pem_b64 if ca_pem_b64 is not None else os.getenv(TIDB_CA_PEM_B64_ENV)
    if not pem_b64:
        return None

    return base64.b64decode(pem_b64).decode("utf-8")


def write_tidb_ca_pem(
    ca_pem: str | None = None,
    ca_path: Path | None = None,
    ca_pem_b64: str | None = None,
) -> str | None:
    """Write TiDB CA PEM content to a runtime-accessible file.

    Vercel Serverless cannot access local secret files from the developer machine.
    When TIDB_CA_PEM or TIDB_CA_PEM_B64 is provided as an environment variable,
    this helper writes the PEM content to /tmp so PyMySQL can use a normal CA
    file path for TLS verification.
    """
    pem = get_tidb_ca_pem(ca_pem=ca_pem, ca_pem_b64=ca_pem_b64)
    if not pem:
        return None

    runtime_ca_path = ca_path or resolve_tidb_ca_runtime_path()
    runtime_ca_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        runtime_ca_path.write_text(pem, encoding="utf-8")
    except OSError:
        # Vercel uses /tmp/tidb-ca.pem; local dev may hit stale/unwritable files.
        fallback_path = Path(tempfile.gettempdir()) / f"talkmate-tidb-ca-{os.getuid()}.pem"
        fallback_path.parent.mkdir(parents=True, exist_ok=True)
        fallback_path.write_text(pem, encoding="utf-8")
        return str(fallback_path)
    return str(runtime_ca_path)


def build_engine_kwargs(
    database_url: str,
    *,
    ca_pem: str | None = None,
    ca_pem_b64: str | None = None,
) -> dict[str, Any]:
    """Build SQLAlchemy engine kwargs for the configured database URL.

    SQLite needs `check_same_thread=False` for the local FastAPI test/dev setup.
    TiDB Cloud is MySQL-compatible and should not receive SQLite-only args.
    `pool_pre_ping=True` helps serverless/runtime environments avoid stale
    pooled connections after cold starts or network reconnects.
    When `TIDB_CA_PEM` or `TIDB_CA_PEM_B64` exists, its PEM content is written
    to `/tmp/tidb-ca.pem` and passed to PyMySQL through SQLAlchemy
    `connect_args`.
    """
    if database_url.startswith("sqlite"):
        return {"connect_args": {"check_same_thread": False}}

    if database_url.startswith("mysql"):
        kwargs: dict[str, Any] = {"pool_pre_ping": True}
        ca_path = write_tidb_ca_pem(
            ca_pem=ca_pem,
            ca_pem_b64=ca_pem_b64,
        )
        if ca_path:
            kwargs["connect_args"] = {"ssl": {"ca": ca_path}}
        return kwargs

    return {}
