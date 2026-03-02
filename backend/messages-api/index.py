"""API для чатов и сообщений между пользователями."""
import json
import os
from datetime import datetime, timezone
import psycopg2


def get_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_schema() -> str:
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return f"{schema}." if schema else ""


CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization, X-User-Email',
}


def response(status, body):
    return {
        'statusCode': status,
        'headers': CORS_HEADERS,
        'body': json.dumps(body, default=str),
    }


def parse_body(event):
    import base64
    body_str = event.get('body', '{}')
    if not body_str:
        return {}
    if event.get('isBase64Encoded'):
        body_str = base64.b64decode(body_str).decode('utf-8')
    return json.loads(body_str)


def get_user_email(event):
    headers = event.get('headers', {})
    return (headers.get('X-User-Email') or
            headers.get('x-user-email') or '')


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


CHAT_COLUMNS = """id, recommendation_id, request_id, request_name,
    recommender_email, recommender_name, recommender_photo, recommender_vk_link,
    tenant_email, tenant_name, tenant_photo, tenant_vk_link,
    last_message, last_message_time"""


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


MSG_COLUMNS = """id, chat_id, sender_id, sender_name, sender_photo,
    text, photos, is_read, is_system_message, created_at"""


def handle_get_chats(event):
    params = event.get('queryStringParameters') or {}
    user_email = params.get('user_email') or get_user_email(event)
    if not user_email:
        return response(400, {'error': 'user_email обязателен'})

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT {CHAT_COLUMNS},
                (SELECT COUNT(*) FROM {S}messages m
                 WHERE m.chat_id = c.id AND m.is_read = FALSE AND m.sender_id != %s) as unread_count,
                c.created_at
            FROM {S}chats c
            WHERE c.recommender_email = %s OR c.tenant_email = %s
            ORDER BY COALESCE(c.last_message_time, c.created_at) DESC
        """, (user_email, user_email, user_email))
        rows = cur.fetchall()
        return response(200, {'chats': [chat_row_to_dict(r) for r in rows]})
    finally:
        conn.close()


def handle_get_chat_by_recommendation(event):
    params = event.get('queryStringParameters') or {}
    recommendation_id = params.get('recommendation_id')
    if not recommendation_id:
        return response(400, {'error': 'recommendation_id обязателен'})

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()
        user_email = params.get('user_email') or get_user_email(event)
        cur.execute(f"""
            SELECT {CHAT_COLUMNS},
                (SELECT COUNT(*) FROM {S}messages m
                 WHERE m.chat_id = c.id AND m.is_read = FALSE AND m.sender_id != %s) as unread_count,
                c.created_at
            FROM {S}chats c
            WHERE c.recommendation_id = %s
            LIMIT 1
        """, (user_email or '', recommendation_id))
        row = cur.fetchone()
        if not row:
            return response(404, {'error': 'Чат не найден'})
        return response(200, {'chat': chat_row_to_dict(row)})
    finally:
        conn.close()


def handle_create_chat(event):
    body = parse_body(event)
    recommendation_id = body.get('recommendationId')

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()

        if recommendation_id:
            user_email = body.get('tenantEmail') or get_user_email(event) or ''
            cur.execute(f"""
                SELECT {CHAT_COLUMNS},
                    (SELECT COUNT(*) FROM {S}messages m
                     WHERE m.chat_id = c.id AND m.is_read = FALSE AND m.sender_id != %s) as unread_count,
                    c.created_at
                FROM {S}chats c
                WHERE c.recommendation_id = %s
                LIMIT 1
            """, (user_email, recommendation_id))
            existing = cur.fetchone()
            if existing:
                return response(200, {'chat': chat_row_to_dict(existing), 'existing': True})

        now = datetime.now(timezone.utc)
        cur.execute(f"""
            INSERT INTO {S}chats (
                recommendation_id, request_id, request_name,
                recommender_email, recommender_name, recommender_photo, recommender_vk_link,
                tenant_email, tenant_name, tenant_photo, tenant_vk_link,
                created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING {CHAT_COLUMNS}, 0 as unread_count, created_at
        """, (
            recommendation_id,
            body.get('requestId') or None,
            body.get('requestName', ''),
            body.get('recommenderEmail', ''),
            body.get('recommenderName', ''),
            body.get('recommenderPhoto', ''),
            body.get('recommenderVkLink', ''),
            body.get('tenantEmail', ''),
            body.get('tenantName', ''),
            body.get('tenantPhoto', ''),
            body.get('tenantVkLink', ''),
            now, now,
        ))
        row = cur.fetchone()
        conn.commit()
        return response(201, {'chat': chat_row_to_dict(row)})
    except Exception as e:
        conn.rollback()
        print(f"Ошибка создания чата: {e}")
        raise
    finally:
        conn.close()


def handle_get_messages(event):
    params = event.get('queryStringParameters') or {}
    chat_id = params.get('chat_id')
    if not chat_id:
        return response(400, {'error': 'chat_id обязателен'})

    after_id = params.get('after_id')
    limit = min(int(params.get('limit', '100')), 500)

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()

        if after_id:
            cur.execute(f"""
                SELECT {MSG_COLUMNS} FROM {S}messages
                WHERE chat_id = %s AND id > %s
                ORDER BY created_at ASC
                LIMIT %s
            """, (int(chat_id), int(after_id), limit))
        else:
            cur.execute(f"""
                SELECT {MSG_COLUMNS} FROM {S}messages
                WHERE chat_id = %s
                ORDER BY created_at ASC
                LIMIT %s
            """, (int(chat_id), limit))

        rows = cur.fetchall()
        return response(200, {'messages': [message_row_to_dict(r) for r in rows]})
    finally:
        conn.close()


def handle_send_message(event):
    body = parse_body(event)
    chat_id = body.get('chatId')
    sender_id = body.get('senderId')
    text = body.get('text', '')
    photos = body.get('photos', [])
    is_system = body.get('isSystemMessage', False)

    if not chat_id:
        return response(400, {'error': 'chatId обязателен'})
    if not sender_id:
        return response(400, {'error': 'senderId обязателен'})
    if not text and not photos:
        return response(400, {'error': 'Сообщение не может быть пустым'})

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()
        now = datetime.now(timezone.utc)

        cur.execute(f"""
            INSERT INTO {S}messages (
                chat_id, sender_id, sender_name, sender_photo,
                text, photos, is_read, is_system_message, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, FALSE, %s, %s)
            RETURNING {MSG_COLUMNS}
        """, (
            int(chat_id),
            sender_id,
            body.get('senderName', ''),
            body.get('senderPhoto', ''),
            text,
            photos if photos else [],
            is_system,
            now,
        ))
        msg_row = cur.fetchone()

        preview = text[:100] if text else ('Фото' if photos else '')
        cur.execute(f"""
            UPDATE {S}chats SET last_message = %s, last_message_time = %s, updated_at = %s
            WHERE id = %s
        """, (preview, now, now, int(chat_id)))

        conn.commit()
        return response(201, {'message': message_row_to_dict(msg_row)})
    except Exception as e:
        conn.rollback()
        print(f"Ошибка отправки сообщения: {e}")
        raise
    finally:
        conn.close()


def handle_mark_read(event):
    body = parse_body(event)
    chat_id = body.get('chatId')
    user_email = body.get('userEmail')
    if not chat_id or not user_email:
        return response(400, {'error': 'chatId и userEmail обязательны'})

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            UPDATE {S}messages SET is_read = TRUE
            WHERE chat_id = %s AND sender_id != %s AND is_read = FALSE
        """, (int(chat_id), user_email))
        updated = cur.rowcount
        conn.commit()
        return response(200, {'updated': updated})
    except Exception as e:
        conn.rollback()
        raise
    finally:
        conn.close()


def handle_unread_count(event):
    params = event.get('queryStringParameters') or {}
    user_email = params.get('user_email') or get_user_email(event)
    if not user_email:
        return response(400, {'error': 'user_email обязателен'})

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT COUNT(*) FROM {S}messages m
            JOIN {S}chats c ON c.id = m.chat_id
            WHERE (c.recommender_email = %s OR c.tenant_email = %s)
            AND m.sender_id != %s AND m.is_read = FALSE
        """, (user_email, user_email, user_email))
        row = cur.fetchone()
        return response(200, {'unreadCount': row[0] if row else 0})
    finally:
        conn.close()


def handle_delete_chat(event):
    body = parse_body(event)
    chat_id = body.get('chatId')
    if not chat_id:
        return response(400, {'error': 'chat_id обязателен'})

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT COUNT(*) FROM {S}escrow_transactions
            WHERE chat_id = %s AND status IN ('frozen', 'pending')
        """, (chat_id,))
        active_count = cur.fetchone()[0]
        if active_count > 0:
            return response(403, {'error': 'Нельзя удалить чат с активной эскроу-сделкой'})

        cur.execute(f"DELETE FROM {S}messages WHERE chat_id = %s", (int(chat_id),))
        cur.execute(f"DELETE FROM {S}chats WHERE id = %s RETURNING id", (int(chat_id),))
        row = cur.fetchone()
        conn.commit()
        if not row:
            return response(404, {'error': 'Чат не найден'})
        return response(200, {'deleted': True})
    except Exception as e:
        conn.rollback()
        print(f"Ошибка удаления чата: {e}")
        raise
    finally:
        conn.close()


def handler(event, context):
    """API для чатов и сообщений между арендаторами и рекомендателями."""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': '',
        }

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    if method == 'GET':
        if action == 'messages':
            return handle_get_messages(event)
        if action == 'chat_by_recommendation':
            return handle_get_chat_by_recommendation(event)
        if action == 'unread_count':
            return handle_unread_count(event)
        return handle_get_chats(event)

    if method == 'POST':
        if action == 'send':
            return handle_send_message(event)
        if action == 'mark_read':
            return handle_mark_read(event)
        if action == 'delete_chat':
            return handle_delete_chat(event)
        return handle_create_chat(event)

    return response(405, {'error': 'Метод не поддерживается'})