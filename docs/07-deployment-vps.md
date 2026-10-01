# 07 — Deploying to the VPS (andu.aetechsolution.et)

This guide deploys Vega **without Docker**, the same way the Laravel project on this server already runs: Nginx in front, the app as a system service. The Laravel site keeps working untouched. Each site gets its own Nginx config and its own port, and Nginx picks the right one by domain name.

Assumptions: Ubuntu 22.04 or 24.04, you can SSH in as a user with `sudo`, and Nginx is already installed (it serves the Laravel site). Commands marked **(local)** run on your laptop. Everything else runs on the server.

---

## How it fits together

```
                         Internet
                            │  https://andu.aetechsolution.et
                            ▼
┌───────────────────────── VPS ─────────────────────────────────┐
│  Nginx (ports 80/443) — picks a site by domain name           │
│   ├─ your Laravel domain → PHP-FPM → Laravel     (unchanged)  │
│   └─ andu.aetechsolution.et                                   │
│        ├─ /            → frontend/dist (React build, static)  │
│        ├─ /assets/     → frontend/dist/assets (cached 1 year) │
│        ├─ /api/ /admin/→ Gunicorn 127.0.0.1:8010 → Django     │
│        ├─ /static/     → backend/staticfiles (admin CSS/JS)   │
│        └─ /media/      → backend/media (uploads)              │
│                                                               │
│  Gunicorn (systemd service "vega") ──► PostgreSQL (local)     │
└───────────────────────────────────────────────────────────────┘
```

Key ideas:

- **Nginx** is the only thing exposed to the internet. It serves static files directly (fast) and forwards `/api/` and `/admin/` to Django.
- **Gunicorn** is the production server for Django, replacing `runserver`. It listens on `127.0.0.1:8010`, which is reachable only from inside the server.
- **systemd** keeps Gunicorn running: it starts at boot and restarts after a crash, much like PHP-FPM for Laravel.
- The **frontend and API share one domain**. The React app calls `/api/...` on the same origin, so no CORS setup is needed.
- **PostgreSQL** runs locally on the server, separate from the Laravel database (MySQL can keep running next to it).

The files you'll install are in the repo under [`deploy/`](../deploy):

| File | Goes to | Purpose |
|------|---------|---------|
| `nginx-andu.aetechsolution.et.conf` | `/etc/nginx/sites-available/andu.aetechsolution.et` | Nginx site |
| `vega.service` | `/etc/systemd/system/vega.service` | Runs Gunicorn |
| `deploy.sh` | used in place | Updates the site after a `git push` |
| `backup.sh` | used in place (cron) | Nightly database + uploads backup |

---

## Step 0 — Look at the server first

Get to know what's already there, so you don't collide with the Laravel setup.

```bash
ssh YOUR_USER@YOUR_SERVER_IP

lsb_release -a                 # Ubuntu version
free -h                        # RAM (Gunicorn with 2 workers needs ~200 MB)
ls /etc/nginx/sites-enabled/   # existing sites (your Laravel one is here)
sudo ss -ltnp                  # ports in use: 8010 must be free
sudo nginx -t                  # current config is valid?
```

If something already listens on **8010**, pick another free port and use it in both `vega.service` and the Nginx file.

---

## Step 1 — DNS: point the subdomain at the server

In the DNS panel for **aetechsolution.et**, add:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `andu` | your VPS IPv4 address | 300 |

(Add an `AAAA` record too if the server has IPv6.)

Check it from your laptop **(local)**. It can take a few minutes:

```bash
dig +short andu.aetechsolution.et     # should print the VPS IP
```

SSL (step 9) won't work until this resolves.

---

## Step 2 — Install what's missing

```bash
sudo apt update
sudo apt install -y git postgresql postgresql-contrib nginx certbot python3-certbot-nginx
```

Nginx and Certbot are probably already installed for Laravel. Apt will just skip them.

**Python 3.13 with uv.** Django 6 needs Python 3.12 or newer, and Ubuntu 22.04 only ships 3.10. `uv` installs its own Python without touching the system's (the same tool used locally):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc                 # puts ~/.local/bin on PATH
uv --version
```

**Node.js 20+** to build the React app. Skip this if `node -v` already shows 20 or newer:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v
```

---

## Step 3 — Create the PostgreSQL database

PostgreSQL has its own users ("roles"). Create one for Vega with a strong password:

```bash
# generate a password and keep it somewhere safe
openssl rand -base64 24

sudo -u postgres psql
```

In the `psql` prompt:

```sql
CREATE USER vega WITH PASSWORD 'PASTE_THE_PASSWORD';
CREATE DATABASE vega OWNER vega;
\q
```

Test the login:

```bash
psql -h 127.0.0.1 -U vega -d vega -c "select 1;"
```

PostgreSQL listens only on localhost by default, so it isn't reachable from the internet. Keep it that way.

---

## Step 4 — Get the code onto the server

The app lives at `/var/www/vega`, next to your Laravel project.

```bash
sudo mkdir -p /var/www/vega
sudo chown $USER:www-data /var/www/vega
```

**If the GitHub repo is private,** give the server read-only access with a **deploy key**:

```bash
ssh-keygen -t ed25519 -C "vega-deploy" -f ~/.ssh/vega_deploy -N ""
cat ~/.ssh/vega_deploy.pub
```

On GitHub, open **azabla/vega → Settings → Deploy keys → Add deploy key** and paste the key. Leave "write access" off. Then tell SSH to use it:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github-vega
    HostName github.com
    User git
    IdentityFile ~/.ssh/vega_deploy
EOF

git clone git@github-vega:azabla/vega.git /var/www/vega
```

(For a public repo, `git clone https://github.com/azabla/vega.git /var/www/vega` is enough.)

---

## Step 5 — Set up the backend

```bash
cd /var/www/vega/backend
uv venv --seed -p 3.13 venv
uv pip install -p venv/bin/python -r requirements.txt
```

### 5.1 The production `.env`

This file holds secrets. It stays on the server and is never committed.

```bash
cp .env.example .env
python3 -c "import secrets; print(secrets.token_urlsafe(50))"   # → SECRET_KEY
nano .env
```

```ini
DEBUG=False
SECRET_KEY=PASTE_THE_GENERATED_KEY
ALLOWED_HOSTS=andu.aetechsolution.et
DATABASE_URL=postgres://vega:THE_DB_PASSWORD@127.0.0.1:5432/vega
CORS_ALLOWED_ORIGINS=
CSRF_TRUSTED_ORIGINS=https://andu.aetechsolution.et
REGISTRATION_OPEN=false
```

What each line does:

| Setting | Why |
|---------|-----|
| `DEBUG=False` | **Never `True` in production.** Debug pages leak code and settings. It also turns on secure cookies and trust of Nginx's HTTPS header. |
| `SECRET_KEY` | Signs sessions and tokens. Long, random, and different from your local key. |
| `ALLOWED_HOSTS` | Django rejects requests for other domains (returns a 400). |
| `DATABASE_URL` | The database from step 3. If the password contains `@ : / #`, URL-encode them. |
| `CORS_ALLOWED_ORIGINS` | Empty: the frontend is on the same domain. |
| `CSRF_TRUSTED_ORIGINS` | Needed for logging in to `/admin/` over HTTPS. |
| `REGISTRATION_OPEN=false` | Strangers can't create accounts through `/api/auth/register/`. You create users yourself. |

Restrict who can read it:

```bash
chmod 640 .env
```

### 5.2 Database tables, static files, your account

```bash
venv/bin/python manage.py migrate
venv/bin/python manage.py collectstatic --noinput
venv/bin/python manage.py check --deploy
venv/bin/python manage.py createsuperuser
```

- `migrate` creates all tables in PostgreSQL.
- `collectstatic` copies the admin's CSS/JS into `backend/staticfiles/`, which Nginx serves.
- `check --deploy` should show at most the HSTS and SSL-redirect warnings. Both are handled by Nginx and Certbot (see Security notes).
- `createsuperuser`: pick your public **username** (e.g. `andu` or `vega`). It appears in URLs like `/u/andu`. Use a **strong password**. This is the internet, not your laptop.

### 5.3 Fill in your portfolio

```bash
venv/bin/python manage.py seed_portfolio portfolio/seed/vega.json --owner YOUR_USERNAME
```

This loads your resume content (profile, experience, education, skills, projects). After that, edit everything in the admin. Images (profile photo, project thumbnails, CV) are uploaded there too.

### 5.4 Try Gunicorn by hand

```bash
venv/bin/gunicorn core.wsgi:application --bind 127.0.0.1:8010
```

In a second SSH session:

```bash
curl -s -H "Host: andu.aetechsolution.et" http://127.0.0.1:8010/api/u/YOUR_USERNAME/profile/ | head -c 200
```

If you see your profile JSON, it works. Stop Gunicorn with `Ctrl+C`.

---

## Step 6 — Run Django as a service (systemd)

```bash
sudo cp /var/www/vega/deploy/vega.service /etc/systemd/system/vega.service
sudo nano /etc/systemd/system/vega.service      # replace YOUR_USER with your Linux user (whoami)

sudo systemctl daemon-reload
sudo systemctl enable --now vega                # start now and on every boot
sudo systemctl status vega                      # should say "active (running)"
```

What the service does: it runs Gunicorn from the virtualenv with 2 worker processes, as your user, in the `www-data` group so Nginx can read the files. If it crashes, systemd restarts it after 5 seconds.

Useful commands:

```bash
sudo journalctl -u vega -f          # live logs (requests and errors)
sudo systemctl restart vega         # after changing .env or code
```

> **Workers:** 2 suits a small VPS that also runs Laravel. A common rule is `2 × CPU cores + 1`; check memory with `free -h` before raising it.

---

## Step 7 — Build the frontend

The frontend reads its build settings from `frontend/.env.production`. It's git-ignored, so create it on the server:

```bash
cd /var/www/vega/frontend
cat > .env.production <<'EOF'
VITE_API_URL=/api
VITE_PORTFOLIO_USERNAME=YOUR_USERNAME
EOF

npm ci
npm run build          # outputs frontend/dist/
```

- `VITE_API_URL=/api`: the React app calls the API on the **same domain**, through Nginx.
- `VITE_PORTFOLIO_USERNAME`: whose portfolio the home page `/` shows. Other users stay at `/u/<username>`.

These values are baked in at build time. If you change them, run `npm run build` again.

> Low on RAM and the build gets killed? Build on your laptop **(local)** with the same `.env.production` and upload it: `rsync -az --delete frontend/dist/ YOUR_USER@SERVER:/var/www/vega/frontend/dist/`.

---

## Step 8 — Add the Nginx site

```bash
sudo cp /var/www/vega/deploy/nginx-andu.aetechsolution.et.conf /etc/nginx/sites-available/andu.aetechsolution.et
sudo ln -s /etc/nginx/sites-available/andu.aetechsolution.et /etc/nginx/sites-enabled/

sudo nginx -t              # ALWAYS test before reloading
sudo systemctl reload nginx
```

- `nginx -t` checks every site, Laravel's included. **If it reports an error, don't reload.** Fix the problem first, and the running sites stay up meanwhile.
- `reload` (not `restart`) applies the new config without dropping connections to the Laravel site.

How Nginx decides: it matches the request's domain against each site's `server_name`. Requests for `andu.aetechsolution.et` go to the new file, and everything else goes where it did before.

Nginx also needs to read the files. Folders under `/var/www` are usually fine:

```bash
namei -l /var/www/vega/frontend/dist/index.html   # every directory needs x for others or www-data
```

Open **http://andu.aetechsolution.et**. You should see the portfolio, without HTTPS for now.

---

## Step 9 — HTTPS with Let's Encrypt

```bash
sudo certbot --nginx -d andu.aetechsolution.et
```

Choose to **redirect HTTP to HTTPS** when asked. Certbot then:

1. proves to Let's Encrypt that you control the domain (that's why DNS must point at the server);
2. adds a `listen 443 ssl` block with the certificate to the Nginx file;
3. adds an http → https redirect;
4. sets up automatic renewal (the certificate lasts 90 days).

Check that renewal works:

```bash
sudo certbot renew --dry-run
```

Open **https://andu.aetechsolution.et** 🎉

---

## Step 10 — Check everything

| Check | Expected |
|-------|----------|
| `https://andu.aetechsolution.et` | Your portfolio, with the padlock in the address bar |
| `http://andu.aetechsolution.et` | Redirects to https |
| `/projects` and a project page, then **refresh** | Page loads (Nginx falls back to `index.html`) |
| `/admin/` | Admin login with styling. You can log in. |
| Upload a project thumbnail in the admin | It appears on the site (`/media/...`) |
| Contact form | Message appears in the admin under *Contacts* |
| `curl -X POST https://andu.aetechsolution.et/api/auth/register/` | `403 Registration is closed` |
| Your Laravel site | Still works exactly as before |

---

## Updating the site later

The normal workflow is to work locally, push to GitHub, then run on the server:

```bash
cd /var/www/vega && ./deploy/deploy.sh
```

[`deploy.sh`](../deploy/deploy.sh) pulls the code, installs new Python packages, runs migrations, collects static files, rebuilds the frontend and restarts the service. If the service doesn't come back up, it stops and tells you where to look.

`deploy.sh` uses `sudo systemctl restart vega`. To run it without a password prompt, allow just that one command (`sudo visudo -f /etc/sudoers.d/vega`):

```
YOUR_USER ALL=(root) NOPASSWD: /usr/bin/systemctl restart vega
```

**Rolling back** a bad release:

```bash
cd /var/www/vega
git log --oneline -5
git checkout <previous-commit>       # then re-run the backend/frontend steps from deploy.sh
```

(Migrations that change tables may need reversing too: `manage.py migrate portfolio <previous_migration>`.)

---

## Backups

[`backup.sh`](../deploy/backup.sh) dumps the database and archives uploads into `~/backups/vega/`, and keeps 14 days.

Let it log in to PostgreSQL without a prompt:

```bash
echo "127.0.0.1:5432:vega:vega:THE_DB_PASSWORD" > ~/.pgpass
chmod 600 ~/.pgpass
/var/www/vega/deploy/backup.sh          # test once
```

Schedule it nightly (`crontab -e`):

```
30 2 * * * /var/www/vega/deploy/backup.sh >> $HOME/backups/vega-backup.log 2>&1
```

Copy backups **off the server** now and then **(local)**: `rsync -az YOUR_USER@SERVER:backups/vega/ ~/vega-backups/`. A backup on the same disk doesn't protect against losing the server.

Restore:

```bash
pg_restore -h 127.0.0.1 -U vega -d vega --clean db-YYYY-MM-DD.dump
tar -xzf media-YYYY-MM-DD.tar.gz -C /var/www/vega/backend
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| **502 Bad Gateway** | Gunicorn isn't running | `sudo systemctl status vega`, then `sudo journalctl -u vega -n 50` |
| **400 Bad Request** from the API | Domain missing from `ALLOWED_HOSTS` | Fix `.env`, then `sudo systemctl restart vega` |
| Admin login says **CSRF verification failed** | `CSRF_TRUSTED_ORIGINS` missing, or Nginx doesn't send `X-Forwarded-Proto` | Check `.env` and the `proxy_set_header` lines |
| Admin has **no styling** | `collectstatic` not run, or wrong `alias` path | Run `collectstatic`; the path must end with `/` |
| Refreshing `/projects` gives **404** | `try_files ... /index.html` missing | Use the provided Nginx file |
| Images 404 | Wrong media path, or Nginx can't read it | Check `alias` and `namei -l` permissions |
| Upload fails: **Permission denied** | Gunicorn's user can't write `backend/media` | `sudo chown -R YOUR_USER:www-data /var/www/vega/backend/media` |
| Upload fails: **413** | File larger than `client_max_body_size` | Raise it in the Nginx file and reload |
| Site shows old content after deploy | Browser cache | Hard refresh. `index.html` isn't cached long; `/assets/` filenames change on each build. |
| Laravel site broke | You edited its config, or a syntax error | `sudo nginx -t` shows the file and line |
| Image URLs start with `http://` | Missing `X-Forwarded-Proto`, or `DEBUG=True` | Check the Nginx headers and `.env` |

Logs:

```bash
sudo journalctl -u vega -f                       # Django / Gunicorn
sudo tail -f /var/log/nginx/error.log            # Nginx errors (both sites)
sudo tail -f /var/log/nginx/access.log
```

---

## Security notes

- **Firewall:** only SSH, 80 and 443 should be open. Gunicorn (8010) and PostgreSQL (5432) listen on localhost only.
  ```bash
  sudo ufw status            # expect: OpenSSH, Nginx Full
  ```
- **`DEBUG=False`**, a unique `SECRET_KEY` and a strong admin password.
- **Registration closed** (`REGISTRATION_OPEN=false`). Open it only when Vega becomes a public SaaS.
- **HSTS** (`SECURE_HSTS_SECONDS`) tells browsers to *only ever* use HTTPS for the domain. It's good once HTTPS is stable, but it can't easily be undone, and with `includeSubDomains` it would affect other `aetechsolution.et` subdomains. Leave it off until everything is confirmed working.
- **The old Render database password** was exposed earlier. Rotate it or delete that database.
- Keep the server updated: `sudo apt update && sudo apt upgrade` (consider `unattended-upgrades`).

---

## Why not Docker here?

The repo has a Docker setup ([02](02-docker.md)), and it would work: run the containers bound to `127.0.0.1` and point the host Nginx at them. On this server the manual route is simpler:

- It matches how the Laravel site is deployed: one Nginx, one way of doing things.
- It uses less memory on a small VPS than running extra Postgres and app containers.
- Logs, services and SSL are managed the same way for both sites.

Switch to Docker later if the server hosts many apps, or when moving to a fresh server.
