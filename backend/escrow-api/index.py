"""API для управления эскроу-транзакциями."""
import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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


def send_escrow_email(to_email, subject, html_body, text_body):
    smtp_host = os.environ.get('SMTP_HOST', os.environ.get('SMTP_SERVER', 'smtp.gmail.com'))
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER', os.environ.get('SENDER_EMAIL', ''))
    smtp_password = os.environ.get('SMTP_PASSWORD', os.environ.get('SENDER_PASSWORD', ''))
    smtp_from = os.environ.get('SMTP_FROM', smtp_user)

    if not smtp_user or not smtp_password:
        return False

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = smtp_from
    msg['To'] = to_email
    msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_from, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Email send error: {e}")
        return False


def notify_escrow_status(recommender_email, recommender_name, tenant_name, request_name, commission, new_status):
    amount_str = f"{commission:,.0f}".replace(",", " ")

    if new_status == 'completed':
        subject = "Сделка подтверждена — вознаграждение переведено"
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
                <h2 style="color: #166534; margin: 0 0 8px 0;">Сделка подтверждена!</h2>
                <p style="color: #15803d; font-size: 14px; margin: 0;">Арендатор {tenant_name} подтвердил сделку</p>
            </div>
            <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px;">
                <p style="margin: 4px 0; font-size: 14px;"><b>Заявка:</b> {request_name}</p>
                <p style="margin: 4px 0; font-size: 14px;"><b>Вознаграждение:</b> {amount_str} ₽</p>
            </div>
            <p style="margin-top: 16px; font-size: 14px; color: #6b7280;">
                Средства {amount_str} ₽ переведены на ваш счёт. Спасибо за рекомендацию!
            </p>
        </div>
        """
        text_body = f"Сделка подтверждена! Арендатор {tenant_name} подтвердил сделку по заявке «{request_name}». Вознаграждение {amount_str} ₽ переведено на ваш счёт."

    elif new_status == 'cancelled':
        subject = "Сделка отменена"
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 24px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 12px;">❌</div>
                <h2 style="color: #991b1b; margin: 0 0 8px 0;">Сделка отменена</h2>
                <p style="color: #dc2626; font-size: 14px; margin: 0;">Арендатор {tenant_name} отменил сделку</p>
            </div>
            <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px;">
                <p style="margin: 4px 0; font-size: 14px;"><b>Заявка:</b> {request_name}</p>
                <p style="margin: 4px 0; font-size: 14px;"><b>Сумма вознаграждения:</b> {amount_str} ₽</p>
            </div>
            <p style="margin-top: 16px; font-size: 14px; color: #6b7280;">
                Средства возвращены арендатору. Если у вас есть вопросы, свяжитесь с арендатором через чат.
            </p>
        </div>
        """
        text_body = f"Сделка отменена. Арендатор {tenant_name} отменил сделку по заявке «{request_name}». Средства {amount_str} ₽ возвращены арендатору."
    else:
        return

    send_escrow_email(recommender_email, subject, html_body, text_body)


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
                RETURNING id, status, completed_at, recommender_email, recommender_name, tenant_name, request_name, commission_amount
            """)
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

    return resp(404, {'error': f'Unknown action: {action}'})