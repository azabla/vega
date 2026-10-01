#!/usr/bin/env bash
# Nightly backup of the database and uploaded files. Keeps 14 days.
# Cron (crontab -e):  30 2 * * * /var/www/vega/deploy/backup.sh >> $HOME/backups/vega-backup.log 2>&1
set -euo pipefail

BACKUP_DIR="$HOME/backups/vega"
STAMP=$(date +%F)
mkdir -p "$BACKUP_DIR"

# uses ~/.pgpass for the password (see docs/07-deployment-vps.md)
pg_dump -h 127.0.0.1 -U vega -Fc vega > "$BACKUP_DIR/db-$STAMP.dump"
tar -czf "$BACKUP_DIR/media-$STAMP.tar.gz" -C /var/www/vega/backend media

find "$BACKUP_DIR" -type f -mtime +14 -delete
echo "$(date) backup ok"
