import json
import os
import hmac
import hashlib
import time
import base64


def create_jwt(payload: dict, secret: str) -> str:
    """Создаёт JWT токен вручную без внешних зависимостей"""
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).rstrip(b"=").decode()
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=").decode()
    signature_input = f"{header}.{body}".encode()
    signature = hmac.digest(secret.encode(), signature_input, hashlib.sha256)
    sig = base64.urlsafe_b64encode(signature).rstrip(b"=").decode()
    return f"{header}.{body}.{sig}"


def verify_jwt(token: str, secret: str) -> dict | None:
    """Проверяет JWT токен и возвращает payload или None"""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header, body, sig = parts
        signature_input = f"{header}.{body}".encode()
        expected_sig = hmac.digest(secret.encode(), signature_input, hashlib.sha256)
        expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).rstrip(b"=").decode()
        if not hmac.compare_digest(sig, expected_sig_b64):
            return None
        padding = 4 - len(body) % 4
        payload = json.loads(base64.urlsafe_b64decode(body + "=" * padding))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except (ValueError, KeyError, TypeError, AttributeError):
        return None


def handler(event: dict, context) -> dict:
    """
    Авторизация администратора.
    POST / — принимает логин и пароль, возвращает JWT токен.
    POST /verify — проверяет валидность JWT токена.
    """
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Content-Type": "application/json"
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    path = event.get("path", "/")
    method = event.get("httpMethod", "")

    admin_login = os.environ.get("ADMIN_LOGIN", "")
    admin_password = os.environ.get("ADMIN_PASSWORD", "")
    jwt_secret = os.environ.get("ADMIN_JWT_SECRET", "")

    # POST /verify — проверка токена
    if method == "POST" and path.endswith("/verify"):
        body = json.loads(event.get("body") or "{}")
        token = body.get("token", "")
        payload = verify_jwt(token, jwt_secret)
        if payload:
            return {
                "statusCode": 200,
                "headers": cors_headers,
                "body": json.dumps({"valid": True, "payload": payload})
            }
        return {
            "statusCode": 401,
            "headers": cors_headers,
            "body": json.dumps({"valid": False, "error": "Токен недействителен или истёк"})
        }

    # POST / — вход по логину и паролю
    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        login = body.get("login", "").strip()
        password = body.get("password", "").strip()

        login_ok = hmac.compare_digest(login, admin_login)
        password_ok = hmac.compare_digest(password, admin_password)

        if not (login_ok and password_ok):
            return {
                "statusCode": 401,
                "headers": cors_headers,
                "body": json.dumps({"error": "Неверный логин или пароль"})
            }

        # Токен действует 8 часов
        payload = {
            "role": "admin",
            "iat": int(time.time()),
            "exp": int(time.time()) + 8 * 3600
        }
        token = create_jwt(payload, jwt_secret)

        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps({"token": token})
        }

    return {
        "statusCode": 405,
        "headers": cors_headers,
        "body": json.dumps({"error": "Метод не поддерживается"})
    }