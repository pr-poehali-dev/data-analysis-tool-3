import json
import os
import hashlib
import time

_current_origin = '*'


def set_request_origin(event):
    global _current_origin
    allowed = os.environ.get('ALLOWED_ORIGINS', '').strip()
    if not allowed:
        _current_origin = '*'
        return
    origins = [o.strip() for o in allowed.split(',') if o.strip()]
    if not origins:
        _current_origin = '*'
        return
    headers = event.get('headers', {})
    request_origin = headers.get('Origin') or headers.get('origin') or ''
    _current_origin = request_origin if request_origin in origins else origins[0]


def _cors():
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': _current_origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    }


def handler(event: dict, context) -> dict:
    '''Проверка SMS-кода верификации'''
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
        body = json.loads(event.get('body', '{}'))
        phone = body.get('phone', '').strip()
        code = body.get('code', '').strip()
        code_hash = body.get('codeHash', '').strip()
        expires_at = body.get('expiresAt', 0)

        if not phone or not code or not code_hash:
            return {
                'statusCode': 400,
                'headers': _cors(),
                'body': json.dumps({'error': 'Missing required fields'}),
                'isBase64Encoded': False
            }

        if time.time() > expires_at:
            return {
                'statusCode': 400,
                'headers': _cors(),
                'body': json.dumps({'error': 'Code expired', 'valid': False}),
                'isBase64Encoded': False
            }

        expected_hash = hashlib.sha256(f"{phone}:{code}".encode()).hexdigest()

        if expected_hash != code_hash:
            return {
                'statusCode': 400,
                'headers': _cors(),
                'body': json.dumps({'error': 'Invalid code', 'valid': False}),
                'isBase64Encoded': False
            }

        return {
            'statusCode': 200,
            'headers': _cors(),
            'body': json.dumps({
                'success': True,
                'valid': True,
                'message': 'Phone verified successfully'
            }),
            'isBase64Encoded': False
        }

    except Exception as e:
        print(f"Error in sms-verify: {str(e)}")
        return {
            'statusCode': 500,
            'headers': _cors(),
            'body': json.dumps({'error': 'Internal server error'}),
            'isBase64Encoded': False
        }
