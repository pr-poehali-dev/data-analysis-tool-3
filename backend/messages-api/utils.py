"""Общие утилиты: подключение к БД, CORS, парсинг."""
import json
import os
import base64
import psycopg2


def get_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_schema() -> str:
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return f"{schema}." if schema else ""


from auth_utils import get_cors_headers


def response(status, body):
    return {
        'statusCode': status,
        'headers': get_cors_headers(),
        'body': json.dumps(body, default=str),
    }


MAX_BODY_SIZE = 70 * 1024 * 1024


def parse_body(event):
    body_str = event.get('body', '{}')
    if not body_str:
        return {}
    if len(body_str) > MAX_BODY_SIZE:
        raise ValueError(f"Тело запроса слишком большое ({len(body_str)} байт). Максимум {MAX_BODY_SIZE} байт")
    if event.get('isBase64Encoded'):
        body_str = base64.b64decode(body_str).decode('utf-8')
    return json.loads(body_str)


def get_user_email(event):
    headers = event.get('headers', {})
    return (headers.get('X-User-Email') or
            headers.get('x-user-email') or '')


CHAT_COLUMNS = """id, recommendation_id, request_id, request_name,
    recommender_email, recommender_name, recommender_photo, recommender_vk_link,
    tenant_email, tenant_name, tenant_photo, tenant_vk_link,
    last_message, last_message_time"""

MSG_COLUMNS = """id, chat_id, sender_id, sender_name, sender_photo,
    text, photos, is_read, is_system_message, created_at"""


def chat_row_to_dict(row):
    return {
        'id': str(row[0]),
        'recommendationId': row[1] or '',
        'requestId': str(row[2]) if row[2] else '',
        'requestName': row[3] or '',
        'recommenderEmail': row[4] or '',
        'recommenderName': row[5] or '',
        'recommenderPhoto': row[6] or '',
        'recommenderVkLink': row[7] or '',
        'tenantEmail': row[8] or '',
        'tenantName': row[9] or '',
        'tenantPhoto': row[10] or '',
        'tenantVkLink': row[11] or '',
        'lastMessage': row[12] or '',
        'lastMessageTime': row[13].isoformat() if row[13] else None,
        'unreadCount': row[14] if len(row) > 14 else 0,
        'createdAt': row[15].isoformat() if len(row) > 15 and row[15] else None,
    }


def message_row_to_dict(row):
    return {
        'id': str(row[0]),
        'chatId': str(row[1]),
        'senderId': row[2] or '',
        'senderName': row[3] or '',
        'senderPhoto': row[4] or '',
        'text': row[5] or '',
        'photos': row[6] if row[6] else [],
        'read': bool(row[7]),
        'isSystemMessage': bool(row[8]),
        'createdAt': row[9].isoformat() if row[9] else None,
    }