"""API для управления рекомендациями недвижимости. v2"""
import json
import os
from datetime import datetime, timezone
import psycopg2
from auth_utils import get_auth_email, require_auth, auth_error_response, set_request_origin, get_cors_headers
from s3_upload import upload_photos_to_s3

MAX_BODY_SIZE = 150 * 1024 * 1024


def get_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_schema() -> str:
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return f"{schema}." if schema else ""


def response(status, body):
    return {
        'statusCode': status,
        'headers': get_cors_headers(),
        'body': json.dumps(body, default=str),
    }


def to_utc_iso(dt):
    """Сериализует datetime в ISO-строку с явной пометкой UTC.

    Колонка в БД timestamp without time zone, но фактически хранится UTC
    (datetime.now(timezone.utc) при записи). Без пометки '+00:00' фронтенд
    интерпретирует время как локальное, из-за чего оно показывается со сдвигом.
    """
    if not dt:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def parse_body(event):
    import base64
    body_str = event.get('body', '{}')
    if not body_str:
        return {}
    if len(body_str) > MAX_BODY_SIZE:
        raise ValueError("Тело запроса слишком большое. Максимум 150 МБ")
    if event.get('isBase64Encoded'):
        body_str = base64.b64decode(body_str).decode('utf-8')
    return json.loads(body_str)


COLUMNS = """r.id, r.user_id, r.request_id, r.request_name, r.owner_email, r.invite_message,
             r.address, r.coordinates_lat, r.coordinates_lng, r.area, r.floor, r.total_floors,
             r.rooms, r.has_furniture, r.has_appliances, r.rent, r.property_comments,
             r.photos, r.status, r.created_at, r.updated_at"""

COLUMNS_SHORT = """r.id, r.user_id, r.request_id, r.request_name, r.owner_email, r.invite_message,
             r.address, r.coordinates_lat, r.coordinates_lng, r.area, r.floor, r.total_floors,
             r.rooms, r.has_furniture, r.has_appliances, r.rent, r.property_comments,
             array_length(r.photos, 1) as photo_count, r.status, r.created_at, r.updated_at"""

COLUMNS_PLAIN = """id, user_id, request_id, request_name, owner_email, invite_message,
             address, coordinates_lat, coordinates_lng, area, floor, total_floors,
             rooms, has_furniture, has_appliances, rent, property_comments,
             photos, status, created_at, updated_at"""


def row_to_dict(row, include_photos=True, has_user_name=False):
    result = {
        'id': str(row[0]),
        'userId': row[1] or '',
        'requestId': str(row[2]) if row[2] else '',
        'requestName': row[3] or '',
        'ownerEmail': row[4] or '',
        'inviteMessage': row[5] or '',
        'propertyData': {
            'address': row[6] or '',
            'coordinates': [row[7] or 0, row[8] or 0],
            'area': row[9] or '',
            'floor': row[10] or '',
            'totalFloors': row[11] or '',
            'rooms': row[12] or '',
            'hasFurniture': bool(row[13]),
            'hasAppliances': bool(row[14]),
            'rent': row[15] or '',
            'comments': row[16] or '',
        },
        'status': row[18] or 'pending',
        'createdAt': to_utc_iso(row[19]),
        'updatedAt': to_utc_iso(row[20]),
    }
    if include_photos:
        result['photos'] = row[17] if row[17] else []
    else:
        result['photos'] = []
        result['photoCount'] = row[17] or 0
    if has_user_name and len(row) > 21:
        first = row[21] or ''
        last = row[22] or ''
        result['userName'] = f"{first} {last}".strip() or ''
    return result


def handle_list(event):
    """Публичный эндпоинт — список рекомендаций видят все."""
    params = event.get('queryStringParameters') or {}
    user_id = params.get('user_id')
    request_id = params.get('request_id')
    rec_id = params.get('id')

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()

        if rec_id:
            cur.execute(f"""
                SELECT {COLUMNS}, u.first_name, u.last_name
                FROM {S}recommendations r
                LEFT JOIN {S}users u ON u.email = r.user_id
                WHERE r.id = %s AND r.status != 'deleted'
            """, (int(rec_id),))
            row = cur.fetchone()
            if not row:
                return response(404, {'error': 'Рекомендация не найдена'})
            return response(200, {'recommendation': row_to_dict(row, include_photos=True, has_user_name=True)})

        conditions = ["r.status != 'deleted'"]
        values = []

        if user_id:
            conditions.append("r.user_id = %s")
            values.append(user_id)
        if request_id:
            conditions.append("r.request_id = %s")
            values.append(request_id)

        where = f" WHERE {' AND '.join(conditions)}"
        limit = " LIMIT 50" if not (user_id or request_id) else ""
        cur.execute(f"""
            SELECT {COLUMNS_SHORT}, u.first_name, u.last_name
            FROM {S}recommendations r
            LEFT JOIN {S}users u ON u.email = r.user_id
            {where} ORDER BY r.created_at DESC{limit}
        """, tuple(values))
        rows = cur.fetchall()
        return response(200, {'recommendations': [row_to_dict(r, include_photos=False, has_user_name=True) for r in rows]})
    finally:
        conn.close()


def handle_create(event):
    auth_email = require_auth(event)
    body = parse_body(event)
    print(f"POST body keys: {list(body.keys())}, userId='{body.get('userId', '')}'")

    if body.get('userId') and auth_email != body.get('userId'):
        return response(403, {'error': 'Нет доступа'})

    body['userId'] = auth_email

    if not body.get('userId'):
        print(f"Ошибка: userId пустой или отсутствует. body={json.dumps(body, default=str)[:500]}")
        return response(400, {'error': 'Поле userId обязательно'})

    pd = body.get('propertyData', {})
    coords = pd.get('coordinates', [0, 0])
    request_id = body.get('requestId') or None

    raw_photos = body.get('photos', [])
    try:
        photo_urls = upload_photos_to_s3(raw_photos)
    except ValueError as e:
        return response(400, {'error': str(e)})

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()
        now = datetime.now(timezone.utc)

        cur.execute(f"""
            INSERT INTO {S}recommendations (
                user_id, request_id, request_name, owner_email, invite_message,
                address, coordinates_lat, coordinates_lng, area, floor, total_floors,
                rooms, has_furniture, has_appliances, rent, property_comments,
                photos, status, created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s
            )
            RETURNING {COLUMNS_PLAIN}
        """, (
            auth_email,
            request_id,
            body.get('requestName', ''),
            body.get('ownerEmail', ''),
            body.get('inviteMessage', ''),
            pd.get('address', ''),
            coords[0] if len(coords) > 0 else 0,
            coords[1] if len(coords) > 1 else 0,
            pd.get('area', ''),
            pd.get('floor', ''),
            pd.get('totalFloors', ''),
            pd.get('rooms', ''),
            pd.get('hasFurniture', False),
            pd.get('hasAppliances', False),
            pd.get('rent', ''),
            pd.get('comments', ''),
            photo_urls,
            'pending',
            now,
            now,
        ))

        row = cur.fetchone()
        conn.commit()
        return response(201, {'recommendation': row_to_dict(row)})
    except Exception as e:
        conn.rollback()
        print(f"Ошибка создания рекомендации: {e}")
        raise
    finally:
        conn.close()


def handle_update(event):
    auth_email = require_auth(event)
    body = parse_body(event)
    rec_id = body.get('id')
    if not rec_id:
        params = event.get('queryStringParameters') or {}
        rec_id = params.get('id')
    if not rec_id:
        return response(400, {'error': 'Поле id обязательно'})

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()

        cur.execute(f"""
            SELECT r.user_id, r.owner_email, req.user_email
            FROM {S}recommendations r
            LEFT JOIN {S}requests req ON req.id::text = r.request_id
            WHERE r.id = %s
        """, (int(rec_id),))
        owner = cur.fetchone()
        if not owner:
            return response(404, {'error': 'Рекомендация не найдена'})
        rec_author = owner[0]
        owner_email = owner[1] or ''
        request_owner_email = owner[2] or ''
        if auth_email != rec_author and auth_email != owner_email and auth_email != request_owner_email:
            return response(403, {'error': 'Нет доступа к этой рекомендации'})

        now = datetime.now(timezone.utc)

        updates = []
        values = []

        simple_fields = {
            'requestId': 'request_id', 'requestName': 'request_name',
            'ownerEmail': 'owner_email', 'inviteMessage': 'invite_message',
            'status': 'status',
        }
        for js_key, db_key in simple_fields.items():
            if js_key in body:
                updates.append(f"{db_key} = %s")
                values.append(body[js_key])

        if 'photos' in body:
            try:
                photo_urls = upload_photos_to_s3(body['photos'])
            except ValueError as e:
                return response(400, {'error': str(e)})
            updates.append("photos = %s")
            values.append(photo_urls)

        pd = body.get('propertyData')
        if pd:
            if 'address' in pd:
                updates.append("address = %s")
                values.append(pd['address'])
            coords = pd.get('coordinates')
            if coords and len(coords) == 2:
                updates.append("coordinates_lat = %s")
                values.append(coords[0])
                updates.append("coordinates_lng = %s")
                values.append(coords[1])
            for js_key, db_key in {'area': 'area', 'floor': 'floor', 'totalFloors': 'total_floors',
                                    'rooms': 'rooms', 'rent': 'rent', 'comments': 'property_comments'}.items():
                if js_key in pd:
                    updates.append(f"{db_key} = %s")
                    values.append(pd[js_key])
            if 'hasFurniture' in pd:
                updates.append("has_furniture = %s")
                values.append(pd['hasFurniture'])
            if 'hasAppliances' in pd:
                updates.append("has_appliances = %s")
                values.append(pd['hasAppliances'])

        if not updates:
            return response(400, {'error': 'Нет полей для обновления'})

        updates.append("updated_at = %s")
        values.append(now)
        values.append(int(rec_id))

        cur.execute(
            f"UPDATE {S}recommendations SET {', '.join(updates)} WHERE id = %s RETURNING {COLUMNS_PLAIN}",
            tuple(values)
        )

        row = cur.fetchone()
        if not row:
            return response(404, {'error': 'Рекомендация не найдена'})

        conn.commit()
        return response(200, {'recommendation': row_to_dict(row)})
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def handle_delete(event):
    auth_email = require_auth(event)

    params = event.get('queryStringParameters') or {}
    rec_id = params.get('id')
    if not rec_id:
        body = parse_body(event)
        rec_id = body.get('id')
    if not rec_id:
        return response(400, {'error': 'Поле id обязательно'})

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()

        cur.execute(f"SELECT user_id FROM {S}recommendations WHERE id = %s", (int(rec_id),))
        owner = cur.fetchone()
        if not owner:
            return response(404, {'error': 'Рекомендация не найдена'})
        if auth_email != owner[0]:
            return response(403, {'error': 'Нет доступа к этой рекомендации'})

        now = datetime.now(timezone.utc)
        cur.execute(
            f"UPDATE {S}recommendations SET status = 'deleted', updated_at = %s WHERE id = %s RETURNING id",
            (now, int(rec_id))
        )
        row = cur.fetchone()
        conn.commit()
        return response(200, {'success': True, 'id': str(row[0])})
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def handler(event, context):
    """API для управления рекомендациями недвижимости."""
    set_request_origin(event)

    if event.get('httpMethod') == 'OPTIONS':
        return response(200, {})

    method = event.get('httpMethod', 'GET')

    try:
        if method == 'GET':
            return handle_list(event)
        elif method == 'POST':
            return handle_create(event)
        elif method == 'PUT':
            return handle_update(event)
        elif method == 'DELETE':
            return handle_delete(event)
        else:
            return response(405, {'error': 'Метод не поддерживается'})
    except ValueError as e:
        return response(400, {'error': str(e)})
    except json.JSONDecodeError:
        return response(400, {'error': 'Некорректный JSON'})
    except PermissionError as e:
        return auth_error_response(401, str(e))
    except Exception as e:
        print(f"Ошибка: {e}")
        return response(500, {'error': 'Внутренняя ошибка сервера'})