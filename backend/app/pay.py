"""Pure pay calculation - no I/O, no globals.

Note: real award rates vary by classification and by award, so ShiftProof
lets users enter their own base rate from their payslip; this module only
applies the casual loading and the day multipliers on top of it."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, time
from typing import Any, Mapping

HOURS_DECIMALS = 2


@dataclass(frozen=True)
class PaySettings:
    base_rate: float
    casual_loading: float
    saturday_multiplier: float
    sunday_multiplier: float
    public_holiday_multiplier: float

    @classmethod
    def from_profile(cls, profile: Mapping[str, Any]) -> "PaySettings":
        return cls(
            base_rate=float(profile["base_rate"]),
            casual_loading=float(profile["casual_loading"]),
            saturday_multiplier=float(profile["saturday_multiplier"]),
            sunday_multiplier=float(profile["sunday_multiplier"]),
            public_holiday_multiplier=float(profile["public_holiday_multiplier"]),
        )


def shift_span_minutes(start_time: time, finish_time: time) -> float:
    """Raw span in minutes; finish <= start means the shift crosses midnight."""
    start = start_time.hour * 60 + start_time.minute + start_time.second / 60
    finish = finish_time.hour * 60 + finish_time.minute + finish_time.second / 60
    span = finish - start
    return span + 24 * 60 if span <= 0 else span


def calculate_hours(start_time: time, finish_time: time, unpaid_break_minutes: int) -> float:
    worked = shift_span_minutes(start_time, finish_time) - unpaid_break_minutes
    return round(max(worked, 0.0) / 60, HOURS_DECIMALS)


def multiplier_for(
    shift_date: date, is_public_holiday: bool, settings: PaySettings
) -> tuple[float, str]:
    if is_public_holiday:
        return settings.public_holiday_multiplier, "public holiday"
    weekday = shift_date.weekday()  # Monday == 0 ... Sunday == 6
    if weekday == 6:
        return settings.sunday_multiplier, "sunday"
    if weekday == 5:
        return settings.saturday_multiplier, "saturday"
    return 1.0, "weekday"


def calculate_pay(
    shift_date: date,
    start_time: time,
    finish_time: time,
    unpaid_break_minutes: int,
    is_public_holiday: bool,
    settings: PaySettings,
) -> dict[str, Any]:
    """Return {hours, pay, breakdown} so the UI can show its working."""
    hours = calculate_hours(start_time, finish_time, unpaid_break_minutes)
    multiplier, label = multiplier_for(shift_date, is_public_holiday, settings)
    loaded_rate = settings.base_rate * (1 + settings.casual_loading / 100)
    hourly_rate = loaded_rate * multiplier
    pay = round(hours * hourly_rate, 2)
    return {
        "hours": hours,
        "pay": pay,
        "breakdown": {
            "base_rate": settings.base_rate,
            "casual_loading": settings.casual_loading,
            "loaded_rate": round(loaded_rate, 4),
            "multiplier": multiplier,
            "multiplier_label": label,
            "hourly_rate": round(hourly_rate, 4),
        },
    }
