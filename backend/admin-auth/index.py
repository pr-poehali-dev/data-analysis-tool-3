import json
import os
import hmac
import hashlib
import time
# redeploy 2
import base64
import bcrypt
import psycopg2

# Настройки защиты от брутфорса
MAX_ATTEMPTS = 5          # максимум неудачных попыток
WINDOW_MINUTES = 15       # окно наблюдения (минут)
BLOCK_MINUTES = 30        # длительность блокировки (минут)


def get_db_conn():
    """Возвращает соединение с PostgreSQL"""
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_client_ip(event: dict) -> str:
    """Извлекает IP-адрес клиента из запроса"""
    headers = event.get("headers") or {}
    ip = (
        headers.get("X-Forwarded-For", "")
        or headers.get("x-forwarded-for", "")
        or (event.get("requestContext") or {}).get("identity", {}).get("sourceIp", "")
        or "unknown"
    )
    return ip.split(",")[0].strip()


def is_ip_blocked(conn, ip: str) -> bool:
    """Проверяет, заблокирован ли IP по числу неудачных попыток за окно WINDOW_MINUTES"""
    window_start = time.time() - WINDOW_MINUTES * 60
    window_ts = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(window_start))
    cur = conn.cursor()
    cur.execute(
        "SELECT COUNT(*) FROM admin_login_attempts "
        "WHERE ip_address = %s AND attempted_at >= %s AND success = FALSE",
        (ip, window_ts)
    )
    count = cur.fetchone()[0]
    cur.close()
    return count >= MAX_ATTEMPTS


def record_attempt(conn, ip: str, success: bool):
    """Записывает попытку входа и чистит старые записи (старше 24ч)"""
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO admin_login_attempts (ip_address, success) VALUES (%s, %s)",
        (ip, success)
    )
    cutoff_ts = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(time.time() - 86400))
    cur.execute(
        "DELETE FROM admin_login_attempts WHERE attempted_at < %s",
        (cutoff_ts,)
    )
    conn.commit()
    cur.close()


def reset_attempts(conn, ip: str):
    """Сбрасывает счётчик неудачных попыток для IP после успешного входа"""
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM admin_login_attempts WHERE ip_address = %s AND success = FALSE",
        (ip,)
    )
    conn.commit()
    cur.close()


def check_password(password: str, admin_password_plain: str, admin_password_hash: str) -> bool:
    """
    Проверяет пароль.
    Если задан ADMIN_PASSWORD_HASH — использует bcrypt.
    Иначе — fallback на сравнение plain text через hmac (старый способ).
    """
    if admin_password_hash:
        return bcrypt.checkpw(password.encode("utf-8"), admin_password_hash.encode("utf-8"))
    # Fallback: plain text (для обратной совместимости пока не задан хеш)
    return hmac.compare_digest(password, admin_password_plain)


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
    Авторизация администратора с bcrypt-хешированием пароля и защитой от брутфорса.
    POST / — вход по логину и паролю, возвращает JWT токен.
    POST /verify — проверяет валидность JWT токена.
    POST /generate-hash — временный эндпоинт: генерирует bcrypt-хеш из ADMIN_PASSWORD.
                          Используется один раз для получения хеша. Защищён ADMIN_JWT_SECRET.
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
    admin_password_hash = os.environ.get("ADMIN_PASSWORD_HASH", "")
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
        client_ip = get_client_ip(event)
        conn = get_db_conn()

        try:
            if is_ip_blocked(conn, client_ip):
                return {
                    "statusCode": 429,
                    "headers": cors_headers,
                    "body": json.dumps({
                        "error": f"Слишком много попыток входа. Попробуйте через {BLOCK_MINUTES} минут."
                    })
                }

            body = json.loads(event.get("body") or "{}")
            login = body.get("login", "").strip()
            password = body.get("password", "").strip()

            login_ok = hmac.compare_digest(login, admin_login)
            password_ok = check_password(password, admin_password, admin_password_hash)

            if not (login_ok and password_ok):
                record_attempt(conn, client_ip, success=False)
                return {
                    "statusCode": 401,
                    "headers": cors_headers,
                    "body": json.dumps({"error": "Неверный логин или пароль"})
                }

            reset_attempts(conn, client_ip)
            record_attempt(conn, client_ip, success=True)

        finally:
            conn.close()

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