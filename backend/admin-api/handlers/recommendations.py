from utils import get_db, audit_log, json_response, SCHEMA

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
    params = []
    if search:
        conditions.append(
            "(LOWER(COALESCE(rec.address,'')) LIKE LOWER(%s) "
            "OR LOWER(COALESCE(rec.request_name,'')) LIKE LOWER(%s) "
            "OR LOWER(COALESCE(rec.owner_email,'')) LIKE LOWER(%s))"
        )
        like = f"%{search}%"
        params.extend([like, like, like])
    if status and status in REC_STATUSES:
        conditions.append("rec.status = %s")
        params.append(status)

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.recommendations rec {where}", params)
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
    """, params)
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
        WHERE rec.id = %s
    """, (int(rec_id),))
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
        SET status = %s, updated_at = NOW()
        WHERE id = %s
        RETURNING id
    """, (new_status, int(rec_id)))
    updated = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not updated:
        return json_response({"error": "Рекомендация не найдена"}, 404)

    audit_log("update_rec_status", "recommendation", rec_id, {"status": new_status})
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
    cur.execute(f"DELETE FROM {SCHEMA}.recommendations WHERE id = %s RETURNING id", (int(rec_id),))
    deleted = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not deleted:
        return json_response({"error": "Рекомендация не найдена"}, 404)

    audit_log("delete_recommendation", "recommendation", rec_id, {})
    return json_response({"success": True, "message": "Рекомендация удалена"})
