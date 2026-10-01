# 02 — Docker

The whole stack runs in Docker Compose. You don't need a local Python virtualenv, Node, or Postgres.

## Files

```
docker-compose.yml        # dev stack: db + backend + frontend
backend/Dockerfile        # Python 3.13 slim, runs gunicorn by default
backend/entrypoint.sh     # runs migrate + collectstatic, then the command
backend/.dockerignore
frontend/Dockerfile       # multi-stage: dev (vite) → build → prod (nginx)
frontend/nginx.conf       # SPA fallback + long cache for /assets
frontend/.dockerignore
```

## Services (`docker-compose.yml`)

The compose project is named **`vega-portfolio`**, so containers, images, and volumes are called `vega-portfolio-*`. Use a unique name in every project. Two projects that share a name (for example, both folders called `vega`) overwrite each other's images on `docker compose build`.

| Service | Image | Host port | Notes |
|---------|-------|-----------|-------|
| `db` | `postgres:17-alpine` | `${DB_PORT:-5433}` | Data persists in the `pgdata` volume. Has a healthcheck so the backend waits for it. |
| `backend` | `./backend` | `${BACKEND_PORT:-8000}` | Runs `manage.py runserver`. `./backend` is mounted, so code changes reload automatically. |
| `frontend` | `./frontend` (target `dev`) | `${FRONTEND_PORT:-5173}` | Vite dev server with hot reload. `node_modules` lives in a container volume. |

### Environment

Compose sets the backend environment directly. **`DATABASE_URL` always points to the local `db` container**, even though `backend/.env` is visible in the mounted folder. `django-environ`'s `read_env()` does not override variables that are already set, so the production database in `.env` is never touched by `docker compose`.

## Common commands

```bash
docker compose up --build                 # start everything
docker compose up -d                      # start in background
docker compose logs -f backend            # follow backend logs
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py shell
docker compose exec backend python manage.py test
docker compose down                       # stop (keeps DB data)
docker compose down -v                    # stop AND delete DB data
```

Installed a new Python or npm package? Rebuild that service:

```bash
docker compose build backend   # after editing requirements.txt
docker compose build frontend  # after editing package.json
docker compose up -d --renew-anon-volumes frontend   # refresh node_modules volume
```

## Port conflicts

All host ports are configurable. Example when another project already uses 8000 and 5432:

```bash
BACKEND_PORT=8001 docker compose up
```

`VITE_API_URL` follows `BACKEND_PORT` automatically. Add new frontend origins to `CORS_ALLOWED_ORIGINS` if you change `FRONTEND_PORT`.

## Production images

The backend image runs as a non-root `app` user. Its default command is gunicorn:

```bash
docker build -t vega-backend ./backend
docker run --env-file backend/.env -p 8000:8000 vega-backend
```

The frontend production image bakes the API URL in at build time:

```bash
docker build --target prod --build-arg VITE_API_URL=https://api.example.com/api -t vega-frontend ./frontend
docker run -p 80:80 vega-frontend
```

> Uploaded media is stored in `/app/media` inside the backend container. For production, either mount a volume there or (planned) move media to S3/R2 with `django-storages`.
