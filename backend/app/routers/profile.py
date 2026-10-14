"""Profile read and update. RLS restricts every call to the caller's own row."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request

from app.schemas import ProfileOut, ProfilePatch
from app.session import current_user
from app.supabase import SupabaseClient

router = APIRouter(prefix="/profile", tags=["profile"])


async def fetch_profile(client: SupabaseClient, token: str) -> dict[str, Any]:
    """The caller's profile. No user filter is needed: RLS returns 0 or 1 rows."""
    rows = await client.rest("GET", "/profiles", token, params={"select": "*"})
    if not rows:
        raise HTTPException(status_code=404, detail="profile not found")
    return rows[0]


@router.get("", response_model=ProfileOut)
async def get_profile(request: Request, token: str = Depends(current_user)) -> dict[str, Any]:
    return await fetch_profile(request.app.state.supabase, token)


@router.patch("", response_model=ProfileOut)
async def update_profile(
    payload: ProfilePatch, request: Request, token: str = Depends(current_user)
) -> dict[str, Any]:
    client = request.app.state.supabase
    updates = payload.model_dump(exclude_unset=True, mode="json")
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    # PostgREST rejects UPDATE without a WHERE clause, so filter by the
    # caller's own id; RLS still guarantees only their row can change.
    user = await client.get_user(token)
    rows = await client.rest(
        "PATCH",
        "/profiles",
        token,
        params={"select": "*", "id": f"eq.{user['id']}"},
        json_body=updates,
        prefer="return=representation",
    )
    if not rows:
        raise HTTPException(status_code=404, detail="profile not found")
    return rows[0]
