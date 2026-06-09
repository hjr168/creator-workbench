#!/usr/bin/env bash
set -euo pipefail

APP_NAME="creator-workbench"
APP_DIR="/opt/${APP_NAME}"
ENV_FILE="/etc/${APP_NAME}/${APP_NAME}.env"
APP_PORT="${APP_PORT:-3000}"

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

npm ci
npm run lint
npm run typecheck
npm run build
npm run db:migrate

pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

if command -v systemctl >/dev/null 2>&1; then
  nginx -t
  systemctl reload nginx
fi

for attempt in 1 2 3 4 5; do
  if curl -fsS "http://127.0.0.1:${APP_PORT}" >/dev/null; then
    echo "Health check passed on attempt ${attempt}."
    exit 0
  fi
  sleep 2
done

echo "Health check failed."
exit 1
