"""Обновление и получение профиля пользователя."""
import json
import os
import hashlib
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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
            cur.execute(f"SELECT id FROM {S}users WHERE email = %s AND id != %s", (email, user_id))
            if cur.fetchone():
                return response(400, {'error': 'Эта почта уже привязана к другому аккаунту'})
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

        cur.execute(f"""
            SELECT id, email, name, avatar_url, first_name, last_name,
                   role, phone, city, vk_link
            FROM {S}users WHERE id = %s
        """, (user_id,))
        row = cur.fetchone()
        user_email = row[1] or ''
        new_name = row[2] or ''
        new_photo = row[3] or ''
        new_vk = row[9] or ''

        if user_email and (first_name is not None or last_name is not None or avatar_url is not None or vk_link is not None):
            if first_name is not None or last_name is not None:
                cur.execute(f"""
                    UPDATE {S}chats SET recommender_name = %s WHERE recommender_email = %s
                """, (new_name, user_email))
                cur.execute(f"""
                    UPDATE {S}chats SET tenant_name = %s WHERE tenant_email = %s
                """, (new_name, user_email))
            if avatar_url is not None:
                cur.execute(f"""
                    UPDATE {S}chats SET recommender_photo = %s WHERE recommender_email = %s
                """, (new_photo, user_email))
                cur.execute(f"""
                    UPDATE {S}chats SET tenant_photo = %s WHERE tenant_email = %s
                """, (new_photo, user_email))
            if vk_link is not None:
                cur.execute(f"""
                    UPDATE {S}chats SET recommender_vk_link = %s WHERE recommender_email = %s
                """, (new_vk, user_email))
                cur.execute(f"""
                    UPDATE {S}chats SET tenant_vk_link = %s WHERE tenant_email = %s
                """, (new_vk, user_email))

        conn.commit()

        return response(200, {
            'user': {
                'id': row[0],
                'email': user_email,
                'name': new_name,
                'avatar_url': new_photo,
                'firstName': row[4] or '',
                'lastName': row[5] or '',
                'role': row[6] or 'tenant',
                'phone': row[7] or '',
                'city': row[8] or '',
                'vkLink': new_vk,
            }
        })
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def handle_send_email_code(event: dict) -> dict:
    user_id = get_user_id_from_event(event)
    body = json.loads(event.get('body', '{}'))
    email = body.get('email', '').strip().lower()
    if not email or '@' not in email:
        return response(400, {'error': 'Укажите корректный email'})

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {S}users WHERE email = %s AND id != %s", (email, user_id))
        if cur.fetchone():
            return response(400, {'error': 'Эта почта уже привязана к другому аккаунту'})
    finally:
        conn.close()

    code = str(secrets.randbelow(900000) + 100000)

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS {S}email_verification_codes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                email VARCHAR(255) NOT NULL,
                code VARCHAR(6) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                used BOOLEAN DEFAULT FALSE
            )
        """)
        cur.execute(f"DELETE FROM {S}email_verification_codes WHERE user_id = %s", (user_id,))
        cur.execute(f"""
            INSERT INTO {S}email_verification_codes (user_id, email, code)
            VALUES (%s, %s, %s)
        """, (user_id, email, code))
        conn.commit()
    finally:
        conn.close()

    smtp_host = os.environ.get('SMTP_HOST', os.environ.get('SMTP_SERVER', 'smtp.gmail.com'))
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER', os.environ.get('SENDER_EMAIL', ''))
    smtp_password = os.environ.get('SMTP_PASSWORD', os.environ.get('SENDER_PASSWORD', ''))
    smtp_from = os.environ.get('SMTP_FROM', smtp_user)

    if not smtp_user or not smtp_password:
        return response(500, {'error': 'SMTP не настроен'})

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Подтверждение email</h2>
        <p>Ваш код подтверждения:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;
                  background: #f5f5f5; padding: 20px; text-align: center;
                  border-radius: 8px; margin: 20px 0;">{code}</p>
        <p style="color: #666; font-size: 14px;">Код действителен 30 минут.</p>
    </div>
    """

    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'Код подтверждения email'
    msg['From'] = smtp_from
    msg['To'] = email
    msg.attach(MIMEText(f"Ваш код подтверждения: {code}", 'plain', 'utf-8'))
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_from, email, msg.as_string())
    except Exception as e:
        print(f"SMTP error: {e}")
        return response(500, {'error': 'Не удалось отправить код'})

    return response(200, {'sent': True})


def handle_verify_email_code(event: dict) -> dict:
    user_id = get_user_id_from_event(event)
    body = json.loads(event.get('body', '{}'))
    code = body.get('code', '').strip()
    if not code:
        return response(400, {'error': 'Укажите код'})

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT email, code, created_at FROM {S}email_verification_codes
            WHERE user_id = %s AND used = FALSE
            ORDER BY created_at DESC LIMIT 1
        """, (user_id,))
        row = cur.fetchone()
        if not row:
            return response(400, {'error': 'Код не найден. Запросите новый'})

        stored_email, stored_code, created_at = row
        age_minutes = (datetime.now(timezone.utc) - created_at.replace(tzinfo=timezone.utc)).total_seconds() / 60
        if age_minutes > 30:
            return response(400, {'error': 'Код истёк. Запросите новый'})

        if stored_code != code:
            return response(400, {'error': 'Неверный код'})

        cur.execute(f"UPDATE {S}email_verification_codes SET used = TRUE WHERE user_id = %s", (user_id,))
        cur.execute(f"UPDATE {S}users SET email = %s, email_verified = TRUE, updated_at = %s WHERE id = %s",
                    (stored_email, datetime.now(timezone.utc).isoformat(), user_id))
        conn.commit()

        cur.execute(f"""
            SELECT id, email, name, avatar_url, first_name, last_name,
                   role, phone, city, vk_link
            FROM {S}users WHERE id = %s
        """, (user_id,))
        row = cur.fetchone()

        return response(200, {
            'verified': True,
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
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    try:
        if method == 'GET':
            return handle_get_profile(event)
        elif method in ('POST', 'PUT'):
            if action == 'send_email_code':
                return handle_send_email_code(event)
            if action == 'verify_email_code':
                return handle_verify_email_code(event)
            return handle_update_profile(event)
        else:
            return response(405, {'error': 'Method not allowed'})
    except PermissionError as e:
        return response(401, {'error': str(e)})
    except ValueError as e:
        return response(500, {'error': 'Server configuration error'})
    except Exception as e:
        return response(500, {'error': 'Internal server error'})