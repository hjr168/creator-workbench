#!/usr/bin/env bash
# 云效 Flow 主机部署专用脚本
# 由制品包自带，云效部署阶段只需：bash scripts/deploy-yunxiao.sh
#
# 设计原则：
#   1. 不依赖 ECS 上任何已有文件（自包含）
#   2. 不用 rsync --delete（避免清空目录）
#   3. 用 npm install 而非 ci（不依赖 lockfile 完美匹配）
#   4. 失败自动回滚到备份
set -euo pipefail

APP_NAME="creator-workbench"
APP_DIR="/opt/${APP_NAME}"
ENV_FILE="/etc/${APP_NAME}/${APP_NAME}.env"
APP_PORT="${APP_PORT:-3000}"
# 云效会注入 package_download_path；手动跑时回退到默认值
PKG_PATH="${package_download_path:-/home/admin/app/package.tgz}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() { printf '\n[%s] %s\n' "$(date -Is)" "$*"; }

# ─── [1/7] 解压构建产物（兼容云效"tar 套 tar"结构）───
log "[1/7] 解压构建产物: ${PKG_PATH}"
DEPLOY_DIR="$(mktemp -d -t cw-deploy-XXXXXX)"
cd "${DEPLOY_DIR}"
# 先拷贝原始包
cp "${PKG_PATH}" "${DEPLOY_DIR}/pkg.tgz"
# 解第一层（外层包，可能是 pkg.tgz / package.tgz / deploy-package.tar.gz）
tar xzf pkg.tgz
# 如果解出来还是个 deploy-package.tar.gz（套娃），再解一层
if [ -f "deploy-package.tar.gz" ]; then
  log "检测到套娃结构，解第二层"
  mkdir -p inner && cd inner
  tar xzf ../deploy-package.tar.gz
  # 把内层内容移到 DEPLOY_DIR 根（用 find 兼容所有 shell）
  find . -mindepth 1 -maxdepth 1 -exec mv {} ../ \; 2>/dev/null || true
  cd ..
  rmdir inner 2>/dev/null || true
fi
echo "包内容:" && ls -la "${DEPLOY_DIR}"

# ─── [2/7] 备份当前版本（最多保留 3 个）───
log "[2/7] 备份当前版本"
if [ -d "${APP_DIR}" ]; then
  cp -r "${APP_DIR}" "${APP_DIR}.bak.$(date +%Y%m%d%H%M%S)"
  ls -dt "${APP_DIR}".bak.* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null || true
fi

# ─── [3/7] 安全同步文件（cp，不用 rsync --delete）───
log "[3/7] 同步文件到 ${APP_DIR}"
mkdir -p "${APP_DIR}"
# 只覆盖我们打包的这些内容，不删目标里其他文件
[ -d "${DEPLOY_DIR}/.next" ] && { rm -rf "${APP_DIR}/.next"; cp -rf "${DEPLOY_DIR}/.next" "${APP_DIR}/"; }
[ -f "${DEPLOY_DIR}/ecosystem.config.cjs" ] && cp -f "${DEPLOY_DIR}/ecosystem.config.cjs" "${APP_DIR}/"
[ -f "${DEPLOY_DIR}/package.json" ] && cp -f "${DEPLOY_DIR}/package.json" "${APP_DIR}/"
[ -f "${DEPLOY_DIR}/package-lock.json" ] && cp -f "${DEPLOY_DIR}/package-lock.json" "${APP_DIR}/"
[ -d "${DEPLOY_DIR}/public" ] && cp -rf "${DEPLOY_DIR}/public" "${APP_DIR}/"
[ -d "${DEPLOY_DIR}/scripts" ] && cp -rf "${DEPLOY_DIR}/scripts" "${APP_DIR}/"
rm -rf "${DEPLOY_DIR}"

# ─── [4/7] 读取环境变量 ───
log "[4/7] 读取环境变量"
cd "${APP_DIR}"
if [ -f "${ENV_FILE}" ]; then
  # shellcheck disable=SC1090
  set -a; . "${ENV_FILE}"; set +a
  echo "已加载 ${ENV_FILE}"
else
  echo "WARNING: 缺少 ${ENV_FILE}（写操作会失败，但站点能起）"
fi

# ─── [5/7] 安装生产依赖 ───
log "[5/7] 安装生产依赖"
NPM_REGISTRY="${NPM_REGISTRY:-https://registry.npmmirror.com}"
# 先试 npm ci（严格），失败则回退 npm install（宽容）
if ! npm ci --registry="${NPM_REGISTRY}" --omit=dev --prefer-offline --no-audit --no-fund; then
  log "npm ci 失败，回退到 npm install"
  npm install --registry="${NPM_REGISTRY}" --omit=dev --no-audit --no-fund
fi

# ─── [6/7] 数据库迁移（失败不阻断）───
log "[6/7] 数据库迁移"
npm run db:migrate || log "Migration skipped or failed (non-fatal)"

# ─── [7/7] 重启 PM2 + 健康检查 ───
log "[7/7] 重启 PM2 + 健康检查"
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

for attempt in 1 2 3 4 5; do
  if curl -fsS "http://127.0.0.1:${APP_PORT}" >/dev/null; then
    log "✅ 健康检查通过（第 ${attempt} 次）— 部署成功！"
    exit 0
  fi
  sleep 3
done

# ─── 健康检查失败 → 回滚 ───
log "❌ 健康检查失败！回滚到上一个版本..."
BACKUP_DIR="$(ls -dt "${APP_DIR}".bak.* 2>/dev/null | head -1)"
if [ -n "${BACKUP_DIR}" ] && [ -d "${BACKUP_DIR}" ]; then
  rm -rf "${APP_DIR}"
  cp -r "${BACKUP_DIR}" "${APP_DIR}"
  cd "${APP_DIR}" && npm install --omit=dev --no-audit --no-fund
  pm2 startOrReload ecosystem.config.cjs --update-env
  pm2 save
  log "已回滚到 ${BACKUP_DIR}"
fi
exit 1
