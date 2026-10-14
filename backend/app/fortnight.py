"""Pure rolling-window and semester logic.

The 48-hour cap is a student-visa condition tied to study periods: it counts
only shifts made while a semester runs (or always, when no semester dates are
set), so during breaks hours are unlimited."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any, Iterable, Mapping

WINDOW_DAYS = 14
HOURS_CAP = 48
CAUTION_AT = 40


@dataclass(frozen=True)
class ShiftHours:
    shift_date: date
    hours: float


def in_session(day: date, semester_start: date | None, semester_end: date | None) -> bool:
    """True when the day counts toward the 48-hour cap."""
    if semester_start is None or semester_end is None:
        return True
    return semester_start <= day <= semester_end


def window_bounds(end_date: date) -> tuple[date, date]:
    """The 14-day window ending on end_date, both ends inclusive."""
    return end_date - timedelta(days=WINDOW_DAYS - 1), end_date


def semester_dates(profile: Mapping[str, Any]) -> tuple[date | None, date | None]:
    start = date.fromisoformat(profile["semester_start"]) if profile.get("semester_start") else None
    end = date.fromisoformat(profile["semester_end"]) if profile.get("semester_end") else None
    return start, end


def rolling_hours(
    shifts: Iterable[ShiftHours],
    end_date: date,
    semester_start: date | None,
    semester_end: date | None,
) -> float:
    """In-session hours in the window ending on end_date.

    The semester dates travel with (shifts, end_date) because only they say
    which shifts count toward the cap."""
    start, end = window_bounds(end_date)
    counted = (
        s.hours
        for s in shifts
        if start <= s.shift_date <= end
        and in_session(s.shift_date, semester_start, semester_end)
    )
    return round(sum(counted), 2)


def period_windows(end_date: date, count: int = 6) -> list[tuple[date, date]]:
    """The current window plus the `count - 1` windows before it."""
    windows: list[tuple[date, date]] = []
    end = end_date
    for _ in range(count):
        windows.append(window_bounds(end))
        end -= timedelta(days=WINDOW_DAYS)
    return windows
