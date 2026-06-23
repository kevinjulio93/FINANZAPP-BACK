#!/bin/bash
set -e

BACKUP_DIR="/backups"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_PATH="$BACKUP_DIR/finanzas_$DATE"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

echo "[$(date)] Starting MongoDB backup..."

mongodump \
  --host "$MONGO_HOST" \
  --port 27017 \
  --username "$MONGO_USER" \
  --password "$MONGO_PASS" \
  --authenticationDatabase admin \
  --db finanzas \
  --out "$BACKUP_PATH"

# Compress the backup
tar -czf "$BACKUP_PATH.tar.gz" -C "$BACKUP_DIR" "finanzas_$DATE"
rm -rf "$BACKUP_PATH"

echo "[$(date)] Backup saved: finanzas_$DATE.tar.gz"

# Remove backups older than RETENTION_DAYS
find "$BACKUP_DIR" -name "finanzas_*.tar.gz" -mtime +$RETENTION_DAYS -delete
echo "[$(date)] Cleaned up backups older than $RETENTION_DAYS days."

echo "[$(date)] Backup completed successfully."
