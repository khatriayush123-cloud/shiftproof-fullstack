"""Account deletion.

Deletes the auth user; ON DELETE CASCADE removes their profile and shifts.
The work happens in rpc/delete_my_account, which runs as the signed-in user -
the backend never holds a credential that bypasses RLS."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response

from app.schemas import MessageOut
from app.session import clear_session_cookies, current_user

router = APIRouter(prefix="/account", tags=["account"])


@router.delete("", response_model=MessageOut)
async def delete_account(
    request: Request, response: Response, token: str = Depends(current_user)
) -> MessageOut:
    await request.app.state.supabase.rpc("delete_my_account", token)
    clear_session_cookies(response)
    return MessageOut(message="account deleted")
