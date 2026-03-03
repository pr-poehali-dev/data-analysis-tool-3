"""Password reset handler."""
import json
from datetime import datetime, timedelta

from utils.db import query_one, execute, get_schema
from utils.password import hash_password, validate_password
from utils.email import is_email_enabled, generate_code, send_password_reset_code
from utils.http import response, error


RESET_CODE_LIFETIME_HOURS = 1


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
