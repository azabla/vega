#!/usr/bin/env bash
# Nightly backup of the Docker database and uploaded files. Keeps 14 days.
# Cron (crontab -e):  30 2 * * * /opt/vega/deploy/backup.sh >> $HOME/backups/vega-backup.log 2>&1
set -euo pipefail

cd "$(dirname "$0")/.."
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.prod"
BACKUP_DIR="$HOME/backups/vega"
STAMP=$(date +%F)
mkdir -p "$BACKUP_DIR"

# database: custom-format dump from inside the db container
$COMPOSE exec -T db pg_dump -U vega -Fc vega > "$BACKUP_DIR/db-$STAMP.dump"

# uploads: archive the "media" volume through the backend container
$COMPOSE exec -T backend tar -czf - -C /app media > "$BACKUP_DIR/media-$STAMP.tar.gz"

find "$BACKUP_DIR" -type f -mtime +14 -delete
echo "$(date) backup ok"
