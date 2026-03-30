from utils import get_db, json_response, SCHEMA


def handle_audit_log(query: dict) -> dict:
    """
    Возвращает журнал действий администратора с пагинацией и фильтром по типу действия.
    Параметры: action_filter, page, limit
    """
    action_filter = query.get("action_filter", "all").strip()
    page = max(1, int(query.get("page", 1)))
    limit = min(100, max(1, int(query.get("limit", 50))))
    offset = (page - 1) * limit

    conditions = []
    params = []
    if action_filter and action_filter != "all":
        conditions.append("action = %s")
        params.append(action_filter)

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.admin_audit_log {where}", params)
    total = cur.fetchone()[0]

    cur.execute(f"""
        SELECT id, action, entity_type, entity_id, details, created_at
        FROM {SCHEMA}.admin_audit_log
        {where}
        ORDER BY created_at DESC
        LIMIT {limit} OFFSET {offset}
    """, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    entries = []
    for row in rows:
        entries.append({
            "id": row[0],
            "action": row[1],
            "entity_type": row[2],
            "entity_id": row[3],
            "details": row[4] if row[4] else {},
            "created_at": str(row[5]) if row[5] else None,
        })

    return json_response({
        "entries": entries,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 1,
    })
