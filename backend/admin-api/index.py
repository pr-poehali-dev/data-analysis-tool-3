# admin-api v2.7
import json
import os
import hmac
import hashlib
import base64
import time
import smtplib
import psycopg2
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
    "Content-Type": "application/json"
}

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")


def verify_admin_token(token: str) -> bool:
    """Проверяет JWT токен администратора"""
    jwt_secret = os.environ.get("ADMIN_JWT_SECRET", "")
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return False
        header, body, sig = parts
        signature_input = f"{header}.{body}".encode()
        expected_sig = hmac.digest(jwt_secret.encode(), signature_input, hashlib.sha256)
        expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).rstrip(b"=").decode()
        if not hmac.compare_digest(sig, expected_sig_b64):
            return False
        padding = 4 - len(body) % 4
        payload = json.loads(base64.urlsafe_b64decode(body + "=" * padding))
        if payload.get("exp", 0) < time.time():
            return False
        if payload.get("role") != "admin":
            return False
        return True
    except (ValueError, KeyError, TypeError, AttributeError):
        return False


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def json_response(data: dict, status: int = 200) -> dict:
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(data, default=str, ensure_ascii=False)
    }


def handler(event: dict, context) -> dict:
    """
    Единая точка входа для всех запросов администратора.
    Требует заголовок X-Admin-Token с валидным JWT.
    GET  ?action=stats                  — общая статистика для дашборда.
    GET  ?action=registrations          — регистрации за последние 30 дней (для графика).
    GET  ?action=activity               — последние действия на платформе.
    GET  ?action=users                  — список пользователей с поиском, фильтром, пагинацией.
    GET  ?action=user&id=X              — детальная карточка одного пользователя.
    POST ?action=block_user             — заблокировать/разблокировать пользователя.
    GET  ?action=requests               — список заявок с поиском, фильтром, пагинацией.
    GET  ?action=request&id=X           — детальная карточка заявки.
    POST ?action=update_request_status  — изменить статус заявки.
    POST ?action=delete_request         — удалить заявку.
    GET  ?action=recommendations        — список рекомендаций с поиском, фильтром, пагинацией.
    GET  ?action=recommendation&id=X    — детальная карточка рекомендации.
    POST ?action=update_rec_status      — изменить статус рекомендации.
    POST ?action=delete_recommendation  — удалить рекомендацию.
    GET  ?action=escrow                 — список сделок с поиском, фильтром по статусу, пагинацией.
    GET  ?action=escrow_detail&id=X     — детальная карточка сделки с историей.
    POST ?action=update_escrow_status   — ручная смена статуса сделки администратором.
    GET  ?action=reviews                — список отзывов с поиском, фильтром по рейтингу, пагинацией.
    POST ?action=delete_review          — удалить отзыв.
    GET  ?action=feedback               — список обращений обратной связи с фильтром/пагинацией.
    POST ?action=mark_feedback_read     — пометить обращение как прочитанное.
    POST ?action=reply_feedback         — ответить на обращение по email и пометить прочитанным.
    GET  ?action=analytics              — расширенная аналитика: города, конверсия, бюджет, типы жилья, срок аренды.
    """
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    headers = event.get("headers") or {}
    token = headers.get("X-Admin-Token") or headers.get("x-admin-token") or ""
    if not verify_admin_token(token):
        return json_response({"error": "Доступ запрещён"}, 403)

    query = event.get("queryStringParameters") or {}
    action = query.get("action", "")
    method = event.get("httpMethod", "GET")

    if action == "stats":
        return handle_stats()
    elif action == "registrations":
        return handle_registrations()
    elif action == "activity":
        return handle_activity()
    elif action == "users":
        return handle_users(query)
    elif action == "user":
        return handle_user(query)
    elif action == "block_user" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        return handle_block_user(body)
    elif action == "requests":
        return handle_requests(query)
    elif action == "request":
        return handle_request(query)
    elif action == "update_request_status" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        return handle_update_request_status(body)
    elif action == "delete_request" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        return handle_delete_request(body)
    elif action == "recommendations":
        return handle_recommendations(query)
    elif action == "recommendation":
        return handle_recommendation(query)
    elif action == "update_rec_status" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        return handle_update_rec_status(body)
    elif action == "delete_recommendation" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        return handle_delete_recommendation(body)
    elif action == "escrow":
        return handle_escrow(query)
    elif action == "escrow_detail":
        return handle_escrow_detail(query)
    elif action == "update_escrow_status" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        return handle_update_escrow_status(body)
    elif action == "reviews":
        return handle_reviews(query)
    elif action == "delete_review" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        return handle_delete_review(body)
    elif action == "feedback":
        return handle_feedback(query)
    elif action == "mark_feedback_read" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        return handle_mark_feedback_read(body)
    elif action == "reply_feedback" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        return handle_reply_feedback(body)
    elif action == "analytics":
        return handle_analytics()

    return json_response({"error": "Укажите параметр action"}, 400)


def handle_stats() -> dict:
    """Возвращает общие счётчики для дашборда"""
    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users")
    users_total = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.requests")
    requests_total = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.recommendations")
    recommendations_total = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.escrow_transactions")
    escrow_total = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.reviews")
    reviews_total = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users WHERE created_at >= NOW() - INTERVAL '30 days'")
    new_users_30d = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.requests WHERE created_at >= NOW() - INTERVAL '30 days'")
    new_requests_30d = cur.fetchone()[0]

    cur.close()
    conn.close()

    return json_response({
        "users_total": users_total,
        "requests_total": requests_total,
        "recommendations_total": recommendations_total,
        "escrow_total": escrow_total,
        "reviews_total": reviews_total,
        "new_users_30d": new_users_30d,
        "new_requests_30d": new_requests_30d,
    })


def handle_registrations() -> dict:
    """Возвращает количество регистраций за последние 30 дней для графика"""
    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"""
        SELECT
            DATE(created_at) AS day,
            COUNT(*) AS cnt
        FROM {SCHEMA}.users
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY day ASC
    """)
    rows = cur.fetchall()

    cur.close()
    conn.close()

    data = [{"day": str(row[0]), "count": row[1]} for row in rows]
    return json_response({"registrations": data})


def handle_activity() -> dict:
    """Возвращает последние 20 действий на платформе"""
    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"""
        SELECT 'user' AS type, id, COALESCE(first_name || ' ' || last_name, name, email) AS title,
               'Новый пользователь' AS action, created_at
        FROM {SCHEMA}.users
        ORDER BY created_at DESC LIMIT 7
    """)
    users_rows = cur.fetchall()

    cur.execute(f"""
        SELECT 'request' AS type, id, name AS title,
               'Новая заявка' AS action, created_at
        FROM {SCHEMA}.requests
        ORDER BY created_at DESC LIMIT 7
    """)
    requests_rows = cur.fetchall()

    cur.execute(f"""
        SELECT 'recommendation' AS type, id, COALESCE(address, 'Без адреса') AS title,
               'Новая рекомендация' AS action, created_at
        FROM {SCHEMA}.recommendations
        ORDER BY created_at DESC LIMIT 6
    """)
    recs_rows = cur.fetchall()

    cur.close()
    conn.close()

    all_rows = list(users_rows) + list(requests_rows) + list(recs_rows)
    all_rows.sort(key=lambda x: x[4] if x[4] else "", reverse=True)
    all_rows = all_rows[:20]

    activity = [
        {
            "type": row[0],
            "id": row[1],
            "title": row[2],
            "action": row[3],
            "created_at": str(row[4])
        }
        for row in all_rows
    ]

    return json_response({"activity": activity})


def handle_users(query: dict) -> dict:
    """
    Возвращает список пользователей с поиском, фильтрацией по роли/статусу, пагинацией.
    Параметры: search, role, status (all|active|blocked), page, limit
    """
    search = query.get("search", "").strip()
    role = query.get("role", "").strip()
    status = query.get("status", "all").strip()
    page = max(1, int(query.get("page", 1)))
    limit = min(50, max(1, int(query.get("limit", 20))))
    offset = (page - 1) * limit

    conditions = []
    if search:
        safe_search = search.replace("'", "''")
        conditions.append(
            f"(LOWER(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')) LIKE LOWER('%{safe_search}%') "
            f"OR LOWER(COALESCE(email,'')) LIKE LOWER('%{safe_search}%') "
            f"OR LOWER(COALESCE(phone,'')) LIKE LOWER('%{safe_search}%'))"
        )
    if role:
        safe_role = role.replace("'", "''")
        conditions.append(f"role = '{safe_role}'")
    if status == "active":
        conditions.append("is_blocked = false")
    elif status == "blocked":
        conditions.append("is_blocked = true")

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users {where}")
    total = cur.fetchone()[0]

    cur.execute(f"""
        SELECT
            id, email, first_name, last_name, name, phone, city, role,
            avatar_url, is_blocked, blocked_at, blocked_reason,
            created_at, last_login_at,
            (SELECT COUNT(*) FROM {SCHEMA}.requests r WHERE r.user_id = u.id) AS requests_count,
            (SELECT COUNT(*) FROM {SCHEMA}.recommendations rec WHERE rec.user_id = u.id) AS recommendations_count
        FROM {SCHEMA}.users u
        {where}
        ORDER BY created_at DESC
        LIMIT {limit} OFFSET {offset}
    """)
    rows = cur.fetchall()

    cur.close()
    conn.close()

    users = []
    for row in rows:
        display_name = ""
        if row[2] or row[3]:
            display_name = f"{row[2] or ''} {row[3] or ''}".strip()
        elif row[4]:
            display_name = row[4]
        elif row[1]:
            display_name = row[1]
        else:
            display_name = f"Пользователь #{row[0]}"

        users.append({
            "id": row[0],
            "email": row[1],
            "first_name": row[2],
            "last_name": row[3],
            "name": row[4],
            "display_name": display_name,
            "phone": row[5],
            "city": row[6],
            "role": row[7],
            "avatar_url": row[8],
            "is_blocked": row[9],
            "blocked_at": str(row[10]) if row[10] else None,
            "blocked_reason": row[11],
            "created_at": str(row[12]) if row[12] else None,
            "last_login_at": str(row[13]) if row[13] else None,
            "requests_count": row[14],
            "recommendations_count": row[15],
        })

    return json_response({
        "users": users,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 1,
    })


def handle_user(query: dict) -> dict:
    """Возвращает детальную карточку одного пользователя по id"""
    user_id = query.get("id", "")
    if not user_id or not str(user_id).isdigit():
        return json_response({"error": "Укажите корректный id пользователя"}, 400)

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"""
        SELECT
            id, email, first_name, last_name, name, phone, city, role,
            avatar_url, is_blocked, blocked_at, blocked_reason,
            created_at, last_login_at,
            telegram_username, vk_link, email_verified,
            (SELECT COUNT(*) FROM {SCHEMA}.requests r WHERE r.user_id = u.id) AS requests_count,
            (SELECT COUNT(*) FROM {SCHEMA}.recommendations rec WHERE rec.user_id = u.id) AS recommendations_count,
            (SELECT COUNT(*) FROM {SCHEMA}.reviews rev WHERE rev.reviewer_id = u.id) AS reviews_count
        FROM {SCHEMA}.users u
        WHERE id = {int(user_id)}
    """)
    row = cur.fetchone()

    cur.close()
    conn.close()

    if not row:
        return json_response({"error": "Пользователь не найден"}, 404)

    display_name = ""
    if row[2] or row[3]:
        display_name = f"{row[2] or ''} {row[3] or ''}".strip()
    elif row[4]:
        display_name = row[4]
    elif row[1]:
        display_name = row[1]
    else:
        display_name = f"Пользователь #{row[0]}"

    return json_response({
        "user": {
            "id": row[0],
            "email": row[1],
            "first_name": row[2],
            "last_name": row[3],
            "name": row[4],
            "display_name": display_name,
            "phone": row[5],
            "city": row[6],
            "role": row[7],
            "avatar_url": row[8],
            "is_blocked": row[9],
            "blocked_at": str(row[10]) if row[10] else None,
            "blocked_reason": row[11],
            "created_at": str(row[12]) if row[12] else None,
            "last_login_at": str(row[13]) if row[13] else None,
            "telegram_username": row[14],
            "vk_link": row[15],
            "email_verified": row[16],
            "requests_count": row[17],
            "recommendations_count": row[18],
            "reviews_count": row[19],
        }
    })


def handle_block_user(body: dict) -> dict:
    """
    Блокирует или разблокирует пользователя.
    body: { user_id: int, block: bool, reason?: str }
    """
    user_id = body.get("user_id")
    block = body.get("block")
    reason = body.get("reason", "")

    if not user_id or not isinstance(user_id, int):
        return json_response({"error": "Укажите user_id"}, 400)
    if block is None:
        return json_response({"error": "Укажите block (true/false)"}, 400)

    safe_reason = str(reason).replace("'", "''") if reason else ""
    conn = get_db()
    cur = conn.cursor()

    if block:
        cur.execute(f"""
            UPDATE {SCHEMA}.users
            SET is_blocked = true,
                blocked_at = NOW(),
                blocked_reason = '{safe_reason}'
            WHERE id = {int(user_id)}
            RETURNING id
        """)
    else:
        cur.execute(f"""
            UPDATE {SCHEMA}.users
            SET is_blocked = false,
                blocked_at = NULL,
                blocked_reason = NULL
            WHERE id = {int(user_id)}
            RETURNING id
        """)

    updated = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not updated:
        return json_response({"error": "Пользователь не найден"}, 404)

    action_text = "заблокирован" if block else "разблокирован"
    return json_response({"success": True, "message": f"Пользователь {action_text}"})


# ─── ЗАЯВКИ ───────────────────────────────────────────────────────────────────

REQUEST_STATUSES = ("active", "in_progress", "archived")


def handle_requests(query: dict) -> dict:
    """
    Возвращает список заявок с поиском, фильтром по статусу, пагинацией.
    Параметры: search, status, page, limit
    """
    search = query.get("search", "").strip()
    status = query.get("status", "").strip()
    page = max(1, int(query.get("page", 1)))
    limit = min(50, max(1, int(query.get("limit", 20))))
    offset = (page - 1) * limit

    conditions = []
    if search:
        safe = search.replace("'", "''")
        conditions.append(
            f"(LOWER(COALESCE(r.name,'')) LIKE LOWER('%{safe}%') "
            f"OR LOWER(COALESCE(r.city,'')) LIKE LOWER('%{safe}%') "
            f"OR LOWER(COALESCE(r.user_email,'')) LIKE LOWER('%{safe}%'))"
        )
    if status and status in REQUEST_STATUSES:
        conditions.append(f"r.status = '{status}'")

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.requests r {where}")
    total = cur.fetchone()[0]

    cur.execute(f"""
        SELECT
            r.id, r.name, r.user_id, r.user_email,
            r.city, r.budget_min, r.budget_max, r.budget,
            r.housing_type, r.rooms_count, r.rental_period, r.move_in_date,
            r.reward, r.status, r.created_at, r.updated_at,
            r.who_will_live, r.has_pets,
            COALESCE(u.first_name || ' ' || u.last_name, u.name, r.user_email) AS author_name,
            (SELECT COUNT(*) FROM {SCHEMA}.recommendations rec WHERE rec.request_id::text = r.id::text) AS offers_count
        FROM {SCHEMA}.requests r
        LEFT JOIN {SCHEMA}.users u ON u.id = r.user_id
        {where}
        ORDER BY r.created_at DESC
        LIMIT {limit} OFFSET {offset}
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    requests_list = []
    for row in rows:
        requests_list.append({
            "id": row[0],
            "name": row[1],
            "user_id": row[2],
            "user_email": row[3],
            "city": row[4],
            "budget_min": row[5],
            "budget_max": row[6],
            "budget": row[7],
            "housing_type": row[8],
            "rooms_count": row[9],
            "rental_period": row[10],
            "move_in_date": row[11],
            "reward": row[12],
            "status": row[13],
            "created_at": str(row[14]) if row[14] else None,
            "updated_at": str(row[15]) if row[15] else None,
            "who_will_live": row[16],
            "has_pets": row[17],
            "author_name": row[18],
            "offers_count": row[19],
        })

    return json_response({
        "requests": requests_list,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 1,
    })


def handle_request(query: dict) -> dict:
    """Возвращает детальную карточку заявки по id"""
    req_id = query.get("id", "")
    if not req_id or not str(req_id).isdigit():
        return json_response({"error": "Укажите корректный id заявки"}, 400)

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"""
        SELECT
            r.id, r.name, r.user_id, r.user_email,
            r.city, r.location, r.budget_min, r.budget_max, r.budget,
            r.housing_type, r.rooms_count, r.rental_period, r.move_in_date,
            r.reward, r.bonus, r.who_will_live, r.about_yourself,
            r.has_pets, r.districts, r.status, r.created_at, r.updated_at,
            COALESCE(u.first_name || ' ' || u.last_name, u.name, r.user_email) AS author_name,
            u.phone AS author_phone, u.avatar_url AS author_avatar,
            (SELECT COUNT(*) FROM {SCHEMA}.recommendations rec WHERE rec.request_id::text = r.id::text) AS offers_count
        FROM {SCHEMA}.requests r
        LEFT JOIN {SCHEMA}.users u ON u.id = r.user_id
        WHERE r.id = {int(req_id)}
    """)
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return json_response({"error": "Заявка не найдена"}, 404)

    return json_response({
        "request": {
            "id": row[0],
            "name": row[1],
            "user_id": row[2],
            "user_email": row[3],
            "city": row[4],
            "location": row[5],
            "budget_min": row[6],
            "budget_max": row[7],
            "budget": row[8],
            "housing_type": row[9],
            "rooms_count": row[10],
            "rental_period": row[11],
            "move_in_date": row[12],
            "reward": row[13],
            "bonus": row[14],
            "who_will_live": row[15],
            "about_yourself": row[16],
            "has_pets": row[17],
            "districts": row[18] if row[18] else [],
            "status": row[19],
            "created_at": str(row[20]) if row[20] else None,
            "updated_at": str(row[21]) if row[21] else None,
            "author_name": row[22],
            "author_phone": row[23],
            "author_avatar": row[24],
            "offers_count": row[25],
        }
    })


def handle_update_request_status(body: dict) -> dict:
    """
    Изменяет статус заявки.
    body: { request_id: int, status: str }
    """
    req_id = body.get("request_id")
    new_status = body.get("status", "")

    if not req_id or not isinstance(req_id, int):
        return json_response({"error": "Укажите request_id"}, 400)
    if new_status not in REQUEST_STATUSES:
        return json_response({"error": f"Статус должен быть одним из: {', '.join(REQUEST_STATUSES)}"}, 400)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"""
        UPDATE {SCHEMA}.requests
        SET status = '{new_status}', updated_at = NOW()
        WHERE id = {int(req_id)}
        RETURNING id
    """)
    updated = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not updated:
        return json_response({"error": "Заявка не найдена"}, 404)

    return json_response({"success": True, "message": "Статус заявки обновлён"})


def handle_delete_request(body: dict) -> dict:
    """
    Удаляет заявку по id.
    body: { request_id: int }
    """
    req_id = body.get("request_id")
    if not req_id or not isinstance(req_id, int):
        return json_response({"error": "Укажите request_id"}, 400)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"DELETE FROM {SCHEMA}.requests WHERE id = {int(req_id)} RETURNING id")
    deleted = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not deleted:
        return json_response({"error": "Заявка не найдена"}, 404)

    return json_response({"success": True, "message": "Заявка удалена"})


# ─── РЕКОМЕНДАЦИИ ─────────────────────────────────────────────────────────────

REC_STATUSES = ("pending", "accepted", "rejected", "deleted")


def handle_recommendations(query: dict) -> dict:
    """
    Возвращает список рекомендаций с поиском, фильтром по статусу, пагинацией.
    Параметры: search, status, page, limit
    """
    search = query.get("search", "").strip()
    status = query.get("status", "").strip()
    page = max(1, int(query.get("page", 1)))
    limit = min(50, max(1, int(query.get("limit", 20))))
    offset = (page - 1) * limit

    conditions = []
    if search:
        safe = search.replace("'", "''")
        conditions.append(
            f"(LOWER(COALESCE(rec.address,'')) LIKE LOWER('%{safe}%') "
            f"OR LOWER(COALESCE(rec.request_name,'')) LIKE LOWER('%{safe}%') "
            f"OR LOWER(COALESCE(rec.owner_email,'')) LIKE LOWER('%{safe}%'))"
        )
    if status and status in REC_STATUSES:
        conditions.append(f"rec.status = '{status}'")

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.recommendations rec {where}")
    total = cur.fetchone()[0]

    cur.execute(f"""
        SELECT
            rec.id, rec.address, rec.rooms, rec.rent, rec.status,
            rec.request_id, rec.request_name, rec.owner_email,
            rec.created_at, rec.updated_at,
            rec.has_furniture, rec.has_appliances, rec.area, rec.floor, rec.total_floors,
            COALESCE(u.first_name || ' ' || u.last_name, u.name, u.email) AS author_name,
            u.id AS author_user_id
        FROM {SCHEMA}.recommendations rec
        LEFT JOIN {SCHEMA}.users u ON u.id::text = rec.user_id
        {where}
        ORDER BY rec.created_at DESC
        LIMIT {limit} OFFSET {offset}
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    recs = []
    for row in rows:
        recs.append({
            "id": row[0],
            "address": row[1],
            "rooms": row[2],
            "rent": row[3],
            "status": row[4],
            "request_id": row[5],
            "request_name": row[6],
            "owner_email": row[7],
            "created_at": str(row[8]) if row[8] else None,
            "updated_at": str(row[9]) if row[9] else None,
            "has_furniture": row[10],
            "has_appliances": row[11],
            "area": row[12],
            "floor": row[13],
            "total_floors": row[14],
            "author_name": row[15],
            "author_user_id": row[16],
        })

    return json_response({
        "recommendations": recs,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 1,
    })


def handle_recommendation(query: dict) -> dict:
    """Возвращает детальную карточку рекомендации по id"""
    rec_id = query.get("id", "")
    if not rec_id or not str(rec_id).isdigit():
        return json_response({"error": "Укажите корректный id рекомендации"}, 400)

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"""
        SELECT
            rec.id, rec.address, rec.rooms, rec.rent, rec.status,
            rec.request_id, rec.request_name, rec.owner_email, rec.invite_message,
            rec.area, rec.floor, rec.total_floors, rec.has_furniture, rec.has_appliances,
            rec.property_comments, rec.photos, rec.coordinates_lat, rec.coordinates_lng,
            rec.created_at, rec.updated_at,
            COALESCE(u.first_name || ' ' || u.last_name, u.name, u.email) AS author_name,
            u.id AS author_user_id, u.email AS author_email, u.phone AS author_phone
        FROM {SCHEMA}.recommendations rec
        LEFT JOIN {SCHEMA}.users u ON u.id::text = rec.user_id
        WHERE rec.id = {int(rec_id)}
    """)
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return json_response({"error": "Рекомендация не найдена"}, 404)

    return json_response({
        "recommendation": {
            "id": row[0],
            "address": row[1],
            "rooms": row[2],
            "rent": row[3],
            "status": row[4],
            "request_id": row[5],
            "request_name": row[6],
            "owner_email": row[7],
            "invite_message": row[8],
            "area": row[9],
            "floor": row[10],
            "total_floors": row[11],
            "has_furniture": row[12],
            "has_appliances": row[13],
            "property_comments": row[14],
            "photos": row[15] if row[15] else [],
            "coordinates_lat": row[16],
            "coordinates_lng": row[17],
            "created_at": str(row[18]) if row[18] else None,
            "updated_at": str(row[19]) if row[19] else None,
            "author_name": row[20],
            "author_user_id": row[21],
            "author_email": row[22],
            "author_phone": row[23],
        }
    })


def handle_update_rec_status(body: dict) -> dict:
    """
    Изменяет статус рекомендации.
    body: { recommendation_id: int, status: str }
    """
    rec_id = body.get("recommendation_id")
    new_status = body.get("status", "")

    if not rec_id or not isinstance(rec_id, int):
        return json_response({"error": "Укажите recommendation_id"}, 400)
    if new_status not in REC_STATUSES:
        return json_response({"error": f"Статус должен быть одним из: {', '.join(REC_STATUSES)}"}, 400)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"""
        UPDATE {SCHEMA}.recommendations
        SET status = '{new_status}', updated_at = NOW()
        WHERE id = {int(rec_id)}
        RETURNING id
    """)
    updated = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not updated:
        return json_response({"error": "Рекомендация не найдена"}, 404)

    return json_response({"success": True, "message": "Статус рекомендации обновлён"})


def handle_delete_recommendation(body: dict) -> dict:
    """
    Удаляет рекомендацию по id.
    body: { recommendation_id: int }
    """
    rec_id = body.get("recommendation_id")
    if not rec_id or not isinstance(rec_id, int):
        return json_response({"error": "Укажите recommendation_id"}, 400)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"DELETE FROM {SCHEMA}.recommendations WHERE id = {int(rec_id)} RETURNING id")
    deleted = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not deleted:
        return json_response({"error": "Рекомендация не найдена"}, 404)

    return json_response({"success": True, "message": "Рекомендация удалена"})


# ─── СДЕЛКИ (ESCROW) ──────────────────────────────────────────────────────────

ESCROW_STATUSES = ("pending", "frozen", "completed", "cancelled", "refunded")

ESCROW_STATUS_LABELS = {
    "pending": "Ожидает",
    "frozen": "Заморожена",
    "completed": "Завершена",
    "cancelled": "Отменена",
    "refunded": "Возврат",
}


def handle_escrow(query: dict) -> dict:
    """
    Возвращает список сделок с поиском, фильтром по статусу, пагинацией.
    Параметры: search, status, page, limit
    """
    search = query.get("search", "").strip()
    status = query.get("status", "").strip()
    page = max(1, int(query.get("page", 1)))
    limit = min(50, max(1, int(query.get("limit", 20))))
    offset = (page - 1) * limit

    conditions = []
    if search:
        safe = search.replace("'", "''")
        conditions.append(
            f"(LOWER(COALESCE(e.request_name,'')) LIKE LOWER('%{safe}%') "
            f"OR LOWER(COALESCE(e.tenant_email,'')) LIKE LOWER('%{safe}%') "
            f"OR LOWER(COALESCE(e.tenant_name,'')) LIKE LOWER('%{safe}%') "
            f"OR LOWER(COALESCE(e.recommender_email,'')) LIKE LOWER('%{safe}%') "
            f"OR LOWER(COALESCE(e.recommender_name,'')) LIKE LOWER('%{safe}%'))"
        )
    if status and status in ESCROW_STATUSES:
        conditions.append(f"e.status = '{status}'")

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.escrow_transactions e {where}")
    total = cur.fetchone()[0]

    cur.execute(f"""
        SELECT
            e.id, e.request_name, e.status,
            e.tenant_name, e.tenant_email,
            e.recommender_name, e.recommender_email,
            e.rent_amount, e.commission_amount,
            e.created_at, e.completed_at,
            e.chat_id, e.recommendation_id
        FROM {SCHEMA}.escrow_transactions e
        {where}
        ORDER BY e.created_at DESC
        LIMIT {limit} OFFSET {offset}
    """)
    rows = cur.fetchall()

    # Суммарная статистика по суммам
    cur.execute(f"""
        SELECT
            COALESCE(SUM(CASE WHEN status = 'frozen' THEN commission_amount ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN status = 'completed' THEN commission_amount ELSE 0 END), 0),
            COALESCE(SUM(commission_amount), 0)
        FROM {SCHEMA}.escrow_transactions
    """)
    sums = cur.fetchone()

    cur.close()
    conn.close()

    transactions = []
    for row in rows:
        transactions.append({
            "id": row[0],
            "request_name": row[1],
            "status": row[2],
            "tenant_name": row[3],
            "tenant_email": row[4],
            "recommender_name": row[5],
            "recommender_email": row[6],
            "rent_amount": float(row[7]),
            "commission_amount": float(row[8]),
            "created_at": str(row[9]) if row[9] else None,
            "completed_at": str(row[10]) if row[10] else None,
            "chat_id": row[11],
            "recommendation_id": row[12],
        })

    return json_response({
        "transactions": transactions,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 1,
        "summary": {
            "frozen_amount": float(sums[0]),
            "completed_amount": float(sums[1]),
            "total_amount": float(sums[2]),
        },
    })


def handle_escrow_detail(query: dict) -> dict:
    """Возвращает детальную карточку сделки по id"""
    escrow_id = query.get("id", "")
    if not escrow_id or not str(escrow_id).isdigit():
        return json_response({"error": "Укажите корректный id сделки"}, 400)

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"""
        SELECT
            e.id, e.request_name, e.status,
            e.tenant_name, e.tenant_email,
            e.recommender_name, e.recommender_email,
            e.rent_amount, e.commission_amount,
            e.created_at, e.completed_at,
            e.chat_id, e.recommendation_id
        FROM {SCHEMA}.escrow_transactions e
        WHERE e.id = {int(escrow_id)}
    """)
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return json_response({"error": "Сделка не найдена"}, 404)

    # Формируем историю смены статусов (на основе дат)
    history = []
    history.append({
        "status": "frozen" if row[2] != "pending" else "pending",
        "label": "Сделка создана",
        "date": str(row[9]) if row[9] else None,
    })
    if row[2] == "completed" and row[10]:
        history.append({
            "status": "completed",
            "label": ESCROW_STATUS_LABELS["completed"],
            "date": str(row[10]),
        })
    elif row[2] == "cancelled":
        history.append({
            "status": "cancelled",
            "label": ESCROW_STATUS_LABELS["cancelled"],
            "date": str(row[10]) if row[10] else None,
        })
    elif row[2] == "refunded":
        history.append({
            "status": "refunded",
            "label": ESCROW_STATUS_LABELS["refunded"],
            "date": str(row[10]) if row[10] else None,
        })

    return json_response({
        "transaction": {
            "id": row[0],
            "request_name": row[1],
            "status": row[2],
            "tenant_name": row[3],
            "tenant_email": row[4],
            "recommender_name": row[5],
            "recommender_email": row[6],
            "rent_amount": float(row[7]),
            "commission_amount": float(row[8]),
            "created_at": str(row[9]) if row[9] else None,
            "completed_at": str(row[10]) if row[10] else None,
            "chat_id": row[11],
            "recommendation_id": row[12],
            "history": history,
        }
    })


def handle_update_escrow_status(body: dict) -> dict:
    """
    Ручная смена статуса сделки администратором.
    body: { escrow_id: int, status: str }
    Важно: не затрагивает логику основного escrow-api (email-уведомления и пр.)
    Используется только для административной коррекции.
    """
    escrow_id = body.get("escrow_id")
    new_status = body.get("status", "")

    if not escrow_id or not isinstance(escrow_id, int):
        return json_response({"error": "Укажите escrow_id"}, 400)
    if new_status not in ESCROW_STATUSES:
        return json_response({"error": f"Статус должен быть одним из: {', '.join(ESCROW_STATUSES)}"}, 400)

    # При завершении/отмене фиксируем дату
    completed_at_sql = ""
    if new_status in ("completed", "cancelled", "refunded"):
        completed_at_sql = ", completed_at = NOW()"
    elif new_status in ("pending", "frozen"):
        completed_at_sql = ", completed_at = NULL"

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"""
        UPDATE {SCHEMA}.escrow_transactions
        SET status = '{new_status}'{completed_at_sql}
        WHERE id = {int(escrow_id)}
        RETURNING id
    """)
    updated = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not updated:
        return json_response({"error": "Сделка не найдена"}, 404)

    return json_response({
        "success": True,
        "message": f"Статус сделки изменён на «{ESCROW_STATUS_LABELS.get(new_status, new_status)}»",
    })


# ─── ОТЗЫВЫ ───────────────────────────────────────────────────────────────────

def handle_reviews(query: dict) -> dict:
    """
    Возвращает список отзывов с поиском, фильтром по рейтингу, пагинацией.
    Параметры: search, rating, page, limit
    """
    search = query.get("search", "").strip()
    rating = query.get("rating", "").strip()
    page = max(1, int(query.get("page", 1)))
    limit = min(50, max(1, int(query.get("limit", 20))))
    offset = (page - 1) * limit

    conditions = []
    if search:
        safe = search.replace("'", "''")
        conditions.append(
            f"(LOWER(COALESCE(reviewer_name,'')) LIKE LOWER('%{safe}%') "
            f"OR LOWER(COALESCE(reviewer_email,'')) LIKE LOWER('%{safe}%') "
            f"OR LOWER(COALESCE(reviewee_name,'')) LIKE LOWER('%{safe}%') "
            f"OR LOWER(COALESCE(comment,'')) LIKE LOWER('%{safe}%'))"
        )
    if rating and rating.isdigit() and 1 <= int(rating) <= 5:
        conditions.append(f"rating = {int(rating)}")

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.reviews {where}")
    total = cur.fetchone()[0]

    cur.execute(f"""
        SELECT
            id, reviewer_name, reviewer_email, reviewer_photo,
            reviewee_name, reviewee_email, reviewee_photo,
            rating, comment, created_at,
            chat_id, recommendation_id
        FROM {SCHEMA}.reviews
        {where}
        ORDER BY created_at DESC
        LIMIT {limit} OFFSET {offset}
    """)
    rows = cur.fetchall()

    # Средний рейтинг
    cur.execute(f"SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) FROM {SCHEMA}.reviews")
    avg_rating = float(cur.fetchone()[0])

    cur.close()
    conn.close()

    reviews = []
    for row in rows:
        reviews.append({
            "id": row[0],
            "reviewer_name": row[1],
            "reviewer_email": row[2],
            "reviewer_photo": row[3],
            "reviewee_name": row[4],
            "reviewee_email": row[5],
            "reviewee_photo": row[6],
            "rating": row[7],
            "comment": row[8],
            "created_at": str(row[9]) if row[9] else None,
            "chat_id": row[10],
            "recommendation_id": row[11],
        })

    return json_response({
        "reviews": reviews,
        "total": total,
        "avg_rating": avg_rating,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 1,
    })


def handle_delete_review(body: dict) -> dict:
    """
    Удаляет отзыв по id.
    body: { review_id: int }
    """
    review_id = body.get("review_id")
    if not review_id or not isinstance(review_id, int):
        return json_response({"error": "Укажите review_id"}, 400)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"DELETE FROM {SCHEMA}.reviews WHERE id = {int(review_id)} RETURNING id")
    deleted = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not deleted:
        return json_response({"error": "Отзыв не найден"}, 404)

    return json_response({"success": True, "message": "Отзыв удалён"})


# ─── ОБРАТНАЯ СВЯЗЬ ───────────────────────────────────────────────────────────

def handle_feedback(query: dict) -> dict:
    """
    Возвращает список обращений обратной связи с фильтром по статусу и пагинацией.
    Параметры: status (new|read|replied|all), search, page, limit
    """
    status = query.get("status", "all").strip()
    search = query.get("search", "").strip()
    page = max(1, int(query.get("page", 1)))
    limit = min(50, max(1, int(query.get("limit", 20))))
    offset = (page - 1) * limit

    conditions = []
    if search:
        safe = search.replace("'", "''")
        conditions.append(
            f"(LOWER(COALESCE(email,'')) LIKE LOWER('%{safe}%') "
            f"OR LOWER(COALESCE(message,'')) LIKE LOWER('%{safe}%') "
            f"OR LOWER(COALESCE(subject_type,'')) LIKE LOWER('%{safe}%'))"
        )
    if status and status != "all":
        safe_status = status.replace("'", "''")
        conditions.append(f"status = '{safe_status}'")

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.feedback_messages {where}")
    total = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.feedback_messages WHERE status = 'new'")
    unread_count = cur.fetchone()[0]

    cur.execute(f"""
        SELECT id, email, subject_type, message, status, admin_reply, replied_at, created_at
        FROM {SCHEMA}.feedback_messages
        {where}
        ORDER BY created_at DESC
        LIMIT {limit} OFFSET {offset}
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    messages = []
    for row in rows:
        messages.append({
            "id": row[0],
            "email": row[1],
            "subject_type": row[2],
            "message": row[3],
            "status": row[4],
            "admin_reply": row[5],
            "replied_at": str(row[6]) if row[6] else None,
            "created_at": str(row[7]) if row[7] else None,
        })

    return json_response({
        "messages": messages,
        "total": total,
        "unread_count": unread_count,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 1,
    })


def handle_mark_feedback_read(body: dict) -> dict:
    """
    Помечает обращение как прочитанное.
    body: { feedback_id: int }
    """
    feedback_id = body.get("feedback_id")
    if not feedback_id or not isinstance(feedback_id, int):
        return json_response({"error": "Укажите feedback_id"}, 400)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"""
        UPDATE {SCHEMA}.feedback_messages
        SET status = 'read'
        WHERE id = {int(feedback_id)} AND status = 'new'
        RETURNING id
    """)
    updated = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    return json_response({"success": True, "updated": updated is not None})


def handle_reply_feedback(body: dict) -> dict:
    """
    Отправляет ответ на email пользователя и помечает обращение как отвеченное.
    body: { feedback_id: int, reply: str }
    """
    feedback_id = body.get("feedback_id")
    reply_text = (body.get("reply") or "").strip()

    if not feedback_id or not isinstance(feedback_id, int):
        return json_response({"error": "Укажите feedback_id"}, 400)
    if not reply_text:
        return json_response({"error": "Текст ответа не может быть пустым"}, 400)

    # Получаем исходное обращение
    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"""
        SELECT id, email, subject_type, message
        FROM {SCHEMA}.feedback_messages
        WHERE id = {int(feedback_id)}
    """)
    row = cur.fetchone()

    if not row:
        cur.close()
        conn.close()
        return json_response({"error": "Обращение не найдено"}, 404)

    user_email = row[1]
    subject_type = row[2]
    original_message = row[3]

    # Отправляем email
    smtp_user = os.environ.get("SMTP_USER")
    smtp_password = os.environ.get("SMTP_PASSWORD")

    if not smtp_user or not smtp_password:
        cur.close()
        conn.close()
        return json_response({"error": "SMTP не настроен"}, 500)

    safe_reply = reply_text.replace("'", "''")

    msg = MIMEMultipart("alternative")
    msg["From"] = smtp_user
    msg["To"] = user_email
    msg["Subject"] = f"Re: [{subject_type}] Ваше обращение в SovetPay"
    msg["Reply-To"] = smtp_user

    text_body = f"Здравствуйте!\n\nОтвет на ваше обращение:\n\n{reply_text}\n\n---\nВаше обращение:\n{original_message}"
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #202020; margin-bottom: 8px;">Ответ на ваше обращение</h2>
      <p style="color: #666; font-size: 14px; margin-bottom: 20px;">Команда SovetPay</p>
      <div style="border-left: 3px solid #3b82f6; padding-left: 16px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 15px; color: #333; white-space: pre-wrap;">{reply_text}</p>
      </div>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 16px;">
        <p style="margin: 0 0 8px; font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.05em;">Ваше обращение</p>
        <p style="margin: 0; font-size: 13px; color: #666; white-space: pre-wrap;">{original_message}</p>
      </div>
    </div>
    """

    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)

    # Обновляем запись в БД
    cur.execute(f"""
        UPDATE {SCHEMA}.feedback_messages
        SET status = 'replied',
            admin_reply = '{safe_reply}',
            replied_at = NOW()
        WHERE id = {int(feedback_id)}
    """)
    conn.commit()
    cur.close()
    conn.close()

    return json_response({"success": True, "message": f"Ответ отправлен на {user_email}"})


# ─── АНАЛИТИКА ────────────────────────────────────────────────────────────────

def handle_analytics() -> dict:
    """
    Расширенная аналитика платформы:
    - По городам: количество заявок
    - Конверсия: заявки → рекомендации → сделки
    - Средний бюджет (из заявок) и средняя сумма аренды (из сделок)
    - Распределение по типу жилья
    - Распределение по сроку аренды
    - Динамика заявок и регистраций по месяцам (последние 12 месяцев)
    - Распределение пользователей по роли
    """
    conn = get_db()
    cur = conn.cursor()

    # --- Города: топ-10 по заявкам ---
    cur.execute(f"""
        SELECT city, COUNT(*) AS cnt
        FROM {SCHEMA}.requests
        WHERE city IS NOT NULL AND city != ''
        GROUP BY city
        ORDER BY cnt DESC
        LIMIT 10
    """)
    cities_rows = cur.fetchall()
    cities = [{"city": row[0], "count": row[1]} for row in cities_rows]

    # --- Конверсия ---
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.requests")
    total_requests = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.recommendations WHERE status != 'deleted'")
    total_recommendations = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.escrow_transactions WHERE status != 'cancelled'")
    total_escrow = cur.fetchone()[0]

    req_to_rec = round(total_recommendations / total_requests * 100, 1) if total_requests > 0 else 0
    rec_to_deal = round(total_escrow / total_recommendations * 100, 1) if total_recommendations > 0 else 0
    req_to_deal = round(total_escrow / total_requests * 100, 1) if total_requests > 0 else 0

    # --- Средний бюджет из заявок ---
    cur.execute(f"""
        SELECT COALESCE(ROUND(AVG(mid_budget), 0), 0)
        FROM (
            SELECT
                CASE
                    WHEN budget_min ~ '^[0-9]+$' AND budget_max ~ '^[0-9]+$'
                    THEN (budget_min::numeric + budget_max::numeric) / 2
                    WHEN budget_min ~ '^[0-9]+$' THEN budget_min::numeric
                    WHEN budget_max ~ '^[0-9]+$' THEN budget_max::numeric
                END AS mid_budget
            FROM {SCHEMA}.requests
            WHERE budget_min IS NOT NULL OR budget_max IS NOT NULL
        ) AS t
        WHERE mid_budget IS NOT NULL
    """)
    avg_budget = float(cur.fetchone()[0])

    # --- Средние суммы из сделок ---
    cur.execute(f"""
        SELECT
            COALESCE(ROUND(AVG(rent_amount), 0), 0),
            COALESCE(ROUND(AVG(commission_amount), 0), 0)
        FROM {SCHEMA}.escrow_transactions
        WHERE status = 'completed'
    """)
    escrow_avgs = cur.fetchone()
    avg_rent = float(escrow_avgs[0])
    avg_commission = float(escrow_avgs[1])

    # --- Типы жилья ---
    cur.execute(f"""
        SELECT housing_type, COUNT(*) AS cnt
        FROM {SCHEMA}.requests
        WHERE housing_type IS NOT NULL AND housing_type != ''
        GROUP BY housing_type
        ORDER BY cnt DESC
    """)
    housing_rows = cur.fetchall()
    housing_types = [{"type": row[0], "count": row[1]} for row in housing_rows]

    # --- Сроки аренды ---
    cur.execute(f"""
        SELECT rental_period, COUNT(*) AS cnt
        FROM {SCHEMA}.requests
        WHERE rental_period IS NOT NULL AND rental_period != ''
        GROUP BY rental_period
        ORDER BY cnt DESC
    """)
    period_rows = cur.fetchall()
    rental_periods = [{"period": row[0], "count": row[1]} for row in period_rows]

    # --- Динамика по месяцам (последние 12) ---
    cur.execute(f"""
        SELECT
            TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
            COUNT(*) AS cnt
        FROM {SCHEMA}.requests
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) ASC
    """)
    req_monthly = [{"month": row[0], "requests": row[1]} for row in cur.fetchall()]

    cur.execute(f"""
        SELECT
            TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
            COUNT(*) AS cnt
        FROM {SCHEMA}.users
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) ASC
    """)
    users_monthly = [{"month": row[0], "users": row[1]} for row in cur.fetchall()]

    # Объединяем в единый список месяцев
    months_map: dict = {}
    for item in req_monthly:
        months_map[item["month"]] = {"month": item["month"], "requests": item["requests"], "users": 0}
    for item in users_monthly:
        if item["month"] in months_map:
            months_map[item["month"]]["users"] = item["users"]
        else:
            months_map[item["month"]] = {"month": item["month"], "requests": 0, "users": item["users"]}
    monthly_dynamics = sorted(months_map.values(), key=lambda x: x["month"])

    # --- Роли пользователей ---
    cur.execute(f"""
        SELECT role, COUNT(*) AS cnt
        FROM {SCHEMA}.users
        GROUP BY role
        ORDER BY cnt DESC
    """)
    roles_rows = cur.fetchall()
    user_roles = [{"role": row[0], "count": row[1]} for row in roles_rows]

    cur.close()
    conn.close()

    return json_response({
        "cities": cities,
        "conversion": {
            "total_requests": total_requests,
            "total_recommendations": total_recommendations,
            "total_escrow": total_escrow,
            "req_to_rec_pct": req_to_rec,
            "rec_to_deal_pct": rec_to_deal,
            "req_to_deal_pct": req_to_deal,
        },
        "averages": {
            "avg_budget": avg_budget,
            "avg_rent": avg_rent,
            "avg_commission": avg_commission,
        },
        "housing_types": housing_types,
        "rental_periods": rental_periods,
        "monthly_dynamics": monthly_dynamics,
        "user_roles": user_roles,
    })