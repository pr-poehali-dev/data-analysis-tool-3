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


def _cors():
    h = get_cors_headers()
    h['Access-Control-Max-Age'] = '86400'
    return h


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