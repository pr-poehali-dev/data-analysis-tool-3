"""
Telegram Auth Extension - Backend Function

Authentication via Telegram bot with temporary token approach.
Flow:
1. User clicks "Login via Telegram" -> redirect to bot
2. Bot generates unique auth link and sends to user
3. User clicks link -> frontend exchanges token for JWT
4. Refresh tokens stored hashed (SHA256) in DB
"""

import json
import os
import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional
import psycopg2
import jwt


# =============================================================================
# CONFIGURATION
# =============================================================================

def get_db_connection():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_schema() -> str:
    """Get database schema prefix."""
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    return f"{schema}." if schema else ""


def get_env(key: str) -> str:
    value = os.environ.get(key)
    if not value:
        raise ValueError(f"Missing environment variable: {key}")
    return value


# =============================================================================
# SECURITY HELPERS
# =============================================================================

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def generate_token(length: int = 32) -> str:
    return secrets.token_urlsafe(length)


def create_jwt(user_id: int, secret: str, email: str = "", expires_in: int = 900) -> str:
    payload = {
        "sub": str(user_id),
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(seconds=expires_in),
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    if email:
        payload["email"] = email
    return jwt.encode(payload, secret, algorithm="HS256")


# =============================================================================
# DATABASE OPERATIONS
# =============================================================================

def get_auth_token(cursor, token: str) -> Optional[dict]:
    """Get auth token data by token."""
    token_hash = hash_token(token)
    schema = get_schema()

    cursor.execute(f"""
        SELECT telegram_id, telegram_username, telegram_first_name,
               telegram_last_name, telegram_photo_url, expires_at, used
        FROM {schema}telegram_auth_tokens
        WHERE token_hash = %s
    """, (token_hash,))

    row = cursor.fetchone()
    if not row:
        return None

    return {
        "telegram_id": row[0],
        "telegram_username": row[1],
        "telegram_first_name": row[2],
        "telegram_last_name": row[3],
        "telegram_photo_url": row[4],
        "expires_at": row[5],
        "used": row[6],
    }


def mark_token_used(cursor, token: str) -> bool:
    """Mark token as used."""
    token_hash = hash_token(token)
    schema = get_schema()

    cursor.execute(f"""
        UPDATE {schema}telegram_auth_tokens
        SET used = TRUE
        WHERE token_hash = %s AND used = FALSE
        RETURNING id
    """, (token_hash,))

    return cursor.fetchone() is not None


def cleanup_expired_tokens(cursor) -> None:
    """Remove expired auth tokens."""
    schema = get_schema()
    cursor.execute(f"""
        DELETE FROM {schema}telegram_auth_tokens
        WHERE expires_at < NOW() OR (used = TRUE AND created_at < NOW() - INTERVAL '1 hour')
    """)


def find_user_by_telegram_id(cursor, telegram_id: str) -> Optional[dict]:
    """Find user by Telegram ID."""
    schema = get_schema()
    cursor.execute(f"""
        SELECT id, email, name, avatar_url, telegram_id,
               first_name, last_name, role, phone, city, vk_link, telegram_username
        FROM {schema}users
        WHERE telegram_id = %s
    """, (telegram_id,))

    row = cursor.fetchone()
    if row:
        return {
            "id": row[0],
            "email": row[1] or "",
            "name": row[2] or "",
            "avatar_url": row[3] or "",
            "telegram_id": row[4] or "",
            "firstName": row[5] or "",
            "lastName": row[6] or "",
            "role": row[7] or "tenant",
            "phone": row[8] or "",
            "city": row[9] or "",
            "vkLink": row[10] or "",
            "telegramUsername": row[11] or "",
        }
    return None


def create_or_update_user(
    cursor,
    telegram_id: str,
    username: Optional[str],
    first_name: Optional[str],
    last_name: Optional[str],
    photo_url: Optional[str]
) -> dict:
    """Create new user or update existing one."""
    schema = get_schema()

    # Build display name
    name_parts = []
    if first_name:
        name_parts.append(first_name)
    if last_name:
        name_parts.append(last_name)
    display_name = " ".join(name_parts) if name_parts else username or f"User {telegram_id}"

    # Check if user exists
    existing = find_user_by_telegram_id(cursor, telegram_id)

    if existing:
        cursor.execute(f"""
            UPDATE {schema}users
            SET name = COALESCE(%s, name),
                avatar_url = COALESCE(%s, avatar_url),
                telegram_username = COALESCE(%s, telegram_username),
                last_login_at = NOW(),
                updated_at = NOW()
            WHERE telegram_id = %s
            RETURNING id, email, name, avatar_url, telegram_id,
                      first_name, last_name, role, phone, city, vk_link, telegram_username
        """, (display_name, photo_url, username, telegram_id))
    else:
        cursor.execute(f"""
            INSERT INTO {schema}users (telegram_id, telegram_username, name, first_name, last_name, avatar_url, email_verified, created_at, updated_at, last_login_at)
            VALUES (%s, %s, %s, %s, %s, %s, TRUE, NOW(), NOW(), NOW())
            RETURNING id, email, name, avatar_url, telegram_id,
                      first_name, last_name, role, phone, city, vk_link, telegram_username
        """, (telegram_id, username, display_name, first_name, last_name, photo_url))

    row = cursor.fetchone()
    return {
        "id": row[0],
        "email": row[1] or "",
        "name": row[2] or "",
        "avatar_url": row[3] or "",
        "telegram_id": row[4] or "",
        "firstName": row[5] or "",
        "lastName": row[6] or "",
        "role": row[7] or "tenant",
        "phone": row[8] or "",
        "city": row[9] or "",
        "vkLink": row[10] or "",
        "telegramUsername": row[11] or "",
    }


def save_refresh_token(cursor, user_id: int, token_hash: str, expires_at: datetime) -> None:
    """Save hashed refresh token to DB."""
    schema = get_schema()
    cursor.execute(f"""
        INSERT INTO {schema}refresh_tokens (user_id, token_hash, expires_at)
        VALUES (%s, %s, %s)
    """, (user_id, token_hash, expires_at))


def find_refresh_token(cursor, token_hash: str) -> Optional[dict]:
    """Find refresh token by hash."""
    schema = get_schema()
    cursor.execute(f"""
        SELECT user_id, expires_at
        FROM {schema}refresh_tokens
        WHERE token_hash = %s AND expires_at > NOW()
    """, (token_hash,))

    row = cursor.fetchone()
    if row:
        return {"user_id": row[0], "expires_at": row[1]}
    return None


def delete_refresh_token(cursor, token_hash: str) -> None:
    """Delete refresh token."""
    schema = get_schema()
    cursor.execute(f"DELETE FROM {schema}refresh_tokens WHERE token_hash = %s", (token_hash,))


def get_user_by_id(cursor, user_id: int) -> Optional[dict]:
    """Get user by ID."""
    schema = get_schema()
    cursor.execute(f"""
        SELECT id, email, name, avatar_url, telegram_id,
               first_name, last_name, role, phone, city, vk_link, telegram_username
        FROM {schema}users WHERE id = %s
    """, (user_id,))

    row = cursor.fetchone()
    if row:
        return {
            "id": row[0],
            "email": row[1] or "",
            "name": row[2] or "",
            "avatar_url": row[3] or "",
            "telegram_id": row[4] or "",
            "firstName": row[5] or "",
            "lastName": row[6] or "",
            "role": row[7] or "tenant",
            "phone": row[8] or "",
            "city": row[9] or "",
            "vkLink": row[10] or "",
            "telegramUsername": row[11] or "",
        }
    return None


def cleanup_expired_refresh_tokens(cursor) -> None:
    """Remove expired refresh tokens."""
    schema = get_schema()
    cursor.execute(f"DELETE FROM {schema}refresh_tokens WHERE expires_at < NOW()")


# =============================================================================
# CORS HELPERS
# =============================================================================

REFRESH_COOKIE_NAME = 'refresh_token'
REFRESH_TOKEN_EXPIRE_DAYS = 30


def make_refresh_cookie(token: str) -> str:
    max_age = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    return (
        f"{REFRESH_COOKIE_NAME}={token}; "
        f"HttpOnly; Secure; SameSite=None; Path=/; Max-Age={max_age}"
    )


def clear_refresh_cookie() -> str:
    return (
        f"{REFRESH_COOKIE_NAME}=; "
        f"HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0"
    )


def get_refresh_token_from_cookie(event: dict) -> str:
    from http.cookies import SimpleCookie
    headers = event.get('headers', {}) or {}
    cookie_str = (
        headers.get('X-Cookie') or headers.get('x-cookie')
        or headers.get('Cookie') or headers.get('cookie') or ''
    )
    if not cookie_str:
        return ''
    try:
        c = SimpleCookie()
        c.load(cookie_str)
        if REFRESH_COOKIE_NAME in c:
            return c[REFRESH_COOKIE_NAME].value
    except Exception:
        pass
    return ''


def get_cors_origin(event: dict) -> str:
    headers = event.get('headers', {}) or {}
    origin = headers.get('Origin') or headers.get('origin') or ''
    if origin:
        return origin
    return os.environ.get("ALLOWED_ORIGINS", "*")


def get_cors_headers(origin: str = '*') -> dict:
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": "true",
    }


def cors_response(status: int, body: dict, origin: str = '*', set_cookie: str = '') -> dict:
    headers = {**get_cors_headers(origin), "Content-Type": "application/json"}
    if set_cookie:
        headers['X-Set-Cookie'] = set_cookie
    return {
        "statusCode": status,
        "headers": headers,
        "body": json.dumps(body),
    }


def options_response(origin: str = '*') -> dict:
    return {
        "statusCode": 204,
        "headers": get_cors_headers(origin),
        "body": "",
    }


# =============================================================================
# ACTION HANDLERS
# =============================================================================

def handle_callback(cursor, body: dict, origin: str = '*') -> dict:
    """
    POST ?action=callback
    Frontend calls this with token to exchange for JWT.
    Like standard OAuth callback.
    """
    token = body.get("token")
    if not token:
        return cors_response(400, {"error": "Missing token"}, origin)

    token_data = get_auth_token(cursor, token)

    if not token_data:
        return cors_response(404, {"error": "Token not found"}, origin)

    expires_at = token_data["expires_at"]
    now = datetime.now(timezone.utc)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now:
        return cors_response(410, {"error": "Token expired"}, origin)

    if token_data["used"]:
        return cors_response(410, {"error": "Token already used"}, origin)

    if not token_data["telegram_id"]:
        return cors_response(400, {"error": "Token not authenticated"}, origin)

    jwt_secret = get_env("JWT_SECRET")
    if len(jwt_secret) < 32:
        return cors_response(500, {"error": "Server configuration error"}, origin)

    # Create or update user
    user = create_or_update_user(
        cursor,
        telegram_id=token_data["telegram_id"],
        username=token_data["telegram_username"],
        first_name=token_data["telegram_first_name"],
        last_name=token_data["telegram_last_name"],
        photo_url=token_data["telegram_photo_url"],
    )

    # Mark token as used
    mark_token_used(cursor, token)

    user_email = user.get("email") or f'tg_{user.get("telegram_id", user["id"])}'
    access_token = create_jwt(user["id"], jwt_secret, email=user_email)
    refresh_token = generate_token(48)
    refresh_token_hash = hash_token(refresh_token)
    refresh_expires = datetime.now(timezone.utc) + timedelta(days=30)

    save_refresh_token(cursor, user["id"], refresh_token_hash, refresh_expires)

    return cors_response(200, {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": 900,
        "user": user,
    }, origin, set_cookie=make_refresh_cookie(refresh_token))


def handle_refresh(cursor, body: dict, event: dict = None, origin: str = '*') -> dict:
    """
    POST ?action=refresh
    Refresh access token using refresh token.
    """
    refresh_token = ''
    if event:
        refresh_token = get_refresh_token_from_cookie(event)

    if not refresh_token:
        refresh_token = body.get("refresh_token", "")

    if not refresh_token:
        return cors_response(400, {"error": "Missing refresh_token"}, origin)

    jwt_secret = get_env("JWT_SECRET")
    token_hash = hash_token(refresh_token)

    token_data = find_refresh_token(cursor, token_hash)
    if not token_data:
        return cors_response(401, {"error": "Invalid or expired refresh token"}, origin)

    user = get_user_by_id(cursor, token_data["user_id"])
    if not user:
        return cors_response(401, {"error": "User not found"}, origin)

    user_email = user.get("email") or f'tg_{user.get("telegram_id", user["id"])}'
    access_token = create_jwt(user["id"], jwt_secret, email=user_email)

    return cors_response(200, {
        "access_token": access_token,
        "expires_in": 900,
        "user": user,
    }, origin, set_cookie=make_refresh_cookie(refresh_token))


def handle_logout(cursor, body: dict, event: dict = None, origin: str = '*') -> dict:
    """
    POST ?action=logout
    Invalidate refresh token.
    """
    refresh_token = ''
    if event:
        refresh_token = get_refresh_token_from_cookie(event)

    if not refresh_token:
        refresh_token = body.get("refresh_token", "")

    if refresh_token:
        token_hash = hash_token(refresh_token)
        delete_refresh_token(cursor, token_hash)

    return cors_response(200, {"success": True}, origin, set_cookie=clear_refresh_cookie())


# =============================================================================
# MAIN HANDLER
# =============================================================================

def handler(event, context):
    """Main entry point."""
    method = event.get("httpMethod", "GET")
    origin = get_cors_origin(event)

    if method == "OPTIONS":
        return options_response(origin)

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    body = {}
    if method == "POST":
        raw_body = event.get("body", "{}")
        try:
            body = json.loads(raw_body) if raw_body else {}
        except json.JSONDecodeError:
            return cors_response(400, {"error": "Invalid JSON"}, origin)

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cleanup_expired_tokens(cursor)
        cleanup_expired_refresh_tokens(cursor)

        if action == "callback" and method == "POST":
            result = handle_callback(cursor, body, origin)
        elif action == "refresh" and method == "POST":
            result = handle_refresh(cursor, body, event, origin)
        elif action == "logout" and method == "POST":
            result = handle_logout(cursor, body, event, origin)
        else:
            result = cors_response(400, {"error": f"Unknown action: {action}"}, origin)

        conn.commit()
        return result

    except ValueError:
        return cors_response(500, {"error": "Server configuration error"}, origin)
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error: {e}")
        return cors_response(500, {"error": "Internal server error"}, origin)
    finally:
        if conn:
            conn.close()