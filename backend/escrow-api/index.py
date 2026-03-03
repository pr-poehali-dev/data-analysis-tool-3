"""API для управления эскроу-транзакциями."""
from utils import CORS_HEADERS, resp
from handlers import handle_list, handle_balance, handle_check_chat, handle_create, handle_update_status


def handler(event, context):
    """CRUD для эскроу-транзакций: создание, список, обновление статуса, баланс."""
    method = event.get('httpMethod', 'GET').upper()

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    if method == 'GET':
        if action == 'list':
            return handle_list(event)
        if action == 'balance':
            return handle_balance(event)
        if action == 'check-chat':
            return handle_check_chat(event)

    if method == 'POST' and action == 'create':
        return handle_create(event)

    if method == 'PUT' and action == 'update-status':
        return handle_update_status(event)

    return resp(404, {'error': f'Unknown action: {action}'})