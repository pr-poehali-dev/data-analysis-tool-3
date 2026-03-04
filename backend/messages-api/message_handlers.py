"""Обработчики для сообщений: получение, отправка, прочтение."""
from datetime import datetime, timezone
from utils import (
    get_connection, get_schema, response, parse_body,
    MSG_COLUMNS, message_row_to_dict,
)
from s3_upload import upload_photos_to_s3
from auth_utils import require_auth


def handle_get_messages(event):
    auth_email = require_auth(event)

    params = event.get('queryStringParameters') or {}
    chat_id = params.get('chat_id')
    if not chat_id:
        return response(400, {'error': 'chat_id обязателен'})

    raw_after = params.get('after_id', '')
    after_id = None
    if raw_after and raw_after.isdigit():
        after_id = int(raw_after)
    limit = min(int(params.get('limit', '100')), 500)

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()

        cur.execute(f"SELECT recommender_email, tenant_email FROM {S}chats WHERE id = %s", (int(chat_id),))
        chat_owner = cur.fetchone()
        if not chat_owner or auth_email not in (chat_owner[0], chat_owner[1]):
            return response(403, {'error': 'Нет доступа к этому чату'})

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
    auth_email = require_auth(event)

    body = parse_body(event)
    chat_id = body.get('chatId')
    sender_id = body.get('senderId')
    text = body.get('text', '')
    raw_photos = body.get('photos', [])
    is_system = body.get('isSystemMessage', False)

    if not chat_id:
        return response(400, {'error': 'chatId обязателен'})
    if not sender_id:
        return response(400, {'error': 'senderId обязателен'})
    if not text and not raw_photos:
        return response(400, {'error': 'Сообщение не может быть пустым'})

    if auth_email != sender_id:
        return response(403, {'error': 'Нельзя отправлять от чужого имени'})

    try:
        photos = upload_photos_to_s3(raw_photos)
    except ValueError as e:
        return response(400, {'error': str(e)})

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
    auth_email = require_auth(event)

    body = parse_body(event)
    chat_id = body.get('chatId')
    user_email = body.get('userEmail')
    if not chat_id or not user_email:
        return response(400, {'error': 'chatId и userEmail обязательны'})

    if auth_email != user_email:
        return response(403, {'error': 'Нет доступа'})

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
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def handle_unread_count(event):
    auth_email = require_auth(event)

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT COUNT(*) FROM {S}messages m
            JOIN {S}chats c ON c.id = m.chat_id
            WHERE (c.recommender_email = %s OR c.tenant_email = %s)
            AND m.sender_id != %s AND m.is_read = FALSE
        """, (auth_email, auth_email, auth_email))
        row = cur.fetchone()
        return response(200, {'unreadCount': row[0] if row else 0})
    finally:
        conn.close()