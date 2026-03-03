"""Health check handler - verifies database schema."""
from utils.db import query_one, get_schema
from utils.http import response, error


REQUIRED_TABLES = ['users', 'refresh_tokens', 'password_reset_tokens', 'email_verification_tokens']

REQUIRED_COLUMNS = {
    'users': ['id', 'email', 'password_hash', 'name', 'email_verified', 'failed_login_attempts', 'last_failed_login_at', 'last_login_at', 'created_at', 'updated_at'],
    'refresh_tokens': ['id', 'user_id', 'token_hash', 'expires_at', 'created_at'],
    'password_reset_tokens': ['id', 'user_id', 'token_hash', 'expires_at', 'created_at'],
    'email_verification_tokens': ['id', 'user_id', 'token_hash', 'expires_at', 'created_at'],
}


def handle(event: dict, origin: str = '*') -> dict:
    """Check database schema has all required tables and columns."""
    S = get_schema()

    if not S:
        return error(500, 'MAIN_DB_SCHEMA not configured', origin)

    schema_name = S.rstrip('.')

    errors_list = []

    for table in REQUIRED_TABLES:
        result = query_one(f"""
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = %s AND table_name = %s
        """, (schema_name, table))

        if not result:
            errors_list.append(f"Table '{table}' not found in schema '{schema_name}'")
            continue

        for column in REQUIRED_COLUMNS[table]:
            col_result = query_one(f"""
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = %s
                AND table_name = %s
                AND column_name = %s
            """, (schema_name, table, column))

            if not col_result:
                errors_list.append(f"Column '{column}' not found in table '{schema_name}.{table}'")

    if errors_list:
        return error(500, f"Schema validation failed: {'; '.join(errors_list)}", origin)

    return response(200, {
        'status': 'ok',
        'schema': schema_name,
        'tables': REQUIRED_TABLES,
        'message': 'All required tables and columns exist'
    }, origin)
