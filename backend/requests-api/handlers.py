"""CRUD-обработчики для заявок на аренду."""
from datetime import datetime, timezone
from utils import get_connection, get_schema, response, parse_body, COLUMNS, row_to_dict, MAX_AVATAR_LENGTH
from auth_utils import get_auth_email, require_auth


def validate_avatar(avatar):
    """Проверяет длину поля avatar. Возвращает ошибку или None."""
    if not avatar:
        return None
    if len(avatar) > MAX_AVATAR_LENGTH:
        return f"URL аватара слишком длинный ({len(avatar)} символов). Максимум {MAX_AVATAR_LENGTH}"
    return None


def handle_list(event):
    """Получить список заявок. Публичный эндпоинт (биржа).
    Фильтр по user_email доступен только с токеном (свои заявки)."""
    params = event.get('queryStringParameters') or {}
    user_email = params.get('user_email')
    status_filter = params.get('status')
    request_id = params.get('id')

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()

        if request_id:
            cur.execute(f"SELECT {COLUMNS} FROM {S}requests WHERE id = %s", (int(request_id),))
            row = cur.fetchone()
            if row:
                return response(200, {'request': row_to_dict(row)})
            return response(404, {'error': 'Заявка не найдена'})

        conditions = []
        values = []

        if user_email:
            auth_email = get_auth_email(event)
            if not auth_email:
                return response(401, {'error': 'Требуется авторизация для просмотра своих заявок'})
            if auth_email != user_email:
                return response(403, {'error': 'Нет доступа к заявкам другого пользователя'})
            conditions.append("user_email = %s")
            values.append(user_email)

        if status_filter:
            conditions.append("status = %s")
            values.append(status_filter)

        where = f" WHERE {' AND '.join(conditions)}" if conditions else ""
        cur.execute(f"SELECT {COLUMNS} FROM {S}requests{where} ORDER BY created_at DESC", tuple(values))
        rows = cur.fetchall()
        return response(200, {'requests': [row_to_dict(r) for r in rows]})
    finally:
        conn.close()


def handle_create(event):
    """Создать новую заявку."""
    auth_email = require_auth(event)
    body = parse_body(event)

    if body.get('userEmail') and auth_email != body.get('userEmail'):
        return response(403, {'error': 'Нет доступа'})

    body['userEmail'] = auth_email

    for field in ['userEmail', 'name']:
        if not body.get(field):
            return response(400, {'error': f'Поле {field} обязательно'})

    avatar_error = validate_avatar(body.get('avatar', ''))
    if avatar_error:
        return response(400, {'error': avatar_error})

    S = get_schema()
    conn = get_connection()
    try:
        cur = conn.cursor()
        now = datetime.now(timezone.utc)

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
            RETURNING {COLUMNS}
        """, (
            body.get('userId'),
            auth_email,
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
            body.get('districts', []),
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
    auth_email = require_auth(event)
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

        cur.execute(f"SELECT user_email FROM {S}requests WHERE id = %s", (int(request_id),))
        owner_row = cur.fetchone()
        if not owner_row:
            return response(404, {'error': 'Заявка не найдена'})
        if auth_email != owner_row[0]:
            return response(403, {'error': 'Нет доступа к этой заявке'})

        if 'avatar' in body:
            avatar_error = validate_avatar(body['avatar'])
            if avatar_error:
                return response(400, {'error': avatar_error})

        now = datetime.now(timezone.utc)

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

        updates = []
        values = []
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
            f"UPDATE {S}requests SET {', '.join(updates)} WHERE id = %s RETURNING {COLUMNS}",
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
    auth_email = require_auth(event)

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

        cur.execute(f"SELECT user_email FROM {S}requests WHERE id = %s", (int(request_id),))
        owner_row = cur.fetchone()
        if not owner_row:
            return response(404, {'error': 'Заявка не найдена'})
        if auth_email != owner_row[0]:
            return response(403, {'error': 'Нет доступа к этой заявке'})

        now = datetime.now(timezone.utc)
        cur.execute(
            f"UPDATE {S}requests SET status = 'archived', updated_at = %s WHERE id = %s RETURNING id",
            (now, int(request_id))
        )
        row = cur.fetchone()
        conn.commit()
        return response(200, {'success': True, 'id': str(row[0])})
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()