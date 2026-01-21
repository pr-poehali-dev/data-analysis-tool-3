import json
import os
import random
import time
import hashlib

def handler(event: dict, context) -> dict:
    '''Отправка SMS-кода верификации на номер телефона'''
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

        if not phone:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
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
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'message': 'SMS code sent successfully',
                'codeHash': code_hash,
                'expiresAt': timestamp + 300,
                'devCode': code if os.environ.get('ENVIRONMENT') == 'development' else None
            }),
            'isBase64Encoded': False
        }

    except Exception as e:
        print(f"Error in sms-send: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'}),
            'isBase64Encoded': False
        }
