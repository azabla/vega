#!/usr/bin/env bash
# Update the live site after pushing to GitHub. Run on the server:
#   cd /opt/vega && ./deploy/deploy.sh            # latest main
#   ./deploy/deploy.sh <commit-sha>               # that commit (what CI/CD does)
set -euo pipefail

REF="${1:-}"
if [ -n "$REF" ] && ! [[ "$REF" =~ ^[0-9a-f]{7,40}$ ]]; then
    echo "!! expected a commit SHA, got: $REF"; exit 1
fi

cd "$(dirname "$0")/.."
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.prod"

[ -f .env.prod ] || { echo "!! .env.prod missing (copy .env.prod.example)"; exit 1; }

echo "==> Pulling latest code"
if [ -n "$REF" ]; then
    git fetch --quiet origin
    git merge --ff-only "$REF"
else
    git pull --ff-only
fi
echo "    now at $(git log -1 --format='%h %s')"

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
