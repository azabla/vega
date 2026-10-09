# 07 — Deploying to the VPS with Docker (andu.aetechsolution.et)

This guide runs Vega in **Docker** on a VPS that already hosts a Laravel site deployed manually (Nginx + PHP-FPM, no Docker). Both keep working side by side:

- The **host Nginx** stays in charge of ports 80/443, the SSL certificates and the Laravel site. You only add one small config file that forwards `andu.aetechsolution.et` to Vega.
- **Vega runs in three containers** (database, Django, web). Only the web container is published, and only on `127.0.0.1:8010`, so the internet can reach it only through the host Nginx.

Assumptions: Ubuntu 22.04 or 24.04, SSH access as a user with `sudo`, and Nginx already installed. Commands marked **(local)** run on your laptop. Everything else runs on the server.

---

## How it fits together

```
                          Internet
                             │ https://andu.aetechsolution.et
                             ▼
┌──────────────────────────── VPS ─────────────────────────────────┐
│  Host Nginx (80/443, SSL by Certbot) — picks a site by domain    │
│   ├─ your Laravel domain ──► PHP-FPM ──► Laravel     (unchanged) │
│   └─ andu.aetechsolution.et ──► 127.0.0.1:8010                   │
│                                      │                           │
│   ┌──────────── Docker network "vega-prod" ───────────────────┐  │
│   │  web (Nginx)  :80  ◄── published as 127.0.0.1:8010         │  │
│   │   ├─ /              React build (in the image)             │  │
│   │   ├─ /static/       Django admin CSS/JS  (volume "static") │  │
│   │   ├─ /media/        uploads              (volume "media")  │  │
│   │   └─ /api/ /admin/ ─► backend (Gunicorn + Django) :8000    │  │
│   │                          └─► db (PostgreSQL)  (volume "pgdata")│
│   └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Docker concepts used here

| Term | In this project |
|------|-----------------|
| **Image** | A packaged app. `backend` and `web` are built from the Dockerfiles in this repo; `postgres:17-alpine` is downloaded. |
| **Container** | A running image. There are three: `db`, `backend`, `web`. |
| **Volume** | Storage that survives rebuilds and restarts: `pgdata` (database), `media` (uploads), `static` (admin files). **Your data lives here, not in the containers.** |
| **Network** | Compose puts the containers on a private network where they find each other by name (`db`, `backend`). The outside world can't reach it. |
| **Port publishing** | `127.0.0.1:8010:80` means port 8010 on the server's **localhost** maps to port 80 in the `web` container. It is not open to the internet. |
| **Health check** | Docker regularly checks the backend responds. `web` starts only once the backend is healthy, and `deploy.sh` waits for it. |
| **restart: unless-stopped** | Containers come back after a crash or a server reboot, like a systemd service. |

### Files involved

| File | Purpose |
|------|---------|
| [`docker-compose.prod.yml`](../docker-compose.prod.yml) | Defines the 3 services, volumes, health checks and the published port |
| [`.env.prod.example`](../.env.prod.example) | Template for `.env.prod`, the server's secrets (never committed) |
| [`backend/Dockerfile`](../backend/Dockerfile) | Python 3.13 image running as a non-root user. The entrypoint runs `migrate` + `collectstatic` on start. |
| [`frontend/Dockerfile`](../frontend/Dockerfile) (`prod` stage) | Builds the React app, then serves it with Nginx |
| [`frontend/nginx.conf`](../frontend/nginx.conf) | Nginx **inside** the `web` container: SPA routing, static/media, proxy to Django |
| [`deploy/nginx-host-andu.aetechsolution.et.conf`](../deploy/nginx-host-andu.aetechsolution.et.conf) | Nginx site on the **host**: forwards the domain to `127.0.0.1:8010` |
| [`deploy/deploy.sh`](../deploy/deploy.sh) | Update after a `git push` |
| [`deploy/backup.sh`](../deploy/backup.sh) | Nightly database + uploads backup |

> **Why two Nginx?** The host Nginx must stay, because it serves Laravel and owns ports 80/443 and the certificates. The one in the container keeps Vega self-contained: routing, static files and caching travel with the app, and the host only needs a 10-line forwarding config.

---

## Step 0 — Look at the server first

```bash
ssh YOUR_USER@YOUR_SERVER_IP

lsb_release -a                 # Ubuntu version
free -h; df -h /               # RAM and disk. Plan for ~600 MB RAM and a few GB of disk for images.
ls /etc/nginx/sites-enabled/   # existing sites (Laravel)
sudo ss -ltnp | grep 8010      # must print nothing (port free)
docker --version               # already installed?
```

If port 8010 is taken, choose another and set `WEB_PORT` in `.env.prod` and in the host Nginx file.

---

## Step 1 — DNS

In the DNS panel for **aetechsolution.et**, add:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `andu` | your VPS IPv4 address | 300 |

**(local)** Check: `dig +short andu.aetechsolution.et` should print the server IP. SSL (step 7) needs this to work.

---

## Step 2 — Install Docker

Skip this if `docker compose version` already works.

```bash
curl -fsSL https://get.docker.com | sudo sh     # Docker Engine + the compose plugin
sudo usermod -aG docker $USER                   # run docker without sudo
exit                                            # log out and back in so the group applies
```

Back in:

```bash
docker run --rm hello-world
docker compose version
```

Docker installs alongside the existing Nginx/PHP/MySQL without changing them.

> **Docker and the firewall:** a port published as `8010:80` would bypass `ufw` and be open to the world. That's why the compose file publishes **`127.0.0.1:8010`**. Keep the `127.0.0.1:` part.

---

## Step 3 — Get the code

```bash
sudo mkdir -p /opt/vega
sudo chown $USER:$USER /opt/vega
```

**Private repo:** create a read-only deploy key.

```bash
ssh-keygen -t ed25519 -C "vega-deploy" -f ~/.ssh/vega_deploy -N ""
cat ~/.ssh/vega_deploy.pub
```

On GitHub, open **azabla/vega → Settings → Deploy keys → Add deploy key** and paste it, with write access off. Then:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github-vega
    HostName github.com
    User git
    IdentityFile ~/.ssh/vega_deploy
EOF

git clone git@github-vega:azabla/vega.git /opt/vega
```

(Public repo: `git clone https://github.com/azabla/vega.git /opt/vega`.)

---

## Step 4 — Production settings (`.env.prod`)

```bash
cd /opt/vega
cp .env.prod.example .env.prod

python3 -c "import secrets; print(secrets.token_urlsafe(50))"   # → SECRET_KEY
openssl rand -hex 24                                             # → POSTGRES_PASSWORD

nano .env.prod
chmod 600 .env.prod
```

```ini
DOMAIN=andu.aetechsolution.et
SECRET_KEY=PASTE_GENERATED_KEY
ALLOWED_HOSTS=andu.aetechsolution.et
CSRF_TRUSTED_ORIGINS=https://andu.aetechsolution.et
CORS_ALLOWED_ORIGINS=
REGISTRATION_OPEN=false
POSTGRES_PASSWORD=PASTE_GENERATED_PASSWORD
PORTFOLIO_USERNAME=YOUR_USERNAME
WEB_PORT=8010
GUNICORN_WORKERS=2
```

| Setting | Why |
|---------|-----|
| `DOMAIN` | Used by the backend health check |
| `SECRET_KEY` | Signs sessions and tokens. Long, random, unique to production. |
| `ALLOWED_HOSTS` | Django refuses requests for other domains (returns a 400) |
| `CSRF_TRUSTED_ORIGINS` | Lets you log in to `/admin/` over HTTPS |
| `CORS_ALLOWED_ORIGINS` | Empty: the frontend and API share one domain |
| `REGISTRATION_OPEN=false` | Strangers can't sign up. You create accounts yourself. |
| `POSTGRES_PASSWORD` | Used by the `db` container and in Django's database URL (compose builds `DATABASE_URL` for you) |
| `PORTFOLIO_USERNAME` | Whose portfolio `/` shows. Baked into the frontend at build time. |
| `WEB_PORT` | The localhost port the host Nginx forwards to |
| `GUNICORN_WORKERS` | Django processes. 2 suits a small VPS shared with Laravel. |

`DEBUG=False` is forced in the compose file. Production never runs in debug mode.

---

## Step 5 — Build and start

```bash
cd /opt/vega
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

The first build takes a few minutes: it downloads base images, installs Python packages and builds the React app. Then:

1. `db` starts, and its health check waits until PostgreSQL accepts connections;
2. `backend` starts and runs `migrate` (creates the tables) and `collectstatic` (fills the `static` volume), then Gunicorn;
3. once the backend's health check passes, `web` starts.

Check:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
# db and backend "healthy", web "Up", web shows 127.0.0.1:8010->80/tcp

curl -s -H "Host: andu.aetechsolution.et" http://127.0.0.1:8010/api/testview/
# "test"
```

**Save typing** with an alias (add it to `~/.bashrc`):

```bash
alias vega='docker compose -f /opt/vega/docker-compose.prod.yml --env-file /opt/vega/.env.prod'
# then: vega ps · vega logs -f backend · vega restart backend
```

The rest of this guide uses `vega` as that alias.

### Your account and content

```bash
vega exec backend python manage.py createsuperuser
vega exec backend python manage.py seed_portfolio portfolio/seed/vega.json --owner YOUR_USERNAME
```

- Use the same **username** as `PORTFOLIO_USERNAME`, and a **strong password**.
- `seed_portfolio` loads your resume content. Afterwards, edit everything and upload images in `/admin/`.

---

## Step 6 — Host Nginx: forward the domain

```bash
sudo cp /opt/vega/deploy/nginx-host-andu.aetechsolution.et.conf /etc/nginx/sites-available/andu.aetechsolution.et
sudo ln -s /etc/nginx/sites-available/andu.aetechsolution.et /etc/nginx/sites-enabled/

sudo nginx -t                 # ALWAYS test first; it checks the Laravel config too
sudo systemctl reload nginx   # reload, not restart: Laravel keeps serving
```

The file only does `proxy_pass http://127.0.0.1:8010`, plus headers telling Vega the real client IP and that the request came over HTTPS (`X-Forwarded-Proto`). Without that header Django would build `http://` image URLs and the admin's CSRF check would fail.

Nginx matches requests by `server_name`. Your Laravel domain still goes to its own config.

Visit **http://andu.aetechsolution.et**. The site should load, without the padlock for now.

---

## Step 7 — HTTPS

```bash
sudo certbot --nginx -d andu.aetechsolution.et
sudo certbot renew --dry-run
```

When Certbot asks, choose **redirect HTTP to HTTPS**. Certbot edits only this site's file: it adds the 443/SSL block and the redirect, and sets up automatic renewal (certificates last 90 days). If Certbot isn't installed: `sudo apt install -y certbot python3-certbot-nginx`.

Open **https://andu.aetechsolution.et** 🎉

---

## Step 8 — Check everything

| Check | Expected |
|-------|----------|
| `https://andu.aetechsolution.et` | Your portfolio, with the padlock |
| `http://...` | Redirects to https |
| Open `/projects`, then refresh | Still loads |
| `/admin/` | Styled login page. You can log in. |
| Upload a project image in the admin | Shows on the site with an `https://.../media/...` URL |
| Send the contact form | Appears in the admin under *Contacts* |
| `curl -X POST https://andu.aetechsolution.et/api/auth/register/` | `403` (registration closed) |
| `curl -m 5 http://YOUR_SERVER_IP:8010` from **(local)** | Fails or times out (not public) |
| The Laravel site | Works as before |

---

## Updating the site

Pushing to `main` deploys automatically once CI passes (see [09 — CI/CD](09-ci-cd.md)). To deploy by hand, on the server:

```bash
cd /opt/vega && ./deploy/deploy.sh
```

The script:

1. runs `git pull`;
2. runs `up -d --build`, which rebuilds only changed images and recreates only changed containers;
3. lets the backend run migrations and `collectstatic` on start;
4. waits for the backend health check, and stops with a pointer to the logs if it fails;
5. prunes old images to save disk.

Your **data is safe** across updates: it lives in the `pgdata` and `media` volumes, not inside the containers.

**Changing `PORTFOLIO_USERNAME`** needs a frontend rebuild, which `deploy.sh` does: `vega up -d --build web`.

**Rolling back:**

```bash
cd /opt/vega
git log --oneline -5
git checkout <good-commit>
vega up -d --build
# back to normal later: git checkout main && ./deploy/deploy.sh
```

A release that changed the database may need its migration reversed: `vega exec backend python manage.py migrate portfolio <previous_migration>`.

---

## Backups

```bash
/opt/vega/deploy/backup.sh          # test once → ~/backups/vega/
crontab -e
```

```
30 2 * * * /opt/vega/deploy/backup.sh >> $HOME/backups/vega-backup.log 2>&1
```

The script dumps PostgreSQL from inside the `db` container (`pg_dump`), archives the `media` volume through the backend container, and keeps 14 days. Copy backups **off the server** now and then **(local)**: `rsync -az YOUR_USER@SERVER:backups/vega/ ~/vega-backups/`.

Restore:

```bash
vega exec -T db pg_restore -U vega -d vega --clean < ~/backups/vega/db-YYYY-MM-DD.dump
vega exec -T backend tar -xzf - -C /app < ~/backups/vega/media-YYYY-MM-DD.tar.gz
```

> ⚠️ `docker compose down -v` **deletes the volumes**, meaning your database and uploads. Use plain `down` (or `stop`). Add `-v` only when you really want to wipe everything.

---

## Everyday commands

```bash
vega ps                                   # status and health
vega logs -f backend                      # Django/Gunicorn logs (Ctrl+C to stop)
vega logs -f web                          # Nginx (inside container) logs
vega restart backend                      # after editing .env.prod (use "up -d" for compose changes)
vega exec backend python manage.py shell  # Django shell
vega exec db psql -U vega                 # database shell
vega down                                 # stop everything (keeps data)
vega up -d                                # start again
docker system df                          # disk used by images and volumes
```

Host Nginx logs: `sudo tail -f /var/log/nginx/error.log`.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| **502 Bad Gateway** | The `web` container isn't running or is on another port | `vega ps`. `WEB_PORT` must match the host Nginx `proxy_pass`. |
| `web` never starts | Backend unhealthy | `vega logs backend`. Usually a bad `.env.prod` value or the DB password changed after the first start (see below). |
| **400 Bad Request** | Domain missing from `ALLOWED_HOSTS` | Fix `.env.prod`, then `vega up -d` |
| Admin: **CSRF verification failed** | `CSRF_TRUSTED_ORIGINS` wrong, or the host Nginx lacks `X-Forwarded-Proto` | Check both |
| Admin has no styling | `static` volume empty | `vega restart backend` (re-runs collectstatic) |
| Image URLs start with `http://` | `X-Forwarded-Proto` not passed by the host Nginx | Use the provided host config |
| Upload fails with **413** | File over 20 MB | Raise `client_max_body_size` in **both** the host and `frontend/nginx.conf` |
| Backend can't log in to the DB after you changed `POSTGRES_PASSWORD` | Postgres only applies the password when the volume is first created | Set it back, or change it inside the DB: `vega exec db psql -U vega -c "ALTER USER vega PASSWORD '...'"` |
| Build killed / very slow | Low RAM during `npm`/`pip` | Add swap: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |
| Disk filling up | Old images and build cache | `docker image prune -f`, `docker builder prune -f` |
| Laravel site broke | Host Nginx config error | `sudo nginx -t` shows the file and line |

---

## Security notes

- The only public ports are SSH, 80 and 443 (`sudo ufw status`). Django and PostgreSQL are reachable only inside the Docker network, and `web` only on localhost.
- Containers restart automatically. The backend runs as a non-root user.
- Production forces `DEBUG=False` and needs a unique `SECRET_KEY` and a strong admin password. `.env.prod` is `chmod 600` and git-ignored.
- Registration is closed (`REGISTRATION_OPEN=false`) until Vega becomes a public SaaS.
- HSTS is not enabled. It forces browsers to use HTTPS forever, and with `includeSubDomains` it would affect other `aetechsolution.et` subdomains. Add it only once you're sure.
- Rotate or delete the old Render database. Its password was exposed earlier.
- Keep the host updated (`sudo apt update && sudo apt upgrade`), and rebuild occasionally (`vega build --pull && vega up -d`) to pick up base-image security fixes.

---

## Local testing of the production stack

The same stack runs on a laptop **(local)**, which is how it was verified before writing this guide:

```bash
cp .env.prod.example .env.prod   # fill in values; WEB_PORT must be free
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
curl -H "Host: andu.aetechsolution.et" -H "X-Forwarded-Proto: https" http://127.0.0.1:8010/api/u/YOUR_USERNAME/profile/
docker compose -f docker-compose.prod.yml --env-file .env.prod down -v   # -v wipes the test data
```

For day-to-day development, keep using `docker-compose.yml` (hot reload) or the non-Docker setup in the [README](README.md).
