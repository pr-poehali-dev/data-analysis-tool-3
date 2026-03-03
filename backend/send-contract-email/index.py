import json
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from typing import Dict, Any
from auth_utils import require_auth, auth_error_response

CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
    'Access-Control-Max-Age': '86400',
}


def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    '''Отправка договора аренды на email — только для авторизованных пользователей'''

    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': '', 'isBase64Encoded': False}

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }

    try:
        auth_email = require_auth(event)

        body = json.loads(event.get('body', '{}'))
        recipient_email = body.get('email')
        file_content_base64 = body.get('fileContent')
        file_name = body.get('fileName', 'Договор_аренды.docx')

        if not recipient_email or not file_content_base64:
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'Email и содержимое файла обязательны'}),
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
                'headers': CORS_HEADERS,
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
            'headers': CORS_HEADERS,
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
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': f'Не удалось отправить email: {str(e)}'}),
            'isBase64Encoded': False
        }
