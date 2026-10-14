"""Environment configuration.

Loads backend/.env next to this file's parent (never a relative path - on
Vercel the working directory is the repo root, not backend/). Runtime needs
only SUPABASE_URL and SUPABASE_ANON_KEY; DATABASE_URL is used exclusively by
the local setup scripts, so the deployed function never holds a connection
string that bypasses row-level security."""
from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

IS_PRODUCTION: bool = os.getenv("VERCEL") == "1"

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")

_missing = [
    name
    for name, value in (("SUPABASE_URL", SUPABASE_URL), ("SUPABASE_ANON_KEY", SUPABASE_ANON_KEY))
    if not value
]
if _missing:
    raise RuntimeError("Missing required environment variable(s): " + ", ".join(_missing))
