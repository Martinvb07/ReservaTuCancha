/* Next llama a register() al arrancar cada runtime: así Sentry queda activo
   tanto en el servidor de Node como en edge. */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') await import('../sentry.server.config');
  if (process.env.NEXT_RUNTIME === 'edge') await import('../sentry.edge.config');
}
