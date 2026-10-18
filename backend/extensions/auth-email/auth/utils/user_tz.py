"""Безопасная проверка часового пояса пользователя."""
import re

_TZ_RE = re.compile(r'^(UTC|[A-Za-z_]+(?:/[A-Za-z0-9_+\-]+){1,2})$')


def clean_timezone(value):
    """Возвращает название пояса (например Europe/Moscow) или None, если значение некорректно."""
    if not isinstance(value, str):
        return None
    value = value.strip()
    if len(value) > 64 or not _TZ_RE.match(value):
        return None
    return value
