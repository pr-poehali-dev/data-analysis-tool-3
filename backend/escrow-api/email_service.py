"""Отправка email-уведомлений об эскроу-сделках."""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


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
