import json
import os
import random
import time
import hashlib

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
    '''Отправка SMS-кода верификации на номер телефона'''
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

        if not phone:
            return {
                'statusCode': 400,
                'headers': _cors(),
                'body': json.dumps({'error': 'Phone number is required'}),
                'isBase64Encoded': False
            }

        code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        code_hash = hashlib.sha256(f"{phone}:{code}".encode()).hexdigest()
        timestamp = int(time.time())

        print(f"SMS Code for {phone}: {code}")
        print(f"Code hash: {code_hash}")
        print(f"Timestamp: {timestamp}")

        return {
            'statusCode': 200,
            'headers': _cors(),
            'body': json.dumps({
                'success': True,
                'message': 'SMS code sent successfully',
                'codeHash': code_hash,
                'expiresAt': timestamp + 300,
                'devCode': code
            }),
            'isBase64Encoded': False
        }

    except Exception as e:
        print(f"Error in sms-send: {str(e)}")
        return {
            'statusCode': 500,
            'headers': _cors(),
            'body': json.dumps({'error': 'Internal server error'}),
            'isBase64Encoded': False
        }
