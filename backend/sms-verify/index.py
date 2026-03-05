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


def _get_schema():
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return f"{schema}." if schema else ""


def _check_rate_limit(key, action, max_attempts, window_seconds):
    """Проверка лимита запросов. Возвращает (превышен, осталось_секунд). Fail-open при ошибке БД."""
    try:
        import psycopg2
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        try:
            S = _get_schema()
            cur = conn.cursor()

            cur.execute(f"""
                DELETE FROM {S}rate_limits
                WHERE action = %s AND created_at < NOW() - INTERVAL '{int(window_seconds)} seconds'
            """, (action,))

            cur.execute(f"""
                SELECT COUNT(*) FROM {S}rate_limits
                WHERE key = %s AND action = %s
                  AND created_at > NOW() - INTERVAL '{int(window_seconds)} seconds'
            """, (key, action))
            count = cur.fetchone()[0]

            if count >= max_attempts:
                cur.execute(f"""
                    SELECT EXTRACT(EPOCH FROM (MIN(created_at) + INTERVAL '{int(window_seconds)} seconds' - NOW()))::int
                    FROM {S}rate_limits
                    WHERE key = %s AND action = %s
                      AND created_at > NOW() - INTERVAL '{int(window_seconds)} seconds'
                """, (key, action))
                remaining = cur.fetchone()[0] or window_seconds
                conn.commit()
                return True, max(remaining, 1)

            cur.execute(f"""
                INSERT INTO {S}rate_limits (key, action, created_at)
                VALUES (%s, %s, NOW())
            """, (key, action))
            conn.commit()
            return False, 0
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    except Exception as e:
        print(f"Rate limit check error (fail-open): {e}")
        return False, 0


VERIFY_PER_PHONE_LIMIT = 5
VERIFY_PER_PHONE_WINDOW = 900


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

        limited, wait = _check_rate_limit(phone, 'sms_verify', VERIFY_PER_PHONE_LIMIT, VERIFY_PER_PHONE_WINDOW)
        if limited:
            return {
                'statusCode': 429,
                'headers': _cors(),
                'body': json.dumps({
                    'error': f'Слишком много попыток. Повторите через {wait // 60 + 1} мин.',
                    'retryAfter': wait
                }),
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
