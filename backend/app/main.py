"""ShiftProof API. Every router is mounted under /api.

Security model: the backend never holds a credential that bypasses row-level
security. Each request forwards the signed-in user's own Supabase access
token, so Postgres RLS enforces ownership; this app adds validation plus the
pay and fortnight calculations on top. No CORS middleware: the frontend
reaches the API on the same origin (Vite proxy locally, Vercel routing in
production)."""
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app import config
from app.routers import account, auth, profile, shifts, summary
from app.schemas import HealthOut
from app.session import ACCESS_COOKIE, REFRESH_COOKIE
from app.supabase import SupabaseClient, SupabaseError


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    http_client = httpx.AsyncClient(timeout=10.0)
    app.state.supabase = SupabaseClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, http_client)
    try:
        yield
    finally:
        await http_client.aclose()


app = FastAPI(title="ShiftProof API", lifespan=lifespan)

for _router in (auth.router, profile.router, shifts.router, summary.router, account.router):
    app.include_router(_router, prefix="/api")


@app.get("/api/health", response_model=HealthOut)
async def health() -> HealthOut:
    """Liveness only: no auth, no Supabase call."""
    return HealthOut(status="ok")


@app.exception_handler(SupabaseError)
async def supabase_error_handler(request: Request, exc: SupabaseError) -> JSONResponse:
    """Upstream failures become clean messages; raw Supabase bodies never leak."""
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = [
        {
            "field": ".".join(
                str(part) for part in error.get("loc", []) if isinstance(part, str) and part != "body"
            ) or "body",
            "message": error.get("msg", "invalid"),
        }
        for error in exc.errors()
    ]
    return JSONResponse(status_code=400, content={"detail": "validation failed", "errors": errors})


@app.exception_handler(HTTPException)
async def http_error_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """A 401 clears the session cookies so the browser stops retrying a
    dead session (cookies set inside a dependency would be lost otherwise)."""
    response = JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    if exc.status_code == 401:
        response.delete_cookie(ACCESS_COOKIE, path="/")
        response.delete_cookie(REFRESH_COOKIE, path="/")
    return response
