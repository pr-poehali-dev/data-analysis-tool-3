"""API для управления заявками на аренду."""
import json
import os
from datetime import datetime, timezone
import psycopg2
import psycopg2.extras


def get_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_schema() -> str:
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return f"{schema}." if schema else ""


CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
}


def response(status, body):
    return {
        'statusCode': status,
        'headers': CORS_HEADERS,
        'body': json.dumps(body, default=str),
    }


def parse_body(event):
    body_str = event.get('body', '{}')
    if not body_str:
        return {}
    return json.loads(body_str)


def handle_list(event):
    """Получить список заявок. Фильтры: user_email, status."""
    params = event.get('queryStringParameters') or {}
    user_email = params.get('user_email')
    status_filter = params.get('status')
    request_id = params.get('id')

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()

        if request_id:
            cur.execute(f"""
                SELECT id, user_id, user_email, name, avatar, location, budget, reward, bonus,
                       who_will_live, about_yourself, has_pets, city, districts,
                       budget_min, budget_max, housing_type, rooms_count,
                       rental_period, move_in_date, status, created_at, updated_at
                FROM {S}requests WHERE id = %s
            """, (int(request_id),))
        elif user_email:
            if status_filter:
                cur.execute(f"""
                    SELECT id, user_id, user_email, name, avatar, location, budget, reward, bonus,
                           who_will_live, about_yourself, has_pets, city, districts,
                           budget_min, budget_max, housing_type, rooms_count,
                           rental_period, move_in_date, status, created_at, updated_at
                    FROM {S}requests WHERE user_email = %s AND status = %s
                    ORDER BY created_at DESC
                """, (user_email, status_filter))
            else:
                cur.execute(f"""
                    SELECT id, user_id, user_email, name, avatar, location, budget, reward, bonus,
                           who_will_live, about_yourself, has_pets, city, districts,
                           budget_min, budget_max, housing_type, rooms_count,
                           rental_period, move_in_date, status, created_at, updated_at
                    FROM {S}requests WHERE user_email = %s
                    ORDER BY created_at DESC
                """, (user_email,))
        else:
            if status_filter:
                cur.execute(f"""
                    SELECT id, user_id, user_email, name, avatar, location, budget, reward, bonus,
                           who_will_live, about_yourself, has_pets, city, districts,
                           budget_min, budget_max, housing_type, rooms_count,
                           rental_period, move_in_date, status, created_at, updated_at
                    FROM {S}requests WHERE status = %s
                    ORDER BY created_at DESC
                """, (status_filter,))
            else:
                cur.execute(f"""
                    SELECT id, user_id, user_email, name, avatar, location, budget, reward, bonus,
                           who_will_live, about_yourself, has_pets, city, districts,
                           budget_min, budget_max, housing_type, rooms_count,
                           rental_period, move_in_date, status, created_at, updated_at
                    FROM {S}requests ORDER BY created_at DESC
                """)

        rows = cur.fetchall()

        if request_id and rows:
            row = rows[0]
            return response(200, {'request': row_to_dict(row)})

        requests = [row_to_dict(row) for row in rows]
        return response(200, {'requests': requests})
    finally:
        conn.close()


def row_to_dict(row):
    return {
        'id': str(row[0]),
        'userId': str(row[1]) if row[1] else row[2],
        'userEmail': row[2],
        'name': row[3] or '',
        'avatar': row[4] or '',
        'location': row[5] or '',
        'budget': row[6] or '',
        'reward': row[7] or '',
        'bonus': row[8] or '',
        'whoWillLive': row[9] or '',
        'aboutYourself': row[10] or '',
        'hasPets': row[11] or '',
        'city': row[12] or '',
        'districts': row[13] if row[13] else [],
        'budgetMin': row[14] or '',
        'budgetMax': row[15] or '',
        'housingType': row[16] or '',
        'roomsCount': row[17] or '',
        'rentalPeriod': row[18] or '',
        'moveInDate': row[19] or '',
        'status': row[20] or 'active',
        'createdAt': row[21].isoformat() if row[21] else None,
        'updatedAt': row[22].isoformat() if row[22] else None,
    }


def handle_create(event):
    """Создать новую заявку."""
    body = parse_body(event)

    required = ['userEmail', 'name']
    for field in required:
        if not body.get(field):
            return response(400, {'error': f'Поле {field} обязательно'})

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()
        now = datetime.now(timezone.utc)
        districts = body.get('districts', [])

        cur.execute(f"""
            INSERT INTO {S}requests (
                user_id, user_email, name, avatar, location, budget, reward, bonus,
                who_will_live, about_yourself, has_pets, city, districts,
                budget_min, budget_max, housing_type, rooms_count,
                rental_period, move_in_date, status, created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s, %s
            )
            RETURNING id, user_id, user_email, name, avatar, location, budget, reward, bonus,
                      who_will_live, about_yourself, has_pets, city, districts,
                      budget_min, budget_max, housing_type, rooms_count,
                      rental_period, move_in_date, status, created_at, updated_at
        """, (
            body.get('userId'),
            body['userEmail'],
            body['name'],
            body.get('avatar', ''),
            body.get('location', ''),
            body.get('budget', ''),
            body.get('reward', ''),
            body.get('bonus', ''),
            body.get('whoWillLive', ''),
            body.get('aboutYourself', ''),
            body.get('hasPets', ''),
            body.get('city', ''),
            districts,
            body.get('budgetMin', ''),
            body.get('budgetMax', ''),
            body.get('housingType', ''),
            body.get('roomsCount', ''),
            body.get('rentalPeriod', ''),
            body.get('moveInDate', ''),
            'active',
            now,
            now,
        ))

        row = cur.fetchone()
        conn.commit()
        return response(201, {'request': row_to_dict(row)})
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def handle_update(event):
    """Обновить заявку."""
    body = parse_body(event)
    request_id = body.get('id')
    if not request_id:
        params = event.get('queryStringParameters') or {}
        request_id = params.get('id')

    if not request_id:
        return response(400, {'error': 'Поле id обязательно'})

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()
        now = datetime.now(timezone.utc)

        updates = []
        values = []

        field_map = {
            'name': 'name', 'avatar': 'avatar', 'location': 'location',
            'budget': 'budget', 'reward': 'reward', 'bonus': 'bonus',
            'whoWillLive': 'who_will_live', 'aboutYourself': 'about_yourself',
            'hasPets': 'has_pets', 'city': 'city', 'districts': 'districts',
            'budgetMin': 'budget_min', 'budgetMax': 'budget_max',
            'housingType': 'housing_type', 'roomsCount': 'rooms_count',
            'rentalPeriod': 'rental_period', 'moveInDate': 'move_in_date',
            'status': 'status',
        }

        for js_key, db_key in field_map.items():
            if js_key in body:
                updates.append(f"{db_key} = %s")
                values.append(body[js_key])

        if not updates:
            return response(400, {'error': 'Нет полей для обновления'})

        updates.append("updated_at = %s")
        values.append(now)
        values.append(int(request_id))

        cur.execute(
            f"UPDATE {S}requests SET {', '.join(updates)} WHERE id = %s "
            f"RETURNING id, user_id, user_email, name, avatar, location, budget, reward, bonus, "
            f"who_will_live, about_yourself, has_pets, city, districts, "
            f"budget_min, budget_max, housing_type, rooms_count, "
            f"rental_period, move_in_date, status, created_at, updated_at",
            tuple(values)
        )

        row = cur.fetchone()
        if not row:
            return response(404, {'error': 'Заявка не найдена'})

        conn.commit()
        return response(200, {'request': row_to_dict(row)})
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def handle_delete(event):
    """Удалить заявку (мягкое удаление — статус archived)."""
    params = event.get('queryStringParameters') or {}
    request_id = params.get('id')

    if not request_id:
        body = parse_body(event)
        request_id = body.get('id')

    if not request_id:
        return response(400, {'error': 'Поле id обязательно'})

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()
        now = datetime.now(timezone.utc)
        cur.execute(
            f"UPDATE {S}requests SET status = 'archived', updated_at = %s WHERE id = %s RETURNING id",
            (now, int(request_id))
        )
        row = cur.fetchone()
        if not row:
            return response(404, {'error': 'Заявка не найдена'})
        conn.commit()
        return response(200, {'success': True, 'id': str(row[0])})
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def handler(event, context):
    """API для управления заявками на аренду."""
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
    except json.JSONDecodeError:
        return response(400, {'error': 'Некорректный JSON'})
    except Exception as e:
        print(f"Ошибка: {e}")
        return response(500, {'error': 'Внутренняя ошибка сервера'})
