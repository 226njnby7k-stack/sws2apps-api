# Backup sidecar — tars the storage volume, encrypts with age, pushes via rclone,
# on a cron schedule. No access to the API's runtime secrets beyond its own
# encryption key and the rclone remote credentials.

FROM alpine:3.20

RUN apk add --no-cache \
    age \
    rclone \
    tar \
    gzip \
    dcron \
    bash \
    coreutils \
    gettext

WORKDIR /app
COPY backup.sh /app/backup.sh
COPY entrypoint.sh /app/entrypoint.sh
COPY rclone.conf.template /app/rclone.conf.template
RUN chmod +x /app/backup.sh /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
