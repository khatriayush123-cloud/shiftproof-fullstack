"""Verify the ShiftProof database objects. Run locally after setup_database.py.

Usage: python check_database.py

Prints a clear PASS/FAIL line for every check: both tables exist, RLS is
enabled on both, the policies are listed, and the trigger and functions are
in place. Never prints the URL or password."""
from __future__ import annotations

import os
import re
import sys

import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

EXPECTED_POLICIES = {
    "profiles_select_own",
    "profiles_update_own",
    "shifts_select_own",
    "shifts_insert_own",
    "shifts_update_own",
    "shifts_delete_own",
}


def _redact(text: str) -> str:
    text = re.sub(r"\b\w+://\S+", "[redacted]", text)
    return re.sub(r"(password|passwd|pwd)\s*=\s*\S+", r"\1=[redacted]", text, flags=re.I)


def _report(failures: list[str], label: str, ok: bool) -> None:
    print(("PASS: " if ok else "FAIL: ") + label)
    if not ok:
        failures.append(label)


def check_tables(cursor, failures: list[str]) -> None:
    cursor.execute(
        "select table_name from information_schema.tables "
        "where table_schema = 'public' and table_name in ('profiles','shifts')"
    )
    found = {row[0] for row in cursor.fetchall()}
    for name in ("profiles", "shifts"):
        _report(failures, f"table public.{name} exists", name in found)


def check_rls(cursor, failures: list[str]) -> None:
    cursor.execute(
        "select relname, relrowsecurity from pg_class "
        "where relnamespace = 'public'::regnamespace and relname in ('profiles','shifts')"
    )
    rows = dict(cursor.fetchall())
    for name in ("profiles", "shifts"):
        _report(failures, f"row level security enabled on public.{name}", rows.get(name) is True)


def check_policies(cursor, failures: list[str]) -> None:
    cursor.execute(
        "select policyname, tablename, cmd from pg_policies "
        "where schemaname = 'public' order by tablename, policyname"
    )
    policies = cursor.fetchall()
    for policyname, tablename, cmd in policies:
        print(f"      policy {policyname} on public.{tablename} ({cmd})")
    names = {row[0] for row in policies}
    _report(failures, "all expected policies present", EXPECTED_POLICIES <= names)


def check_trigger_and_functions(cursor, failures: list[str]) -> None:
    cursor.execute(
        "select exists (select 1 from pg_trigger "
        "where tgname = 'on_auth_user_created' and tgrelid = 'auth.users'::regclass)"
    )
    _report(failures, "trigger on_auth_user_created exists on auth.users", cursor.fetchone()[0])
    cursor.execute(
        "select proname from pg_proc where pronamespace = 'public'::regnamespace "
        "and proname in ('handle_new_user','delete_my_account')"
    )
    found = {row[0] for row in cursor.fetchall()}
    _report(failures, "function public.handle_new_user() exists", "handle_new_user" in found)
    _report(failures, "function public.delete_my_account() exists", "delete_my_account" in found)


def main() -> int:
    database_url = os.getenv("DATABASE_URL", "")
    if not database_url:
        print("FAIL: DATABASE_URL is not set (put it in backend/.env)")
        return 1
    failures: list[str] = []
    connection = None
    try:
        connection = psycopg2.connect(database_url)
        with connection.cursor() as cursor:
            check_tables(cursor, failures)
            check_rls(cursor, failures)
            check_policies(cursor, failures)
            check_trigger_and_functions(cursor, failures)
    except psycopg2.Error as exc:
        print(f"FAIL: cannot inspect database ({type(exc).__name__}): {_redact(str(exc))}")
        return 1
    finally:
        if connection is not None:
            connection.close()
    if failures:
        print(f"{len(failures)} database check(s) FAILED")
        return 1
    print("All database checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
