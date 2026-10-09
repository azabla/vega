# Vega docs

One document per piece of work, in the order it was done.

| # | Doc | What it covers |
|---|-----|----------------|
| 00 | [Product vision](00-product-vision.md) | Where Vega is going: one master profile → portfolio, CV, Career Passport |
| 01 | [Bug fixes](01-bug-fixes.md) | Backend and frontend bugs fixed before the SaaS work |
| 02 | [Docker](02-docker.md) | Running the full stack (Postgres + Django + Vite) with Docker Compose |
| 03 | [Custom user & auth API](03-auth.md) | `accounts.User` model and the JWT auth endpoints |
| 04 | [Multi-tenancy](04-multi-tenancy.md) | One portfolio per user: owner fields, public `/api/u/<username>/` and owner `/api/me/` APIs, importing data |
| 05 | [Master profile v1](05-master-profile.md) | Skills with evidence, education, certificates, project pages |
| 06 | [Redesign & seed data](06-design-and-seed.md) | Design system, components and skeletons; `seed_portfolio` with my real projects |
| 07 | [Deploying to the VPS](07-deployment-vps.md) | Step-by-step Docker deployment next to the existing Laravel site: `docker-compose.prod.yml`, host Nginx + HTTPS, updates, backups |
| 08 | [Owner dashboard](08-dashboard.md) | Login/signup and mobile-first editing of the whole portfolio at `/dashboard` |
| 08b | [UI design system](08-ui-design-system.md) | "The Living Résumé": themes, pages, components, owner look settings |
| 09 | [CI/CD](09-ci-cd.md) | GitHub Actions: backend tests, lint, build and image checks on every push/PR; auto-deploy of `main` to the VPS |
| 10 | [Appearance & UI polish](10-appearance-and-ui-polish.md) | Design system fully wired in; owners pick theme, fonts, layouts, sections and pages at `/dashboard/appearance` with a live preview |

## Quick start

```bash
docker compose up --build
# backend:  http://localhost:8000/api/
# frontend: http://localhost:5173
# admin:    http://localhost:8000/admin/
docker compose exec backend python manage.py createsuperuser
# or sign up at http://localhost:5173/register and edit at /dashboard
```

## Running locally (without Docker)

The system Python has no `ensurepip`, so create the venv with [uv](https://docs.astral.sh/uv/):

```bash
# backend — uses DATABASE_URL=sqlite:///dev.sqlite3 from backend/.env
cd backend
uv venv --seed -p 3.13 venv
uv pip install -p venv/bin/python -r requirements.txt
venv/bin/python manage.py migrate
venv/bin/python manage.py createsuperuser
venv/bin/python manage.py seed_portfolio portfolio/seed/vega.json --owner <username>  # optional sample content
venv/bin/python manage.py runserver 127.0.0.1:8001   # 8000 is used by another project

# frontend (new terminal)
cd frontend
npm install
VITE_API_URL=http://127.0.0.1:8001/api npm run dev
```

Open `http://localhost:5173/u/<username>` (or `/` for `VITE_PORTFOLIO_USERNAME`).

> Never point a local `.env` at the production database. The Render URL is kept commented out in `backend/.env`.

Run the backend tests:

```bash
docker compose exec backend python manage.py test
```

If a port is already in use on your machine:

```bash
BACKEND_PORT=8001 FRONTEND_PORT=5174 DB_PORT=5434 docker compose up
```
