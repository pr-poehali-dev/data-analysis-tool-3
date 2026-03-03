"""Проверка JWT-токена для авторизации запросов."""
import os
import jwt


def get_jwt_secret() -> str:
    secret = os.environ.get('JWT_SECRET', '')
    if not secret or len(secret) < 32:
        raise ValueError('JWT_SECRET must be at least 32 characters')
    return secret


def verify_token(token: str) -> dict:
    return jwt.decode(token, get_jwt_secret(), algorithms=['HS256'])


def get_auth_email(event: dict) -> str | None:
    headers = event.get('headers', {})
    auth = (headers.get('X-Authorization') or headers.get('x-authorization')
            or headers.get('Authorization') or headers.get('authorization') or '')
    if not auth.startswith('Bearer '):
        return None
    try:
        payload = verify_token(auth[7:])
        return payload.get('email')
    except Exception:
        return None


def require_auth(event: dict) -> str:
    email = get_auth_email(event)
    if not email:
        raise PermissionError('Требуется авторизация')
    return email
