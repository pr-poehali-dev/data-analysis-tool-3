"""HTTP response utilities."""
import os
import json
from typing import Optional
from http.cookies import SimpleCookie

REFRESH_COOKIE_NAME = 'refresh_token'
REFRESH_TOKEN_EXPIRE_DAYS = int(os.environ.get('REFRESH_TOKEN_EXPIRE_DAYS', '30'))


def get_origin_from_event(event: dict) -> str:
    """Get Origin header from request, fallback to CORS_ORIGIN env or '*'."""
    headers = event.get('headers', {})
    origin = headers.get('Origin') or headers.get('origin') or ''
    if origin:
        return origin
    return os.environ.get('CORS_ORIGIN', '*')


def make_refresh_cookie(token: str) -> str:
    """Build Set-Cookie string for httpOnly refresh token."""
    max_age = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    return (
        f"{REFRESH_COOKIE_NAME}={token}; "
        f"HttpOnly; Secure; SameSite=None; Path=/; Max-Age={max_age}"
    )


def clear_refresh_cookie() -> str:
    """Build Set-Cookie string that removes the refresh token cookie."""
    return (
        f"{REFRESH_COOKIE_NAME}=; "
        f"HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0"
    )


def get_refresh_token_from_cookie(event: dict) -> str:
    """Extract refresh_token from cookie header (X-Cookie or Cookie)."""
    headers = event.get('headers', {})
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


def make_headers(origin: str = '*', set_cookie: Optional[str] = None) -> dict:
    """Create response headers with CORS."""
    headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json'
    }
    if set_cookie:
        headers['X-Set-Cookie'] = set_cookie
    return headers


def response(status_code: int, body: dict, origin: str = '*', set_cookie: Optional[str] = None) -> dict:
    """Create HTTP response."""
    return {
        'statusCode': status_code,
        'headers': make_headers(origin, set_cookie),
        'body': json.dumps(body),
        'isBase64Encoded': False
    }


def options_response(origin: str = '*') -> dict:
    """Create OPTIONS preflight response."""
    return {
        'statusCode': 200,
        'headers': make_headers(origin),
        'body': '',
        'isBase64Encoded': False
    }


def error(status_code: int, message: str, origin: str = '*') -> dict:
    """Create error response."""
    return response(status_code, {'error': message}, origin)