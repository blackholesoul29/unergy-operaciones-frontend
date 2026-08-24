/**
 * El módulo de monitoreo que sirve el backend en su propia raíz.
 *
 * El legacy lo proxyaba tanto en Vite como en Vercel. Hoy las vistas lo llaman a
 * través de `~/core/client.ts` (`/api/v1/monitoreo/…`), así que esta ruta cubre
 * el acceso directo por URL — un enlace guardado, una pestaña vieja.
 */
export default defineEventHandler((event) => {
  return reenviar(event, useRuntimeConfig(event).apiProxyTarget)
})
