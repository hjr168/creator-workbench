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
