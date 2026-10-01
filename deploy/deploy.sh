#!/usr/bin/env bash
# Update the live site after pushing to GitHub. Run on the server:
#   cd /var/www/vega && ./deploy/deploy.sh
set -euo pipefail

APP_DIR=/var/www/vega
UV="$HOME/.local/bin/uv"

cd "$APP_DIR"
echo "==> Pulling latest code"
git pull --ff-only

echo "==> Backend: dependencies, migrations, static files"
cd "$APP_DIR/backend"
"$UV" pip install -q -p venv/bin/python -r requirements.txt
venv/bin/python manage.py migrate --noinput
venv/bin/python manage.py collectstatic --noinput
venv/bin/python manage.py check --deploy --fail-level ERROR

echo "==> Frontend: build (reads frontend/.env.production)"
cd "$APP_DIR/frontend"
npm ci --no-audit --no-fund
npm run build

echo "==> Restarting the app"
sudo systemctl restart vega
sleep 2
systemctl is-active --quiet vega && echo "==> Done: vega is running" || {
    echo "!! vega failed to start — see: sudo journalctl -u vega -n 50"
    exit 1
}
