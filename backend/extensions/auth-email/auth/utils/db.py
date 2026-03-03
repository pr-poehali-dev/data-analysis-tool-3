"""Database utilities for Simple Query Protocol."""
import os
import psycopg2
from typing import Any, Optional


def get_connection():
    """Get database connection."""
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise ValueError('DATABASE_URL not configured')
    return psycopg2.connect(dsn)


def get_schema() -> str:
    """Get schema prefix from env. Returns 'schema.' or empty string."""
    schema = os.environ.get('MAIN_DB_SCHEMA', '')
    return f"{schema}." if schema else ""


def escape(value: Any) -> str:
    """Deprecated: use parameterized queries instead."""
    if value is None:
        return 'NULL'
    if isinstance(value, bool):
        return 'TRUE' if value else 'FALSE'
    if isinstance(value, (int, float)):
        return str(value)
    s = str(value).replace("'", "''")
    return f"'{s}'"


def query(sql: str, params: Optional[tuple] = None) -> list:
    """Execute SELECT query and return all rows."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(sql, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def query_one(sql: str, params: Optional[tuple] = None):
    """Execute SELECT query and return first row or None."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(sql, params)
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row


def execute(sql: str, params: Optional[tuple] = None) -> None:
    """Execute INSERT/UPDATE/DELETE query."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(sql, params)
    conn.commit()
    cur.close()
    conn.close()


def execute_returning(sql: str, params: Optional[tuple] = None):
    """Execute INSERT with RETURNING and return first value."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(sql, params)
    result = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return result[0] if result else None
