"""API для управления эскроу-транзакциями."""
import json
import os
import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_schema():
    schema = os.environ.get('DB_SCHEMA', '')
    return f"{schema}." if schema else ""

def resp(status, body):
    return {'statusCode': status, 'headers': CORS_HEADERS, 'body': json.dumps(body, default=str)}


def handler(event, context):
    """CRUD для эскроу-транзакций: создание, список, обновление статуса, баланс."""
    method = event.get('httpMethod', 'GET').upper()

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    S = get_schema()

    if method == 'GET' and action == 'list':
        email = params.get('email', '')
        if not email:
            return resp(400, {'error': 'email обязателен'})

        conn = get_conn()
        try:
            cur = conn.cursor()
            cur.execute(f"""
                SELECT id, chat_id, recommendation_id, request_name,
                       tenant_email, tenant_name, recommender_email, recommender_name,
                       rent_amount, commission_amount, status, created_at, completed_at
                FROM {S}escrow_transactions
                WHERE tenant_email = '{email}' OR recommender_email = '{email}'
                ORDER BY created_at DESC
            """)
            rows = cur.fetchall()
            transactions = []
            for r in rows:
                transactions.append({
                    'id': str(r[0]),
                    'chatId': r[1] or '',
                    'recommendationId': r[2] or '',
                    'requestName': r[3],
                    'tenantEmail': r[4],
                    'tenantName': r[5],
                    'recommenderEmail': r[6],
                    'recommenderName': r[7],
                    'rentAmount': float(r[8]),
                    'commissionAmount': float(r[9]),
                    'status': r[10],
                    'createdAt': r[11].isoformat() if r[11] else None,
                    'completedAt': r[12].isoformat() if r[12] else None,
                })
            return resp(200, {'transactions': transactions})
        finally:
            conn.close()

    if method == 'GET' and action == 'balance':
        email = params.get('email', '')
        if not email:
            return resp(400, {'error': 'email обязателен'})

        conn = get_conn()
        try:
            cur = conn.cursor()
            cur.execute(f"""
                SELECT
                    COALESCE(SUM(CASE WHEN status = 'frozen' AND recommender_email = '{email}' THEN commission_amount ELSE 0 END), 0) as frozen,
                    COALESCE(SUM(CASE WHEN status = 'completed' AND recommender_email = '{email}' THEN commission_amount ELSE 0 END), 0) as completed,
                    COALESCE(SUM(CASE WHEN status = 'frozen' AND tenant_email = '{email}' THEN commission_amount ELSE 0 END), 0) as pending,
                    COALESCE(SUM(CASE WHEN status = 'completed' AND tenant_email = '{email}' THEN commission_amount ELSE 0 END), 0) as sent
                FROM {S}escrow_transactions
                WHERE tenant_email = '{email}' OR recommender_email = '{email}'
            """)
            row = cur.fetchone()
            return resp(200, {
                'frozen': float(row[0]),
                'completed': float(row[1]),
                'pending': float(row[2]),
                'sent': float(row[3]),
            })
        finally:
            conn.close()

    if method == 'GET' and action == 'check-chat':
        chat_id = params.get('chatId', '')
        if not chat_id:
            return resp(400, {'error': 'chatId обязателен'})

        conn = get_conn()
        try:
            cur = conn.cursor()
            cur.execute(f"""
                SELECT id, status, commission_amount FROM {S}escrow_transactions
                WHERE chat_id = '{chat_id.replace("'", "''")}'
                AND status IN ('frozen', 'completed', 'pending')
                ORDER BY created_at DESC LIMIT 1
            """)
            row = cur.fetchone()
            if row:
                return resp(200, {'hasActive': True, 'transactionId': str(row[0]), 'status': row[1], 'commissionAmount': float(row[2])})
            return resp(200, {'hasActive': False})
        finally:
            conn.close()

    if method == 'POST' and action == 'create':
        body = json.loads(event.get('body', '{}'))
        required = ['requestName', 'tenantEmail', 'tenantName', 'recommenderEmail', 'recommenderName']
        for field in required:
            if not body.get(field):
                return resp(400, {'error': f'{field} обязателен'})

        conn = get_conn()
        try:
            cur = conn.cursor()
            cur.execute(f"""
                INSERT INTO {S}escrow_transactions
                    (chat_id, recommendation_id, request_name, tenant_email, tenant_name,
                     recommender_email, recommender_name, rent_amount, commission_amount, status)
                VALUES ('{body.get('chatId', '')}', '{body.get('recommendationId', '')}',
                        '{body['requestName'].replace("'", "''")}',
                        '{body['tenantEmail']}', '{body['tenantName'].replace("'", "''")}',
                        '{body['recommenderEmail']}', '{body['recommenderName'].replace("'", "''")}',
                        {float(body.get('rentAmount', 0))}, {float(body.get('commissionAmount', 0))},
                        'frozen')
                RETURNING id, created_at
            """)
            row = cur.fetchone()
            conn.commit()
            return resp(201, {
                'id': str(row[0]),
                'createdAt': row[1].isoformat(),
                'status': 'frozen'
            })
        finally:
            conn.close()

    if method == 'PUT' and action == 'update-status':
        body = json.loads(event.get('body', '{}'))
        tx_id = body.get('id')
        new_status = body.get('status')
        if not tx_id or not new_status:
            return resp(400, {'error': 'id и status обязательны'})

        allowed = ['pending', 'frozen', 'completed', 'cancelled', 'refunded']
        if new_status not in allowed:
            return resp(400, {'error': f'Недопустимый статус. Допустимые: {", ".join(allowed)}'})

        completed_sql = ", completed_at = CURRENT_TIMESTAMP" if new_status == 'completed' else ""

        conn = get_conn()
        try:
            cur = conn.cursor()
            cur.execute(f"""
                UPDATE {S}escrow_transactions
                SET status = '{new_status}'{completed_sql}
                WHERE id = {int(tx_id)}
                RETURNING id, status, completed_at
            """)
            row = cur.fetchone()
            conn.commit()
            if not row:
                return resp(404, {'error': 'Транзакция не найдена'})
            return resp(200, {
                'id': str(row[0]),
                'status': row[1],
                'completedAt': row[2].isoformat() if row[2] else None,
            })
        finally:
            conn.close()

    return resp(404, {'error': f'Unknown action: {action}'})