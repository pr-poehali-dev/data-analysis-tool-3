"""Общие утилиты: БД, CORS, сериализация."""
import json
import os
import psycopg2

MAX_BODY_SIZE = 1 * 1024 * 1024
MAX_AVATAR_LENGTH = 2048


def get_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_schema() -> str:
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return f"{schema}." if schema else ""


from auth_utils import get_cors_headers


def response(status, body):
    return {
        'statusCode': status,
        'headers': get_cors_headers(),
        'body': json.dumps(body, default=str),
    }


def parse_body(event):
    body_str = event.get('body', '{}')
    if not body_str:
        return {}
    if len(body_str) > MAX_BODY_SIZE:
        raise ValueError("Тело запроса слишком большое. Максимум 1 МБ")
    return json.loads(body_str)


COLUMNS = """id, user_id, user_email, name, avatar, location, budget, reward, bonus,
    who_will_live, about_yourself, has_pets, city, districts,
    budget_min, budget_max, housing_type, rooms_count,
    rental_period, move_in_date, status, created_at, updated_at"""


def row_to_dict(row):
    return {
        'id': str(row[0]),
        'userId': str(row[1]) if row[1] else row[2],
        'userEmail': row[2],
        'name': row[3] or '',
        'avatar': row[4] or '',
        'location': row[5] or '',
        'budget': row[6] or '',
        'reward': row[7] or '',
        'bonus': row[8] or '',
        'whoWillLive': row[9] or '',
        'aboutYourself': row[10] or '',
        'hasPets': row[11] or '',
        'city': row[12] or '',
        'districts': row[13] if row[13] else [],
        'budgetMin': row[14] or '',
        'budgetMax': row[15] or '',
        'housingType': row[16] or '',
        'roomsCount': row[17] or '',
        'rentalPeriod': row[18] or '',
        'moveInDate': row[19] or '',
        'status': row[20] or 'active',
        'createdAt': row[21].isoformat() if row[21] else None,
        'updatedAt': row[22].isoformat() if row[22] else None,
    }