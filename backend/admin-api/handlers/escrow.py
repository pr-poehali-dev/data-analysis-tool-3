from utils import get_db, audit_log, json_response, SCHEMA

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
    params = []
    if search:
        conditions.append(
            "(LOWER(COALESCE(e.request_name,'')) LIKE LOWER(%s) "
            "OR LOWER(COALESCE(e.tenant_email,'')) LIKE LOWER(%s) "
            "OR LOWER(COALESCE(e.tenant_name,'')) LIKE LOWER(%s) "
            "OR LOWER(COALESCE(e.recommender_email,'')) LIKE LOWER(%s) "
            "OR LOWER(COALESCE(e.recommender_name,'')) LIKE LOWER(%s))"
        )
        like = f"%{search}%"
        params.extend([like, like, like, like, like])
    if status and status in ESCROW_STATUSES:
        conditions.append("e.status = %s")
        params.append(status)

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.escrow_transactions e {where}", params)
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
    """, params)
    rows = cur.fetchall()

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
        WHERE e.id = %s
    """, (int(escrow_id),))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return json_response({"error": "Сделка не найдена"}, 404)

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
    """
    escrow_id = body.get("escrow_id")
    new_status = body.get("status", "")

    if not escrow_id or not isinstance(escrow_id, int):
        return json_response({"error": "Укажите escrow_id"}, 400)
    if new_status not in ESCROW_STATUSES:
        return json_response({"error": f"Статус должен быть одним из: {', '.join(ESCROW_STATUSES)}"}, 400)

    completed_at_sql = ""
    if new_status in ("completed", "cancelled", "refunded"):
        completed_at_sql = ", completed_at = NOW()"
    elif new_status in ("pending", "frozen"):
        completed_at_sql = ", completed_at = NULL"

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"""
        UPDATE {SCHEMA}.escrow_transactions
        SET status = %s{completed_at_sql}
        WHERE id = %s
        RETURNING id
    """, (new_status, int(escrow_id)))
    updated = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not updated:
        return json_response({"error": "Сделка не найдена"}, 404)

    audit_log("update_escrow_status", "escrow", escrow_id, {"status": new_status})
    return json_response({
        "success": True,
        "message": f"Статус сделки изменён на «{ESCROW_STATUS_LABELS.get(new_status, new_status)}»",
    })
