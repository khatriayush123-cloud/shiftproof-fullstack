"""Rolling-window summary: where the worker stands against the 48-hour cap,
plus the last six 14-day periods."""
from __future__ import annotations

from datetime import date, datetime, time
from zoneinfo import ZoneInfo
from typing import Any

from fastapi import APIRouter, Depends, Request

from app.fortnight import HOURS_CAP, in_session, period_windows, semester_dates
from app.pay import PaySettings, calculate_pay
from app.routers.profile import fetch_profile
from app.schemas import PeriodOut, SummaryOut
from app.session import current_user

router = APIRouter(prefix="/summary", tags=["summary"])


@router.get("", response_model=SummaryOut)
async def summary(request: Request, token: str = Depends(current_user)) -> SummaryOut:
    client = request.app.state.supabase
    profile = await fetch_profile(client, token)
    settings = PaySettings.from_profile(profile)
    semester_start, semester_end = semester_dates(profile)
    # Australia/Sydney, not the server clock: Vercel runs in UTC, which is
    # the previous day before 11am Sydney time and would drop today's shifts.
    today = datetime.now(ZoneInfo("Australia/Sydney")).date()
    windows = period_windows(today, 6)
    earliest = windows[-1][0]
    rows: list[dict[str, Any]] = await client.rest(
        "GET",
        "/shifts",
        token,
        params=[("select", "*"), ("shift_date", f"gte.{earliest}"), ("shift_date", f"lte.{today}")],
    )
    # hours count only in-session shifts (the cap measure); pay counts every
    # shift, including semester-break work, because that money was earned.
    totals: list[dict[str, float]] = [{"hours": 0.0, "pay": 0.0} for _ in windows]
    counts = [0 for _ in windows]
    for row in rows:
        calc = calculate_pay(
            date.fromisoformat(row["shift_date"]),
            time.fromisoformat(row["start_time"]),
            time.fromisoformat(row["finish_time"]),
            int(row["unpaid_break_minutes"]),
            bool(row["is_public_holiday"]),
            settings,
        )
        shift_date = date.fromisoformat(row["shift_date"])
        for index, (start, end) in enumerate(windows):
            if start <= shift_date <= end:
                counts[index] += 1
                totals[index]["pay"] += calc["pay"]
                if in_session(shift_date, semester_start, semester_end):
                    totals[index]["hours"] += calc["hours"]
                break
    hours = round(totals[0]["hours"], 2)
    today_counts = in_session(today, semester_start, semester_end)
    return SummaryOut(
        window_start=windows[0][0],
        window_end=windows[0][1],
        hours=hours,
        expected_pay=round(totals[0]["pay"], 2),
        shift_count=counts[0],
        in_session=today_counts,
        hours_remaining=None if not today_counts else max(0.0, round(HOURS_CAP - hours, 2)),
        periods=[
            PeriodOut(
                window_start=start,
                window_end=end,
                hours=round(total["hours"], 2),
                pay=round(total["pay"], 2),
                shift_count=counts[index],
            )
            for index, ((start, end), total) in enumerate(zip(windows, totals))
        ],
    )