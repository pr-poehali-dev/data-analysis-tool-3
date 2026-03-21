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
    GET /stats — общая статистика для дашборда.
    GET /registrations — регистрации за последние 30 дней (для графика).
    GET /activity — последние действия на платформе.
    """
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    # Проверяем токен администратора
    headers = event.get("headers") or {}
    token = headers.get("X-Admin-Token") or headers.get("x-admin-token") or ""
    if not verify_admin_token(token):
        return json_response({"error": "Доступ запрещён"}, 403)

    query = event.get("queryStringParameters") or {}
    action = query.get("action", "")

    if action == "stats":
        return handle_stats()
    elif action == "registrations":
        return handle_registrations()
    elif action == "activity":
        return handle_activity()

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

    # Новые пользователи
    cur.execute(f"""
        SELECT 'user' AS type, id, COALESCE(first_name || ' ' || last_name, name, email) AS title,
               'Новый пользователь' AS action, created_at
        FROM {SCHEMA}.users
        ORDER BY created_at DESC LIMIT 7
    """)
    users_rows = cur.fetchall()

    # Новые заявки
    cur.execute(f"""
        SELECT 'request' AS type, id, name AS title,
               'Новая заявка' AS action, created_at
        FROM {SCHEMA}.requests
        ORDER BY created_at DESC LIMIT 7
    """)
    requests_rows = cur.fetchall()

    # Новые рекомендации
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