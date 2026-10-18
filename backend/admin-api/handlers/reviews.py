from utils import user_match, short_title, is_id, parse_pagination, get_db, audit_log, json_response, SCHEMA, to_utc_iso


def handle_reviews(query: dict) -> dict:
    """
    Возвращает список отзывов с поиском, фильтром по рейтингу, пагинацией.
    Параметры: search, rating, page, limit
    """
    search = query.get("search", "").strip()
    rating = query.get("rating", "").strip()
    page, limit = parse_pagination(query, 20, 50)
    offset = (page - 1) * limit

    conditions = []
    params = []
    if search:
        conditions.append(
            "(LOWER(COALESCE(rv.reviewer_name,'')) LIKE LOWER(%s) "
            "OR LOWER(COALESCE(rv.reviewer_email,'')) LIKE LOWER(%s) "
            "OR LOWER(COALESCE(rv.reviewee_name,'')) LIKE LOWER(%s) "
            "OR LOWER(COALESCE(rv.comment,'')) LIKE LOWER(%s))"
        )
        like = f"%{search}%"
        params.extend([like, like, like, like])
    if rating and rating.isdigit() and 1 <= int(rating) <= 5:
        conditions.append("rv.rating = %s")
        params.append(int(rating))

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.reviews rv {where}", params)
    total = cur.fetchone()[0]

    cur.execute(f"""
        SELECT
            rv.id, rv.reviewer_name, rv.reviewer_email, rv.reviewer_photo,
            rv.reviewee_name, rv.reviewee_email, rv.reviewee_photo,
            rv.rating, rv.comment, rv.created_at,
            rv.chat_id, rv.recommendation_id,
            (SELECT u.tz FROM {SCHEMA}.users u WHERE {user_match("rv.reviewer_email")} ORDER BY u.id LIMIT 1) AS reviewer_tz
        FROM {SCHEMA}.reviews rv
        {where}
        ORDER BY rv.created_at DESC, rv.id DESC
        LIMIT {limit} OFFSET {offset}
    """, params)
    rows = cur.fetchall()

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
            "created_at": to_utc_iso(row[9]),
            "chat_id": row[10],
            "recommendation_id": row[11],
            "reviewer_tz": row[12],
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
    if not review_id or not isinstance(review_id, int) or isinstance(review_id, bool) or not is_id(review_id):
        return json_response({"error": "Укажите review_id"}, 400)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"DELETE FROM {SCHEMA}.reviews WHERE id = %s RETURNING id, reviewer_name, reviewee_name, rating", (int(review_id),))
    deleted = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not deleted:
        return json_response({"error": "Отзыв не найден"}, 404)

    audit_log("delete_review", "review", review_id, {
        "title": short_title(f"{deleted[1] or 'Без имени'} → {deleted[2] or 'Без имени'}, оценка {deleted[3]}"),
    })
    return json_response({"success": True, "message": "Отзыв удалён"})