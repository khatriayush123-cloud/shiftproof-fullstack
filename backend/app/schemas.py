"""Request and response models (Pydantic v2); field limits mirror sql/schema.sql."""
from __future__ import annotations

from datetime import date, datetime, time
from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator

from app.pay import shift_span_minutes

Award = Literal["MA000003", "MA000119", "MA000009"]
VisaType = Literal["student_500", "other"]
ShiftStatus = Literal["clear", "caution", "over", "unlimited"]
EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class HealthOut(BaseModel):
    status: str

class MessageOut(BaseModel):
    message: str

class Breakdown(BaseModel):
    base_rate: float
    casual_loading: float
    loaded_rate: float
    multiplier: float
    multiplier_label: str
    hourly_rate: float

class SignupIn(BaseModel):
    full_name: str = Field(min_length=1, max_length=80)
    email: str = Field(pattern=EMAIL_PATTERN, max_length=254)
    password: str = Field(min_length=8, max_length=128)
    consent: Literal[True]  # consent must be true

class LoginIn(BaseModel):
    email: str = Field(pattern=EMAIL_PATTERN, max_length=254)
    password: str = Field(min_length=1, max_length=128)

class ProfilePatch(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    award: Optional[Award] = None
    classification: Optional[int] = Field(default=None, ge=1, le=5)
    visa_type: Optional[VisaType] = None
    semester_start: Optional[date] = None
    semester_end: Optional[date] = None
    base_rate: Optional[float] = Field(default=None, ge=1, le=200)
    casual_loading: Optional[float] = Field(default=None, ge=0, le=100)
    saturday_multiplier: Optional[float] = Field(default=None, ge=1, le=5)
    sunday_multiplier: Optional[float] = Field(default=None, ge=1, le=5)
    public_holiday_multiplier: Optional[float] = Field(default=None, ge=1, le=5)
    setup_complete: Optional[bool] = None

    @model_validator(mode="after")
    def _semester_pair(self) -> "ProfilePatch":
        has_start = "semester_start" in self.model_fields_set
        has_end = "semester_end" in self.model_fields_set
        if has_start != has_end:
            raise ValueError("semester_start and semester_end must be set together")
        if self.semester_start and self.semester_end and self.semester_end < self.semester_start:
            raise ValueError("semester_end must be on or after semester_start")
        return self

class ProfileOut(BaseModel):
    id: str
    full_name: Optional[str] = None
    award: Optional[Award] = None
    classification: Optional[int] = None
    visa_type: Optional[VisaType] = None
    semester_start: Optional[date] = None
    semester_end: Optional[date] = None
    base_rate: float
    casual_loading: float
    saturday_multiplier: float
    sunday_multiplier: float
    public_holiday_multiplier: float
    setup_complete: bool
    consent_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class MeOut(BaseModel):
    email: str
    profile: ProfileOut

class ShiftFields(BaseModel):
    shift_date: date
    employer: str = Field(min_length=1, max_length=80)
    start_time: time
    finish_time: time
    unpaid_break_minutes: int = Field(default=0, ge=0, le=600)
    is_public_holiday: bool = False

class ShiftIn(ShiftFields):
    @model_validator(mode="after")
    def _break_fits(self) -> "ShiftIn":
        if self.unpaid_break_minutes >= shift_span_minutes(self.start_time, self.finish_time):
            raise ValueError("unpaid break must be shorter than the shift")
        return self

class ShiftCheckIn(ShiftIn):
    employer: Optional[str] = Field(default=None, min_length=1, max_length=80)  # preview runs before it is typed

class ShiftPatch(BaseModel):
    shift_date: Optional[date] = None
    employer: Optional[str] = Field(default=None, min_length=1, max_length=80)
    start_time: Optional[time] = None
    finish_time: Optional[time] = None
    unpaid_break_minutes: Optional[int] = Field(default=None, ge=0, le=600)
    is_public_holiday: Optional[bool] = None

class ShiftOut(ShiftFields):
    id: str
    created_at: datetime
    hours: float
    pay: float
    breakdown: Breakdown

class CheckOut(BaseModel):
    hours: float
    pay: float
    breakdown: Breakdown
    window_start: date
    window_end: date
    current_hours: float
    projected_hours: float
    cap: int = 48
    in_session: bool
    over_by: float
    status: ShiftStatus

class PeriodOut(BaseModel):
    window_start: date
    window_end: date
    hours: float
    pay: float
    shift_count: int

class SummaryOut(BaseModel):
    window_start: date
    window_end: date
    hours: float
    expected_pay: float
    shift_count: int
    in_session: bool
    hours_remaining: Optional[float] = None
    periods: list[PeriodOut]
