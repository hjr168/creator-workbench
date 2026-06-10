#!/usr/bin/env bash
set -euo pipefail

APP_NAME="creator-workbench"
APP_DIR="/opt/${APP_NAME}"
ENV_FILE="/etc/${APP_NAME}/${APP_NAME}.env"
APP_PORT="${APP_PORT:-3000}"
APP_DOMAIN="${APP_DOMAIN:-workbench.huangjiarong.top}"
EXPECTED_PUBLIC_IP="${EXPECTED_PUBLIC_IP:-8.138.148.239}"

log() {
  printf '\n[%s] %s\n' "$(date -Is)" "$*"
}

cd "$APP_DIR"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
else
  echo "Missing environment file: ${ENV_FILE}"
  exit 1
fi

log "Installing dependencies"
npm ci

log "Running lint"
npm run lint

log "Running typecheck"
npm run typecheck

log "Building application"
npm run build

log "Running database migration"
npm run db:migrate

log "Reloading PM2"
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

if command -v systemctl >/dev/null 2>&1; then
  log "Writing Nginx HTTP reverse proxy"
  cat >"/etc/nginx/conf.d/${APP_NAME}.conf" <<EOF
server {
    listen 80;
    server_name ${EXPECTED_PUBLIC_IP} ${APP_DOMAIN};

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
  log "Reloading Nginx"
  nginx -t
  systemctl reload nginx
fi

log "Running health check"
for attempt in 1 2 3 4 5; do
  if curl -fsS "http://127.0.0.1:${APP_PORT}" >/dev/null; then
    echo "Health check passed on attempt ${attempt}."
    exit 0
  fi
  sleep 2
done

echo "Health check failed."
exit 1
