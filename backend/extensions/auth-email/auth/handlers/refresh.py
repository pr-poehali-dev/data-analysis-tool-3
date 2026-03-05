"""Обновление access-токена с ротацией refresh-токена."""
import json
import os
from datetime import datetime, timedelta

from utils.db import get_connection, get_schema
from utils.jwt_utils import (
    create_access_token, create_refresh_token,
    decode_refresh_token, hash_token,
    ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS,
)
from utils.http import response, error, get_refresh_token_from_cookie, make_refresh_cookie


def handle(event: dict, origin: str = '*') -> dict:
    """Обновление access-токена с ротацией refresh-токена."""
    jwt_secret = os.environ.get('JWT_SECRET')
    if not jwt_secret:
        return error(500, 'JWT_SECRET not configured', origin)

    refresh_token = get_refresh_token_from_cookie(event)

    if not refresh_token:
        body_str = event.get('body', '{}')
        payload = json.loads(body_str)
        refresh_token = payload.get('refresh_token', '')

    if not refresh_token:
        return error(401, 'Refresh token required', origin)

    decoded = decode_refresh_token(refresh_token)
    if not decoded:
        return error(401, 'Invalid or expired refresh token', origin)

    user_id = int(decoded.get('sub'))
    old_token_hash = hash_token(refresh_token)
    now = datetime.utcnow()

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()

        cur.execute(f"""
            SELECT rt.id, u.email, u.name
            FROM {S}refresh_tokens rt
            JOIN {S}users u ON u.id = rt.user_id
            WHERE rt.token_hash = %s
              AND rt.user_id = %s
              AND rt.expires_at > %s
        """, (old_token_hash, user_id, now.isoformat()))

        result = cur.fetchone()
        if not result:
            conn.close()
            return error(401, 'Refresh token revoked or expired', origin)

        old_rt_id, user_email, user_name = result

        cur.execute(f"DELETE FROM {S}refresh_tokens WHERE id = %s", (old_rt_id,))

        new_refresh_token, new_expires = create_refresh_token(user_id)
        new_token_hash = hash_token(new_refresh_token)

        cur.execute(f"""
            INSERT INTO {S}refresh_tokens (user_id, token_hash, expires_at, created_at)
            VALUES (%s, %s, %s, %s)
        """, (user_id, new_token_hash, new_expires.isoformat(), now.isoformat()))

        conn.commit()

        access_token = create_access_token(user_id, user_email)

        return response(200, {
            'access_token': access_token,
            'token_type': 'Bearer',
            'expires_in': ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            'user': {
                'id': user_id,
                'email': user_email,
                'name': user_name
            }
        }, origin, set_cookie=make_refresh_cookie(new_refresh_token))
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
