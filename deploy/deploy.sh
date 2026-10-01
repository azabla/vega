#!/usr/bin/env bash
# Update the live site after pushing to GitHub. Run on the server:
#   cd /opt/vega && ./deploy/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.prod"

[ -f .env.prod ] || { echo "!! .env.prod missing (copy .env.prod.example)"; exit 1; }

echo "==> Pulling latest code"
git pull --ff-only

echo "==> Building images and restarting changed containers"
# backend runs migrate + collectstatic on start (backend/entrypoint.sh)
$COMPOSE up -d --build --remove-orphans

echo "==> Waiting for the backend health check"
for i in $(seq 30); do
    status=$(docker inspect -f '{{.State.Health.Status}}' "$($COMPOSE ps -q backend)" 2>/dev/null || echo starting)
    [ "$status" = healthy ] && break
    sleep 3
done
$COMPOSE ps

if [ "$status" != healthy ]; then
    echo "!! backend is not healthy — see: $COMPOSE logs --tail=80 backend"
    exit 1
fi

echo "==> Removing old images"
docker image prune -f >/dev/null
echo "==> Done"
