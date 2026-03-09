import json
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


SUPPORT_EMAIL = "sovetpay@gmail.com"


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

    if not user_email or not message:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Поля email и message обязательны'})
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
    msg['Subject'] = f'Обратная связь от {user_email}'
    msg['Reply-To'] = user_email

    text_body = f"Письмо от: {user_email}\n\n{message}"
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #202020; margin-bottom: 8px;">Новое обращение</h2>
      <p style="color: #666; font-size: 14px; margin-bottom: 20px;">Обратная связь через сайт SovetPay</p>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
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

    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'success': True})
    }
