"""Password reset handler."""
import json
from datetime import datetime, timedelta

from utils.db import query_one, execute, get_connection, get_schema
from utils.password import hash_password, validate_password
from utils.email import is_email_enabled, generate_code, send_password_reset_code
from utils.http import response, error


RESET_CODE_LIFETIME_HOURS = 1
RESET_PER_EMAIL_LIMIT = 3
RESET_PER_EMAIL_WINDOW = 3600
RESET_PER_IP_LIMIT = 10
RESET_PER_IP_WINDOW = 3600


def _get_client_ip(event):
    """Получение IP-адреса клиента из заголовков запроса."""
    headers = event.get('headers', {})
    ip = (
        headers.get('X-Forwarded-For', '').split(',')[0].strip()
        or headers.get('x-forwarded-for', '').split(',')[0].strip()
        or headers.get('X-Real-Ip', '')
        or headers.get('x-real-ip', '')
        or (event.get('requestContext', {}).get('identity', {}).get('sourceIp', ''))
    )
    return ip or 'unknown'


def _check_rate_limit(key, action, max_attempts, window_seconds):
    """Проверка лимита запросов. Возвращает (превышен, осталось_секунд). Fail-open при ошибке БД."""
    try:
        conn = get_connection()
        try:
            S = get_schema()
            cur = conn.cursor()

            cur.execute(f"""
                DELETE FROM {S}rate_limits
                WHERE action = %s AND created_at < NOW() - INTERVAL '{int(window_seconds)} seconds'
            """, (action,))

            cur.execute(f"""
                SELECT COUNT(*) FROM {S}rate_limits
                WHERE key = %s AND action = %s
                  AND created_at > NOW() - INTERVAL '{int(window_seconds)} seconds'
            """, (key, action))
            count = cur.fetchone()[0]

            if count >= max_attempts:
                cur.execute(f"""
                    SELECT EXTRACT(EPOCH FROM (MIN(created_at) + INTERVAL '{int(window_seconds)} seconds' - NOW()))::int
                    FROM {S}rate_limits
                    WHERE key = %s AND action = %s
                      AND created_at > NOW() - INTERVAL '{int(window_seconds)} seconds'
                """, (key, action))
                remaining = cur.fetchone()[0] or window_seconds
                conn.commit()
                return True, max(remaining, 1)

            cur.execute(f"""
                INSERT INTO {S}rate_limits (key, action, created_at)
                VALUES (%s, %s, NOW())
            """, (key, action))
            conn.commit()
            return False, 0
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    except Exception as e:
        print(f"Rate limit check error (fail-open): {e}")
        return False, 0


def handle(event: dict, origin: str = '*') -> dict:
    """
    Password reset flow:
    1. POST {email} - request reset, sends code to email
    2. POST {email, code, new_password} - set new password with code
    """
    body_str = event.get('body', '{}')
    payload = json.loads(body_str)

    email = str(payload.get('email', '')).lower().strip()
    code = str(payload.get('code', '')).strip()
    new_password = str(payload.get('new_password', ''))

    if not email:
        return error(400, 'Email обязателен', origin)

    S = get_schema()

    if email and not code and not new_password:
        limited, wait = _check_rate_limit(email, 'reset_email', RESET_PER_EMAIL_LIMIT, RESET_PER_EMAIL_WINDOW)
        if limited:
            return error(429, f'Слишком много запросов сброса пароля. Повторите через {wait // 60 + 1} мин.', origin)

        client_ip = _get_client_ip(event)
        limited_ip, wait_ip = _check_rate_limit(client_ip, 'reset_ip', RESET_PER_IP_LIMIT, RESET_PER_IP_WINDOW)
        if limited_ip:
            return error(429, f'Слишком много запросов. Повторите через {wait_ip // 60 + 1} мин.', origin)
        user = query_one(f"SELECT id FROM {S}users WHERE email = %s", (email,))
        response_msg = 'Если пользователь существует, код сброса будет отправлен на email'

        if user:
            user_id = user[0]
            now = datetime.utcnow().isoformat()

            execute(f"DELETE FROM {S}password_reset_tokens WHERE user_id = %s", (user_id,))

            reset_code = generate_code()
            expires_at = (datetime.utcnow() + timedelta(hours=RESET_CODE_LIFETIME_HOURS)).isoformat()

            execute(f"""
                INSERT INTO {S}password_reset_tokens (user_id, token_hash, expires_at, created_at)
                VALUES (%s, %s, %s, %s)
            """, (user_id, reset_code, expires_at, now))

            if is_email_enabled():
                send_password_reset_code(email, reset_code)

            return response(200, {'message': response_msg}, origin)

        return response(200, {'message': response_msg}, origin)

    if email and code and new_password:
        is_valid, error_msg = validate_password(new_password)
        if not is_valid:
            return error(400, error_msg, origin)

        now = datetime.utcnow().isoformat()

        user = query_one(f"SELECT id FROM {S}users WHERE email = %s", (email,))
        if not user:
            return error(400, 'Неверный код', origin)

        user_id = user[0]

        token_record = query_one(f"""
            SELECT id FROM {S}password_reset_tokens
            WHERE user_id = %s
              AND token_hash = %s
              AND expires_at > %s
        """, (user_id, code, now))

        if not token_record:
            return error(400, 'Неверный или истёкший код', origin)

        new_password_hash = hash_password(new_password)
        execute(f"""
            UPDATE {S}users SET password_hash = %s, updated_at = %s
            WHERE id = %s
        """, (new_password_hash, now, user_id))

        execute(f"DELETE FROM {S}password_reset_tokens WHERE user_id = %s", (user_id,))
        execute(f"DELETE FROM {S}refresh_tokens WHERE user_id = %s", (user_id,))

        return response(200, {'message': 'Пароль успешно изменён'}, origin)

    return error(400, 'Укажите email для запроса кода или email + code + new_password для сброса', origin)