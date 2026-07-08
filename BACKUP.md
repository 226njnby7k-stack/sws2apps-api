# Backup & Restore — read this before you trust this deployment

An untested restore procedure is a hypothesis, not a backup. This document is not
done until you have actually destroyed a test copy of your data and restored it
from backup successfully. Do that BEFORE go-live, and re-do it after any major
change to this stack.

## Strategy

1. **Nightly, encrypted, off-box.** The `backup` container reads the storage
   volume read-only, tars it, encrypts the tarball with `BACKUP_ENCRYPTION_KEY`
   (age or gpg symmetric — see the backup container's script), and pushes it via
   `rclone` to `BACKUP_DESTINATION`.
2. **Asymmetric encryption (age), private key never on this server.** The
   backup container holds only an age *public* key (`BACKUP_ENCRYPTION_KEY`) and
   can encrypt, but cannot decrypt. The matching *private* key
   (`backup-identity.txt`, generated once via `age-keygen`, on a machine that is
   never this VPS) lives only in your password manager and a second offline
   location. Consequence: even a total compromise of this server cannot expose
   your existing backups, because the ability to read them was never on the
   box in the first place. It's also independent of `SEC_ENCRYPT_KEY` (which
   encrypts the live data), so no single leaked key exposes both live data and
   backups.
3. **A different location than the primary host.** If your VPS provider has an
   outage, gets your account suspended, or the box is compromised, the backup
   must not go down with it. Object storage from a different provider, in a
   jurisdiction acceptable to your body of elders/branch office (for most
   deployers: stay in-region), is the baseline.
4. **Retention.** Keep at minimum: last 7 daily, last 4 weekly, last 3 monthly.
   Adjust `BACKUP_SCHEDULE_CRON` and the retention logic in the backup container
   to match your risk tolerance and storage budget.

## The restore drill (mandatory, do this now)

Do this on a SEPARATE machine or VM, never against your live production volume.

```bash
# 1. Pull the latest encrypted backup from BACKUP_DESTINATION
rclone copy remote:path/to/organized-backup-<timestamp>.tar.gz.age ./drill/ --config rclone.conf

# 2. Decrypt with the PRIVATE key (backup-identity.txt — the one that never
#    lives on the production server; you're using it here, on a separate
#    drill machine, specifically to prove the recovery path works)
age -d -i backup-identity.txt drill/organized-backup-<timestamp>.tar.gz.age > drill/backup.tar.gz

# 3. Extract into a fresh volume
mkdir -p drill/storage && tar -xzf drill/backup.tar.gz -C drill/storage --strip-components=1

# 4. Point a throwaway API instance at it and boot
docker run --rm -it \
  -e STORAGE_PATH=/data/storage \
  -e SEC_ENCRYPT_KEY="$SEC_ENCRYPT_KEY" \
  -e AUTH_JWT_PRIVATE_KEY="$AUTH_JWT_PRIVATE_KEY" \
  -e AUTH_JWT_PUBLIC_KEY="$AUTH_JWT_PUBLIC_KEY" \
  -v "$(pwd)/drill/storage:/data/storage" \
  -p 8001:8000 \
  organized-api:latest

# 5. Log in as a real user against this throwaway instance, confirm congregation
#    data (persons, schedules, meeting settings) matches what you expect.
```

If step 5 works, your backups are real. If it doesn't, fix the backup pipeline
NOW, before you have live data depending on it.

**Calendar reminder to set today:** re-run this drill every 3-6 months, and any
time you change the storage schema, the encryption keys, or the backup script.
A drill that passed once, a year ago, is not evidence anything works today.

## What this does NOT cover

- **Key loss.** If you lose `SEC_ENCRYPT_KEY` with no other copy, your live data
  AND your backups are both permanently unreadable, this backup strategy protects
  against infrastructure loss, not key loss. See .env.example's guidance on
  storing `SEC_ENCRYPT_KEY` in two separate places.
- **Ransomware/compromise of the live host reaching the backup credentials.** If
  an attacker gets shell access to the API host and also finds
  `BACKUP_ENCRYPTION_KEY` and rclone credentials sitting in the same `.env`,
  they could potentially corrupt or delete backups too. Consider a
  write-only/append-only backup destination (many object storage providers
  support object-lock/immutability) so even a compromised host can't delete
  prior backups.
