import json
import sys
import os

# Добавляем текущую директорию в путь для импортов модулей
sys.path.insert(0, os.path.dirname(__file__))

from utils import get_cors_headers, verify_admin_token, json_response, set_current_event
from handlers.dashboard import handle_stats, handle_registrations, handle_activity
from handlers.users import handle_users, handle_user, handle_block_user
from handlers.requests import handle_requests, handle_request, handle_update_request_status, handle_delete_request
from handlers.recommendations import handle_recommendations, handle_recommendation, handle_update_rec_status, handle_delete_recommendation
from handlers.escrow import handle_escrow, handle_escrow_detail, handle_update_escrow_status
from handlers.reviews import handle_reviews, handle_delete_review
from handlers.feedback import handle_feedback, handle_mark_feedback_read, handle_reply_feedback
from handlers.analytics import handle_analytics
from handlers.audit import handle_audit_log


def handler(event: dict, context) -> dict:
    """
    Единая точка входа для всех запросов администратора.
    Требует заголовок X-Admin-Token с валидным JWT.
    GET  ?action=stats                  — общая статистика для дашборда.
    GET  ?action=registrations          — регистрации за последние 30 дней (для графика).
    GET  ?action=activity               — последние действия на платформе.
    GET  ?action=users                  — список пользователей с поиском, фильтром, пагинацией.
    GET  ?action=user&id=X              — детальная карточка одного пользователя.
    POST ?action=block_user             — заблокировать/разблокировать пользователя.
    GET  ?action=requests               — список заявок с поиском, фильтром, пагинацией.
    GET  ?action=request&id=X           — детальная карточка заявки.
    POST ?action=update_request_status  — изменить статус заявки.
    POST ?action=delete_request         — удалить заявку.
    GET  ?action=recommendations        — список рекомендаций с поиском, фильтром, пагинацией.
    GET  ?action=recommendation&id=X    — детальная карточка рекомендации.
    POST ?action=update_rec_status      — изменить статус рекомендации.
    POST ?action=delete_recommendation  — удалить рекомендацию.
    GET  ?action=escrow                 — список сделок с поиском, фильтром по статусу, пагинацией.
    GET  ?action=escrow_detail&id=X     — детальная карточка сделки с историей.
    POST ?action=update_escrow_status   — ручная смена статуса сделки администратором.
    GET  ?action=reviews                — список отзывов с поиском, фильтром по рейтингу, пагинацией.
    POST ?action=delete_review          — удалить отзыв.
    GET  ?action=feedback               — список обращений обратной связи с фильтром/пагинацией.
    POST ?action=mark_feedback_read     — пометить обращение как прочитанное.
    POST ?action=reply_feedback         — ответить на обращение по email и пометить прочитанным.
    GET  ?action=analytics              — расширенная аналитика.
    GET  ?action=audit_log              — журнал административных действий.
    """
    set_current_event(event)

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": get_cors_headers(event), "body": ""}

    headers = event.get("headers") or {}
    token = headers.get("X-Admin-Token") or headers.get("x-admin-token") or ""
    if not verify_admin_token(token):
        return json_response({"error": "Доступ запрещён"}, 403)

    query = event.get("queryStringParameters") or {}
    action = query.get("action", "")
    method = event.get("httpMethod", "GET")

    if action == "stats":
        return handle_stats()
    elif action == "registrations":
        return handle_registrations()
    elif action == "activity":
        return handle_activity()
    elif action == "users":
        return handle_users(query)
    elif action == "user":
        return handle_user(query)
    elif action == "block_user" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        return handle_block_user(body)
    elif action == "requests":
        return handle_requests(query)
    elif action == "request":
        return handle_request(query)
    elif action == "update_request_status" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        return handle_update_request_status(body)
    elif action == "delete_request" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        return handle_delete_request(body)
    elif action == "recommendations":
        return handle_recommendations(query)
    elif action == "recommendation":
        return handle_recommendation(query)
    elif action == "update_rec_status" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        return handle_update_rec_status(body)
    elif action == "delete_recommendation" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        return handle_delete_recommendation(body)
    elif action == "escrow":
        return handle_escrow(query)
    elif action == "escrow_detail":
        return handle_escrow_detail(query)
    elif action == "update_escrow_status" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        return handle_update_escrow_status(body)
    elif action == "reviews":
        return handle_reviews(query)
    elif action == "delete_review" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        return handle_delete_review(body)
    elif action == "feedback":
        return handle_feedback(query)
    elif action == "mark_feedback_read" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        return handle_mark_feedback_read(body)
    elif action == "reply_feedback" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        return handle_reply_feedback(body)
    elif action == "analytics":
        return handle_analytics()
    elif action == "audit_log":
        return handle_audit_log(query)

    return json_response({"error": "Укажите параметр action"}, 400)
