import json
import os
from datetime import timezone
import psycopg2
from psycopg2.extras import RealDictCursor
from auth_utils import require_auth, auth_error_response, set_request_origin, get_cors_headers


def to_utc_iso(dt):
    """Сериализует datetime в ISO-строку с явной пометкой UTC.

    Колонка created_at в БД timestamp without time zone, но фактически хранится
    UTC (сервер БД работает в UTC). str(datetime) без пометки зоны браузер
    интерпретирует как локальное время, из-за чего дата отзыва показывается
    со сдвигом (иногда даже другим днём).
    """
    if not dt:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def normalize_review_dates(review: dict) -> dict:
    if review.get('created_at') is not None:
        review['created_at'] = to_utc_iso(review['created_at'])
    if review.get('updated_at') is not None:
        review['updated_at'] = to_utc_iso(review['updated_at'])
    return review

def handler(event: dict, context) -> dict:
    """API для работы с отзывами между участниками сделок"""
    set_request_origin(event)

    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': get_cors_headers(), 'body': ''}

    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])

        if method == 'GET':
            return get_reviews(event, conn)
        elif method == 'POST':
            return create_review(event, conn)
        else:
            return {
                'statusCode': 405,
                'headers': get_cors_headers(),
                'body': json.dumps({'error': 'Метод не поддерживается'})
            }
    except PermissionError as e:
        return auth_error_response(401, str(e))
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
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

    S = os.environ.get('MAIN_DB_SCHEMA', 'public')
    schema = f"{S}." if S else ""

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if chat_id:
            cur.execute(f"""
                SELECT r.id, r.chat_id, r.recommendation_id, r.reviewer_email, r.reviewer_name,
                       r.reviewee_email, r.reviewee_name, r.rating, r.comment, r.created_at,
                       COALESCE(NULLIF(u.avatar_url, ''), COALESCE(r.reviewer_photo, '')) as reviewer_photo,
                       COALESCE(r.reviewee_photo, '') as reviewee_photo
                FROM {schema}reviews r
                LEFT JOIN {schema}users u ON u.email = r.reviewer_email
                WHERE r.chat_id = %s
                ORDER BY r.created_at DESC
            """, (chat_id,))
        elif reviewee_email:
            cur.execute(f"""
                SELECT r.id, r.chat_id, r.recommendation_id, r.reviewer_email, r.reviewer_name,
                       r.reviewee_email, r.reviewee_name, r.rating, r.comment, r.created_at,
                       COALESCE(NULLIF(u.avatar_url, ''), COALESCE(r.reviewer_photo, '')) as reviewer_photo,
                       COALESCE(r.reviewee_photo, '') as reviewee_photo
                FROM {schema}reviews r
                LEFT JOIN {schema}users u ON u.email = r.reviewer_email
                WHERE r.reviewee_email = %s
                ORDER BY r.created_at DESC
            """, (reviewee_email,))
        else:
            return {
                'statusCode': 400,
                'headers': get_cors_headers(),
                'body': json.dumps({'error': 'reviewee_email or chat_id required'})
            }

        reviews = cur.fetchall()

        avg_rating = None
        if reviewee_email:
            cur.execute(f"""
                SELECT AVG(rating)::numeric(3,2) as avg_rating, COUNT(*) as count
                FROM {schema}reviews
                WHERE reviewee_email = %s
            """, (reviewee_email,))
            stats = cur.fetchone()
            avg_rating = float(stats['avg_rating']) if stats['avg_rating'] else None

        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'reviews': [normalize_review_dates(dict(r)) for r in reviews],
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
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Нельзя оставлять отзыв от чужого имени'})
        }

    data['reviewer_email'] = auth_email

    required = ['chat_id', 'recommendation_id', 'reviewer_email', 'reviewer_name',
                'reviewee_email', 'reviewee_name', 'rating']

    for field in required:
        if field not in data:
            return {
                'statusCode': 400,
                'headers': get_cors_headers(),
                'body': json.dumps({'error': f'Missing required field: {field}'})
            }

    rating = data['rating']
    if not isinstance(rating, int) or rating < 1 or rating > 5:
        return {
            'statusCode': 400,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Rating must be between 1 and 5'})
        }

    reviewer_photo = data.get('reviewer_photo', '') or ''
    reviewee_photo = data.get('reviewee_photo', '') or ''

    S = os.environ.get('MAIN_DB_SCHEMA', 'public')
    schema = f"{S}." if S else ""

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"""
            SELECT id FROM {schema}reviews
            WHERE chat_id = %s AND reviewer_email = %s
        """, (data['chat_id'], auth_email))

        existing = cur.fetchone()

        if existing:
            cur.execute(f"""
                UPDATE {schema}reviews
                SET rating = %s, comment = %s,
                    reviewer_photo = %s, reviewee_photo = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, chat_id, recommendation_id, reviewer_email, reviewer_name,
                          reviewee_email, reviewee_name, rating, comment, created_at,
                          COALESCE(reviewer_photo, '') as reviewer_photo,
                          COALESCE(reviewee_photo, '') as reviewee_photo
            """, (rating, data.get('comment'), reviewer_photo, reviewee_photo, existing['id']))
        else:
            cur.execute(f"""
                INSERT INTO {schema}reviews
                (chat_id, recommendation_id, reviewer_email, reviewer_name,
                 reviewee_email, reviewee_name, rating, comment,
                 reviewer_photo, reviewee_photo)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, chat_id, recommendation_id, reviewer_email, reviewer_name,
                          reviewee_email, reviewee_name, rating, comment, created_at,
                          COALESCE(reviewer_photo, '') as reviewer_photo,
                          COALESCE(reviewee_photo, '') as reviewee_photo
            """, (data['chat_id'], data['recommendation_id'], auth_email,
                  data['reviewer_name'], data['reviewee_email'], data['reviewee_name'],
                  rating, data.get('comment'), reviewer_photo, reviewee_photo))

        review = cur.fetchone()
        conn.commit()

        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'success': True,
                'review': normalize_review_dates(dict(review))
            }, default=str)
        }