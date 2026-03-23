import json
import os
import hmac
import hashlib
import base64
import time
import psycopg2

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
    GET  ?action=stats          — общая статистика для дашборда.
    GET  ?action=registrations  — регистрации за последние 30 дней (для графика).
    GET  ?action=activity       — последние действия на платформе.
    GET  ?action=users          — список пользователей с поиском, фильтром, пагинацией.
    GET  ?action=user&id=X      — детальная карточка одного пользователя.
    POST ?action=block_user     — заблокировать/разблокировать пользователя.
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
