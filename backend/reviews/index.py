import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from auth_utils import require_auth, auth_error_response

CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
}

def handler(event: dict, context) -> dict:
    """API для работы с отзывами между участниками сделок"""

    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])

        if method == 'GET':
            return get_reviews(event, conn)
        elif method == 'POST':
            return create_review(event, conn)
        else:
            return {
                'statusCode': 405,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'Метод не поддерживается'})
            }
    except PermissionError as e:
        return auth_error_response(401, str(e))
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }
    finally:
        if 'conn' in locals():
            conn.close()

def get_reviews(event: dict, conn) -> dict:
    """Публичный эндпоинт — отзывы видны всем."""
    params = event.get('queryStringParameters') or {}
    reviewee_email = params.get('reviewee_email')
    chat_id = params.get('chat_id')

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if chat_id:
            cur.execute("""
                SELECT id, chat_id, recommendation_id, reviewer_email, reviewer_name,
                       reviewee_email, reviewee_name, rating, comment, created_at
                FROM reviews
                WHERE chat_id = %s
                ORDER BY created_at DESC
            """, (chat_id,))
        elif reviewee_email:
            cur.execute("""
                SELECT id, chat_id, recommendation_id, reviewer_email, reviewer_name,
                       reviewee_email, reviewee_name, rating, comment, created_at
                FROM reviews
                WHERE reviewee_email = %s
                ORDER BY created_at DESC
            """, (reviewee_email,))
        else:
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'reviewee_email or chat_id required'})
            }

        reviews = cur.fetchall()

        avg_rating = None
        if reviewee_email:
            cur.execute("""
                SELECT AVG(rating)::numeric(3,2) as avg_rating, COUNT(*) as count
                FROM reviews
                WHERE reviewee_email = %s
            """, (reviewee_email,))
            stats = cur.fetchone()
            avg_rating = float(stats['avg_rating']) if stats['avg_rating'] else None

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'reviews': [dict(r) for r in reviews],
                'avg_rating': avg_rating,
                'total': len(reviews)
            }, default=str)
        }

def create_review(event: dict, conn) -> dict:
    """Приватный эндпоинт — только с токеном, reviewer_email из токена."""
    auth_email = require_auth(event)
    data = json.loads(event.get('body', '{}'))

    if data.get('reviewer_email') and auth_email != data.get('reviewer_email'):
        return {
            'statusCode': 403,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Нельзя оставлять отзыв от чужого имени'})
        }

    data['reviewer_email'] = auth_email

    required = ['chat_id', 'recommendation_id', 'reviewer_email', 'reviewer_name',
                'reviewee_email', 'reviewee_name', 'rating']

    for field in required:
        if field not in data:
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': f'Missing required field: {field}'})
            }

    rating = data['rating']
    if not isinstance(rating, int) or rating < 1 or rating > 5:
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Rating must be between 1 and 5'})
        }

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id FROM reviews
            WHERE chat_id = %s AND reviewer_email = %s
        """, (data['chat_id'], auth_email))

        existing = cur.fetchone()

        if existing:
            cur.execute("""
                UPDATE reviews
                SET rating = %s, comment = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, chat_id, recommendation_id, reviewer_email, reviewer_name,
                          reviewee_email, reviewee_name, rating, comment, created_at
            """, (rating, data.get('comment'), existing['id']))
        else:
            cur.execute("""
                INSERT INTO reviews
                (chat_id, recommendation_id, reviewer_email, reviewer_name,
                 reviewee_email, reviewee_name, rating, comment)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, chat_id, recommendation_id, reviewer_email, reviewer_name,
                          reviewee_email, reviewee_name, rating, comment, created_at
            """, (data['chat_id'], data['recommendation_id'], auth_email,
                  data['reviewer_name'], data['reviewee_email'], data['reviewee_name'],
                  rating, data.get('comment')))

        review = cur.fetchone()
        conn.commit()

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'success': True,
                'review': dict(review)
            }, default=str)
        }
