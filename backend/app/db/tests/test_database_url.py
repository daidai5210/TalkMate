from app.db.url import build_engine_kwargs, write_tidb_ca_pem


TEST_TIDB_CA_PEM = "-----BEGIN CERTIFICATE-----\nexample-ca\n-----END CERTIFICATE-----\n"


def test_sqlite_engine_kwargs_include_check_same_thread(monkeypatch):
    monkeypatch.delenv("TIDB_CA_PEM", raising=False)

    kwargs = build_engine_kwargs("sqlite:///./talkmate.db")

    assert kwargs["connect_args"] == {"check_same_thread": False}
    assert "pool_pre_ping" not in kwargs


def test_tidb_engine_kwargs_enable_pool_pre_ping_without_sqlite_connect_args(monkeypatch):
    monkeypatch.delenv("TIDB_CA_PEM", raising=False)

    kwargs = build_engine_kwargs(
        "mysql+pymysql://user:password@example.com:4000/talkmate?ssl_verify_cert=true"
    )

    assert kwargs["pool_pre_ping"] is True
    assert "connect_args" not in kwargs


def test_tidb_engine_kwargs_write_ca_pem_and_enable_ssl_connect_args(monkeypatch, tmp_path):
    runtime_ca_path = tmp_path / "tidb-ca.pem"
    monkeypatch.setenv("TIDB_CA_PEM", TEST_TIDB_CA_PEM)
    monkeypatch.setattr("app.db.url.TIDB_CA_RUNTIME_PATH", runtime_ca_path)

    kwargs = build_engine_kwargs("mysql+pymysql://user:password@example.com:4000/talkmate")

    assert kwargs["pool_pre_ping"] is True
    assert kwargs["connect_args"] == {"ssl": {"ca": str(runtime_ca_path)}}
    assert runtime_ca_path.read_text(encoding="utf-8") == TEST_TIDB_CA_PEM


def test_write_tidb_ca_pem_returns_none_when_missing(tmp_path):
    runtime_ca_path = tmp_path / "tidb-ca.pem"

    assert write_tidb_ca_pem(ca_pem="", ca_path=runtime_ca_path) is None
    assert not runtime_ca_path.exists()


def test_write_tidb_ca_pem_overwrites_existing_runtime_file(tmp_path):
    runtime_ca_path = tmp_path / "tidb-ca.pem"
    runtime_ca_path.write_text("old-ca", encoding="utf-8")

    path = write_tidb_ca_pem(ca_pem=TEST_TIDB_CA_PEM, ca_path=runtime_ca_path)

    assert path == str(runtime_ca_path)
    assert runtime_ca_path.read_text(encoding="utf-8") == TEST_TIDB_CA_PEM


def test_unknown_database_engine_kwargs_are_empty(monkeypatch):
    monkeypatch.delenv("TIDB_CA_PEM", raising=False)

    assert build_engine_kwargs("postgresql://user:password@example.com/app") == {}
