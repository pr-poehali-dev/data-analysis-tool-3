import json
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from typing import Dict, Any
from auth_utils import require_auth, auth_error_response, set_request_origin, get_cors_headers

MAX_BODY_SIZE = 15 * 1024 * 1024
MAX_FILE_BASE64_LENGTH = int(10 * 1024 * 1024 * 4 / 3) + 100
CONTRACT_PER_EMAIL_LIMIT = 5
CONTRACT_PER_EMAIL_WINDOW = 3600


def _cors():
    h = get_cors_headers()
    h['Access-Control-Max-Age'] = '86400'
    return h


def _get_schema():
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return f"{schema}." if schema else ""


def _check_rate_limit(key, action, max_attempts, window_seconds):
    """Проверка лимита запросов. Возвращает (превышен, осталось_секунд). Fail-open при ошибке БД."""
    try:
        import psycopg2
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        try:
            S = _get_schema()
            cur = conn.cursor()

            cur.execute(f"""
                DELETE FROM {S}rate_limits
                WHERE action = %s AND created_at < NOW() - INTERVAL '{int(window_seconds)} seconds'
            """, (action,))

            cur.execute(f"""
                SELECT COUNT(*) FROM {S}rate_limits
                WHERE key = %s AND action = %s
                  AND created_at > NOW() - INTERVAL '{int(window_seconds)} seconds'
            """, (key, action))
            count = cur.fetchone()[0]

            if count >= max_attempts:
                cur.execute(f"""
                    SELECT EXTRACT(EPOCH FROM (MIN(created_at) + INTERVAL '{int(window_seconds)} seconds' - NOW()))::int
                    FROM {S}rate_limits
                    WHERE key = %s AND action = %s
                      AND created_at > NOW() - INTERVAL '{int(window_seconds)} seconds'
                """, (key, action))
                remaining = cur.fetchone()[0] or window_seconds
                conn.commit()
                return True, max(remaining, 1)

            cur.execute(f"""
                INSERT INTO {S}rate_limits (key, action, created_at)
                VALUES (%s, %s, NOW())
            """, (key, action))
            conn.commit()
            return False, 0
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    except Exception as e:
        print(f"Rate limit check error (fail-open): {e}")
        return False, 0


def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    '''Отправка договора аренды на email — только для авторизованных пользователей'''
    set_request_origin(event)

    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': _cors(), 'body': '', 'isBase64Encoded': False}

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': _cors(),
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }

    try:
        auth_email = require_auth(event)

        limited, wait = _check_rate_limit(auth_email, 'contract_email', CONTRACT_PER_EMAIL_LIMIT, CONTRACT_PER_EMAIL_WINDOW)
        if limited:
            return {
                'statusCode': 429,
                'headers': _cors(),
                'body': json.dumps({
                    'error': f'Слишком много отправок. Повторите через {wait // 60 + 1} мин.',
                    'retryAfter': wait
                }),
                'isBase64Encoded': False
            }

        body_str = event.get('body', '{}')
        if body_str and len(body_str) > MAX_BODY_SIZE:
            return {
                'statusCode': 400,
                'headers': _cors(),
                'body': json.dumps({'error': 'Тело запроса слишком большое. Максимум 15 МБ'}),
                'isBase64Encoded': False
            }

        body = json.loads(body_str)
        recipient_email = body.get('email')
        file_content_base64 = body.get('fileContent')
        file_name = body.get('fileName', 'Договор_аренды.docx')

        if not recipient_email or not file_content_base64:
            return {
                'statusCode': 400,
                'headers': _cors(),
                'body': json.dumps({'error': 'Email и содержимое файла обязательны'}),
                'isBase64Encoded': False
            }

        if len(file_content_base64) > MAX_FILE_BASE64_LENGTH:
            size_mb = round(len(file_content_base64) * 3 / 4 / 1024 / 1024, 1)
            return {
                'statusCode': 400,
                'headers': _cors(),
                'body': json.dumps({'error': f'Файл слишком большой ({size_mb} МБ). Максимум 10 МБ'}),
                'isBase64Encoded': False
            }

        import base64
        file_content = base64.b64decode(file_content_base64)

        smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        sender_email = os.environ.get('SMTP_USER')
        sender_password = os.environ.get('SMTP_PASSWORD')

        if not sender_email or not sender_password:
            return {
                'statusCode': 500,
                'headers': _cors(),
                'body': json.dumps({'error': 'SMTP credentials not configured'}),
                'isBase64Encoded': False
            }

        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = 'Договор аренды жилого помещения'

        email_body = '''
Здравствуйте!

Во вложении вы найдете договор аренды жилого помещения.

С уважением,
Система управления документами
        '''

        msg.attach(MIMEText(email_body, 'plain', 'utf-8'))

        part = MIMEBase('application', 'vnd.openxmlformats-officedocument.wordprocessingml.document')
        part.set_payload(file_content)
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', 'attachment', filename=file_name)
        msg.attach(part)

        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)

        return {
            'statusCode': 200,
            'headers': _cors(),
            'body': json.dumps({
                'success': True,
                'message': f'Договор успешно отправлен на {recipient_email}'
            }),
            'isBase64Encoded': False
        }

    except PermissionError as e:
        return auth_error_response(401, str(e))
    except Exception as e:
        print(f'Ошибка при отправке email: {str(e)}')
        return {
            'statusCode': 500,
            'headers': _cors(),
            'body': json.dumps({'error': f'Не удалось отправить email: {str(e)}'}),
            'isBase64Encoded': False
        }