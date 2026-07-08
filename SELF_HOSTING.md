# Self-Hosting This Fork

> **Prefer zero maintenance?** Use the official hosted version at
> [sws2apps.com](https://sws2apps.com) — it's actively maintained, requires no
> server of your own, and is the right choice for most congregations.
>
> This guide is for congregations who want direct control over where their data
> is physically stored, and who have someone able to run and maintain a small
> server. It is a community-maintained fork, not an official sws2apps product.

## Before you deploy anything

sws2apps states, everywhere on their site and projects:

> "Caution: Before using the app, be sure to obtain approval from your body of
> elders and review the guidance from your local branch office, as local
> circumstances may vary."

That applies here too. **Additionally, specific to self-hosting:** running your
own server means your congregation, not sws2apps, is responsible for uptime,
backups, and data security. Confirm with your body of elders and branch office
that self-hosting specifically is an approved arrangement, not just that using
the app is approved — these are two different questions, and every body of
elders considering this will reasonably ask where the data lives. Decide who
administers the server and who else can step in if that person is unavailable,
before you have real congregation data depending on it.

## What this fork changes vs. upstream

- No Firebase, no Google infrastructure, verified by a build with those packages
  absent from `node_modules` in both the client and API.
- Your own server holds an AES-encrypted copy of your congregation's data.
  Nobody at sws2apps, and no third-party cloud provider you haven't chosen
  yourself, has access to it.
- Everything else — features, UI, meeting scheduling, reports — is unchanged.
  This fork tracks upstream and pulls their improvements in on an ongoing basis.

## What you'll need

- A small VPS (2 vCPU / 4 GB is plenty for one congregation) from a provider in
  a jurisdiction your body of elders/branch office is comfortable with.
- A domain name you control (for TLS).
- Docker + Docker Compose on that VPS.
- Comfort with the command line — this guide assumes you can SSH in, edit a
  file, and run `docker compose up`. It does not hold your hand through Docker
  basics.
- A place to store off-site encrypted backups (a second cloud storage account,
  in a different provider than your VPS — see BACKUP.md).

## Deploy

1. Fork this repository (both `organized-app` and `sws2apps-api`).
2. Clone `sws2apps-api` onto your VPS, alongside `docker-compose.yml`,
   `Caddyfile`, and `.env` (from `.env.example` — every value there is
   required and explained inline).
3. Build the client (`organized-app`) and place its output where
   `docker-compose.yml` expects it (`./client-dist`).
4. `docker compose up -d`. Caddy will automatically obtain a TLS certificate for
   your domain (make sure DNS is already pointed at the VPS first, and that
   ports 80/443 are open in your VPS provider's own firewall/security-group
   settings — this is separate from anything configured inside the box, and
   easy to miss if you don't already run your own firewall).
5. Visit your domain, create the first (admin) account, and complete
   congregation setup.
6. **Do the restore drill in BACKUP.md before considering yourself live.**

## Hard constraints — read before changing the topology

- **The API must stay single-process.** No replicas, no PM2 cluster mode. See
  the comment block at the top of `docker-compose.yml` for why — this is a
  correctness constraint (single-use tokens, recovery codes), not a performance
  suggestion.
- **Keep client and API same-origin** (both behind the one Caddy instance, as
  configured). This is what allows the cookie policy to stay at its more
  restrictive, safer setting.

## Staying up to date with upstream

This fork tracks `sws2apps/organized-app` and `sws2apps/sws2apps-api`. To pull
in their ongoing improvements:

```bash
git fetch upstream
git checkout main && git merge upstream/main && git push origin main
git checkout self-hosted && git merge main
# resolve conflicts, if any, in the small set of files this fork touches
# (see PROJECT.md for the current list)
```

Do this periodically — every time upstream ships a notable feature or fix, or
at minimum quarterly. This fork is only worth using if it stays current; a
stale self-hosted deployment misses out on the same team's continued work.

## Support

This is community-maintained. Issues and pull requests are welcome, but there
is no guaranteed response time or official support channel — you are running
this at your own congregation's discretion and responsibility, per the caution
above.
