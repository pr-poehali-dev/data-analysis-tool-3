from utils import get_db, json_response, SCHEMA


def handle_analytics() -> dict:
    """
    Расширенная аналитика платформы:
    - По городам: количество заявок
    - Конверсия: доля заявок с рекомендацией, доля рекомендаций со сделкой, доля заявок со сделкой
    - Средний бюджет (из заявок) и средняя сумма аренды (из сделок)
    - Распределение по типу жилья
    - Распределение по сроку аренды
    - Динамика заявок и регистраций по месяцам (последние 12 месяцев)
    - Распределение пользователей по роли
    """
    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"""
        SELECT city, COUNT(*) AS cnt
        FROM {SCHEMA}.requests
        WHERE city IS NOT NULL AND city != ''
        GROUP BY city
        ORDER BY cnt DESC
        LIMIT 10
    """)
    cities = [{"city": row[0], "count": row[1]} for row in cur.fetchall()]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.requests")
    total_requests = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.recommendations WHERE status != 'deleted'")
    total_recommendations = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.escrow_transactions WHERE status != 'cancelled'")
    total_escrow = cur.fetchone()[0]

    cur.execute(f"""
        SELECT COUNT(DISTINCT rec.request_id)
        FROM {SCHEMA}.recommendations rec
        JOIN {SCHEMA}.requests r ON r.id::text = rec.request_id
        WHERE rec.status != 'deleted'
    """)
    requests_with_rec = cur.fetchone()[0]

    cur.execute(f"""
        SELECT COUNT(DISTINCT rec.id)
        FROM {SCHEMA}.escrow_transactions e
        JOIN {SCHEMA}.recommendations rec ON rec.id::text = e.recommendation_id
        WHERE e.status != 'cancelled' AND rec.status != 'deleted'
    """)
    recs_with_deal = cur.fetchone()[0]

    cur.execute(f"""
        SELECT COUNT(DISTINCT r.id)
        FROM {SCHEMA}.escrow_transactions e
        JOIN {SCHEMA}.recommendations rec ON rec.id::text = e.recommendation_id
        JOIN {SCHEMA}.requests r ON r.id::text = rec.request_id
        WHERE e.status != 'cancelled' AND rec.status != 'deleted'
    """)
    requests_with_deal = cur.fetchone()[0]

    def pct(part: int, whole: int) -> float:
        return round(part / whole * 100, 1) if whole > 0 else 0

    req_to_rec = pct(requests_with_rec, total_requests)
    rec_to_deal = pct(recs_with_deal, total_recommendations)
    req_to_deal = pct(requests_with_deal, total_requests)

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

    cur.execute(f"""
        SELECT housing_type, COUNT(*) AS cnt
        FROM {SCHEMA}.requests
        WHERE housing_type IS NOT NULL AND housing_type != ''
        GROUP BY housing_type
        ORDER BY cnt DESC
    """)
    housing_types = [{"type": row[0], "count": row[1]} for row in cur.fetchall()]

    cur.execute(f"""
        SELECT rental_period, COUNT(*) AS cnt
        FROM {SCHEMA}.requests
        WHERE rental_period IS NOT NULL AND rental_period != ''
        GROUP BY rental_period
        ORDER BY cnt DESC
    """)
    rental_periods = [{"period": row[0], "count": row[1]} for row in cur.fetchall()]

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

    months_map: dict = {}
    for item in req_monthly:
        months_map[item["month"]] = {"month": item["month"], "requests": item["requests"], "users": 0}
    for item in users_monthly:
        if item["month"] in months_map:
            months_map[item["month"]]["users"] = item["users"]
        else:
            months_map[item["month"]] = {"month": item["month"], "requests": 0, "users": item["users"]}
    monthly_dynamics = sorted(months_map.values(), key=lambda x: x["month"])

    cur.execute(f"""
        SELECT role, COUNT(*) AS cnt
        FROM {SCHEMA}.users
        GROUP BY role
        ORDER BY cnt DESC
    """)
    user_roles = [{"role": row[0], "count": row[1]} for row in cur.fetchall()]

    cur.close()
    conn.close()

    return json_response({
        "cities": cities,
        "conversion": {
            "total_requests": total_requests,
            "total_recommendations": total_recommendations,
            "total_escrow": total_escrow,
            "requests_with_rec": requests_with_rec,
            "recs_with_deal": recs_with_deal,
            "requests_with_deal": requests_with_deal,
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
