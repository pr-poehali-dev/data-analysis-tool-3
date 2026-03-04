"""API для управления заявками на аренду."""
import json
from utils import response
from handlers import handle_list, handle_create, handle_update, handle_delete
from auth_utils import auth_error_response


def handler(event, context):
    """API для управления заявками на аренду."""
    if event.get('httpMethod') == 'OPTIONS':
        return response(200, {})

    method = event.get('httpMethod', 'GET')

    try:
        if method == 'GET':
            return handle_list(event)
        elif method == 'POST':
            return handle_create(event)
        elif method == 'PUT':
            return handle_update(event)
        elif method == 'DELETE':
            return handle_delete(event)
        else:
            return response(405, {'error': 'Метод не поддерживается'})
    except ValueError as e:
        return response(400, {'error': str(e)})
    except json.JSONDecodeError:
        return response(400, {'error': 'Некорректный JSON'})
    except PermissionError as e:
        return auth_error_response(401, str(e))
    except Exception as e:
        print(f"Ошибка: {e}")
        return response(500, {'error': 'Внутренняя ошибка сервера'})