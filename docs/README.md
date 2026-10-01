# Vega docs

One document per piece of work, in the order it was done.

| # | Doc | What it covers |
|---|-----|----------------|
| 01 | [Bug fixes](01-bug-fixes.md) | Backend and frontend bugs fixed before the SaaS work |
| 02 | [Docker](02-docker.md) | Running the full stack (Postgres + Django + Vite) with Docker Compose |
| 03 | [Custom user & auth API](03-auth.md) | `accounts.User` model and the JWT auth endpoints |

## Quick start

```bash
docker compose up --build
# backend:  http://localhost:8000/api/
# frontend: http://localhost:5173
# admin:    http://localhost:8000/admin/
docker compose exec backend python manage.py createsuperuser
```

## Running locally (without Docker)

The system Python has no `ensurepip`, so create the venv with [uv](https://docs.astral.sh/uv/):

```bash
# backend — uses DATABASE_URL=sqlite:///dev.sqlite3 from backend/.env
cd backend
uv venv --seed -p 3.13 env
uv pip install -p env/bin/python -r requirements.txt
env/bin/python manage.py migrate
env/bin/python manage.py createsuperuser
env/bin/python manage.py runserver 127.0.0.1:8001   # 8000 is used by another project

# frontend (new terminal)
cd frontend
npm install
VITE_API_URL=http://127.0.0.1:8001/api npm run dev
```

> Never point a local `.env` at the production database. The Render URL is kept commented out in `backend/.env`.

Run the backend tests:

```bash
docker compose exec backend python manage.py test
```

If a port is already in use on your machine:

```bash
BACKEND_PORT=8001 FRONTEND_PORT=5174 DB_PORT=5434 docker compose up
```
