module.exports = {
  apps: [
    {
      name: "email-polling",
      script: "node_modules/.bin/tsx",
      args: "scripts/polling.ts",
      cwd: "C:\\Users\\bruno\\OneDrive\\Área de Trabalho\\Claude\\atendimento",
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
    },
  ],
}
