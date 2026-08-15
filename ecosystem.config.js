/* Procesos de producción en el VPS — lo consume el deploy de GitHub Actions
   con `pm2 startOrReload ecosystem.config.js` (crea los procesos la primera
   vez y los recarga sin downtime las siguientes).

   Los secretos NO van aquí: Nest lee Backend/.env (ConfigModule) y Next toma
   los NEXT_PUBLIC_* de Frontend/.env.production durante `next build`. */
module.exports = {
  apps: [
    {
      name: 'rtc-backend',
      cwd: './Backend',
      script: 'dist/main.js',
      env: { NODE_ENV: 'production', PORT: 4000 },
      max_memory_restart: '512M',
      time: true, // timestamps en los logs de pm2
    },
    {
      name: 'rtc-frontend',
      cwd: './Frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      env: { NODE_ENV: 'production', PORT: 3000 },
      max_memory_restart: '512M',
      time: true,
    },
  ],
};
