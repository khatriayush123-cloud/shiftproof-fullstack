"""Shift CRUD and the pre-acceptance check.

Pay is always computed on read from the stored shift and the profile's
current settings - never stored - so changing pay settings recalculates
every shift automatically and the numbers can never disagree."""
from __future__ import annotations

from datetime import date, time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

from app.fortnight import (
    CAUTION_AT, HOURS_CAP, ShiftHours, in_session, rolling_hours, semester_dates, window_bounds,
)
from app.pay import PaySettings, calculate_hours, calculate_pay
from app.routers.profile import fetch_profile
from app.schemas import CheckOut, MessageOut, ShiftCheckIn, ShiftIn, ShiftOut, ShiftPatch
from app.session import current_user

router = APIRouter(prefix="/shifts", tags=["shifts"])


def _computed(row: dict[str, Any], settings: PaySettings) -> dict[str, Any]:
    """Attach hours, pay and breakdown computed from the stored shift."""
    calc = calculate_pay(date.fromisoformat(row["shift_date"]), time.fromisoformat(row["start_time"]),
                         time.fromisoformat(row["finish_time"]), int(row["unpaid_break_minutes"]),
                         bool(row["is_public_holiday"]), settings)
    return {**row, **calc}


def _as_hours(row: dict[str, Any]) -> ShiftHours:
    return ShiftHours(date.fromisoformat(row["shift_date"]),
                      calculate_hours(time.fromisoformat(row["start_time"]),
                                      time.fromisoformat(row["finish_time"]),
                                      int(row["unpaid_break_minutes"])))


@router.get("", response_model=list[ShiftOut])
async def list_shifts(request: Request, token: str = Depends(current_user)) -> list[dict[str, Any]]:
    client = request.app.state.supabase
    settings = PaySettings.from_profile(await fetch_profile(client, token))
    rows = await client.rest("GET", "/shifts", token,
                             params={"select": "*", "order": "shift_date.desc,created_at.desc"})
    return [_computed(row, settings) for row in rows]


@router.post("", response_model=ShiftOut, status_code=201)
async def create_shift(payload: ShiftIn, request: Request,
                       token: str = Depends(current_user)) -> dict[str, Any]:
    client = request.app.state.supabase
    settings = PaySettings.from_profile(await fetch_profile(client, token))
    rows = await client.rest("POST", "/shifts", token, params={"select": "*"},
                             json_body=payload.model_dump(mode="json"), prefer="return=representation")
    return _computed(rows[0], settings)


@router.patch("/{shift_id}", response_model=ShiftOut)
async def update_shift(shift_id: str, payload: ShiftPatch, request: Request,
                       token: str = Depends(current_user)) -> dict[str, Any]:
    client = request.app.state.supabase
    settings = PaySettings.from_profile(await fetch_profile(client, token))
    existing = await client.rest("GET", "/shifts", token,
                                 params={"select": "*", "id": f"eq.{shift_id}"})
    if not existing:  # RLS hides other people's rows, so this 404s for them too
        raise HTTPException(status_code=404, detail="shift not found")
    merged = {**existing[0], **payload.model_dump(exclude_unset=True)}
    try:  # the merged row must still be a valid shift
        ShiftIn.model_validate({name: merged[name] for name in ShiftIn.model_fields})
    except ValidationError as exc:
        raise RequestValidationError(exc.errors()) from None
    rows = await client.rest("PATCH", "/shifts", token,
                             params={"select": "*", "id": f"eq.{shift_id}"},
                             json_body=payload.model_dump(exclude_unset=True, mode="json"),
                             prefer="return=representation")
    return _computed(rows[0], settings)


@router.delete("/{shift_id}", response_model=MessageOut)
async def delete_shift(shift_id: str, request: Request,
                       token: str = Depends(current_user)) -> MessageOut:
    rows = await request.app.state.supabase.rest(
        "DELETE", "/shifts", token,
        params={"select": "*", "id": f"eq.{shift_id}"}, prefer="return=representation")
    if not rows:
        raise HTTPException(status_code=404, detail="shift not found")
    return MessageOut(message="shift deleted")


@router.post("/check", response_model=CheckOut)
async def check_shift(payload: ShiftCheckIn, request: Request,
                      token: str = Depends(current_user)) -> CheckOut:
    """Dry run for a shift that is NOT saved: what it pays, and whether it
    pushes the worker past 48 hours in the window ending on its date.
    Employer is optional here so the live preview works before it is typed."""
    client = request.app.state.supabase
    profile = await fetch_profile(client, token)
    calc = calculate_pay(payload.shift_date, payload.start_time, payload.finish_time,
                         payload.unpaid_break_minutes, payload.is_public_holiday,
                         PaySettings.from_profile(profile))
    window_start, window_end = window_bounds(payload.shift_date)
    rows = await client.rest("GET", "/shifts", token, params=[
        ("select", "shift_date,start_time,finish_time,unpaid_break_minutes"),
        ("shift_date", f"gte.{window_start}"), ("shift_date", f"lte.{window_end}")])
    semester_start, semester_end = semester_dates(profile)
    # saved shifts only, so the candidate can never count against itself
    current = rolling_hours([_as_hours(r) for r in rows], payload.shift_date,
                            semester_start, semester_end)
    projected = round(current + calc["hours"], 2)
    counts = in_session(payload.shift_date, semester_start, semester_end)
    if not counts:
        status = "unlimited"
    elif projected >= HOURS_CAP:
        status = "over"
    elif projected >= CAUTION_AT:
        status = "caution"
    else:
        status = "clear"
    return CheckOut(hours=calc["hours"], pay=calc["pay"], breakdown=calc["breakdown"],
                    window_start=window_start, window_end=window_end, current_hours=current,
                    projected_hours=projected, cap=HOURS_CAP, in_session=counts,
                    over_by=max(0.0, round(projected - HOURS_CAP, 2)), status=status)
