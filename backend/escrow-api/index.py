"""API для управления эскроу-транзакциями."""
from utils import resp, get_escrow_cors_headers
from handlers import handle_list, handle_balance, handle_check_chat, handle_create, handle_update_status
from auth_utils import auth_error_response, set_request_origin


def handler(event, context):
    """CRUD для эскроу-транзакций: создание, список, обновление статуса, баланс."""
    set_request_origin(event)

    method = event.get('httpMethod', 'GET').upper()

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': get_escrow_cors_headers(), 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    try:
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
    except PermissionError as e:
        return auth_error_response(401, str(e))