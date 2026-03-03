"""API для управления документами пользователя (договоры аренды и др.)."""
import json
import os
from datetime import datetime, timezone
import psycopg2
from auth_utils import get_auth_email, require_auth


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


def row_to_dict(row):
    return {
        'id': str(row[0]),
        'userEmail': row[1] or '',
        'type': row[2] or 'rental-agreement',
        'fileName': row[3] or '',
        'data': row[4] if row[4] else {},
        'createdAt': row[5].isoformat() if row[5] else None,
        'updatedAt': row[6].isoformat() if row[6] else None,
    }


COLUMNS = "id, user_email, type, file_name, data, created_at, updated_at"


def handle_get_documents(event):
    params = event.get('queryStringParameters') or {}
    auth_email = get_auth_email(event)
    user_email = auth_email or params.get('user_email') or get_user_email(event)
    if not user_email:
        return response(400, {'error': 'user_email обязателен'})

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT {COLUMNS} FROM {S}documents
            WHERE user_email = %s
            ORDER BY updated_at DESC
        """, (user_email,))
        rows = cur.fetchall()
        return response(200, {'documents': [row_to_dict(r) for r in rows]})
    finally:
        conn.close()


def handle_get_document(event):
    params = event.get('queryStringParameters') or {}
    doc_id = params.get('id')
    if not doc_id:
        return response(400, {'error': 'id обязателен'})

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(f"SELECT {COLUMNS} FROM {S}documents WHERE id = %s", (doc_id,))
        row = cur.fetchone()
        if not row:
            return response(404, {'error': 'Документ не найден'})
        auth_email = get_auth_email(event)
        if auth_email and row[1] != auth_email:
            return response(403, {'error': 'Нет доступа к этому документу'})
        return response(200, {'document': row_to_dict(row)})
    finally:
        conn.close()


def handle_save_document(event):
    body = parse_body(event)
    auth_email = get_auth_email(event)
    user_email = auth_email or body.get('userEmail') or get_user_email(event)
    if not user_email:
        return response(400, {'error': 'userEmail обязателен'})

    doc_type = body.get('type', 'rental-agreement')
    file_name = body.get('fileName', '')
    data = body.get('data', {})
    existing_id = body.get('id')

    S = get_schema()
    conn = get_connection()
    now = datetime.now(timezone.utc)
    try:
        cur = conn.cursor()

        if existing_id and auth_email:
            cur.execute(f"SELECT user_email FROM {S}documents WHERE id = %s", (existing_id,))
            owner = cur.fetchone()
            if owner and owner[0] != auth_email:
                return response(403, {'error': 'Нет доступа к этому документу'})

        if existing_id:
            cur.execute(f"SELECT id FROM {S}documents WHERE id = %s", (existing_id,))
            if cur.fetchone():
                cur.execute(f"""
                    UPDATE {S}documents
                    SET data = %s, file_name = %s, updated_at = %s
                    WHERE id = %s
                    RETURNING {COLUMNS}
                """, (json.dumps(data), file_name, now, existing_id))
                row = cur.fetchone()
                conn.commit()
                return response(200, {'document': row_to_dict(row)})

        cur.execute(f"""
            INSERT INTO {S}documents (user_email, type, file_name, data, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING {COLUMNS}
        """, (user_email, doc_type, file_name, json.dumps(data), now, now))
        row = cur.fetchone()
        conn.commit()
        return response(201, {'document': row_to_dict(row)})
    except Exception as e:
        conn.rollback()
        print(f"Ошибка сохранения документа: {e}")
        raise
    finally:
        conn.close()


def handle_delete_document(event):
    params = event.get('queryStringParameters') or {}
    doc_id = params.get('id')
    if not doc_id:
        body = parse_body(event)
        doc_id = body.get('id')
    if not doc_id:
        return response(400, {'error': 'id обязателен'})

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()

        auth_email = get_auth_email(event)
        if auth_email:
            cur.execute(f"SELECT user_email FROM {S}documents WHERE id = %s", (doc_id,))
            owner = cur.fetchone()
            if not owner or owner[0] != auth_email:
                return response(403, {'error': 'Нет доступа к этому документу'})

        cur.execute(f"DELETE FROM {S}documents WHERE id = %s", (doc_id,))
        conn.commit()
        if cur.rowcount == 0:
            return response(404, {'error': 'Документ не найден'})
        return response(200, {'success': True})
    except Exception as e:
        conn.rollback()
        print(f"Ошибка удаления документа: {e}")
        raise
    finally:
        conn.close()


def handler(event, context):
    """API документов: CRUD операции для договоров аренды и других документов."""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': '',
        }

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    if method == 'GET' and action == 'get_one':
        return handle_get_document(event)
    elif method == 'GET':
        return handle_get_documents(event)
    elif method == 'POST':
        return handle_save_document(event)
    elif method == 'PUT':
        return handle_save_document(event)
    elif method == 'DELETE':
        return handle_delete_document(event)

    return response(405, {'error': 'Метод не поддерживается'})