"""Проверка JWT-токена для авторизации запросов."""
import json
import os
import jwt


CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization, X-User-Email',
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
        print(f"[AUTH_DEBUG] No Bearer token found")
        return None
    try:
        payload = verify_token(auth[7:])
        email = payload.get('email')
        print(f"[AUTH_DEBUG] JWT payload keys: {list(payload.keys())}, email: {email}")
        return email
    except Exception as e:
        print(f"[AUTH_DEBUG] JWT decode error: {e}")
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
        'headers': CORS_HEADERS,
        'body': json.dumps({'error': message}),
    }