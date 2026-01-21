import json
import hashlib
import time

def handler(event: dict, context) -> dict:
    '''Проверка SMS-кода верификации'''
    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
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
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Missing required fields'}),
                'isBase64Encoded': False
            }

        if time.time() > expires_at:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Code expired', 'valid': False}),
                'isBase64Encoded': False
            }

        expected_hash = hashlib.sha256(f"{phone}:{code}".encode()).hexdigest()

        if expected_hash != code_hash:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Invalid code', 'valid': False}),
                'isBase64Encoded': False
            }

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
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
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'}),
            'isBase64Encoded': False
        }
