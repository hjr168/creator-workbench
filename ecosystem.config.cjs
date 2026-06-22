module.exports = {
  apps: [
    {
      name: "creator-workbench",
      cwd: "/opt/creator-workbench",
      script: ".next/standalone/server.js",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "512M",
      env: {
        HOSTNAME: "127.0.0.1",
        PORT: "3000",
        // 以下变量来自 deploy-remote.sh 启动 PM2 前 source 的
        // /etc/creator-workbench/creator-workbench.env。PM2 fork 模式下
        // `--update-env` 不一定能把未声明的 shell 环境变量注入进程，
        // 因此在这里显式声明，保证每次部署后进程都能读到正确值。
        NODE_ENV: process.env.NODE_ENV || "production",
        DATABASE_URL: process.env.DATABASE_URL || "",
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "",
        ADMIN_COOKIE_SECRET: process.env.ADMIN_COOKIE_SECRET || "",
        AIHOT_BASE_URL: process.env.AIHOT_BASE_URL || "",
        AIHOT_TIMEOUT_MS: process.env.AIHOT_TIMEOUT_MS || "",
        AIHOT_MIN_INTERVAL_MS: process.env.AIHOT_MIN_INTERVAL_MS || "",
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
        TOPIC_RADAR_LLM_MODEL: process.env.TOPIC_RADAR_LLM_MODEL || "",
        TOPIC_RADAR_JOB_SECRET: process.env.TOPIC_RADAR_JOB_SECRET || "",
      },
    },
    {
      name: "creator-workbench-scheduler",
      cwd: "/opt/creator-workbench",
      script: "scripts/aihot-scheduler.mjs",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      restart_delay: 60_000,
      max_memory_restart: "128M",
    },
  ],
};
