"""Проверка JWT-токена для авторизации запросов."""
import json
import os
import jwt


_current_origin = '*'


def set_request_origin(event):
    global _current_origin
    allowed = os.environ.get('ALLOWED_ORIGINS', '').strip()
    if not allowed:
        _current_origin = '*'
        return
    origins = [o.strip() for o in allowed.split(',') if o.strip()]
    if not origins:
        _current_origin = '*'
        return
    headers = event.get('headers', {})
    request_origin = headers.get('Origin') or headers.get('origin') or ''
    _current_origin = request_origin if request_origin in origins else origins[0]


def get_cors_headers():
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': _current_origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
    }


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


def check_ownership(auth_email: str, target_email: str):
    if auth_email.lower() != target_email.lower():
        raise PermissionError('Нет доступа к данным другого пользователя')


def auth_error_response(status: int = 401, message: str = 'Требуется авторизация') -> dict:
    return {
        'statusCode': status,
        'headers': get_cors_headers(),
        'body': json.dumps({'error': message}),
    }