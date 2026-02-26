#!/bin/bash

# CheckHost.top - Database Backup Script
# Run this from the project root

BACKUP_DIR="./backups/db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="checkhost_db_$TIMESTAMP.sql.gz"
RETENTION_DAYS=7

mkdir -p $BACKUP_DIR

echo "💾 Starting database backup..."

# Extract Database credentials from .env if possible
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

DB_CONTAINER="checkhost-db"
DB_USER=${POSTGRES_USER:-postgres}
DB_NAME=${POSTGRES_DB:-checkhost}

# Perform backup using docker exec
if docker ps | grep -q $DB_CONTAINER; then
    docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_DIR/$FILENAME"
    echo "✅ Backup saved to $BACKUP_DIR/$FILENAME"
else
    echo "❌ Error: Container $DB_CONTAINER is not running."
    exit 1
fi

# Clean up old backups
echo "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
find $BACKUP_DIR -name "checkhost_db_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "✨ Done!"
