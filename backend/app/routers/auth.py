"""Signup, login, logout and the signed-in user's read model."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Union

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from app.routers.profile import fetch_profile
from app.schemas import LoginIn, MeOut, MessageOut, SignupIn
from app.session import ACCESS_COOKIE, clear_session_cookies, current_user, set_session_cookies
from app.supabase import SupabaseError

router = APIRouter(prefix="/auth", tags=["auth"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/signup", response_model=Union[MeOut, MessageOut], status_code=201)
async def signup(
    payload: SignupIn, request: Request, response: Response
) -> Union[MeOut, MessageOut]:
    client = request.app.state.supabase
    grant = await client.signup(payload.email, payload.password, payload.full_name)
    session, user = grant["session"], grant["user"]
    if session is None:
        # Supabase wants email confirmation: no session exists yet, so there
        # is no token to record consent with until the first sign in.
        return MessageOut(message="account created - check your email to confirm")
    token = session["access_token"]
    # Runs as the new user, so RLS allows updating only their own row. The id
    # filter is required because PostgREST rejects UPDATE without a WHERE.
    rows = await client.rest(
        "PATCH",
        "/profiles",
        token,
        params={"select": "*", "id": f"eq.{user['id']}"},
        json_body={"consent_at": _now()},
        prefer="return=representation",
    )
    if not rows:
        raise SupabaseError(502, "upstream service unavailable")
    set_session_cookies(response, token, session["refresh_token"], int(session["expires_in"]))
    return MeOut(email=user.get("email", payload.email), profile=rows[0])


@router.post("/login", response_model=MeOut)
async def login(payload: LoginIn, request: Request, response: Response) -> MeOut:
    client = request.app.state.supabase
    try:
        grant = await client.login(payload.email, payload.password)
    except SupabaseError as exc:
        if exc.status_code in (400, 401):
            # never reveal whether the email exists
            raise HTTPException(status_code=401, detail="invalid email or password") from None
        raise
    session, user = grant["session"], grant["user"]
    if not session:
        raise HTTPException(status_code=401, detail="invalid email or password")
    set_session_cookies(response, session["access_token"], session["refresh_token"], int(session["expires_in"]))
    profile = await fetch_profile(client, session["access_token"])
    return MeOut(email=user.get("email", payload.email), profile=profile)


@router.post("/logout", response_model=MessageOut)
async def logout(request: Request, response: Response) -> MessageOut:
    token = request.cookies.get(ACCESS_COOKIE)
    if token:
        try:
            await request.app.state.supabase.logout(token)
        except SupabaseError:
            pass  # the cookies are cleared either way
    clear_session_cookies(response)
    return MessageOut(message="signed out")


@router.get("/me", response_model=MeOut)
async def me(request: Request, token: str = Depends(current_user)) -> MeOut:
    client = request.app.state.supabase
    user = await client.get_user(token)
    return MeOut(email=user.get("email", ""), profile=await fetch_profile(client, token))
