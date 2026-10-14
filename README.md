# ShiftProof

Know what you're owed. Know you're still legal.

ShiftProof helps casual hospitality workers on Australian student visas check, before accepting a shift, what it should pay under their award and whether it would push them past the 48-hour limit in any rolling 14-day window.

## Architecture

```
React (Vite) frontend  ──/api──▶  FastAPI backend (Vercel Python function)  ──▶  Supabase (Auth + Postgres, Sydney)
```

- `frontend/` – React 19 + Vite + Tailwind CSS. Talks only to the backend, on the same origin.
- `backend/` – FastAPI. Pay and rolling-fortnight calculations run here, the single source of truth.
- `api/index.py` – Vercel entry point that loads the FastAPI app.
- `backend/sql/schema.sql` – tables, row-level security policies, and triggers.

## Security

- Supabase credentials live only in environment variables (`backend/.env` locally, Vercel project settings in production). `.env` is never committed.
- The deployed app holds only the Supabase URL and publishable key. Every data request forwards the signed-in user's own token, so Postgres row-level security limits each user to their own rows.
- The session is stored in httpOnly, Secure cookies that JavaScript cannot read. Nothing is stored in localStorage.

## Run locally

```powershell
# Terminal 1 – backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env   # then fill in the values
python setup_database.py
uvicorn app.main:app --reload --port 8000

# Terminal 2 – frontend
cd frontend
npm install
npm run dev
```
