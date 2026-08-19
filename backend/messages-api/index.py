"""API для чатов и сообщений между пользователями."""
from datetime import datetime, timezone
from utils import (
    get_connection, get_schema, response, parse_body,
    CHAT_COLUMNS, chat_row_to_dict,
)
from message_handlers import (
    handle_get_messages, handle_send_message,
    handle_mark_read, handle_unread_count,
)
from auth_utils import require_auth, auth_error_response, set_request_origin, get_cors_headers


def handle_get_chats(event):
    auth_email = require_auth(event)

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
            WHERE (c.recommender_email = %s OR c.tenant_email = %s) AND c.is_hidden = FALSE
            ORDER BY COALESCE(c.last_message_time, c.created_at) DESC
        """, (auth_email, auth_email, auth_email))
        rows = cur.fetchall()
        return response(200, {'chats': [chat_row_to_dict(r) for r in rows]})
    finally:
        conn.close()


def handle_get_chat_by_recommendation(event):
    auth_email = require_auth(event)

    params = event.get('queryStringParameters') or {}
    recommendation_id = params.get('recommendation_id')
    if not recommendation_id:
        return response(400, {'error': 'recommendation_id обязателен'})

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
            WHERE c.recommendation_id = %s
              AND (c.recommender_email = %s OR c.tenant_email = %s)
              AND c.is_hidden = FALSE
            LIMIT 1
        """, (auth_email, recommendation_id, auth_email, auth_email))
        row = cur.fetchone()
        if not row:
            return response(404, {'error': 'Чат не найден'})
        return response(200, {'chat': chat_row_to_dict(row)})
    finally:
        conn.close()


def _fetch_chat_row(cur, S, auth_email, chat_id):
    cur.execute(f"""
        SELECT {CHAT_COLUMNS},
            (SELECT COUNT(*) FROM {S}messages m
             WHERE m.chat_id = c.id AND m.is_read = FALSE AND m.sender_id != %s) as unread_count,
            c.created_at
        FROM {S}chats c
        WHERE c.id = %s
    """, (auth_email, chat_id))
    return cur.fetchone()


def handle_create_chat(event):
    auth_email = require_auth(event)
    body = parse_body(event)

    tenant = body.get('tenantEmail', '')
    recommender = body.get('recommenderEmail', '')
    if auth_email not in (tenant, recommender):
        return response(403, {'error': 'Нет доступа'})

    recommendation_id = body.get('recommendationId')
    request_id = body.get('requestId') or None

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()

        existing = None

        # Основная проверка: чат уже существует между этими же людьми в рамках этой заявки
        if request_id:
            cur.execute(f"""
                SELECT id, recommendation_id FROM {S}chats
                WHERE request_id = %s AND recommender_email = %s AND tenant_email = %s
                  AND is_hidden = FALSE
                ORDER BY created_at ASC
                LIMIT 1
            """, (request_id, recommender, tenant))
            existing = cur.fetchone()

        # Фолбэк для старых записей без request_id — проверка по конкретной рекомендации
        if not existing and recommendation_id:
            cur.execute(f"""
                SELECT id, recommendation_id FROM {S}chats
                WHERE recommendation_id = %s AND is_hidden = FALSE
                LIMIT 1
            """, (recommendation_id,))
            existing = cur.fetchone()

        if existing:
            chat_id, existing_recommendation_id = existing
            if recommendation_id and existing_recommendation_id != recommendation_id:
                cur.execute(
                    f"UPDATE {S}chats SET recommendation_id = %s, updated_at = %s WHERE id = %s",
                    (recommendation_id, datetime.now(timezone.utc), chat_id)
                )
                conn.commit()
            row = _fetch_chat_row(cur, S, auth_email, chat_id)
            return response(200, {'chat': chat_row_to_dict(row), 'existing': True})

        def safe_photo(val):
            if not val or val.startswith('data:'):
                return ''
            return val[:500]

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
            request_id,
            body.get('requestName', ''),
            body.get('recommenderEmail', ''),
            body.get('recommenderName', ''),
            safe_photo(body.get('recommenderPhoto', '')),
            body.get('recommenderVkLink', ''),
            body.get('tenantEmail', ''),
            body.get('tenantName', ''),
            safe_photo(body.get('tenantPhoto', '')),
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


def handle_delete_chat(event):
    auth_email = require_auth(event)
    body = parse_body(event)
    chat_id = body.get('chatId')
    if not chat_id:
        return response(400, {'error': 'chat_id обязателен'})

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()

        cur.execute(f"SELECT recommender_email, tenant_email FROM {S}chats WHERE id = %s", (int(chat_id),))
        chat_row = cur.fetchone()
        if not chat_row:
            return response(404, {'error': 'Чат не найден'})
        if auth_email not in (chat_row[0], chat_row[1]):
            return response(403, {'error': 'Нет доступа к этому чату'})

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
    set_request_origin(event)

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': '',
        }

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    try:
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
    except ValueError as e:
        return response(400, {'error': str(e)})
    except PermissionError as e:
        return auth_error_response(401, str(e))