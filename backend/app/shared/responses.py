from typing import Any, List, Optional


def ok(data: Any = None, message: str = "success") -> dict:
    return {"code": 0, "message": message, "data": data}


def err(code: int, message: str, errors: Optional[List[dict[str, str]]] = None) -> dict:
    payload: dict[str, Any] = {"code": code, "message": message, "data": None}
    if errors is not None:
        payload["errors"] = errors
    return payload
