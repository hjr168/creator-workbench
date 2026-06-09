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
  ],
};
