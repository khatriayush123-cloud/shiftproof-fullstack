"""Thin async client for Supabase Auth and PostgREST.

Every data call carries the signed-in user's access token so Postgres
row-level security decides which rows are visible; the backend never holds a
credential that bypasses RLS. Nothing here logs tokens, keys or bodies."""
from __future__ import annotations

from typing import Any, Mapping, Sequence

import httpx

Params = Mapping[str, str] | Sequence[tuple[str, str]]


class SupabaseError(Exception):
    """An upstream failure, already mapped to a clean message and status."""

    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message


def _classify(response: httpx.Response) -> SupabaseError:
    """Map a Supabase error response to a clean message.

    Raw upstream bodies are never forwarded to the client."""
    hint = ""
    try:
        body = response.json()
        hint = f"{body.get('error_code', '')} {body.get('msg', '')}".lower()
    except ValueError:
        pass
    if "already" in hint and ("registered" in hint or "exist" in hint):
        return SupabaseError(409, "an account with that email already exists")
    if response.status_code in (401, 403):
        return SupabaseError(401, "not signed in")
    if response.status_code == 404:
        return SupabaseError(404, "not found")
    if response.status_code < 500:
        return SupabaseError(400, "invalid request")
    return SupabaseError(502, "upstream service unavailable")


def _session(result: Any) -> dict[str, Any]:
    """Normalise GoTrue signup/login/refresh payloads.

    A session exists only when Supabase signs the user in immediately; with
    email confirmation on, signup returns just the user object."""
    if isinstance(result, dict) and result.get("access_token"):
        return {"session": result, "user": result.get("user", {})}
    if isinstance(result, dict) and "session" in result:
        return {"session": result.get("session"), "user": result.get("user", {})}
    return {"session": None, "user": result if isinstance(result, dict) else {}}


class SupabaseClient:
    def __init__(self, base_url: str, anon_key: str, http: httpx.AsyncClient) -> None:
        self._base = base_url.rstrip("/")
        self._key = anon_key
        self._http = http

    async def _call(
        self,
        method: str,
        url: str,
        token: str | None = None,
        *,
        params: Params | None = None,
        json_body: Mapping[str, Any] | None = None,
        prefer: str | None = None,
    ) -> Any:
        headers = {"apikey": self._key}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        if prefer:
            headers["Prefer"] = prefer
        try:
            response = await self._http.request(
                method, url, params=params, json=json_body, headers=headers
            )
        except httpx.HTTPError as exc:
            raise SupabaseError(502, "upstream service unavailable") from exc
        if response.status_code >= 400:
            raise _classify(response)
        if response.status_code == 204 or not response.content:
            return None
        return response.json()

    async def signup(self, email: str, password: str, full_name: str) -> dict[str, Any]:
        body = await self._call(
            "POST",
            f"{self._base}/auth/v1/signup",
            json_body={"email": email, "password": password, "data": {"full_name": full_name}},
        )
        return _session(body)

    async def login(self, email: str, password: str) -> dict[str, Any]:
        body = await self._call(
            "POST",
            f"{self._base}/auth/v1/token?grant_type=password",
            json_body={"email": email, "password": password},
        )
        return _session(body)

    async def refresh(self, refresh_token: str) -> dict[str, Any]:
        body = await self._call(
            "POST",
            f"{self._base}/auth/v1/token?grant_type=refresh_token",
            json_body={"refresh_token": refresh_token},
        )
        return _session(body)

    async def logout(self, token: str) -> None:
        await self._call("POST", f"{self._base}/auth/v1/logout", token)

    async def get_user(self, token: str) -> dict[str, Any]:
        body = await self._call("GET", f"{self._base}/auth/v1/user", token)
        return body or {}

    async def rest(
        self,
        method: str,
        path: str,
        token: str,
        *,
        params: Params | None = None,
        json_body: Mapping[str, Any] | None = None,
        prefer: str | None = None,
    ) -> Any:
        return await self._call(
            method,
            f"{self._base}/rest/v1{path}",
            token,
            params=params,
            json_body=json_body,
            prefer=prefer,
        )

    async def rpc(self, name: str, token: str, json_body: Mapping[str, Any] | None = None) -> Any:
        return await self._call(
            "POST",
            f"{self._base}/rest/v1/rpc/{name}",
            token,
            json_body=json_body if json_body is not None else {},
        )
