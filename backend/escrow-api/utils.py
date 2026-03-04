"""Общие утилиты: БД, CORS, ответы."""
import json
import os
import psycopg2
from auth_utils import get_cors_headers


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_schema():
    schema = os.environ.get('DB_SCHEMA', '')
    return f"{schema}." if schema else ""


def get_escrow_cors_headers():
    base = get_cors_headers()
    base['Access-Control-Allow-Methods'] = 'GET, POST, PUT, OPTIONS'
    base['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Authorization, X-User-Id, X-Auth-Token'
    base['Access-Control-Max-Age'] = '86400'
    return base


def resp(status, body):
    return {'statusCode': status, 'headers': get_escrow_cors_headers(), 'body': json.dumps(body, default=str)}


def tx_row_to_dict(r):
    return {
        'id': str(r[0]),
        'chatId': r[1] or '',
        'recommendationId': r[2] or '',
        'requestName': r[3],
        'tenantEmail': r[4],
        'tenantName': r[5],
        'recommenderEmail': r[6],
        'recommenderName': r[7],
        'rentAmount': float(r[8]),
        'commissionAmount': float(r[9]),
        'status': r[10],
        'createdAt': r[11].isoformat() if r[11] else None,
        'completedAt': r[12].isoformat() if r[12] else None,
    }


TX_COLUMNS = """id, chat_id, recommendation_id, request_name,
    tenant_email, tenant_name, recommender_email, recommender_name,
    rent_amount, commission_amount, status, created_at, completed_at"""