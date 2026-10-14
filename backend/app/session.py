"""Cookie sessions.

Two httponly cookies hold the Supabase session: sp_access (max_age =
expires_in) and sp_refresh (30 days). Tokens are never returned in a response
body and never touch localStorage, so browser JavaScript cannot read them.

The JWT payload is decoded WITHOUT verification here only to see when the
token expires; Supabase verifies the signature on every data request."""
from __future__ import annotations

import base64
import json
import time

from fastapi import HTTPException, Request, Response

from app.config import IS_PRODUCTION
from app.supabase import SupabaseClient, SupabaseError

ACCESS_COOKIE = "sp_access"
REFRESH_COOKIE = "sp_refresh"
REFRESH_MAX_AGE = 30 * 24 * 60 * 60
EXPIRY_MARGIN_SECONDS = 60
COOKIE_PATH = "/"


def set_session_cookies(
    response: Response, access_token: str, refresh_token: str, expires_in: int
) -> None:
    response.set_cookie(
        ACCESS_COOKIE,
        access_token,
        max_age=expires_in,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        path=COOKIE_PATH,
    )
    response.set_cookie(
        REFRESH_COOKIE,
        refresh_token,
        max_age=REFRESH_MAX_AGE,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        path=COOKIE_PATH,
    )


def clear_session_cookies(response: Response) -> None:
    response.delete_cookie(ACCESS_COOKIE, path=COOKIE_PATH)
    response.delete_cookie(REFRESH_COOKIE, path=COOKIE_PATH)


def expires_within(token: str, seconds: int) -> bool:
    """True when the token cannot be read or expires within `seconds`."""
    try:
        payload_b64 = token.split(".")[1]
        payload_b64 += "=" * (-len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        return float(payload["exp"]) - time.time() <= seconds
    except (IndexError, ValueError, TypeError, KeyError):
        return True


async def current_user(request: Request, response: Response) -> str:
    """Resolve the caller to their Supabase access token.

    Every downstream call runs with this token so RLS scopes each query to
    the signed-in user. A missing or near-expiry token is refreshed from
    sp_refresh and fresh cookies are set; if the refresh fails the 401
    handler clears both cookies."""
    client: SupabaseClient = request.app.state.supabase
    access = request.cookies.get(ACCESS_COOKIE)
    refresh = request.cookies.get(REFRESH_COOKIE)
    if access and not expires_within(access, EXPIRY_MARGIN_SECONDS):
        return access
    if not refresh:
        raise HTTPException(status_code=401, detail="not signed in")
    try:
        grant = await client.refresh(refresh)
    except SupabaseError:
        raise HTTPException(status_code=401, detail="session expired") from None
    session = grant.get("session") or {}
    if not session.get("access_token"):
        raise HTTPException(status_code=401, detail="session expired")
    set_session_cookies(
        response,
        session["access_token"],
        session["refresh_token"],
        int(session["expires_in"]),
    )
    return session["access_token"]
