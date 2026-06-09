#!/usr/bin/env bash
set -euo pipefail

APP_NAME="creator-workbench"
APP_DIR="/opt/${APP_NAME}"
ENV_DIR="/etc/${APP_NAME}"
ENV_FILE="${ENV_DIR}/${APP_NAME}.env"
DOMAIN="${APP_DOMAIN:-workbench.huangjiarong.top}"
APP_PORT="${APP_PORT:-3000}"
EXPECTED_IP="${EXPECTED_PUBLIC_IP:-8.138.148.239}"
NODE_MAJOR="${NODE_MAJOR:-22}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run this script as root."
  exit 1
fi

install_packages() {
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update
    apt-get install -y curl ca-certificates gnupg nginx postgresql postgresql-contrib certbot python3-certbot-nginx rsync
    if ! command -v node >/dev/null 2>&1 || ! node -v | grep -q "^v${NODE_MAJOR}\\."; then
      curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
      apt-get install -y nodejs
    fi
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y curl ca-certificates nginx postgresql-server postgresql-contrib certbot python3-certbot-nginx rsync
    if [ ! -d /var/lib/pgsql/data/base ]; then
      postgresql-setup --initdb
    fi
    if ! command -v node >/dev/null 2>&1 || ! node -v | grep -q "^v${NODE_MAJOR}\\."; then
      curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
      dnf install -y nodejs
    fi
  elif command -v yum >/dev/null 2>&1; then
    yum install -y curl ca-certificates nginx postgresql-server postgresql-contrib certbot python3-certbot-nginx rsync
    if [ ! -d /var/lib/pgsql/data/base ]; then
      postgresql-setup initdb || true
    fi
    if ! command -v node >/dev/null 2>&1 || ! node -v | grep -q "^v${NODE_MAJOR}\\."; then
      curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
      yum install -y nodejs
    fi
  else
    echo "Unsupported Linux distribution. Install Node.js ${NODE_MAJOR}, PostgreSQL, Nginx, Certbot, and rsync manually."
    exit 1
  fi
}

install_pm2() {
  if ! command -v pm2 >/dev/null 2>&1; then
    npm install -g pm2
  fi
}

enable_services() {
  systemctl enable --now nginx
  systemctl enable --now postgresql || systemctl enable --now postgresql.service
}

setup_postgres() {
  local db_name="${POSTGRES_DB:-creator_workbench}"
  local db_user="${POSTGRES_USER:-creator_workbench}"
  local db_password="${POSTGRES_PASSWORD:-}"

  if [ -n "${DATABASE_URL:-}" ]; then
    local parsed_database
    parsed_database="$(DATABASE_URL="$DATABASE_URL" python3 <<'PY'
import os
import shlex
from urllib.parse import urlparse, unquote

url = urlparse(os.environ["DATABASE_URL"])
if url.scheme not in {"postgres", "postgresql"}:
    raise SystemExit("DATABASE_URL must use postgres:// or postgresql://")
if not url.username or not url.password or not url.path.strip("/"):
    raise SystemExit("DATABASE_URL must include username, password, and database name")

print(f"db_user={shlex.quote(unquote(url.username))}")
print(f"db_password={shlex.quote(unquote(url.password))}")
print(f"db_name={shlex.quote(unquote(url.path.strip('/')))}")
PY
)"
    eval "$parsed_database"
  fi

  if [ -z "$db_password" ]; then
    db_password="$(openssl rand -hex 24)"
  fi

  if [[ ! "$db_user" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]] || [[ ! "$db_name" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
    echo "PostgreSQL user and database name must contain only letters, numbers, and underscores."
    exit 1
  fi

  local sql_db_password="${db_password//\'/\'\'}"

  local psql_command
  if command -v runuser >/dev/null 2>&1; then
    psql_command="runuser -u postgres -- psql -v ON_ERROR_STOP=1"
  else
    psql_command="su - postgres -c 'psql -v ON_ERROR_STOP=1'"
  fi

  eval "$psql_command" <<SQL
do \$\$
begin
  if not exists (select from pg_roles where rolname = '${db_user}') then
    create role ${db_user} login password '${sql_db_password}';
  else
    alter role ${db_user} with password '${sql_db_password}';
  end if;
end
\$\$;

select 'create database ${db_name} owner ${db_user}'
where not exists (select from pg_database where datname = '${db_name}')\\gexec
grant all privileges on database ${db_name} to ${db_user};
SQL

  mkdir -p "$ENV_DIR"
  touch "$ENV_FILE"
  chmod 600 "$ENV_FILE"

  if ! grep -q "^DATABASE_URL=" "$ENV_FILE"; then
    cat >>"$ENV_FILE" <<EOF
DATABASE_URL=postgresql://${db_user}:${db_password}@127.0.0.1:5432/${db_name}
EOF
  fi
}

write_default_env() {
  mkdir -p "$ENV_DIR"
  touch "$ENV_FILE"
  chmod 600 "$ENV_FILE"

  grep -q "^NODE_ENV=" "$ENV_FILE" || echo "NODE_ENV=production" >>"$ENV_FILE"
  grep -q "^AIHOT_BASE_URL=" "$ENV_FILE" || echo "AIHOT_BASE_URL=https://aihot.virxact.com/api/public" >>"$ENV_FILE"
  grep -q "^AIHOT_TIMEOUT_MS=" "$ENV_FILE" || echo "AIHOT_TIMEOUT_MS=10000" >>"$ENV_FILE"
  grep -q "^AIHOT_MIN_INTERVAL_MS=" "$ENV_FILE" || echo "AIHOT_MIN_INTERVAL_MS=1200" >>"$ENV_FILE"
  grep -q "^TOPIC_RADAR_LLM_MODEL=" "$ENV_FILE" || echo "TOPIC_RADAR_LLM_MODEL=gpt-4o-mini" >>"$ENV_FILE"
}

write_nginx_config() {
  local nginx_conf="/etc/nginx/conf.d/${APP_NAME}.conf"
  cat >"$nginx_conf" <<EOF
server {
  listen 80;
  server_name ${DOMAIN};

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
  nginx -t
  systemctl reload nginx
}

maybe_issue_certificate() {
  local resolved_ip
  resolved_ip="$(getent ahostsv4 "$DOMAIN" | awk '{ print $1; exit }' || true)"

  if [ "$resolved_ip" != "$EXPECTED_IP" ]; then
    echo "Skipping HTTPS certificate. ${DOMAIN} resolves to '${resolved_ip:-none}', expected '${EXPECTED_IP}'."
    return
  fi

  if [ -z "${CERTBOT_EMAIL:-}" ]; then
    echo "Skipping HTTPS certificate. Set CERTBOT_EMAIL to enable non-interactive Certbot."
    return
  fi

  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$CERTBOT_EMAIL" --redirect
}

mkdir -p "$APP_DIR"
install_packages
install_pm2
enable_services
setup_postgres
write_default_env
write_nginx_config
maybe_issue_certificate

echo "Server bootstrap complete for ${APP_NAME}."
