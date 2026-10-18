from utils import parse_pagination, is_id, get_db, audit_log, json_response, SCHEMA, to_utc_iso, user_match


def handle_users(query: dict) -> dict:
    """
    Возвращает список пользователей с поиском, фильтрацией по роли/статусу, пагинацией.
    Параметры: search, role, status (all|active|blocked), page, limit
    """
    search = query.get("search", "").strip()
    role = query.get("role", "").strip()
    status = query.get("status", "all").strip()
    page, limit = parse_pagination(query, 20, 50)
    offset = (page - 1) * limit

    conditions = []
    params = []
    if search:
        conditions.append(
            "(LOWER(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')) LIKE LOWER(%s) "
            "OR LOWER(COALESCE(name,'')) LIKE LOWER(%s) "
            "OR LOWER(COALESCE(email,'')) LIKE LOWER(%s) "
            "OR LOWER(COALESCE(phone,'')) LIKE LOWER(%s))"
        )
        like = f"%{search}%"
        params.extend([like, like, like, like])
    if role:
        conditions.append("role = %s")
        params.append(role)
    if status == "active":
        conditions.append("is_blocked = false")
    elif status == "blocked":
        conditions.append("is_blocked = true")

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users {where}", params)
    total = cur.fetchone()[0]

    cur.execute(f"""
        WITH page AS (
            SELECT
                id, email, first_name, last_name, name, phone, city, role,
                avatar_url, is_blocked, blocked_at, blocked_reason,
                created_at, last_login_at, telegram_id
            FROM {SCHEMA}.users u
            {where}
            ORDER BY created_at DESC, id DESC
            LIMIT {limit} OFFSET {offset}
        ),
        req AS (
            SELECT p.id AS uid, COUNT(*) AS cnt
            FROM page p
            JOIN {SCHEMA}.requests r ON {user_match("r.user_email", "p")}
            GROUP BY p.id
        ),
        rec AS (
            SELECT p.id AS uid, COUNT(*) AS cnt
            FROM page p
            JOIN {SCHEMA}.recommendations x ON {user_match("x.user_id", "p")}
            GROUP BY p.id
        )
        SELECT
            p.id, p.email, p.first_name, p.last_name, p.name, p.phone, p.city, p.role,
            p.avatar_url, p.is_blocked, p.blocked_at, p.blocked_reason,
            p.created_at, p.last_login_at,
            COALESCE(req.cnt, 0) AS requests_count,
            COALESCE(rec.cnt, 0) AS recommendations_count
        FROM page p
        LEFT JOIN req ON req.uid = p.id
        LEFT JOIN rec ON rec.uid = p.id
        ORDER BY p.created_at DESC, p.id DESC
    """, params)
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
            "blocked_at": to_utc_iso(row[10]),
            "blocked_reason": row[11],
            "created_at": to_utc_iso(row[12]),
            "last_login_at": to_utc_iso(row[13]),
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
    if not user_id or not is_id(user_id):
        return json_response({"error": "Укажите корректный id пользователя"}, 400)

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"""
        SELECT
            id, email, first_name, last_name, name, phone, city, role,
            avatar_url, is_blocked, blocked_at, blocked_reason,
            created_at, last_login_at,
            telegram_username, vk_link, email_verified,
            (SELECT COUNT(*) FROM {SCHEMA}.requests r WHERE {user_match("r.user_email")}) AS requests_count,
            (SELECT COUNT(*) FROM {SCHEMA}.recommendations rec WHERE {user_match("rec.user_id")}) AS recommendations_count,
            (SELECT COUNT(*) FROM {SCHEMA}.reviews rev WHERE rev.reviewer_email = u.email) AS reviews_count
        FROM {SCHEMA}.users u
        WHERE id = %s
    """, (int(user_id),))
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
            "blocked_at": to_utc_iso(row[10]),
            "blocked_reason": row[11],
            "created_at": to_utc_iso(row[12]),
            "last_login_at": to_utc_iso(row[13]),
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

    if not user_id or not isinstance(user_id, int) or isinstance(user_id, bool) or not is_id(user_id):
        return json_response({"error": "Укажите user_id"}, 400)
    if block is None:
        return json_response({"error": "Укажите block (true/false)"}, 400)

    conn = get_db()
    cur = conn.cursor()

    if block:
        cur.execute(f"""
            UPDATE {SCHEMA}.users
            SET is_blocked = true,
                blocked_at = NOW(),
                blocked_reason = %s
            WHERE id = %s
            RETURNING id
        """, (str(reason) if reason else "", int(user_id)))
    else:
        cur.execute(f"""
            UPDATE {SCHEMA}.users
            SET is_blocked = false,
                blocked_at = NULL,
                blocked_reason = NULL
            WHERE id = %s
            RETURNING id
        """, (int(user_id),))

    updated = cur.fetchone()
    revoked = 0
    if updated and block:
        cur.execute(f"DELETE FROM {SCHEMA}.refresh_tokens WHERE user_id = %s", (int(user_id),))
        revoked = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()

    if not updated:
        return json_response({"error": "Пользователь не найден"}, 404)

    action_text = "заблокирован" if block else "разблокирован"
    details = {"reason": reason}
    if block:
        details["sessions_revoked"] = revoked
    audit_log("block_user" if block else "unblock_user", "user", user_id, details)
    return json_response({"success": True, "message": f"Пользователь {action_text}"})