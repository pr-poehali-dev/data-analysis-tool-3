"""Logout handler."""
import json

from utils.db import execute, get_schema
from utils.jwt_utils import hash_token
from utils.http import response, clear_refresh_cookie, get_refresh_token_from_cookie


def handle(event: dict, origin: str = '*') -> dict:
    """Logout user by revoking refresh token from cookie or request body."""
    refresh_token = get_refresh_token_from_cookie(event)

    if not refresh_token:
        body_str = event.get('body', '{}')
        payload = json.loads(body_str)
        refresh_token = payload.get('refresh_token', '')

    if refresh_token:
        token_hash = hash_token(refresh_token)
        S = get_schema()
        execute(f"DELETE FROM {S}refresh_tokens WHERE token_hash = %s", (token_hash,))

    return response(200, {'message': 'Logged out successfully'}, origin, set_cookie=clear_refresh_cookie())