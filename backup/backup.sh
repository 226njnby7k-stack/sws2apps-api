#!/usr/bin/env bash
# backup.sh — one backup run. Called by cron inside the container (see entrypoint.sh).
#
# Required env:
#   BACKUP_ENCRYPTION_KEY   — age public key (recipient) to encrypt TO.
#                             (Keep the matching private key OFF this box — see
#                             BACKUP.md. This script only ever encrypts, never
#                             decrypts, so the box doing backups never needs and
#                             never holds the ability to read them back.)
#   BACKUP_DESTINATION      — rclone remote path, e.g. "myremote:organized-backups"
#
# Retention (as actually implemented below): keeps every backup from the last 7
# days, PLUS every 1st-of-month backup indefinitely; prunes everything else after
# each successful upload. The weekly tier is NOT implemented, and monthlies are NOT
# capped (kept forever). If you need a stricter 7-daily / 4-weekly / 3-monthly
# policy, prefer your object storage's native lifecycle rules (see note below).

set -euo pipefail

STORAGE_PATH="${STORAGE_PATH:-/data/storage}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
WORKDIR="$(mktemp -d)"
ARCHIVE="$WORKDIR/organized-backup-${STAMP}.tar.gz"
ENCRYPTED="${ARCHIVE}.age"

cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

log() { echo "[backup $STAMP] $*"; }

if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
	log "FATAL: BACKUP_ENCRYPTION_KEY not set — refusing to run an unencrypted backup"
	exit 1
fi

if [ -z "${BACKUP_DESTINATION:-}" ]; then
	log "FATAL: BACKUP_DESTINATION not set"
	exit 1
fi

if [ ! -d "$STORAGE_PATH" ] || [ -z "$(ls -A "$STORAGE_PATH" 2>/dev/null)" ]; then
	log "FATAL: $STORAGE_PATH is missing or empty — refusing to back up nothing " \
	    "(this usually means the volume mount is broken, not that there's no data)"
	exit 1
fi

log "tarring $STORAGE_PATH"
tar -czf "$ARCHIVE" -C "$(dirname "$STORAGE_PATH")" "$(basename "$STORAGE_PATH")"

log "encrypting"
age -r "$BACKUP_ENCRYPTION_KEY" -o "$ENCRYPTED" "$ARCHIVE"
rm -f "$ARCHIVE"   # never let the plaintext tarball linger, even briefly, after this point

log "uploading to $BACKUP_DESTINATION"
rclone copyto "$ENCRYPTED" "${BACKUP_DESTINATION}/$(basename "$ENCRYPTED")" \
	--config /app/rclone.conf

log "verifying upload"
REMOTE_SIZE=$(rclone size "${BACKUP_DESTINATION}/$(basename "$ENCRYPTED")" --config /app/rclone.conf --json | grep -o '"bytes":[0-9]*' | cut -d: -f2)
LOCAL_SIZE=$(stat -c%s "$ENCRYPTED" 2>/dev/null || stat -f%z "$ENCRYPTED")

if [ "$REMOTE_SIZE" != "$LOCAL_SIZE" ]; then
	log "FATAL: uploaded size ($REMOTE_SIZE) doesn't match local size ($LOCAL_SIZE) — upload may be corrupt"
	exit 1
fi

log "upload verified ($LOCAL_SIZE bytes)"

# --- Retention pruning ---
# Keep every backup from the last 7 days, plus every 1st-of-month backup (kept
# indefinitely). Prune the rest. NOTE: no weekly tier and no cap on monthlies —
# this is deliberately simple so it's easy to audit and hard to get catastrophically
# wrong. If your object storage supports native lifecycle rules (most S3-compatible
# providers do), prefer those and delete this whole section — one less place for a
# bug to delete something it shouldn't.
log "pruning old backups (keep: last 7 days + all 1st-of-month)"
rclone lsf "$BACKUP_DESTINATION" --config /app/rclone.conf --files-only | sort > "$WORKDIR/all_backups.txt"

CUTOFF_DAILY=$(date -u -d '7 days ago' +%Y%m%d 2>/dev/null || date -u -v-7d +%Y%m%d)

while IFS= read -r fname; do
	# extract YYYYMMDD from organized-backup-YYYYMMDDTHHMMSSZ.tar.gz.age
	file_date=$(echo "$fname" | grep -o '[0-9]\{8\}' | head -1)
	[ -z "$file_date" ] && continue

	if [ "$file_date" -lt "$CUTOFF_DAILY" ]; then
		day_of_month=${file_date: -2}
		# older than 7 days: keep only the 1st-of-month backups, prune the rest.
		if [ "$day_of_month" != "01" ]; then
			log "pruning $fname (older than 7 days, not a 1st-of-month keeper)"
			rclone delete "${BACKUP_DESTINATION}/${fname}" --config /app/rclone.conf || \
				log "WARN: failed to prune $fname — leaving it, non-fatal"
		fi
	fi
done < "$WORKDIR/all_backups.txt"

log "backup complete"
