import json
import os
import smtplib
import psycopg2
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


SUPPORT_EMAIL = "sovetpay@gmail.com"
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
RATE_LIMIT_MAX = 5
RATE_LIMIT_WINDOW_HOURS = 1


def check_rate_limit(ip: str) -> bool:
    """Возвращает True если лимит не превышен, False если превышен."""
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.rate_limits "
        f"WHERE key = %s AND action = 'send_feedback' "
        f"AND created_at > NOW() - INTERVAL '{RATE_LIMIT_WINDOW_HOURS} hours'",
        (ip,)
    )
    count = cur.fetchone()[0]
    if count < RATE_LIMIT_MAX:
        cur.execute(
            f"INSERT INTO {SCHEMA}.rate_limits (key, action) VALUES (%s, 'send_feedback')",
            (ip,)
        )
        conn.commit()
        cur.close()
        conn.close()
        return True
    cur.close()
    conn.close()
    return False


def save_to_db(email: str, subject_type: str, message: str) -> None:
    """Сохраняет сообщение обратной связи в БД. Ошибки не прерывают основной поток."""
    safe_email = email.replace("'", "''")
    safe_subject = subject_type.replace("'", "''")
    safe_message = message.replace("'", "''")
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.feedback_messages (email, subject_type, message, status) "
        f"VALUES ('{safe_email}', '{safe_subject}', '{safe_message}', 'new')"
    )
    conn.commit()
    cur.close()
    conn.close()


def handler(event: dict, context) -> dict:
    """Отправка обратной связи от пользователя на почту сервиса sovetpay@gmail.com"""

    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Method not allowed'})}

    body = json.loads(event.get('body') or '{}')
    user_email = (body.get('email') or '').strip()
    message = (body.get('message') or '').strip()
    subject_type = (body.get('subject_type') or 'Вопрос').strip()

    if not user_email or not message:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Поля email и message обязательны'})
        }

    ip = (event.get('requestContext') or {}).get('identity', {}).get('sourceIp', 'unknown')
    if not check_rate_limit(ip):
        return {
            'statusCode': 429,
            'headers': headers,
            'body': json.dumps({'error': 'Слишком много запросов. Попробуйте через час.'})
        }

    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')

    if not smtp_user or not smtp_password:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'SMTP не настроен'})
        }

    msg = MIMEMultipart('alternative')
    msg['From'] = smtp_user
    msg['To'] = SUPPORT_EMAIL
    msg['Subject'] = f'[{subject_type}] Обратная связь от {user_email}'
    msg['Reply-To'] = user_email

    text_body = f"Письмо от: {user_email}\n\n{message}"
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #202020; margin-bottom: 8px;">Новое обращение — {subject_type}</h2>
      <p style="color: #666; font-size: 14px; margin-bottom: 20px;">Обратная связь через сайт SovetPay</p>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #333;">
          <strong>Тема:</strong> {subject_type}
        </p>
        <p style="margin: 0; font-size: 14px; color: #333;">
          <strong>Email отправителя:</strong><br/>
          <a href="mailto:{user_email}" style="color: #3b82f6;">{user_email}</a>
        </p>
      </div>
      <div style="border-left: 3px solid #3b82f6; padding-left: 16px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 15px; color: #333; white-space: pre-wrap;">{message}</p>
      </div>
      <p style="color: #999; font-size: 12px;">Ответьте на это письмо или напрямую на {user_email}</p>
    </div>
    """

    msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    # Отправляем email — основная логика, не трогаем
    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)

    # Сохраняем в БД после успешной отправки.
    # Ошибка сохранения не должна ломать ответ пользователю — перехватываем молча.
    try:
        save_to_db(user_email, subject_type, message)
    except Exception:
        pass

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'success': True})
    }