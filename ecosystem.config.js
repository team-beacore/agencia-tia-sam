module.exports = {
  apps: [
    {
      name: 'tia-sam',
      script: 'server/index.js',
      cwd: __dirname,

      // Carrega .env sem vazar segredos para o Git
      // Node >= 22.9: lê o arquivo .env se existir, sem sobrescrever vars já definidas.
      node_args: '--env-file-if-exists=.env',

      env: {
        NODE_ENV: 'production',
        PORT: '4000',
        TRUST_PROXY: '1',
        // JWT_SECRET, ADMIN_PASSWORD (apenas no 1º boot), ADMIN_EMAIL,
        // CORS_ORIGINS, DATA_DIR e variáveis de backup vêm do .env (não versionado).
        // Em produção o processo ABORTA sem JWT_SECRET (e sem ADMIN_PASSWORD com banco vazio).
      },

      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      time: true,
      shutdown_with_message: true,
      kill_timeout: 5000,

      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: undefined,
      out_file: undefined,
    },
  ],
}