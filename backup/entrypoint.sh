#!/usr/bin/env bash
set -euo pipefail

# Render rclone.conf from the template using env vars rclone itself expects
# (whatever your chosen remote type needs — S3-compatible, Backblaze B2, etc.
# populate rclone.conf.template accordingly; see BACKUP.md for a worked example).
envsubst < /app/rclone.conf.template > /app/rclone.conf
chmod 600 /app/rclone.conf

# Install the cron schedule from BACKUP_SCHEDULE_CRON
echo "${BACKUP_SCHEDULE_CRON:-0 3 * * *} /app/backup.sh >> /proc/1/fd/1 2>> /proc/1/fd/2" > /etc/crontabs/root

echo "[entrypoint] backup container ready, schedule: ${BACKUP_SCHEDULE_CRON:-0 3 * * *}"
echo "[entrypoint] run a manual backup now with: docker exec <container> /app/backup.sh"

# Run cron in the foreground so the container stays up and logs are visible
exec crond -f -d 8
