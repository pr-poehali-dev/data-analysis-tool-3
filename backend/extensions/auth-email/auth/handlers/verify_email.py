"""Email verification handler."""
import json
from datetime import datetime

from utils.db import query_one, execute, get_schema
from utils.http import response, error


def handle(event: dict, origin: str = '*') -> dict:
    """Verify email with code. POST {email, code}."""
    body_str = event.get('body', '{}')
    payload = json.loads(body_str)

    email = str(payload.get('email', '')).lower().strip()
    code = str(payload.get('code', '')).strip()

    if not email or not code:
        return error(400, 'Email и код обязательны', origin)

    now = datetime.utcnow().isoformat()
    S = get_schema()

    user = query_one(f"SELECT id, email_verified FROM {S}users WHERE email = %s", (email,))
    if not user:
        return error(404, 'Пользователь не найден', origin)

    user_id, already_verified = user

    if already_verified:
        return response(200, {'message': 'Email уже подтверждён'}, origin)

    token_record = query_one(f"""
        SELECT id FROM {S}email_verification_tokens
        WHERE user_id = %s
          AND token_hash = %s
          AND expires_at > %s
    """, (user_id, code, now))

    if not token_record:
        return error(400, 'Неверный или истёкший код', origin)

    execute(f"""
        UPDATE {S}users SET email_verified = TRUE, updated_at = %s
        WHERE id = %s
    """, (now, user_id))

    execute(f"DELETE FROM {S}email_verification_tokens WHERE user_id = %s", (user_id,))

    return response(200, {'message': 'Email подтверждён'}, origin)
