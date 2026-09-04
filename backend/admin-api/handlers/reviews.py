from utils import get_db, audit_log, json_response, SCHEMA, to_utc_iso


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
    params = []
    if search:
        conditions.append(
            "(LOWER(COALESCE(reviewer_name,'')) LIKE LOWER(%s) "
            "OR LOWER(COALESCE(reviewer_email,'')) LIKE LOWER(%s) "
            "OR LOWER(COALESCE(reviewee_name,'')) LIKE LOWER(%s) "
            "OR LOWER(COALESCE(comment,'')) LIKE LOWER(%s))"
        )
        like = f"%{search}%"
        params.extend([like, like, like, like])
    if rating and rating.isdigit() and 1 <= int(rating) <= 5:
        conditions.append("rating = %s")
        params.append(int(rating))

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.reviews {where}", params)
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
    cur.execute(f"DELETE FROM {SCHEMA}.reviews WHERE id = %s RETURNING id", (int(review_id),))
    deleted = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not deleted:
        return json_response({"error": "Отзыв не найден"}, 404)

    audit_log("delete_review", "review", review_id, {})
    return json_response({"success": True, "message": "Отзыв удалён"})