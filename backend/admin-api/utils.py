import json
import os
import hmac
import hashlib
import base64
import time
from datetime import timezone
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")


def to_utc_iso(dt):
    """Сериализует datetime в ISO-строку с явной пометкой UTC.

    Колонки timestamp в БД хранят UTC без пометки часового пояса (сервер БД
    работает в UTC). Без явной пометки '+00:00' фронтенд интерпретирует
    время как локальное, из-за чего оно показывается со сдвигом.
    """
    if not dt:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()

_current_event: dict = {}


def set_current_event(event: dict):
    global _current_event
    _current_event = event


def get_cors_headers(event: dict) -> dict:
    origin = (event.get("headers") or {}).get("origin") or (event.get("headers") or {}).get("Origin", "")
    is_allowed = (
        origin in ["https://sovetpay.ru", "https://www.sovetpay.ru"]
        or origin.endswith(".poehali.dev")
    )
    allowed_origin = origin if is_allowed else "https://sovetpay.ru"
    return {
        "Access-Control-Allow-Origin": allowed_origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
        "Content-Type": "application/json",
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "X-XSS-Protection": "1; mode=block",
    }


def verify_admin_token(token: str) -> bool:
    """Проверяет JWT токен администратора"""
    jwt_secret = os.environ.get("ADMIN_JWT_SECRET", "")
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return False
        header, body, sig = parts
        signature_input = f"{header}.{body}".encode()
        expected_sig = hmac.digest(jwt_secret.encode(), signature_input, hashlib.sha256)
        expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).rstrip(b"=").decode()
        if not hmac.compare_digest(sig, expected_sig_b64):
            return False
        padding = 4 - len(body) % 4
        payload = json.loads(base64.urlsafe_b64decode(body + "=" * padding))
        if payload.get("exp", 0) < time.time():
            return False
        if payload.get("role") != "admin":
            return False
        return True
    except (ValueError, KeyError, TypeError, AttributeError):
        return False


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def audit_log(action: str, entity_type: str, entity_id, details: dict = None):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.admin_audit_log (action, entity_type, entity_id, details) VALUES (%s, %s, %s, %s)",
            (action, entity_type, entity_id, json.dumps(details or {}, ensure_ascii=False))
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception:
        pass


def json_response(data: dict, status: int = 200) -> dict:
    return {
        "statusCode": status,
        "headers": get_cors_headers(_current_event),
        "body": json.dumps(data, default=str, ensure_ascii=False)
    }