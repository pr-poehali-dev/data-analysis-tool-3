"""Обновление и получение профиля пользователя."""
import json
import os
import hashlib
from datetime import datetime, timezone
import psycopg2
import jwt


def get_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_schema() -> str:
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return f"{schema}." if schema else ""


def get_jwt_secret() -> str:
    secret = os.environ.get('JWT_SECRET', '')
    if not secret or len(secret) < 32:
        raise ValueError('JWT_SECRET must be at least 32 characters')
    return secret


def verify_access_token(token: str) -> dict:
    secret = get_jwt_secret()
    payload = jwt.decode(token, secret, algorithms=['HS256'])
    return payload


def response(status: int, body: dict) -> dict:
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
        },
        'body': json.dumps(body, default=str),
    }


def get_user_id_from_event(event: dict) -> int:
    headers = event.get('headers', {})
    auth = headers.get('X-Authorization') or headers.get('x-authorization') or headers.get('Authorization') or headers.get('authorization') or ''
    if not auth.startswith('Bearer '):
        raise PermissionError('Missing or invalid Authorization header')
    token = auth[7:]
    payload = verify_access_token(token)
    user_id = payload.get('sub') or payload.get('user_id')
    if not user_id:
        raise PermissionError('Invalid token payload')
    return int(user_id)


def handle_get_profile(event: dict) -> dict:
    params = event.get('queryStringParameters') or {}
    email = params.get('email')

    if email:
        return handle_get_public_profile(email)

    user_id = get_user_id_from_event(event)
    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT id, email, name, avatar_url, first_name, last_name, 
                   role, phone, city, vk_link, telegram_id, yandex_id
            FROM {S}users WHERE id = %s
        """, (user_id,))
        row = cur.fetchone()
        if not row:
            return response(404, {'error': 'User not found'})
        return response(200, {
            'user': {
                'id': row[0],
                'email': row[1] or '',
                'name': row[2] or '',
                'avatar_url': row[3] or '',
                'firstName': row[4] or '',
                'lastName': row[5] or '',
                'role': row[6] or 'tenant',
                'phone': row[7] or '',
                'city': row[8] or '',
                'vkLink': row[9] or '',
                'telegram_id': row[10] or '',
                'yandex_id': row[11] or '',
            }
        })
    finally:
        conn.close()


def handle_get_public_profile(email: str) -> dict:
    """Получение публичного профиля по email."""
    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT id, email, name, avatar_url, first_name, last_name,
                   role, city, vk_link
            FROM {S}users WHERE email = %s
        """, (email,))
        row = cur.fetchone()
        if not row:
            return response(404, {'error': 'User not found'})
        return response(200, {
            'user': {
                'id': row[0],
                'email': row[1] or '',
                'name': row[2] or '',
                'avatar_url': row[3] or '',
                'firstName': row[4] or '',
                'lastName': row[5] or '',
                'role': row[6] or 'tenant',
                'city': row[7] or '',
                'vkLink': row[8] or '',
            }
        })
    finally:
        conn.close()


def handle_update_profile(event: dict) -> dict:
    user_id = get_user_id_from_event(event)
    body_str = event.get('body', '{}')
    try:
        body = json.loads(body_str) if body_str else {}
    except json.JSONDecodeError:
        return response(400, {'error': 'Invalid JSON'})

    first_name = body.get('firstName')
    last_name = body.get('lastName')
    email = body.get('email')
    city = body.get('city')
    vk_link = body.get('vkLink')
    avatar_url = body.get('avatar_url')

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()
        updates = []
        values = []

        if first_name is not None:
            updates.append("first_name = %s")
            values.append(first_name)
        if last_name is not None:
            updates.append("last_name = %s")
            values.append(last_name)
        if email is not None:
            updates.append("email = %s")
            values.append(email)
        if city is not None:
            updates.append("city = %s")
            values.append(city)
        if vk_link is not None:
            updates.append("vk_link = %s")
            values.append(vk_link)
        if avatar_url is not None:
            updates.append("avatar_url = %s")
            values.append(avatar_url)

        if first_name is not None or last_name is not None:
            cur.execute(f"SELECT first_name, last_name FROM {S}users WHERE id = %s", (user_id,))
            row = cur.fetchone()
            fn = first_name if first_name is not None else (row[0] or '')
            ln = last_name if last_name is not None else (row[1] or '')
            display = f"{fn} {ln}".strip()
            updates.append("name = %s")
            values.append(display)

        if not updates:
            return response(400, {'error': 'No fields to update'})

        updates.append("updated_at = %s")
        values.append(datetime.now(timezone.utc).isoformat())
        values.append(user_id)

        cur.execute(
            f"UPDATE {S}users SET {', '.join(updates)} WHERE id = %s",
            tuple(values)
        )
        conn.commit()

        cur.execute(f"""
            SELECT id, email, name, avatar_url, first_name, last_name,
                   role, phone, city, vk_link
            FROM {S}users WHERE id = %s
        """, (user_id,))
        row = cur.fetchone()

        return response(200, {
            'user': {
                'id': row[0],
                'email': row[1] or '',
                'name': row[2] or '',
                'avatar_url': row[3] or '',
                'firstName': row[4] or '',
                'lastName': row[5] or '',
                'role': row[6] or 'tenant',
                'phone': row[7] or '',
                'city': row[8] or '',
                'vkLink': row[9] or '',
            }
        })
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def handler(event: dict, context) -> dict:
    """Обновление и получение профиля пользователя."""
    if event.get('httpMethod') == 'OPTIONS':
        return response(200, {})

    method = event.get('httpMethod', 'GET')
    try:
        if method == 'GET':
            return handle_get_profile(event)
        elif method in ('POST', 'PUT'):
            return handle_update_profile(event)
        else:
            return response(405, {'error': 'Method not allowed'})
    except PermissionError as e:
        return response(401, {'error': str(e)})
    except ValueError as e:
        return response(500, {'error': 'Server configuration error'})
    except Exception as e:
        return response(500, {'error': 'Internal server error'})