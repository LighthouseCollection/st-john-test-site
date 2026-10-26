#!/usr/bin/env bash
# St. John the Beloved test site · build and (re)start it on the Plenix server (VM 130, 10.0.0.30). From Git Bash, in the
# repository: bash deploy/deploy.sh   (needs this PC's SSH key on plenix@10.0.0.30)
#   1. the smoke test passes here first (the site, the API, a save, a reset);
#   2. the source goes to /srv/st-john/src and docker compose builds and starts the app and PostgreSQL 16
#      (data in /srv/st-john/db; the password and the reset token in /srv/st-john/.env, made once on the server, never in git);
#   3. the server's Nginx gets the st-john site file (deploy/nginx-st-john.conf) and is reloaded;
#   4. the health check answers through Nginx.
# HTTPS, the address and the Authentik sign-in are Nginx Proxy Manager's (CT 102): see deploy/README.md.
set -euo pipefail
HOST=plenix@10.0.0.30
cd "$(dirname "$0")/.."
if [ "${SKIP_SMOKE:-}" != "1" ]; then DATABASE_URL=pglite:memory node test/smoke.test.js | tail -1 | grep -q SMOKE_OK || { echo "The smoke test failed: nothing deployed"; exit 1; }; fi
PKG=$(mktemp -u).tgz
tar -czf "$PKG" --exclude=node_modules --exclude=public --exclude=.git Dockerfile docker-compose.yml package.json package-lock.json build.js site server db deploy
SUM=$(sha256sum "$PKG" | cut -d' ' -f1)
scp -q "$PKG" "$HOST:/tmp/st-john-src.tgz"
rm -f "$PKG"
ssh "$HOST" "set -e
  echo '$SUM  /tmp/st-john-src.tgz' | sha256sum -c --quiet -
  sudo mkdir -p /srv/st-john/db
  sudo rm -rf /srv/st-john/src.new && sudo mkdir -p /srv/st-john/src.new
  sudo tar -xzf /tmp/st-john-src.tgz -C /srv/st-john/src.new --no-same-owner && rm /tmp/st-john-src.tgz
  sudo rm -rf /srv/st-john/src.old; if [ -d /srv/st-john/src ]; then sudo mv /srv/st-john/src /srv/st-john/src.old; fi
  sudo mv /srv/st-john/src.new /srv/st-john/src
  if [ ! -f /srv/st-john/.env ]; then
    printf 'DB_PASSWORD=%s\nRESET_TOKEN=%s\n' \"\$(openssl rand -hex 24)\" \"\$(openssl rand -hex 24)\" | sudo tee /srv/st-john/.env >/dev/null
    sudo chmod 600 /srv/st-john/.env
  fi
  sudo cp /srv/st-john/.env /srv/st-john/src/.env
  cd /srv/st-john/src && sudo docker compose up -d --build --quiet-pull 2>&1 | tail -3
  sudo cp /srv/st-john/src/deploy/nginx-st-john.conf /etc/nginx/sites-available/st-john
  sudo ln -sf /etc/nginx/sites-available/st-john /etc/nginx/sites-enabled/st-john
  sudo nginx -t -q && sudo systemctl reload nginx
  for i in \$(seq 1 30); do curl -sf -H 'Host: stjohn.lighthouseway.org' http://127.0.0.1/healthz && break; sleep 2; done; echo"
echo "Deployed. Reset by hand: ssh $HOST then curl -X POST -H \"x-reset-token: \$(sudo grep RESET_TOKEN /srv/st-john/.env | cut -d= -f2)\" http://127.0.0.1:8790/api/reset"
