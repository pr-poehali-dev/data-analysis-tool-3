from utils import get_db, json_response, SCHEMA


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
