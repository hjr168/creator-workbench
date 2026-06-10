#!/usr/bin/env bash
# 云效 Flow 部署脚本
# 在 ECS 上由云效 Runner 触发执行
# 构建产物从云效构建阶段传递过来，此脚本只负责部署
set -euo pipefail

APP_NAME="creator-workbench"
APP_DIR="/opt/${APP_NAME}"
ENV_FILE="/etc/${APP_NAME}/${APP_NAME}.env"
APP_PORT="${APP_PORT:-3000}"
APP_DOMAIN="${APP_DOMAIN:-workbench.huangjiarong.top}"
DEPLOY_DIR="/tmp/${APP_NAME}-deploy"

log() {
  printf '\n[%s] %s\n' "$(date -Is)" "$*"
}

# 1. 解压构建产物
log "Extracting build artifacts"
rm -rf "${DEPLOY_DIR}"
mkdir -p "${DEPLOY_DIR}"
tar xzf deploy-package.tar.gz -C "${DEPLOY_DIR}"

# 2. 备份当前版本（保留最近 3 个备份）
if [ -d "${APP_DIR}" ]; then
  log "Backing up current version"
  cp -r "${APP_DIR}" "${APP_DIR}.bak.$(date +%Y%m%d%H%M%S)"
  # 清理旧备份，只保留最近 3 个
  ls -dt "${APP_DIR}".bak.* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null || true
fi

# 3. 同步文件到部署目录
log "Syncing files to ${APP_DIR}"
mkdir -p "${APP_DIR}"
rsync -az --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'coverage' \
  --exclude 'generated' \
  --exclude '.env' \
  --exclude '.env.*' \
  --exclude '*.bak.*' \
  "${DEPLOY_DIR}/" "${APP_DIR}/"

# 4. 清理临时文件
rm -rf "${DEPLOY_DIR}"

# 5. 读取环境变量
cd "${APP_DIR}"
if [ -f "${ENV_FILE}" ]; then
  set -a
  # shellcheck disable=SC1090
  . "${ENV_FILE}"
  set +a
else
  log "WARNING: Missing environment file: ${ENV_FILE}"
fi

# 6. 安装生产依赖
log "Installing production dependencies"
NPM_REGISTRY="${NPM_REGISTRY:-https://registry.npmmirror.com}"
if ! npm ci --registry="${NPM_REGISTRY}" --omit=dev --prefer-offline --no-audit --no-fund; then
  log "npm ci failed with mirror registry, retrying with default..."
  npm ci --omit=dev --no-audit --no-fund
fi

# 7. 数据库迁移
log "Running database migration"
npm run db:migrate || log "Migration skipped or failed (non-fatal)"

# 8. 重启应用
log "Reloading PM2"
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

# 9. 健康检查
log "Running health check"
for attempt in 1 2 3 4 5; do
  if curl -fsS "http://127.0.0.1:${APP_PORT}" >/dev/null; then
    log "Health check passed on attempt ${attempt}."
    log "Deployment successful!"
    exit 0
  fi
  sleep 3
done

log "Health check FAILED!"
log "Rolling back to previous version..."
BACKUP_DIR=$(ls -dt "${APP_DIR}".bak.* 2>/dev/null | head -1)
if [ -n "${BACKUP_DIR}" ]; then
  rsync -az --delete \
    --exclude '.git' --exclude 'node_modules' \
    --exclude '*.bak.*' \
    "${BACKUP_DIR}/" "${APP_DIR}/"
  cd "${APP_DIR}" && npm ci --omit=dev --no-audit --no-fund
  pm2 startOrReload ecosystem.config.cjs --update-env
  pm2 save
  log "Rollback completed."
fi
exit 1
