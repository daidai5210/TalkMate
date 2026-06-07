from app.db.url import build_engine_kwargs


def test_sqlite_engine_kwargs_include_check_same_thread():
    kwargs = build_engine_kwargs("sqlite:///./talkmate.db")

    assert kwargs["connect_args"] == {"check_same_thread": False}
    assert "pool_pre_ping" not in kwargs


def test_tidb_engine_kwargs_enable_pool_pre_ping_without_sqlite_connect_args():
    kwargs = build_engine_kwargs(
        "mysql+pymysql://user:password@example.com:4000/talkmate?ssl_verify_cert=true"
    )

    assert kwargs["pool_pre_ping"] is True
    assert "connect_args" not in kwargs


def test_unknown_database_engine_kwargs_are_empty():
    assert build_engine_kwargs("postgresql://user:password@example.com/app") == {}
