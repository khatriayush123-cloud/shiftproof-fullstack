"""Create the ShiftProof schema in Supabase. Run this locally, once.

Usage: python setup_database.py

Reads DATABASE_URL from backend/.env and executes sql/schema.sql, which is
idempotent (safe to run more than once). This script is the ONLY place that
reads the connection string: the deployed function never holds a credential
that bypasses row-level security. The URL and password are never printed."""
from __future__ import annotations

import os
import re
import sys

import psycopg2
from dotenv import load_dotenv

_HERE = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(_HERE, ".env"))
SCHEMA_PATH = os.path.join(_HERE, "sql", "schema.sql")


def _redact(text: str) -> str:
    """Strip anything that could leak the connection string."""
    text = re.sub(r"\b\w+://\S+", "[redacted]", text)
    return re.sub(r"(password|passwd|pwd)\s*=\s*\S+", r"\1=[redacted]", text, flags=re.I)


def main() -> int:
    database_url = os.getenv("DATABASE_URL", "")
    if not database_url:
        print("FAIL: DATABASE_URL is not set (put it in backend/.env)")
        return 1
    try:
        with open(SCHEMA_PATH, encoding="utf-8") as handle:
            schema_sql = handle.read()
    except OSError as exc:
        print(f"FAIL: cannot read sql/schema.sql ({type(exc).__name__})")
        return 1
    connection = None
    try:
        connection = psycopg2.connect(database_url)
        with connection.cursor() as cursor:
            cursor.execute(schema_sql)
        connection.commit()
    except psycopg2.Error as exc:
        if connection is not None:
            connection.rollback()
        print(f"FAIL: database setup error ({type(exc).__name__}): {_redact(str(exc))}")
        return 1
    finally:
        if connection is not None:
            connection.close()
    print("Database setup completed successfully")
    return 0


if __name__ == "__main__":
    sys.exit(main())
