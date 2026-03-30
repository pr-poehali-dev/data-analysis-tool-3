from utils import get_db, audit_log, json_response, SCHEMA

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
    params = []
    if search:
        conditions.append(
            "(LOWER(COALESCE(r.name,'')) LIKE LOWER(%s) "
            "OR LOWER(COALESCE(r.city,'')) LIKE LOWER(%s) "
            "OR LOWER(COALESCE(r.user_email,'')) LIKE LOWER(%s))"
        )
        like = f"%{search}%"
        params.extend([like, like, like])
    if status and status in REQUEST_STATUSES:
        conditions.append("r.status = %s")
        params.append(status)

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.requests r {where}", params)
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
    """, params)
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
        WHERE r.id = %s
    """, (int(req_id),))
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
            "districts": row[18],
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
        SET status = %s, updated_at = NOW()
        WHERE id = %s
        RETURNING id
    """, (new_status, int(req_id)))
    updated = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not updated:
        return json_response({"error": "Заявка не найдена"}, 404)

    audit_log("update_request_status", "request", req_id, {"status": new_status})
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
    cur.execute(f"DELETE FROM {SCHEMA}.requests WHERE id = %s RETURNING id", (int(req_id),))
    deleted = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not deleted:
        return json_response({"error": "Заявка не найдена"}, 404)

    audit_log("delete_request", "request", req_id, {})
    return json_response({"success": True, "message": "Заявка удалена"})
