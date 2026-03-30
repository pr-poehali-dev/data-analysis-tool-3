import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from utils import get_db, audit_log, json_response, SCHEMA


def handle_feedback(query: dict) -> dict:
    """
    Возвращает список обращений обратной связи с фильтром по статусу и пагинацией.
    Параметры: status (new|read|replied|all), search, page, limit
    """
    status = query.get("status", "all").strip()
    search = query.get("search", "").strip()
    page = max(1, int(query.get("page", 1)))
    limit = min(50, max(1, int(query.get("limit", 20))))
    offset = (page - 1) * limit

    conditions = []
    params = []
    if search:
        conditions.append(
            "(LOWER(COALESCE(email,'')) LIKE LOWER(%s) "
            "OR LOWER(COALESCE(message,'')) LIKE LOWER(%s) "
            "OR LOWER(COALESCE(subject_type,'')) LIKE LOWER(%s))"
        )
        like = f"%{search}%"
        params.extend([like, like, like])
    if status and status != "all":
        conditions.append("status = %s")
        params.append(status)

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.feedback_messages {where}", params)
    total = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.feedback_messages WHERE status = 'new'")
    unread_count = cur.fetchone()[0]

    cur.execute(f"""
        SELECT id, email, subject_type, message, status, admin_reply, replied_at, created_at
        FROM {SCHEMA}.feedback_messages
        {where}
        ORDER BY created_at DESC
        LIMIT {limit} OFFSET {offset}
    """, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    messages = []
    for row in rows:
        messages.append({
            "id": row[0],
            "email": row[1],
            "subject_type": row[2],
            "message": row[3],
            "status": row[4],
            "admin_reply": row[5],
            "replied_at": str(row[6]) if row[6] else None,
            "created_at": str(row[7]) if row[7] else None,
        })

    return json_response({
        "messages": messages,
        "total": total,
        "unread_count": unread_count,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 1,
    })


def handle_mark_feedback_read(body: dict) -> dict:
    """
    Помечает обращение как прочитанное.
    body: { feedback_id: int }
    """
    feedback_id = body.get("feedback_id")
    if not feedback_id or not isinstance(feedback_id, int):
        return json_response({"error": "Укажите feedback_id"}, 400)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"""
        UPDATE {SCHEMA}.feedback_messages
        SET status = 'read'
        WHERE id = %s AND status = 'new'
        RETURNING id
    """, (int(feedback_id),))
    updated = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if updated:
        audit_log("mark_feedback_read", "feedback", feedback_id, {})
    return json_response({"success": True, "updated": updated is not None})


def handle_reply_feedback(body: dict) -> dict:
    """
    Отправляет ответ на email пользователя и помечает обращение как отвеченное.
    body: { feedback_id: int, reply: str }
    """
    feedback_id = body.get("feedback_id")
    reply_text = (body.get("reply") or "").strip()

    if not feedback_id or not isinstance(feedback_id, int):
        return json_response({"error": "Укажите feedback_id"}, 400)
    if not reply_text:
        return json_response({"error": "Текст ответа не может быть пустым"}, 400)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"""
        SELECT id, email, subject_type, message
        FROM {SCHEMA}.feedback_messages
        WHERE id = %s
    """, (int(feedback_id),))
    row = cur.fetchone()

    if not row:
        cur.close()
        conn.close()
        return json_response({"error": "Обращение не найдено"}, 404)

    user_email = row[1]
    subject_type = row[2]
    original_message = row[3]

    smtp_user = os.environ.get("SMTP_USER")
    smtp_password = os.environ.get("SMTP_PASSWORD")

    if not smtp_user or not smtp_password:
        cur.close()
        conn.close()
        return json_response({"error": "SMTP не настроен"}, 500)

    msg = MIMEMultipart("alternative")
    msg["From"] = smtp_user
    msg["To"] = user_email
    msg["Subject"] = f"Re: [{subject_type}] Ваше обращение в SovetPay"
    msg["Reply-To"] = smtp_user

    text_body = f"Здравствуйте!\n\nОтвет на ваше обращение:\n\n{reply_text}\n\n---\nВаше обращение:\n{original_message}"
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #202020; margin-bottom: 8px;">Ответ на ваше обращение</h2>
      <p style="color: #666; font-size: 14px; margin-bottom: 20px;">Команда SovetPay</p>
      <div style="border-left: 3px solid #3b82f6; padding-left: 16px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 15px; color: #333; white-space: pre-wrap;">{reply_text}</p>
      </div>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 16px;">
        <p style="margin: 0 0 8px; font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.05em;">Ваше обращение</p>
        <p style="margin: 0; font-size: 13px; color: #666; white-space: pre-wrap;">{original_message}</p>
      </div>
    </div>
    """

    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)

    cur.execute(f"""
        UPDATE {SCHEMA}.feedback_messages
        SET status = 'replied',
            admin_reply = %s,
            replied_at = NOW()
        WHERE id = %s
    """, (reply_text, int(feedback_id)))
    conn.commit()
    cur.close()
    conn.close()

    audit_log("reply_feedback", "feedback", feedback_id, {"email": user_email})
    return json_response({"success": True, "message": f"Ответ отправлен на {user_email}"})
