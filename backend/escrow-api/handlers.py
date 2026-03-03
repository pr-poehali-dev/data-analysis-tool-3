"""Обработчики эскроу-транзакций."""
import json
from utils import get_conn, get_schema, resp, tx_row_to_dict, TX_COLUMNS
from email_service import notify_escrow_status
from auth_utils import require_auth


def handle_list(event):
    auth_email = require_auth(event)

    S = get_schema()
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT {TX_COLUMNS}
            FROM {S}escrow_transactions
            WHERE tenant_email = %s OR recommender_email = %s
            ORDER BY created_at DESC
        """, (auth_email, auth_email))
        rows = cur.fetchall()
        return resp(200, {'transactions': [tx_row_to_dict(r) for r in rows]})
    finally:
        conn.close()


def handle_balance(event):
    auth_email = require_auth(event)

    S = get_schema()
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT
                COALESCE(SUM(CASE WHEN status = 'frozen' AND recommender_email = %s THEN commission_amount ELSE 0 END), 0) as frozen,
                COALESCE(SUM(CASE WHEN status = 'completed' AND recommender_email = %s THEN commission_amount ELSE 0 END), 0) as completed,
                COALESCE(SUM(CASE WHEN status = 'frozen' AND tenant_email = %s THEN commission_amount ELSE 0 END), 0) as pending,
                COALESCE(SUM(CASE WHEN status = 'completed' AND tenant_email = %s THEN commission_amount ELSE 0 END), 0) as sent
            FROM {S}escrow_transactions
            WHERE tenant_email = %s OR recommender_email = %s
        """, (auth_email, auth_email, auth_email, auth_email, auth_email, auth_email))
        row = cur.fetchone()
        return resp(200, {
            'frozen': float(row[0]),
            'completed': float(row[1]),
            'pending': float(row[2]),
            'sent': float(row[3]),
        })
    finally:
        conn.close()


def handle_check_chat(event):
    auth_email = require_auth(event)

    params = event.get('queryStringParameters') or {}
    chat_id = params.get('chatId', '')
    if not chat_id:
        return resp(400, {'error': 'chatId обязателен'})

    S = get_schema()
    conn = get_conn()
    try:
        cur = conn.cursor()

        cur.execute(f"SELECT recommender_email, tenant_email FROM {S}chats WHERE id = %s", (int(chat_id),))
        chat_row = cur.fetchone()
        if not chat_row or auth_email not in (chat_row[0], chat_row[1]):
            return resp(403, {'error': 'Нет доступа к этому чату'})

        cur.execute(f"""
            SELECT id, status, commission_amount FROM {S}escrow_transactions
            WHERE chat_id = %s
            AND status IN ('frozen', 'completed', 'pending')
            ORDER BY created_at DESC LIMIT 1
        """, (chat_id,))
        row = cur.fetchone()
        if row:
            return resp(200, {'hasActive': True, 'transactionId': str(row[0]), 'status': row[1], 'commissionAmount': float(row[2])})
        return resp(200, {'hasActive': False})
    finally:
        conn.close()


def handle_create(event):
    auth_email = require_auth(event)
    body = json.loads(event.get('body', '{}'))

    if auth_email not in (body.get('tenantEmail'), body.get('recommenderEmail')):
        return resp(403, {'error': 'Нет доступа'})

    required = ['requestName', 'tenantEmail', 'tenantName', 'recommenderEmail', 'recommenderName']
    for field in required:
        if not body.get(field):
            return resp(400, {'error': f'{field} обязателен'})

    S = get_schema()
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            INSERT INTO {S}escrow_transactions
                (chat_id, recommendation_id, request_name, tenant_email, tenant_name,
                 recommender_email, recommender_name, rent_amount, commission_amount, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'frozen')
            RETURNING id, created_at
        """, (
            body.get('chatId', ''),
            body.get('recommendationId', ''),
            body['requestName'],
            body['tenantEmail'],
            body['tenantName'],
            body['recommenderEmail'],
            body['recommenderName'],
            float(body.get('rentAmount', 0)),
            float(body.get('commissionAmount', 0)),
        ))
        row = cur.fetchone()
        conn.commit()
        return resp(201, {
            'id': str(row[0]),
            'createdAt': row[1].isoformat(),
            'status': 'frozen'
        })
    finally:
        conn.close()


def handle_update_status(event):
    auth_email = require_auth(event)
    body = json.loads(event.get('body', '{}'))
    tx_id = body.get('id')
    new_status = body.get('status')
    if not tx_id or not new_status:
        return resp(400, {'error': 'id и status обязательны'})

    allowed = ['pending', 'frozen', 'completed', 'cancelled', 'refunded']
    if new_status not in allowed:
        return resp(400, {'error': f'Недопустимый статус. Допустимые: {", ".join(allowed)}'})

    completed_sql = ", completed_at = CURRENT_TIMESTAMP" if new_status == 'completed' else ""

    S = get_schema()
    conn = get_conn()
    try:
        cur = conn.cursor()

        cur.execute(f"""
            SELECT tenant_email, recommender_email FROM {S}escrow_transactions WHERE id = %s
        """, (int(tx_id),))
        tx_row = cur.fetchone()
        if not tx_row:
            return resp(404, {'error': 'Транзакция не найдена'})
        if auth_email not in (tx_row[0], tx_row[1]):
            return resp(403, {'error': 'Нет доступа к этой транзакции'})

        cur.execute(f"""
            UPDATE {S}escrow_transactions
            SET status = %s{completed_sql}
            WHERE id = %s
            RETURNING id, status, completed_at, recommender_email, recommender_name, tenant_name, request_name, commission_amount
        """, (new_status, int(tx_id)))
        row = cur.fetchone()
        conn.commit()
        if not row:
            return resp(404, {'error': 'Транзакция не найдена'})

        if new_status in ('completed', 'cancelled'):
            try:
                notify_escrow_status(
                    recommender_email=row[3],
                    recommender_name=row[4],
                    tenant_name=row[5],
                    request_name=row[6],
                    commission=float(row[7]),
                    new_status=new_status
                )
            except Exception as e:
                print(f"Failed to send notification: {e}")

        return resp(200, {
            'id': str(row[0]),
            'status': row[1],
            'completedAt': row[2].isoformat() if row[2] else None,
        })
    finally:
        conn.close()
